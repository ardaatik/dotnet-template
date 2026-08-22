using Docker.DotNet;

namespace DotnetTemplate.Test.Infrastructure;

public static class DockerHelper
{
    public static bool IsAvailable()
    {
        try
        {
            using DockerClient client = new DockerClientConfiguration().CreateClient();
            client.System.PingAsync().GetAwaiter().GetResult();
            return true;
        }
        catch
        {
            return false;
        }
    }
}
