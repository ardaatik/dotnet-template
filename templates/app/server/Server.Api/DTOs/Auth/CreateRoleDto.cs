using System.ComponentModel.DataAnnotations;

namespace Server.Api.DTOs.Auth;

public sealed record CreateRoleDto
{
    [Required]
    [StringLength(256, MinimumLength = 2)]
    public required string Name { get; init; }
}
