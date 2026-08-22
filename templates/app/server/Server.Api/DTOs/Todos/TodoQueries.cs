using System.Linq.Expressions;
using Server.Api.Entities;

namespace Server.Api.DTOs.Todos;

internal static class TodoQueries
{
    public static Expression<Func<Todo, TodoDto>> ProjectToDto()
    {
        return todo => new TodoDto
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
}
