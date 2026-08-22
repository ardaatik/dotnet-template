namespace Server.Api.Entities;

public sealed class AppRefreshToken
{
    public Guid Id { get; set; }
    public required string UserId { get; set; }
    public required string UserAgent { get; set; }
    public required string Token { get; set; }
    public required DateTime ExpiresAtUtc { get; set; }

    public User User { get; set; } = null!;
}
