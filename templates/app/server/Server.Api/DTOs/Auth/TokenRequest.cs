namespace Server.Api.DTOs.Auth;

public sealed record TokenRequest(string UserId, string Email, IEnumerable<string> Roles, string? Name = null);
