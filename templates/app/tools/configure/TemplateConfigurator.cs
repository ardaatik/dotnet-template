namespace DotnetTemplate.Configure;

public static class TemplateConfigurator
{
    public static void Configure(string outputPath, string db, string auth)
    {
        string root = Path.GetFullPath(outputPath);
        if (!Directory.Exists(root))
        {
            throw new DirectoryNotFoundException($"Output path not found: {root}");
        }

        string variant = $"{db}.{auth}";
        string serverApi = Path.Combine(root, "server", "Server.Api");
        string serverRoot = Path.Combine(root, "server");
        string infra = Path.Combine(serverRoot, "Infra");
        string variantsRoot = Path.Combine(serverApi, "Variants");
        string clientUi = Path.Combine(root, "client", "ui");

        if (!Directory.Exists(infra))
        {
            return;
        }

        RemoveIfExists(Path.Combine(serverApi, "DependencyInjection.Database.cs"));

        CopyFile(
            Path.Combine(infra, "csproj", $"Server.Api.{variant}.csproj"),
            Path.Combine(serverApi, "Server.Api.csproj"),
            required: true);

        CopyFile(
            Path.Combine(infra, "di", $"DependencyInjection.{variant}.cs"),
            Path.Combine(serverApi, "DependencyInjection.Variants.cs"),
            required: true);

        string dockerCompose = Path.Combine(infra, "docker", $"docker-compose.{db}.yml");
        CopyFile(dockerCompose, Path.Combine(serverRoot, "docker-compose.yml"), required: true);
        CopyFile(dockerCompose, Path.Combine(serverRoot, "docker-compose.db.yml"), required: true);

        string dockerComposeProd = Path.Combine(infra, "docker", $"docker-compose.prod.{db}.yml");
        CopyFile(dockerComposeProd, Path.Combine(root, "docker-compose.prod.yml"), required: true);

        if (auth == "identity")
        {
            ConfigureIdentityAuth(serverApi, variantsRoot);
        }
        else
        {
            ConfigureEntraAuth(serverApi, variantsRoot, clientUi);
        }

        ConfigureMigrations(serverApi, db, auth);

        if (db == "postgres")
        {
            string postgresDevSettings = Path.Combine(serverApi, "appsettings.Postgres.Development.json");
            string devSettings = Path.Combine(serverApi, "appsettings.Development.json");
            if (File.Exists(postgresDevSettings))
            {
                CopyFile(postgresDevSettings, devSettings, required: true);
            }
        }

        RemoveIfExists(Path.Combine(serverApi, "appsettings.Postgres.Development.json"));
        WriteReadme(root, clientUi, db, auth);
        RemoveIfExists(variantsRoot);
        RemoveIfExists(infra);
        RemoveIfExists(Path.Combine(clientUi, "variants"));
        RemoveIfExists(Path.Combine(root, "readme"));
        RemoveIfExists(Path.Combine(root, ".template-variant"));
    }

    private static void WriteReadme(string root, string clientUi, string db, string auth)
    {
        string readmeRoot = Path.Combine(root, "readme");
        string appReadme = AssembleReadme(
            readmeRoot,
            "shared.md",
            $"db.{db}.md",
            $"auth.{auth}.md");
        File.WriteAllText(Path.Combine(root, "README.md"), appReadme);

        string clientReadme = AssembleReadme(
            readmeRoot,
            "client.shared.md",
            auth == "entra" ? "client.auth.entra.md" : null);
        File.WriteAllText(Path.Combine(clientUi, "README.md"), clientReadme);
    }

    private static string AssembleReadme(string readmeRoot, params string?[] fragments)
    {
        var parts = new List<string>();
        foreach (string? fragment in fragments)
        {
            if (fragment is null)
            {
                continue;
            }

            string path = Path.Combine(readmeRoot, fragment);
            if (!File.Exists(path))
            {
                throw new FileNotFoundException($"README fragment not found: {path}");
            }

            parts.Add(File.ReadAllText(path).TrimEnd());
        }

        return string.Join(Environment.NewLine + Environment.NewLine, parts) + Environment.NewLine;
    }

