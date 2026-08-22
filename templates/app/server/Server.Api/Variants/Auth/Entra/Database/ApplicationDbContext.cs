using Server.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Server.Api.Database;

public sealed partial class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Todo> Todos { get; set; }
    public DbSet<AppRole> Roles { get; set; }
    public DbSet<AppRoleClaim> RoleClaims { get; set; }
    public DbSet<AppUserRole> UserRoles { get; set; }
    public DbSet<AppRefreshToken> RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schemas.Application);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        ConfigureAuthEntities(modelBuilder);
    }

    partial void ConfigureAuthEntities(ModelBuilder modelBuilder);
}
