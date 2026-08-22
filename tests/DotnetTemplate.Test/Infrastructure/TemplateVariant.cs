namespace DotnetTemplate.Test.Infrastructure;

public sealed record TemplateVariant(string Db, string Auth)
{
    public static IEnumerable<object[]> AllVariants =>
    [
        [new TemplateVariant("sqlserver", "identity")],
        [new TemplateVariant("postgres", "identity")],
        [new TemplateVariant("sqlserver", "entra")],
        [new TemplateVariant("postgres", "entra")],
    ];
}
