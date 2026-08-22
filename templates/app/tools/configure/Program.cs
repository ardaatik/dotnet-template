using DotnetTemplate.Configure;

if (args.Length == 0 || !args[0].Equals("configure", StringComparison.OrdinalIgnoreCase))
{
    Console.Error.WriteLine("Usage: dotnet run -- configure <outputPath> [--db sqlserver|postgres] [--auth identity|entra]");
    return 1;
}

string? outputPath = null;
string? db = null;
string? auth = null;

for (int i = 1; i < args.Length; i++)
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

if (string.IsNullOrWhiteSpace(outputPath))
{
    Console.Error.WriteLine("Usage: dotnet run -- configure <outputPath> [--db sqlserver|postgres] [--auth identity|entra]");
    return 1;
}

outputPath = NormalizeOutputPath(outputPath);

if (string.IsNullOrWhiteSpace(db) || string.IsNullOrWhiteSpace(auth))
{
    (db, auth) = ReadVariantFile(outputPath);
}

if (string.IsNullOrWhiteSpace(db) || string.IsNullOrWhiteSpace(auth))
{
    Console.Error.WriteLine("Usage: dotnet run -- configure <outputPath> --db sqlserver|postgres --auth identity|entra");
    return 1;
}

try
{
    TemplateConfigurator.Configure(outputPath, db, auth);
    Console.WriteLine("Template output configured successfully.");
    return 0;
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Configuration failed: {ex.Message}");
    return 1;
}

static (string? Db, string? Auth) ReadVariantFile(string outputPath)
{
    string variantFile = Path.Combine(outputPath, ".template-variant");
    if (!File.Exists(variantFile))
    {
        return (null, null);
    }

    string? db = null;
    string? auth = null;

    foreach (string line in File.ReadAllLines(variantFile))
    {
        int separator = line.IndexOf('=');
        if (separator <= 0)
        {
            continue;
        }

        string key = line[..separator].Trim();
        string value = line[(separator + 1)..].Trim();

        if (key.Equals("db", StringComparison.OrdinalIgnoreCase))
        {
            db = value;
        }
        else if (key.Equals("auth", StringComparison.OrdinalIgnoreCase))
        {
            auth = value;
        }
    }

    return (db, auth);
}

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
