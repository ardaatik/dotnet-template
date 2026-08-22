namespace Server.Api.DTOs.Auth;

public sealed record AuthorizationUserDto
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Email { get; init; }
}
