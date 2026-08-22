using DotnetTemplate.Test.Infrastructure;
using Xunit;

namespace DotnetTemplate.Test;

[Collection("TemplateVerification")]
public sealed class WizardVerificationTests
{
    [Theory]
    [MemberData(nameof(TemplateVariant.AllVariants), MemberType = typeof(TemplateVariant))]
    public async Task Wizard_creates_configured_app_for_variant(TemplateVariant variant)
    {
        string outputDir = Path.Combine(Path.GetTempPath(), "dotnet-template-wizard", $"{variant.Db}-{variant.Auth}");
        if (Directory.Exists(outputDir))
        {
            Directory.Delete(outputDir, recursive: true);
        }

        Directory.CreateDirectory(outputDir);

        string name = $"wizard-{variant.Db}-{variant.Auth}";
        await WizardCli.RunAsync(
            "--name",
            name,
            "--output",
            outputDir,
            "--db",
            variant.Db,
            "--auth",
            variant.Auth,
            "--yes");

        GeneratedAppAssertions.AssertConfiguredTree(outputDir, variant);
    }
}
