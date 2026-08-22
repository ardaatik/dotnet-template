using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Server.Api.DTOs.Auth;
using Server.Api.Settings;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Identity;

namespace Server.Api.Services;

public sealed class TokenProvider(
    IOptions<JwtAuthOptions> options,
    RoleManager<IdentityRole> roleManager)
{
    private readonly JwtAuthOptions _jwtAuthOptions = options.Value;

    public async Task<AccessTokensDto> CreateAsync(TokenRequest tokenRequest)
    {
        return new AccessTokensDto(await GenerateAccessTokenAsync(tokenRequest), GenerateRefreshToken());
    }

    private async Task<string> GenerateAccessTokenAsync(TokenRequest tokenRequest)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtAuthOptions.Key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        // Get all claims from all roles without duplicates
        var roleClaims = new HashSet<Claim>();
        foreach (var roleName in tokenRequest.Roles)
        {
            var role = await roleManager.FindByNameAsync(roleName);
            if (role != null)
            {
                IList<Claim> tempClaims = await roleManager.GetClaimsAsync(role);
                roleClaims.UnionWith(tempClaims);
            }
        }

        List<Claim> claims =
        [
            new(JwtRegisteredClaimNames.Sub, tokenRequest.UserId),
            new(JwtRegisteredClaimNames.Email, tokenRequest.Email),
            ..tokenRequest.Roles.Select(role => new Claim(ClaimTypes.Role, role)),
            ..roleClaims
        ];

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_jwtAuthOptions.ExpirationInMinutes),
            SigningCredentials = credentials,
            Issuer = _jwtAuthOptions.Issuer,
            Audience = _jwtAuthOptions.Audience
        };

        var handler = new JsonWebTokenHandler();

        string accessToken = handler.CreateToken(tokenDescriptor);

        return accessToken;
    }

    private static string GenerateRefreshToken()
    {
        byte[] randomBytes = RandomNumberGenerator.GetBytes(32);

        return Convert.ToBase64String(randomBytes);
    }
}
