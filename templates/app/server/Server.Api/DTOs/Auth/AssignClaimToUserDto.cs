using System.ComponentModel.DataAnnotations;

namespace Server.Api.DTOs.Auth;

public sealed record AssignClaimToUserDto
{
    [Required]
    public required string UserId { get; init; }

    [Required]
    [StringLength(500)]
    public required string ClaimType { get; init; }

    [Required]
    [StringLength(500)]
    public required string ClaimValue { get; init; }
}
