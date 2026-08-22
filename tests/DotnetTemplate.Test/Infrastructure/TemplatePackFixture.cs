using Xunit;

namespace DotnetTemplate.Test.Infrastructure;

public sealed class TemplatePackFixture : IAsyncLifetime
{
    public async Task InitializeAsync()
    {
        await TemplatePack.EnsureInstalledAsync();
    }

    public async Task DisposeAsync()
    {
        await DotnetCli.RunAllowFailureAsync(RepoPaths.RepoRoot, "new", "uninstall", RepoPaths.TemplatePath);
    }
}