    private static void ConfigureIdentityAuth(string serverApi, string variantsRoot)
    {
        string identityRoot = Path.Combine(variantsRoot, "Auth", "Identity");
        CopyFile(Path.Combine(identityRoot, "Controllers", "AuthController.cs"), Path.Combine(serverApi, "Controllers", "AuthController.cs"));
        CopyFile(Path.Combine(identityRoot, "Controllers", "AuthorizationController.cs"), Path.Combine(serverApi, "Controllers", "AuthorizationController.cs"));
        CopyFile(Path.Combine(identityRoot, "Services", "TokenProvider.cs"), Path.Combine(serverApi, "Services", "TokenProvider.cs"));
        CopyFile(Path.Combine(identityRoot, "Database", "ApplicationDbContext.cs"), Path.Combine(serverApi, "Database", "ApplicationDbContext.cs"));
        CopyFile(Path.Combine(identityRoot, "Database", "ApplicationIdentityDbContext.cs"), Path.Combine(serverApi, "Database", "ApplicationIdentityDbContext.cs"));
        CopyFile(Path.Combine(identityRoot, "Extensions", "DatabaseExtensions.cs"), Path.Combine(serverApi, "Extensions", "DatabaseExtensions.cs"));
        CopyFile(Path.Combine(identityRoot, "Entities", "RefreshToken.cs"), Path.Combine(serverApi, "Entities", "RefreshToken.cs"));
    }

    private static void ConfigureEntraAuth(string serverApi, string variantsRoot, string clientUi)
    {
        string entraRoot = Path.Combine(variantsRoot, "Auth", "Entra");
        CopyFile(Path.Combine(entraRoot, "Controllers", "AuthController.cs"), Path.Combine(serverApi, "Controllers", "AuthController.cs"));
        CopyFile(Path.Combine(entraRoot, "Controllers", "AuthorizationController.cs"), Path.Combine(serverApi, "Controllers", "AuthorizationController.cs"));
        CopyFile(Path.Combine(entraRoot, "Services", "TokenProvider.cs"), Path.Combine(serverApi, "Services", "TokenProvider.cs"));
        CopyFile(Path.Combine(entraRoot, "Services", "IdentityResolverService.cs"), Path.Combine(serverApi, "Services", "IdentityResolverService.cs"));
        CopyFile(Path.Combine(entraRoot, "Services", "IIdentityResolverService.cs"), Path.Combine(serverApi, "Services", "IIdentityResolverService.cs"));
        CopyFile(Path.Combine(entraRoot, "Authorization", "IUserClaimsProvider.cs"), Path.Combine(serverApi, "Authorization", "IUserClaimsProvider.cs"));
        CopyFile(Path.Combine(entraRoot, "Authorization", "DbUserClaimsProvider.cs"), Path.Combine(serverApi, "Authorization", "DbUserClaimsProvider.cs"));
        CopyFile(Path.Combine(entraRoot, "Database", "ApplicationDbContext.cs"), Path.Combine(serverApi, "Database", "ApplicationDbContext.cs"));
        CopyFile(Path.Combine(entraRoot, "Database", "ApplicationDbContext.AuthEntities.cs"), Path.Combine(serverApi, "Database", "ApplicationDbContext.AuthEntities.cs"));
        CopyFile(Path.Combine(entraRoot, "Extensions", "DatabaseExtensions.cs"), Path.Combine(serverApi, "Extensions", "DatabaseExtensions.cs"));
        CopyFile(Path.Combine(entraRoot, "Entities", "AppRole.cs"), Path.Combine(serverApi, "Entities", "AppRole.cs"));
        CopyFile(Path.Combine(entraRoot, "Entities", "AppRoleClaim.cs"), Path.Combine(serverApi, "Entities", "AppRoleClaim.cs"));
        CopyFile(Path.Combine(entraRoot, "Entities", "AppUserRole.cs"), Path.Combine(serverApi, "Entities", "AppUserRole.cs"));
        CopyFile(Path.Combine(entraRoot, "Entities", "AppRefreshToken.cs"), Path.Combine(serverApi, "Entities", "AppRefreshToken.cs"));
        CopyFile(Path.Combine(entraRoot, "Settings", "AzureAdOptions.cs"), Path.Combine(serverApi, "Settings", "AzureAdOptions.cs"));

        string entraClient = Path.Combine(clientUi, "variants", "auth", "entra");
        CopyFile(Path.Combine(entraClient, "AuthContext.tsx"), Path.Combine(clientUi, "src", "context", "AuthContext.tsx"));
        CopyFile(Path.Combine(entraClient, "Login.tsx"), Path.Combine(clientUi, "src", "features", "auth", "Login.tsx"));
        CopyFile(Path.Combine(entraClient, "auth.ts"), Path.Combine(clientUi, "src", "api", "auth.ts"));
        CopyFile(Path.Combine(entraClient, "App.tsx"), Path.Combine(clientUi, "src", "App.tsx"));
        CopyFile(Path.Combine(entraClient, "main.tsx"), Path.Combine(clientUi, "src", "main.tsx"));
        CopyFile(Path.Combine(entraClient, ".env.example"), Path.Combine(clientUi, ".env.example"));
        CopyFile(Path.Combine(entraClient, "package.json"), Path.Combine(clientUi, "package.json"), required: true);
        CopyFile(Path.Combine(entraClient, "package-lock.json"), Path.Combine(clientUi, "package-lock.json"), required: true);

        RemoveIfExists(Path.Combine(clientUi, "src", "features", "auth", "Signup.tsx"));
        RemoveIfExists(Path.Combine(clientUi, "src", "features", "auth", "SignupForm.tsx"));
    }

