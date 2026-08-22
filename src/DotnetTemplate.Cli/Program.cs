using System.Diagnostics;
using DotnetTemplate.Configure;
using Spectre.Console;

if (args.Length > 0 && args[0].Equals("configure", StringComparison.OrdinalIgnoreCase))
{
    return RunConfigure(args.AsSpan(1));
}

return RunWizard(args);

static int RunConfigure(ReadOnlySpan<string> args)
{
    string? outputPath = null;
    string? db = null;
    string? auth = null;

    for (int i = 0; i < args.Length; i++)
    {
        string arg = args[i];
        if (arg is "--db" or "-db")
        {
            db = args[++i];
        }
        else if (arg is "--auth" or "-au")
        {
            auth = args[++i];
        }
        else if (outputPath is null)
        {
            outputPath = arg;
        }
    }

    if (string.IsNullOrWhiteSpace(outputPath) ||
        string.IsNullOrWhiteSpace(db) ||
        string.IsNullOrWhiteSpace(auth))
    {
        AnsiConsole.MarkupLine("[red]Usage: dotnet run -- configure <outputPath> --db sqlserver|postgres --auth identity|entra[/]");
        return 1;
    }

    try
    {
        outputPath = NormalizeOutputPath(outputPath);
        TemplateConfigurator.Configure(outputPath, db, auth);
        AnsiConsole.MarkupLine("[green]Template output configured successfully.[/]");
        return 0;
    }
    catch (Exception ex)
    {
        AnsiConsole.MarkupLine($"[red]Configuration failed: {Markup.Escape(ex.Message)}[/]");
        return 1;
    }
}

static int RunWizard(string[] args)
{
    if (TryParseUnattendedArgs(args, out UnattendedWizardOptions? unattended))
    {
        return RunUnattendedWizard(unattended!);
    }

    if (HasAnyUnattendedFlag(args))
    {
        PrintUnattendedUsage();
        return 1;
    }

    return RunInteractiveWizard();
}

static int RunInteractiveWizard()
{
    string templateRoot = ResolveTemplateRoot();

    AnsiConsole.Write(new FigletText("Dotnet Template").Color(Color.Cyan1));

    string projectName = AnsiConsole.Ask<string>("Project [green]name[/]:");
    string outputPath = NormalizeOutputPath(
        AnsiConsole.Ask<string>("Output [green]path[/]:", projectName));

    string db = AnsiConsole.Prompt(
        new SelectionPrompt<string>()
            .Title("Choose [green]database[/]:")
            .AddChoices("sqlserver", "postgres"));

    string auth = AnsiConsole.Prompt(
        new SelectionPrompt<string>()
            .Title("Choose [green]authentication[/]:")
            .AddChoices("identity", "entra"));

    if (!AnsiConsole.Confirm($"Create [yellow]{projectName}[/] with db=[cyan]{db}[/], auth=[cyan]{auth}[/]?"))
    {
        AnsiConsole.MarkupLine("[red]Cancelled.[/]");
        return 1;
    }

    return CreateProject(templateRoot, projectName, outputPath, db, auth, interactive: true);
}

static int RunUnattendedWizard(UnattendedWizardOptions options)
{
    string templateRoot = ResolveTemplateRoot();
    return CreateProject(templateRoot, options.Name, options.OutputPath, options.Db, options.Auth, interactive: false);
}

static int CreateProject(
    string templateRoot,
    string projectName,
    string outputPath,
    string db,
    string auth,
    bool interactive)
{
    if (!IsValidDb(db))
    {
        if (interactive)
        {
            AnsiConsole.MarkupLine($"[red]Invalid database: {Markup.Escape(db)}[/]");
        }
        else
        {
            PrintUnattendedUsage();
        }

        return 1;
    }

    if (!IsValidAuth(auth))
    {
        if (interactive)
        {
            AnsiConsole.MarkupLine($"[red]Invalid authentication: {Markup.Escape(auth)}[/]");
        }
        else
        {
            PrintUnattendedUsage();
        }

        return 1;
    }

    EnsureTemplateInstalled(templateRoot, interactive);

    string arguments =
        $"new dotnet-template-app -n {Quote(projectName)} -o {Quote(outputPath)} --db {db} --auth {auth} --allow-scripts yes --force";

    int exitCode = RunProcess("dotnet", arguments, interactive);
    if (exitCode != 0)
    {
        if (interactive)
        {
            AnsiConsole.MarkupLine("[red]Template generation failed.[/]");
        }

        return exitCode;
    }

    exitCode = RunConfigure(new[] { outputPath, "--db", db, "--auth", auth });
    if (exitCode != 0)
    {
        return exitCode;
    }

    if (!Directory.Exists(outputPath))
    {
        if (interactive)
        {
            AnsiConsole.MarkupLine("[red]Project folder was not created. Check errors above and try again.[/]");
        }

        return 1;
    }

    if (interactive)
    {
        AnsiConsole.MarkupLine("[green]Project created successfully.[/]");
        AnsiConsole.WriteLine();

        AnsiConsole.MarkupLine("[bold]Next steps[/]");
        AnsiConsole.MarkupLine($"1. cd {outputPath}");
        AnsiConsole.MarkupLine("2. cd server && docker compose -f docker-compose.db.yml up -d");

        if (auth == "entra")
        {
            AnsiConsole.MarkupLine("3. Register an Entra app (SPA redirect URI + API scope api://{clientId}/API.Read)");
            AnsiConsole.MarkupLine("4. Set AzureAd + Jwt secrets in server user-secrets and client/ui/.env");
        }
        else
        {
            AnsiConsole.MarkupLine("3. cd server/Server.Api && dotnet run");
            AnsiConsole.MarkupLine("4. cd client/ui && npm install && npm run dev");
        }
    }

    return 0;
}

