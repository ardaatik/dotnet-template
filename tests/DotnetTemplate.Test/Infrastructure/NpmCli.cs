using System.Diagnostics;

namespace DotnetTemplate.Test.Infrastructure;

public static class NpmCli
{
    public static async Task RunAsync(string workingDirectory, params string[] args)
    {
        ProcessStartInfo startInfo = new()
        {
            FileName = NodeHelper.NpmExecutable,
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
        };

        foreach (string arg in args)
        {
            startInfo.ArgumentList.Add(arg);
        }

        using Process process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("Failed to start npm process.");

        string stdout = await process.StandardOutput.ReadToEndAsync();
        string stderr = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"npm {string.Join(' ', args)} failed with exit code {process.ExitCode}.\n" +
                $"stdout:\n{stdout}\n" +
                $"stderr:\n{stderr}");
        }
    }
}
