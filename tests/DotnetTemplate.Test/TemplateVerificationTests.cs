using DotnetTemplate.Test.Infrastructure;
using Xunit;

namespace DotnetTemplate.Test;

[Collection("TemplateVerification")]
public sealed class TemplateVerificationTests
{
    [SkippableTheory]
    [MemberData(nameof(TemplateVariant.AllVariants), MemberType = typeof(TemplateVariant))]
    public async Task Generated_app_builds_and_database_smoke_succeeds(TemplateVariant variant)
    {
        Skip.IfNot(DockerHelper.IsAvailable(), "Docker is not available; skipping database smoke test.");

        string outputDir = Path.Combine(Path.GetTempPath(), "dotnet-template-verify", $"{variant.Db}-{variant.Auth}");
        if (Directory.Exists(outputDir))
        {
            Directory.Delete(outputDir, recursive: true);
        }

        Directory.CreateDirectory(outputDir);

        await TemplatePack.EnsureInstalledAsync();

        string name = $"verify-{variant.Db}-{variant.Auth}";
        await DotnetCli.RunAsync(
            RepoPaths.RepoRoot,
            "new",
            "dotnet-template-app",
            "-n",
            name,
            "-o",
            outputDir,
            "--db",
            variant.Db,
            "--auth",
            variant.Auth,
            "--allow-scripts",
            "yes",
            "--force");

        if (NodeHelper.IsAvailable() && variant.Db == "postgres")
        {
            string clientUi = Path.Combine(outputDir, "client", "ui");
            await NpmCli.RunAsync(clientUi, "ci");
            await NpmCli.RunAsync(clientUi, "run", "build");
        }

        string projectPath = Path.Combine(outputDir, "server", "Server.Api", "Server.Api.csproj");
        await DotnetCli.RunAsync(outputDir, "build", projectPath);

        await using DatabaseContainer database = await DatabaseContainer.StartAsync(variant.Db);
        await using GeneratedAppRunner runner = await GeneratedAppRunner.StartAsync(projectPath, database.ConnectionString);
        HttpResponseMessage response = await runner.HttpClient.GetAsync(GeneratedAppRunner.SwaggerJsonPath);
        response.EnsureSuccessStatusCode();
    }
}
