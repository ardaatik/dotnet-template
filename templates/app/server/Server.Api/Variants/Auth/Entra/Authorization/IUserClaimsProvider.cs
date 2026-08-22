namespace Server.Api.Authorization;

public sealed record UserClaimDto(string Type, string Value);

public interface IUserClaimsProvider
{
    Task<IReadOnlyList<UserClaimDto>> GetClaimsAsync(string applicationUserId, CancellationToken cancellationToken = default);
}
