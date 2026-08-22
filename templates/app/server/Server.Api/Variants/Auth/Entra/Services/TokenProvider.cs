using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Server.Api.Authorization;
using Server.Api.DTOs.Auth;
using Server.Api.Settings;

namespace Server.Api.Services;

public sealed class TokenProvider(IOptions<JwtAuthOptions> options, IUserClaimsProvider claimsProvider)
{
    private readonly JwtAuthOptions _jwtAuthOptions = options.Value;

    public async Task<AccessTokensDto> CreateAsync(TokenRequest tokenRequest, CancellationToken cancellationToken = default)
    {
        return new AccessTokensDto(await GenerateAccessTokenAsync(tokenRequest, cancellationToken), GenerateRefreshToken());
    }

    private async Task<string> GenerateAccessTokenAsync(TokenRequest tokenRequest, CancellationToken cancellationToken)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtAuthOptions.Key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        List<Claim> claims =
        [
            new(JwtRegisteredClaimNames.Sub, tokenRequest.UserId),
            new(JwtRegisteredClaimNames.Email, tokenRequest.Email),
            new(JwtRegisteredClaimNames.Name, tokenRequest.Name ?? string.Empty),
            ..tokenRequest.Roles.Select(role => new Claim(ClaimTypes.Role, role))
        ];

        IReadOnlyList<UserClaimDto> userClaims = await claimsProvider.GetClaimsAsync(tokenRequest.UserId, cancellationToken);
        foreach (UserClaimDto claim in userClaims)
        {
            if (!string.IsNullOrEmpty(claim.Type) && !string.IsNullOrEmpty(claim.Value))
            {
                claims.Add(new Claim(claim.Type, claim.Value));
            }
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_jwtAuthOptions.ExpirationInMinutes),
            SigningCredentials = credentials,
            Issuer = _jwtAuthOptions.Issuer,
            Audience = _jwtAuthOptions.Audience
        };

        var handler = new JsonWebTokenHandler();
        return handler.CreateToken(tokenDescriptor);
    }

    private static string GenerateRefreshToken()
    {
        byte[] randomBytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(randomBytes);
    }
}
