namespace Server.Api.Settings;

public sealed class CorsOptions
{
    public const string PolicyName = "ApiCorsPolicy";
    public const string SectionName = "Cors";

    public required string[] AllowedOrigins { get; init; }
}
