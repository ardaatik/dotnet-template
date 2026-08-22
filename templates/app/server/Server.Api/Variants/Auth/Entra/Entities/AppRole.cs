namespace Server.Api.Entities;

public sealed class AppRole
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;

    public ICollection<AppRoleClaim> RoleClaims { get; set; } = [];
    public ICollection<AppUserRole> UserRoles { get; set; } = [];
}
