namespace Server.Api.DTOs.Auth;

public sealed record UserRoleAssignmentDto
{
    public required string UserId { get; init; }
    public required string UserName { get; init; }
    public required string UserEmail { get; init; }
    public required string RoleId { get; init; }
    public required string RoleName { get; init; }
}

public sealed record UserRoleAssignmentsPageDto
{
    public List<UserRoleAssignmentDto> Items { get; init; } = [];
    public int TotalCount { get; init; }
    public int PageSize { get; init; }
}
