using Server.Api.DTOs.Common;

namespace Server.Api.DTOs.Todos;

public sealed record CreateTodoDto
{
    public required string Name { get; init; }
    public string? Description { get; init; }
}
