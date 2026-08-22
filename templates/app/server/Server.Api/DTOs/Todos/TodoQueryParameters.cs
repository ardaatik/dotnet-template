using Server.Api.DTOs.Common;

namespace Server.Api.DTOs.Todos;

public sealed record TodoQueryParameters : AcceptHeaderDto
{
    public string? Fields { get; init; }
}
