using System.Dynamic;
using System.Net.Mime;
using Asp.Versioning;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Api.Database;
using Server.Api.DTOs.Common;
using Server.Api.DTOs.Todos;
using Server.Api.Entities;
using Server.Api.Services;
using Server.Api.Services.Sorting;

namespace Server.Api.Controllers;

[Authorize] // Base authentication required
[ApiController]
[Route("api/todos")]
[ApiVersion(1.0)]
[Produces(
    MediaTypeNames.Application.Json,
    CustomMediaTypeNames.Application.JsonV1,
    CustomMediaTypeNames.Application.JsonV2,
    CustomMediaTypeNames.Application.HateoasJson,
    CustomMediaTypeNames.Application.HateoasJsonV1,
    CustomMediaTypeNames.Application.HateoasJsonV2)]
public sealed class TodosController(
    ApplicationDbContext dbContext,
    LinkService linkService,
    UserContext userContext) : ControllerBase
{

    /// <summary>
    /// Get all todos
    /// </summary>
    /// <param name="query"></param>
    /// <param name="sortMappingProvider"></param>
    /// <param name="dataShapingService"></param>
    /// <returns>
    /// <response code="200">The todos</response>
    /// <response code="401">The user is not authorized</response>
    /// <response code="400">The query parameters are invalid</response>
    /// </returns>
    [HttpGet]
    [Authorize(Policy = "TodosRead")]
    public async Task<IActionResult> GetTodos(
        [FromQuery] TodosQueryParameters query,
        SortMappingProvider sortMappingProvider,
        DataShapingService dataShapingService)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        if (!sortMappingProvider.ValidateMappings<TodoDto, Todo>(query.Sort))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: $"The provided sort parameter isn't valid: '{query.Sort}'");
        }

        if (!dataShapingService.Validate<TodoDto>(query.Fields))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: $"The provided data shaping fields aren't valid: '{query.Fields}'");
        }

        query.Search ??= query.Search?.Trim().ToLower();

        SortMapping[] sortMappings = sortMappingProvider.GetMappings<TodoDto, Todo>();

        IQueryable<TodoDto> todosQuery = dbContext
            .Todos
            .Where(t => t.UserId == userId)
            .Where(t => query.Search == null ||
                        t.Name.ToLower().Contains(query.Search) ||
                        t.Description != null && t.Description.ToLower().Contains(query.Search))
            .Where(t => query.IsArchived == null || t.IsArchived == query.IsArchived)
            .ApplySort(query.Sort, sortMappings)
            .Select(TodoQueries.ProjectToDto());

        int totalCount = await todosQuery.CountAsync();

        List<TodoDto> todos = await todosQuery
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        var paginationResult = new PaginationResult<ExpandoObject>
        {
            Items = dataShapingService.ShapeCollectionData(
                todos,
                query.Fields,
                query.IncludeLinks ? t => CreateLinksForTodo(t.Id, query.Fields) : null),
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = totalCount
        };
        if (query.IncludeLinks)
        {
            paginationResult.Links = CreateLinksForTodos(
                query,
                paginationResult.HasNextPage,
                paginationResult.HasPreviousPage);
        }

        return Ok(paginationResult);
    }

    /// <summary>
    /// Get a to do
    /// </summary>
    /// <param name="id"></param>
    /// <param name="query"></param>
    /// <param name="dataShapingService"></param>
    /// <returns>
    /// <response code="200">The to do</response>
    /// <response code="401">The user is not authorized</response>
    /// <response code="400">The query parameters are invalid</response>
    /// <response code="404">The to do not found</response>
    /// </returns>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTodo(
        string id,
        [FromQuery] TodoQueryParameters query,
        DataShapingService dataShapingService)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        if (!dataShapingService.Validate<TodoDto>(query.Fields))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: $"The provided data shaping fields aren't valid: '{query.Fields}'");
        }

        TodoDto? todo = await dbContext
            .Todos
            .Where(t => t.Id == id && t.UserId == userId)
            .Select(TodoQueries.ProjectToDto())
            .FirstOrDefaultAsync();

        if (todo is null)
        {
            return NotFound();
        }

        ExpandoObject shapedTodoDto = dataShapingService.ShapeData(todo, query.Fields);

        if (query.IncludeLinks)
        {
            ((IDictionary<string, object?>)shapedTodoDto)[nameof(ILinksResponse.Links)] =
                CreateLinksForTodo(id, query.Fields);
        }

        return Ok(shapedTodoDto);
    }


    /// <summary>
    /// Create a To Do
    /// </summary>
    /// <param name="createTodoDto"></param>
    /// <param name="acceptHeader"></param>
    /// <param name="validator"></param>
    /// <returns>
    /// <response code="201">The To Do</response>
    /// <response code="401">The user is not authorized</response>
    /// <response code="400">The To Do is invalid</response>
    /// </returns>
    [HttpPost]
    [Authorize(Policy = "TodosCreate")]
    public async Task<ActionResult<TodoDto>> CreateTodo(
        CreateTodoDto createTodoDto,
        [FromHeader] AcceptHeaderDto acceptHeader,
        IValidator<CreateTodoDto> validator)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        await validator.ValidateAndThrowAsync(createTodoDto);

        Todo todo = createTodoDto.ToEntity(userId);

        dbContext.Todos.Add(todo);

        await dbContext.SaveChangesAsync();

        TodoDto todoDto = todo.ToDto();

        if (acceptHeader.IncludeLinks)
        {
            todoDto.Links = CreateLinksForTodo(todo.Id, null);
        }

        return CreatedAtAction(nameof(GetTodo), new { id = todoDto.Id }, todoDto);
    }


    /// <summary>
    /// Update a To Do
    /// </summary>
    /// <param name="id"></param>
    /// <param name="updateTodoDto"></param>
    /// <returns>
    /// <response code="204">The To Do</response>
    /// <response code="401">The user is not authorized</response>
    /// <response code="400">The To Do is invalid</response>
    /// <response code="404">The To Do not found</response>
    /// </returns>
    [HttpPut("{id}")]
    [Authorize(Policy = "TodosUpdate")]
    public async Task<ActionResult> UpdateTodo(string id, UpdateTodoDto updateTodoDto)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        Todo? todo = await dbContext.Todos.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (todo is null)
        {
            return NotFound();
        }

        todo.UpdateFromDto(updateTodoDto);

        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Patch a To Do
    /// </summary>
    /// <param name="id"></param>
    /// <param name="patchDocument"></param>
    /// <returns>
    /// <response code="204">The To Do</response>
    /// <response code="401">The user is not authorized</response>
    /// <response code="400">The To Do is invalid</response>
    /// <response code="404">The To Do not found</response>
    /// </returns>
    [HttpPatch("{id}")]
    public async Task<ActionResult> PatchTodo(string id, JsonPatchDocument<TodoDto> patchDocument)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        Todo? todo = await dbContext.Todos.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (todo is null)
        {
            return NotFound();
        }

        TodoDto todoDto = todo.ToDto();

        patchDocument.ApplyTo(todoDto, ModelState);

        if (!TryValidateModel(todoDto))
        {
            return ValidationProblem(ModelState);
        }

        todo.Name = todoDto.Name;
        todo.Description = todoDto.Description;
        todo.UpdatedAtUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Delete a To Do
    /// </summary>
    /// <param name="id"></param>
    /// <returns>
    /// <response code="204">The To Do</response>
    /// <response code="401">The user is not authorized</response>
    /// <response code="404">The To Do not found</response>
    /// </returns>
    [HttpDelete("{id}")]
    [Authorize(Policy = "TodosDelete")]
    public async Task<ActionResult> DeleteTodo(string id)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        Todo? todo = await dbContext.Todos.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (todo is null)
        {
            return NotFound();
        }

        dbContext.Todos.Remove(todo);

        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    private List<LinkDto> CreateLinksForTodos(
        TodosQueryParameters parameters,
        bool hasNextPage,
        bool hasPreviousPage)
    {
        List<LinkDto> links =
        [
            linkService.Create(nameof(GetTodos), "self", HttpMethods.Get, new
            {
                page = parameters.Page,
                pageSize = parameters.PageSize,
                fields = parameters.Fields,
                q = parameters.Search,
                sort = parameters.Sort,
                isArchived = parameters.IsArchived
            }),
            linkService.Create(nameof(CreateTodo), "create", HttpMethods.Post)
        ];

        if (hasNextPage)
        {
            links.Add(linkService.Create(nameof(GetTodos), "next-page", HttpMethods.Get, new
            {
                page = parameters.Page + 1,
                pageSize = parameters.PageSize,
                fields = parameters.Fields,
                q = parameters.Search,
                sort = parameters.Sort,
                isArchived = parameters.IsArchived
            }));
        }

        if (hasPreviousPage)
        {
            links.Add(linkService.Create(nameof(GetTodos), "previous-page", HttpMethods.Get, new
            {
                page = parameters.Page - 1,
                pageSize = parameters.PageSize,
                fields = parameters.Fields,
                q = parameters.Search,
                sort = parameters.Sort,
                isArchived = parameters.IsArchived
            }));
        }

        return links;
    }

    private List<LinkDto> CreateLinksForTodo(string id, string? fields)
    {
        List<LinkDto> links =
        [
            linkService.Create(nameof(GetTodo), "self", HttpMethods.Get, new { id, fields }),
            linkService.Create(nameof(UpdateTodo), "update", HttpMethods.Put, new { id }),
            linkService.Create(nameof(PatchTodo), "partial-update", HttpMethods.Patch, new { id }),
            linkService.Create(nameof(DeleteTodo), "delete", HttpMethods.Delete, new { id })
        ];

        return links;
    }
}
