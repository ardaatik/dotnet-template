using System.ComponentModel.DataAnnotations;

namespace Server.Api.DTOs.Auth;

public sealed record AssignRoleToUserDto
{
    [Required]
    public required string UserId { get; init; }

    [Required]
    public required string RoleName { get; init; }
}
