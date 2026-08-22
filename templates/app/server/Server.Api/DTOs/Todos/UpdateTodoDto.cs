namespace Server.Api.DTOs.Todos;

public sealed record UpdateTodoDto
{
    public required string Name { get; init; }
    public string? Description { get; init; }
}