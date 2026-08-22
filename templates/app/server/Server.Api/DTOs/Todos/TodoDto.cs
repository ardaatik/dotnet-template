using Server.Api.DTOs.Common;

namespace Server.Api.DTOs.Todos;

public sealed record TodoDto : ILinksResponse
{
    public required string Id { get; init; }
    public required string UserId { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required bool IsArchived { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public DateTime? UpdatedAtUtc { get; init; }
    public List<LinkDto> Links { get; set; }
}
