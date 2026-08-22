namespace Server.Api.Entities;

public sealed class AppUserRole
{
    public string UserId { get; set; } = null!;
    public int RoleId { get; set; }

    public User User { get; set; } = null!;
    public AppRole Role { get; set; } = null!;
}
