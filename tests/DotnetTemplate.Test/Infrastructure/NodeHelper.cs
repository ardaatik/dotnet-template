using System.Diagnostics;

namespace DotnetTemplate.Test.Infrastructure;

public static class NodeHelper
{
    public static bool IsAvailable()
    {
        try
        {
            ProcessStartInfo startInfo = new()
            {
                FileName = NpmExecutable,
                ArgumentList = { "--version" },
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
            };

            using Process process = Process.Start(startInfo)
                ?? throw new InvalidOperationException("Failed to start npm process.");

            process.WaitForExit(TimeSpan.FromSeconds(10));
            return process.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }

    internal static string NpmExecutable => OperatingSystem.IsWindows() ? "npm.cmd" : "npm";
}
