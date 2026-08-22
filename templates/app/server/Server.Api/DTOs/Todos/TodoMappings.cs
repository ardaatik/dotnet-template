using Server.Api.Entities;
using Server.Api.Services.Sorting;

namespace Server.Api.DTOs.Todos;

internal static class TodoMappings
{
    public static readonly SortMappingDefinition<TodoDto, Todo> SortMapping = new()
    {
        Mappings =
        [
            new SortMapping(nameof(TodoDto.Name), nameof(Todo.Name)),
            new SortMapping(nameof(TodoDto.Description), nameof(Todo.Description)),
            new SortMapping(nameof(TodoDto.IsArchived), nameof(Todo.IsArchived)),
            new SortMapping(nameof(TodoDto.CreatedAtUtc), nameof(Todo.CreatedAtUtc)),
            new SortMapping(nameof(TodoDto.UpdatedAtUtc), nameof(Todo.UpdatedAtUtc))
        ]
    };

    public static TodoDto ToDto(this Todo todo)
    {
        return new TodoDto
        {
            Id = todo.Id,
            UserId = todo.UserId,
            Name = todo.Name,
            Description = todo.Description,
            IsArchived = todo.IsArchived,
            CreatedAtUtc = todo.CreatedAtUtc,
            UpdatedAtUtc = todo.UpdatedAtUtc
        };
    }

    public static Todo ToEntity(this CreateTodoDto dto, string userId)
    {
        Todo todo = new()
        {
            Id = $"t_{Guid.CreateVersion7()}",
            UserId = userId,
            Name = dto.Name,
            Description = dto.Description,
            IsArchived = false,
            CreatedAtUtc = DateTime.UtcNow
        };

        return todo;
    }

    public static void UpdateFromDto(this Todo todo, UpdateTodoDto dto)
    {
        todo.Name = dto.Name;
        todo.Description = dto.Description;
        todo.UpdatedAtUtc = DateTime.UtcNow;
    }
}
