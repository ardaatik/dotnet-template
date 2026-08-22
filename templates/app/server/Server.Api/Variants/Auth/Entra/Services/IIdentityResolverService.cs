using System.Security.Claims;
using Server.Api.Services;

public interface IIdentityResolverService
{
    Task<string?> ResolveIdentityIdAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default);
}