    private static void ConfigureMigrations(string serverApi, string db, string auth)
    {
        string migrationsRoot = Path.Combine(serverApi, "Migrations");
        string dbFolder = db == "postgres" ? "Postgres" : "SqlServer";

        RemoveIfExists(Path.Combine(migrationsRoot, "Application"));
        RemoveIfExists(Path.Combine(migrationsRoot, "Identity"));

        if (auth == "identity")
        {
            string applicationSource = Path.Combine(migrationsRoot, dbFolder, "Application");
            string identitySource = Path.Combine(migrationsRoot, dbFolder, "Identity");
            MoveDirectory(applicationSource, Path.Combine(migrationsRoot, "Application"));
            MoveDirectory(identitySource, Path.Combine(migrationsRoot, "Identity"));
        }
        else
        {
            string applicationSource = Path.Combine(migrationsRoot, dbFolder, "ApplicationEntra");
            MoveDirectory(applicationSource, Path.Combine(migrationsRoot, "Application"));
        }

        RemoveIfExists(Path.Combine(migrationsRoot, "SqlServer"));
        RemoveIfExists(Path.Combine(migrationsRoot, "Postgres"));
    }

    private static void CopyFile(string source, string destination, bool required = false)
    {
        if (!File.Exists(source))
        {
            if (required)
            {
                throw new FileNotFoundException($"Required variant file not found: {source}");
            }

            return;
        }

        Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
        File.Copy(source, destination, overwrite: true);
    }

    private static void MoveDirectory(string source, string destination)
    {
        if (!Directory.Exists(source))
        {
            throw new DirectoryNotFoundException($"Migration folder not found: {source}");
        }

        if (Directory.Exists(destination))
        {
            Directory.Delete(destination, recursive: true);
        }

        Directory.Move(source, destination);
    }

    private static void RemoveIfExists(string path)
    {
        if (File.Exists(path))
        {
            File.Delete(path);
        }
        else if (Directory.Exists(path))
        {
            Directory.Delete(path, recursive: true);
        }
    }
}
