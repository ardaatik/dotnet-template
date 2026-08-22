using Server.Api.DTOs.Common;
using Microsoft.AspNetCore.Mvc;

namespace Server.Api.DTOs.Todos;

public sealed record TodosQueryParameters : AcceptHeaderDto
{
    [FromQuery(Name = "q")]
    public string? Search { get; set; }
    public bool? IsArchived { get; init; }
    public string? Sort { get; init; }
    public string? Fields { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}