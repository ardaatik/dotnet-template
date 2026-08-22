using Microsoft.EntityFrameworkCore;
using Server.Api.Database;

namespace Server.Api.Authorization;

public sealed class DbUserClaimsProvider(ApplicationDbContext dbContext) : IUserClaimsProvider
{
    public async Task<IReadOnlyList<UserClaimDto>> GetClaimsAsync(
        string applicationUserId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.UserRoles
            .AsNoTracking()
            .Where(ur => ur.UserId == applicationUserId)
            .Join(
                dbContext.RoleClaims,
                ur => ur.RoleId,
                rc => rc.RoleId,
                (_, rc) => new UserClaimDto(rc.ClaimType, rc.ClaimValue))
            .Distinct()
            .ToListAsync(cancellationToken);
    }
}
