using Microsoft.EntityFrameworkCore;
using Server.Api.Entities;

namespace Server.Api.Database;

public sealed partial class ApplicationDbContext
{
    partial void ConfigureAuthEntities(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppRole>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(256).IsRequired();
            entity.HasIndex(e => e.Name).IsUnique();
        });

        modelBuilder.Entity<AppRoleClaim>(entity =>
        {
            entity.ToTable("role_claims");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ClaimType).HasMaxLength(256).IsRequired();
            entity.Property(e => e.ClaimValue).HasMaxLength(256).IsRequired();
            entity.HasOne(e => e.Role).WithMany(r => r.RoleClaims).HasForeignKey(e => e.RoleId);
        });

        modelBuilder.Entity<AppUserRole>(entity =>
        {
            entity.ToTable("user_roles");
            entity.HasKey(e => new { e.UserId, e.RoleId });
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.Role).WithMany(r => r.UserRoles).HasForeignKey(e => e.RoleId);
        });

        modelBuilder.Entity<AppRefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Token).HasMaxLength(1000).IsRequired();
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
