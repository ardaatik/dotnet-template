using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Server.Api.Database;
using Server.Api.Entities;
using EntityClaims = Server.Api.Entities.Claims;

namespace Server.Api.Extensions;

public static class DatabaseExtensions
{
    public static async Task ApplyMigrationsAsync(this WebApplication app)
    {
        using IServiceScope scope = app.Services.CreateScope();
        await using ApplicationDbContext applicationDbContext =
            scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        try
        {
            await applicationDbContext.Database.MigrateAsync();
            app.Logger.LogInformation("Application database migrations applied successfully.");
        }
        catch (Exception e)
        {
            app.Logger.LogError(e, "An error occurred while applying database migrations.");
            throw;
        }
    }

    public static async Task SeedInitialDataAsync(this WebApplication app)
    {
        using IServiceScope scope = app.Services.CreateScope();
        ApplicationDbContext dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        try
        {
            await SeedRolesAndClaimsAsync(dbContext);
            app.Logger.LogInformation("Successfully created roles and claims.");
        }
        catch (Exception ex)
        {
            app.Logger.LogError(ex, "An error occurred while seeding initial data.");
            throw;
        }
    }

    private static async Task SeedRolesAndClaimsAsync(ApplicationDbContext dbContext)
    {
        AppRole adminRole = await EnsureRoleAsync(dbContext, Roles.Admin);
        AppRole memberRole = await EnsureRoleAsync(dbContext, Roles.Member);

        System.Security.Claims.Claim[] adminClaims =
        [
            EntityClaims.TodoClaims.Read(),
            EntityClaims.TodoClaims.Create(),
            EntityClaims.TodoClaims.Update(),
            EntityClaims.TodoClaims.Delete(),
            EntityClaims.UserClaims.Read(),
            EntityClaims.UserClaims.Update(),
            EntityClaims.UserClaims.ReadOwn(),
            EntityClaims.UserClaims.UpdateOwn(),
            EntityClaims.PermissionClaims.UsersManage(),
            EntityClaims.PermissionClaims.RolesManage()
        ];

        System.Security.Claims.Claim[] memberClaims =
        [
            EntityClaims.TodoClaims.Read(),
            EntityClaims.TodoClaims.Create(),
            EntityClaims.TodoClaims.Update(),
            EntityClaims.TodoClaims.Delete(),
            EntityClaims.UserClaims.ReadOwn(),
            EntityClaims.UserClaims.UpdateOwn()
        ];

        await EnsureRoleClaimsAsync(dbContext, adminRole, adminClaims);
        await EnsureRoleClaimsAsync(dbContext, memberRole, memberClaims);
    }

    private static async Task<AppRole> EnsureRoleAsync(ApplicationDbContext dbContext, string roleName)
    {
        AppRole? role = await dbContext.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
        if (role is not null)
        {
            return role;
        }

        role = new AppRole { Name = roleName };
        dbContext.Roles.Add(role);
        await dbContext.SaveChangesAsync();
        return role;
    }

    private static async Task EnsureRoleClaimsAsync(
        ApplicationDbContext dbContext,
        AppRole role,
        IEnumerable<System.Security.Claims.Claim> claims)
    {
        List<AppRoleClaim> existingClaims = await dbContext.RoleClaims
            .Where(rc => rc.RoleId == role.Id)
            .ToListAsync();

        foreach (System.Security.Claims.Claim claim in claims)
        {
            if (existingClaims.Any(c => c.ClaimType == claim.Type && c.ClaimValue == claim.Value))
            {
                continue;
            }

            dbContext.RoleClaims.Add(new AppRoleClaim
            {
                RoleId = role.Id,
                ClaimType = claim.Type,
                ClaimValue = claim.Value
            });
        }

        await dbContext.SaveChangesAsync();
    }
}
