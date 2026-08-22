using System.ComponentModel.DataAnnotations;

namespace Server.Api.DTOs.Auth;

public sealed record RoleClaimDto
{
    public required int Id { get; init; }
    public required string RoleId { get; init; }
    public required string ClaimType { get; init; }
    public required string ClaimValue { get; init; }
}
