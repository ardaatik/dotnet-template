namespace DotnetTemplate.Test.Infrastructure;

public static class TemplatePack
{
    public static async Task EnsureInstalledAsync()
    {
        await DotnetCli.RunAsync(RepoPaths.RepoRoot, "new", "install", RepoPaths.TemplatePath, "--force");
    }
}
