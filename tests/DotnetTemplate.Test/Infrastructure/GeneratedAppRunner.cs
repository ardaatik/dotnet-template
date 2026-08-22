using System.Diagnostics;
using System.Net;
using System.Net.Sockets;

namespace DotnetTemplate.Test.Infrastructure;

public sealed class GeneratedAppRunner : IAsyncDisposable
{
    public const string SwaggerJsonPath = "/swagger/1.0/swagger.json";

    private readonly Process _process;

    private GeneratedAppRunner(Process process, HttpClient httpClient)
    {
        _process = process;
        HttpClient = httpClient;
    }

    public HttpClient HttpClient { get; }

    public static async Task<GeneratedAppRunner> StartAsync(
        string projectPath,
        string connectionString,
        CancellationToken cancellationToken = default)
    {
        int port = GetFreePort();
        ProcessStartInfo startInfo = new()
        {
            FileName = "dotnet",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
        };

        startInfo.ArgumentList.Add("run");
        startInfo.ArgumentList.Add("--project");
        startInfo.ArgumentList.Add(projectPath);
        startInfo.ArgumentList.Add("--no-build");
        startInfo.ArgumentList.Add("--no-launch-profile");
        startInfo.Environment["ASPNETCORE_ENVIRONMENT"] = "Development";
        startInfo.Environment["ASPNETCORE_URLS"] = $"http://127.0.0.1:{port}";
        startInfo.Environment["ConnectionStrings__Database"] = connectionString;

        Process process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("Failed to start generated API process.");

        HttpClient httpClient = new()
        {
            BaseAddress = new Uri($"http://127.0.0.1:{port}"),
            Timeout = TimeSpan.FromSeconds(10),
        };

        DateTime deadline = DateTime.UtcNow.AddMinutes(2);
        while (DateTime.UtcNow < deadline)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (process.HasExited)
            {
                string stderr = await process.StandardError.ReadToEndAsync(cancellationToken);
                string stdout = await process.StandardOutput.ReadToEndAsync(cancellationToken);
                throw new InvalidOperationException(
                    $"Generated API exited with code {process.ExitCode} before swagger became available.\n" +
                    $"stdout:\n{stdout}\n" +
                    $"stderr:\n{stderr}");
            }

            try
            {
                HttpResponseMessage response = await httpClient.GetAsync(SwaggerJsonPath, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    return new GeneratedAppRunner(process, httpClient);
                }
            }
            catch (HttpRequestException)
            {
            }

            await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
        }

        if (!process.HasExited)
        {
            process.Kill(entireProcessTree: true);
            await process.WaitForExitAsync(cancellationToken);
        }

        httpClient.Dispose();
        process.Dispose();
        throw new TimeoutException($"Timed out waiting for {SwaggerJsonPath}.");
    }

    public async ValueTask DisposeAsync()
    {
        HttpClient.Dispose();

        if (!_process.HasExited)
        {
            _process.Kill(entireProcessTree: true);
            await _process.WaitForExitAsync();
        }

        _process.Dispose();
    }

    private static int GetFreePort()
    {
        TcpListener listener = new(IPAddress.Loopback, 0);
        listener.Start();
        int port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }
}
