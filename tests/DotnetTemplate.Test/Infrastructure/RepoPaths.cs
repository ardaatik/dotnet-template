namespace DotnetTemplate.Test.Infrastructure;

public static class RepoPaths
{
    public static string RepoRoot { get; } = FindRepoRoot();

    public static string TemplatePath => Path.Combine(RepoRoot, "templates", "app");

    public static string CliProjectPath => Path.Combine(RepoRoot, "src", "DotnetTemplate.Cli", "DotnetTemplate.Cli.csproj");

    private static string FindRepoRoot()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);
        while (directory is not null)
        {
            if (File.Exists(Path.Combine(directory.FullName, "DotnetTemplate.sln")))
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        throw new InvalidOperationException("Could not find repository root containing DotnetTemplate.sln.");
    }
}
