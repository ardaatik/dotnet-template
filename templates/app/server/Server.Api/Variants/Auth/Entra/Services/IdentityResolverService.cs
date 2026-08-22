using System.Security.Claims;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Graph;
using Microsoft.Graph.Models;
using Server.Api.Extensions;

namespace Server.Api.Services;

public sealed class IdentityResolverService(
    GraphServiceClient graphClient,
    IMemoryCache memoryCache) : IIdentityResolverService
{
    private const string CacheKeyPrefix = "identity:oid:";
    private const string CacheKeyPrefixUpn = "identity:upn:";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

    public async Task<string?> ResolveIdentityIdAsync(
        ClaimsPrincipal principal,
        CancellationToken cancellationToken = default)
    {
        string? claimId = principal.GetIdentityId();
        string? upn = GetUpnOrEmailFromClaims(principal);

        if (string.IsNullOrEmpty(claimId) && string.IsNullOrEmpty(upn))
        {
            return null;
        }

        if (!string.IsNullOrEmpty(claimId))
        {
            string cacheKey = $"{CacheKeyPrefix}{claimId}";
            string? cached = await memoryCache.GetOrCreateAsync(cacheKey, async entry =>
            {
                entry.SetAbsoluteExpiration(CacheDuration);
                return await ResolveFromGraphAsync(claimId, upn, cancellationToken);
            });

            if (!string.IsNullOrEmpty(cached))
            {
                return cached;
            }
        }

        if (!string.IsNullOrEmpty(upn))
        {
            string cacheKey = $"{CacheKeyPrefixUpn}{upn}";
            string? cached = await memoryCache.GetOrCreateAsync(cacheKey, async entry =>
            {
                entry.SetAbsoluteExpiration(CacheDuration);
                return await ResolveFromGraphAsync(null, upn, cancellationToken);
            });

            if (!string.IsNullOrEmpty(cached))
            {
                return cached;
            }
        }

        return claimId;
    }

    private async Task<string?> ResolveFromGraphAsync(
        string? claimId,
        string? upn,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(upn))
        {
            try
            {
                User? graphUser = await graphClient
                    .Users[upn]
                    .GetAsync(cfg => cfg.QueryParameters.Select = ["id"], cancellationToken);

                if (graphUser?.Id != null)
                {
                    return graphUser.Id;
                }
            }
            catch
            {
                // fall through
            }
        }

        if (!string.IsNullOrEmpty(claimId))
        {
            try
            {
                User? graphUser = await graphClient
                    .Users[claimId]
                    .GetAsync(cfg => cfg.QueryParameters.Select = ["id"], cancellationToken);

                if (graphUser?.Id != null)
                {
                    return graphUser.Id;
                }
            }
            catch
            {
                // fall through
            }
        }

        return claimId;
    }

    private static string? GetUpnOrEmailFromClaims(ClaimsPrincipal principal)
    {
        return principal.FindFirstValue("preferred_username")
            ?? principal.FindFirstValue("upn")
            ?? principal.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn")
            ?? principal.FindFirstValue("email");
    }
}
