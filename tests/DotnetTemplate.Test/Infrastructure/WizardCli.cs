using System.Diagnostics;

namespace DotnetTemplate.Test.Infrastructure;

public static class WizardCli
{
    public static async Task RunAsync(params string[] args)
    {
        ProcessStartInfo startInfo = new()
        {
            FileName = "dotnet",
            WorkingDirectory = RepoPaths.RepoRoot,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
        };

        startInfo.ArgumentList.Add("run");
        startInfo.ArgumentList.Add("--project");
        startInfo.ArgumentList.Add(RepoPaths.CliProjectPath);
        startInfo.ArgumentList.Add("--");
        foreach (string arg in args)
        {
            startInfo.ArgumentList.Add(arg);
        }

        using Process process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("Failed to start wizard CLI process.");

        string stdout = await process.StandardOutput.ReadToEndAsync();
        string stderr = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"wizard {string.Join(' ', args)} failed with exit code {process.ExitCode}.\n" +
                $"stdout:\n{stdout}\n" +
                $"stderr:\n{stderr}");
        }
    }
}
