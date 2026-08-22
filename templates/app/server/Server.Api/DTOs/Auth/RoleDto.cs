using System.ComponentModel.DataAnnotations;

namespace Server.Api.DTOs.Auth;

public sealed record RoleDto
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string NormalizedName { get; init; }
    public string? ConcurrencyStamp { get; init; }
}
