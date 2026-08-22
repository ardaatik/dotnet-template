namespace Server.Api.Entities;

public sealed class AppRoleClaim
{
    public int Id { get; set; }
    public int RoleId { get; set; }
    public string ClaimType { get; set; } = null!;
    public string ClaimValue { get; set; } = null!;

    public AppRole Role { get; set; } = null!;
}
