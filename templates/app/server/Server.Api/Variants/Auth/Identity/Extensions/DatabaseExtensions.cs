using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Server.Api.Database;
using Server.Api.Entities;

namespace Server.Api.Extensions;

public static class DatabaseExtensions
{
    private const string SeedAdminEmail = "admin@gmail.com";
    private const string SeedAdminPassword = "Admin@1234";
    private const string SeedAdminName = "Admin";

    public static async Task ApplyMigrationsAsync(this WebApplication app)
    {
        using IServiceScope scope = app.Services.CreateScope();
        await using ApplicationDbContext applicationDbContext =
            scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await using ApplicationIdentityDbContext identityDbContext =
            scope.ServiceProvider.GetRequiredService<ApplicationIdentityDbContext>();

        try
        {
            await applicationDbContext.Database.MigrateAsync();
            app.Logger.LogInformation("Application database migrations applied successfully.");

            await identityDbContext.Database.MigrateAsync();
            app.Logger.LogInformation("Identity database migrations applied successfully.");
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
        RoleManager<IdentityRole> roleManager =
            scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        UserManager<IdentityUser> userManager =
            scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
        ApplicationDbContext applicationDbContext =
            scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        ApplicationIdentityDbContext identityDbContext =
            scope.ServiceProvider.GetRequiredService<ApplicationIdentityDbContext>();

        try
        {
            // Create roles if they don't exist
            if (!await roleManager.RoleExistsAsync(Roles.Member))
            {
                await roleManager.CreateAsync(new IdentityRole(Roles.Member));
            }
            if (!await roleManager.RoleExistsAsync(Roles.Admin))
            {
                await roleManager.CreateAsync(new IdentityRole(Roles.Admin));
            }

            await SeedRoleClaims(roleManager);
            await SeedAdminUserAsync(
                userManager,
                applicationDbContext,
                identityDbContext,
                app.Logger);

            app.Logger.LogInformation("Successfully created roles and claims.");
        }
        catch (Exception ex)
        {
            app.Logger.LogError(ex, "An error occurred while seeding initial data.");
            throw;
        }
    }

    private static async Task SeedRoleClaims(RoleManager<IdentityRole> roleManager)
    {
        // Get the roles
        var adminRole = await roleManager.FindByNameAsync(Roles.Admin);
        var memberRole = await roleManager.FindByNameAsync(Roles.Member);

        if (adminRole == null || memberRole == null)
        {
            return;
        }

        // Admin role claims (full access)
        var adminClaims = new[]
        {
            Claims.TodoClaims.Read(),
            Claims.TodoClaims.Create(),
            Claims.TodoClaims.Update(),
            Claims.TodoClaims.Delete(),

            Claims.UserClaims.Read(),
            Claims.UserClaims.Update(),
            Claims.UserClaims.ReadOwn(),
            Claims.UserClaims.UpdateOwn(),

            Claims.PermissionClaims.UsersManage(),
            Claims.PermissionClaims.RolesManage()
        };

        // Member role claims (limited access)
        var memberClaims = new[]
        {
            Claims.TodoClaims.Read(),
            Claims.TodoClaims.Create(),
            Claims.TodoClaims.Update(),
            Claims.TodoClaims.Delete(),

            Claims.UserClaims.ReadOwn(),
            Claims.UserClaims.UpdateOwn()
        };

        // Add claims to Admin role
        await AddClaimsToRole(roleManager, adminRole, adminClaims);

        // Add claims to Member role  
        await AddClaimsToRole(roleManager, memberRole, memberClaims);
    }

    private static async Task AddClaimsToRole(
        RoleManager<IdentityRole> roleManager,
        IdentityRole role,
        Claim[] claims)
    {
        var existingClaims = await roleManager.GetClaimsAsync(role);

        foreach (var claim in claims)
        {
            if (!existingClaims.Any(c => c.Type == claim.Type && c.Value == claim.Value))
            {
                await roleManager.AddClaimAsync(role, claim);
            }
        }
    }

    private static async Task SeedAdminUserAsync(
        UserManager<IdentityUser> userManager,
        ApplicationDbContext applicationDbContext,
        ApplicationIdentityDbContext identityDbContext,
        ILogger logger)
    {
        if (await userManager.FindByEmailAsync(SeedAdminEmail) is not null)
        {
            return;
        }

        await using IDbContextTransaction transaction = await identityDbContext.Database.BeginTransactionAsync();
        applicationDbContext.Database.SetDbConnection(identityDbContext.Database.GetDbConnection());
        await applicationDbContext.Database.UseTransactionAsync(transaction.GetDbTransaction());

        var identityUser = new IdentityUser
        {
            Email = SeedAdminEmail,
            UserName = SeedAdminEmail
        };

        IdentityResult createResult = await userManager.CreateAsync(identityUser, SeedAdminPassword);
        if (!createResult.Succeeded)
        {
            string errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to seed admin user: {errors}");
        }

        IdentityResult addRoleResult = await userManager.AddToRoleAsync(identityUser, Roles.Admin);
        if (!addRoleResult.Succeeded)
        {
            string errors = string.Join("; ", addRoleResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to assign admin role to seeded user: {errors}");
        }

        applicationDbContext.Users.Add(new User
        {
            Id = $"u_{Guid.CreateVersion7()}",
            Name = SeedAdminName,
            Email = SeedAdminEmail,
            CreatedAtUtc = DateTime.UtcNow,
            IdentityId = identityUser.Id
        });

        await applicationDbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        logger.LogInformation("Seeded development admin user {Email}.", SeedAdminEmail);
    }
}
