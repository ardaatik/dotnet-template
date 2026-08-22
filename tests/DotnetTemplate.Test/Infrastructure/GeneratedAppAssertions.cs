using Xunit;

namespace DotnetTemplate.Test.Infrastructure;

public static class GeneratedAppAssertions
{
    public static void AssertConfiguredTree(string outputDir, TemplateVariant variant)
    {
        AssertScaffoldingRemoved(outputDir);
        AssertCommonArtifacts(outputDir, variant);

        if (variant.Auth == "identity")
        {
            AssertIdentityVariant(outputDir);
        }
        else
        {
            AssertEntraVariant(outputDir);
        }
    }

    private static void AssertScaffoldingRemoved(string outputDir)
    {
        Assert.False(Directory.Exists(Path.Combine(outputDir, "server", "Infra")));
        Assert.False(Directory.Exists(Path.Combine(outputDir, "server", "Server.Api", "Variants")));
        Assert.False(Directory.Exists(Path.Combine(outputDir, "tools")));
        Assert.False(Directory.Exists(Path.Combine(outputDir, "readme")));
        Assert.False(File.Exists(Path.Combine(outputDir, ".template-variant")));
    }

    private static void AssertCommonArtifacts(string outputDir, TemplateVariant variant)
    {
        Assert.True(File.Exists(Path.Combine(outputDir, "server", "docker-compose.db.yml")));
        Assert.True(File.Exists(Path.Combine(outputDir, "README.md")));
        Assert.True(File.Exists(Path.Combine(outputDir, "client", "ui", "README.md")));

        if (variant.Auth == "entra")
        {
            string readme = File.ReadAllText(Path.Combine(outputDir, "README.md"));
            Assert.Contains("AzureAd", readme, StringComparison.Ordinal);
            Assert.Contains("Entra app registration", readme, StringComparison.Ordinal);
        }
    }

    private static void AssertIdentityVariant(string outputDir)
    {
        string authController = File.ReadAllText(
            Path.Combine(outputDir, "server", "Server.Api", "Controllers", "AuthController.cs"));
        Assert.Contains("register", authController, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("login", authController, StringComparison.OrdinalIgnoreCase);

        Assert.True(File.Exists(Path.Combine(outputDir, "client", "ui", "src", "features", "auth", "Signup.tsx")));
        Assert.True(Directory.Exists(Path.Combine(outputDir, "server", "Server.Api", "Migrations", "Application")));
        Assert.True(Directory.Exists(Path.Combine(outputDir, "server", "Server.Api", "Migrations", "Identity")));
    }

    private static void AssertEntraVariant(string outputDir)
    {
        string authController = File.ReadAllText(
            Path.Combine(outputDir, "server", "Server.Api", "Controllers", "AuthController.cs"));
        Assert.Contains("Microsoft.Graph", authController, StringComparison.Ordinal);
        Assert.Contains("token", authController, StringComparison.OrdinalIgnoreCase);

        Assert.False(File.Exists(Path.Combine(outputDir, "client", "ui", "src", "features", "auth", "Signup.tsx")));

        string packageJson = File.ReadAllText(Path.Combine(outputDir, "client", "ui", "package.json"));
        Assert.Contains("@azure/msal-browser", packageJson, StringComparison.Ordinal);
        Assert.Contains("@azure/msal-react", packageJson, StringComparison.Ordinal);

        Assert.True(Directory.Exists(Path.Combine(outputDir, "server", "Server.Api", "Migrations", "Application")));
        Assert.False(Directory.Exists(Path.Combine(outputDir, "server", "Server.Api", "Migrations", "Identity")));
    }
}