static bool TryParseUnattendedArgs(string[] args, out UnattendedWizardOptions? options)
{
    options = null;

    string? name = null;
    string? output = null;
    string? db = null;
    string? auth = null;
    bool yes = false;

    for (int i = 0; i < args.Length; i++)
    {
        string arg = args[i];
        switch (arg)
        {
            case "--name" or "-n":
                name = args[++i];
                break;
            case "--output" or "-o":
                output = args[++i];
                break;
            case "--db":
                db = args[++i];
                break;
            case "--auth":
                auth = args[++i];
                break;
            case "--yes" or "-y":
                yes = true;
                break;
        }
    }

    if (string.IsNullOrWhiteSpace(name) ||
        string.IsNullOrWhiteSpace(output) ||
        string.IsNullOrWhiteSpace(db) ||
        string.IsNullOrWhiteSpace(auth) ||
        !yes)
    {
        return false;
    }

    options = new UnattendedWizardOptions(name, NormalizeOutputPath(output), db, auth);
    return true;
}

static bool HasAnyUnattendedFlag(string[] args)
{
    foreach (string arg in args)
    {
        if (arg is "--name" or "-n" or "--output" or "-o" or "--db" or "--auth" or "--yes" or "-y")
        {
            return true;
        }
    }

    return false;
}

static void PrintUnattendedUsage()
{
    AnsiConsole.MarkupLine(
        "[red]Usage: dotnet run -- --name <projectName> --output <path> --db sqlserver|postgres --auth identity|entra --yes[/]");
}

static bool IsValidDb(string db) => db is "sqlserver" or "postgres";

static bool IsValidAuth(string auth) => auth is "identity" or "entra";

static string NormalizeOutputPath(string outputPath)
{
    if (OperatingSystem.IsWindows() &&
        outputPath.StartsWith('/') &&
        outputPath.Length >= 3 &&
        char.IsAsciiLetter(outputPath[1]) &&
        outputPath[2] == '/')
    {
        char drive = char.ToUpperInvariant(outputPath[1]);
        string tail = outputPath[2..].Replace('/', Path.DirectorySeparatorChar);
        outputPath = $"{drive}:{tail}";
    }

    return Path.GetFullPath(outputPath);
}

static string ResolveTemplateRoot()
{
    string fromRepo = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "templates", "app"));
    if (Directory.Exists(Path.Combine(fromRepo, ".template.config")))
    {
        return fromRepo;
    }

    string fromCwd = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "templates", "app"));
    if (Directory.Exists(Path.Combine(fromCwd, ".template.config")))
    {
        return fromCwd;
    }

    throw new DirectoryNotFoundException("Could not locate templates/app/.template.config");
}

static void EnsureTemplateInstalled(string templateRoot, bool interactive)
{
    // --force reinstalls the local template pack (picks up repo changes; avoids exit code 106).
    int installExit = RunProcess("dotnet", $"new install {Quote(templateRoot)} --force", interactive);
    if (installExit != 0)
    {
        throw new InvalidOperationException($"Failed to install template pack (exit code {installExit}).");
    }
}

static int RunProcess(string fileName, string arguments, bool interactive = true)
{
    if (interactive)
    {
        AnsiConsole.MarkupLine($"[grey]> {fileName} {arguments}[/]");
    }

    using Process process = Process.Start(new ProcessStartInfo
    {
        FileName = fileName,
        Arguments = arguments,
        UseShellExecute = false
    })!;

    process.WaitForExit();
    return process.ExitCode;
}

static string Quote(string value) => $"\"{value}\"";

file sealed record UnattendedWizardOptions(string Name, string OutputPath, string Db, string Auth);
