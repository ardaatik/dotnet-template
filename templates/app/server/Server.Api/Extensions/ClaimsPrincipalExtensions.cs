using System.Security.Claims;

namespace Server.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string? GetIdentityId(this ClaimsPrincipal? principal)
    {
        string? identityId = principal?.FindFirstValue("oid")
            ?? principal?.FindFirstValue(ClaimTypes.NameIdentifier);

        return identityId;
    }
}
