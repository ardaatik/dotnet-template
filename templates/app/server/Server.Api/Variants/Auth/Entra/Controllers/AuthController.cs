using System.Net.Mime;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.Graph;
using Server.Api.Database;
using Server.Api.DTOs.Auth;
using Server.Api.DTOs.Common;
using Server.Api.DTOs.Users;
using Server.Api.Entities;
using Server.Api.Services;
using Server.Api.Settings;

namespace Server.Api.Controllers;

[ApiController]
[Route("api/auth")]
[Produces(
    MediaTypeNames.Application.Json,
    CustomMediaTypeNames.Application.JsonV1,
    CustomMediaTypeNames.Application.HateoasJson,
    CustomMediaTypeNames.Application.HateoasJsonV1)]
public sealed class AuthController(
    ApplicationDbContext dbContext,
    LinkService linkService,
    IIdentityResolverService identityResolver,
    GraphServiceClient graphClient,
    TokenProvider tokenProvider,
    IOptions<JwtAuthOptions> jwtOptions,
    UserContext userContext) : ControllerBase
{
    private const string EntraScheme = "Entra";

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetProfile([FromHeader] AcceptHeaderDto acceptHeaderDto)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        User? user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
        {
            return NotFound();
        }

        List<string> roleNames = await dbContext.UserRoles
            .AsNoTracking()
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.Role.Name)
            .ToListAsync();

        var userDto = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            CreatedAtUtc = user.CreatedAtUtc,
            UpdatedAtUtc = user.UpdatedAtUtc
        };

        if (acceptHeaderDto?.IncludeLinks == true)
        {
            userDto.Links =
            [
                linkService.Create(nameof(GetProfile), "self", Microsoft.AspNetCore.Http.HttpMethods.Get, null, "Auth")
            ];
        }

        return Ok(userDto);
    }

    [HttpPost("token")]
    [Authorize(AuthenticationSchemes = EntraScheme)]
    [ProducesResponseType(typeof(AccessTokensDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AccessTokensDto>> ExchangeToken()
    {
        string? identityId = await identityResolver.ResolveIdentityIdAsync(User);
        if (string.IsNullOrEmpty(identityId))
        {
            return Unauthorized();
        }

        User? user = await dbContext.Users.FirstOrDefaultAsync(u => u.IdentityId == identityId);
        if (user is null)
        {
            user = await CreateUserAsync(identityId);
            if (user is null)
            {
                return StatusCode(500, "Failed to create user.");
            }
        }

        List<string> roleNames = await dbContext.UserRoles
            .AsNoTracking()
            .Where(ur => ur.UserId == user.Id)
            .Select(ur => ur.Role.Name)
            .ToListAsync();

        var tokenRequest = new TokenRequest(user.Id, user.Email, roleNames, user.Name);
        AccessTokensDto tokens = await tokenProvider.CreateAsync(tokenRequest);

        JwtAuthOptions jwtOptionsValue = jwtOptions.Value;
        var refreshTokenEntity = new AppRefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            UserAgent = Request.Headers.UserAgent.ToString(),
            Token = tokens.RefreshToken,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(jwtOptionsValue.RefreshTokenExpirationDays)
        };
        dbContext.RefreshTokens.Add(refreshTokenEntity);
        await dbContext.SaveChangesAsync();

        return Ok(tokens);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AccessTokensDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AccessTokensDto>> Refresh([FromBody] RefreshTokenDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RefreshToken))
        {
            return Unauthorized();
        }

        AppRefreshToken? refreshTokenEntity = await dbContext.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == dto.RefreshToken);

        if (refreshTokenEntity is null || refreshTokenEntity.ExpiresAtUtc < DateTime.UtcNow)
        {
            return Unauthorized();
        }

        User user = refreshTokenEntity.User;
        List<string> roleNames = await dbContext.UserRoles
            .AsNoTracking()
            .Where(ur => ur.UserId == user.Id)
            .Select(ur => ur.Role.Name)
            .ToListAsync();

        var tokenRequest = new TokenRequest(user.Id, user.Email, roleNames, user.Name);
        AccessTokensDto tokens = await tokenProvider.CreateAsync(tokenRequest);

        dbContext.RefreshTokens.Remove(refreshTokenEntity);

        JwtAuthOptions jwtOptionsValue = jwtOptions.Value;
        var newRefreshToken = new AppRefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            UserAgent = Request.Headers.UserAgent.ToString(),
            Token = tokens.RefreshToken,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(jwtOptionsValue.RefreshTokenExpirationDays)
        };
        dbContext.RefreshTokens.Add(newRefreshToken);
        await dbContext.SaveChangesAsync();

        return Ok(tokens);
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<ActionResult> Logout([FromBody] RefreshTokenDto dto)
    {
        AppRefreshToken? refreshToken = await dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == dto.RefreshToken);

        if (refreshToken is not null)
        {
            dbContext.RefreshTokens.Remove(refreshToken);
            await dbContext.SaveChangesAsync();
        }

        return Ok();
    }

    private async Task<User?> CreateUserAsync(string identityId)
    {
        string email;
        string name;

        try
        {
            Microsoft.Graph.Models.User? graphUser = await graphClient.Users[identityId].GetAsync(cfg =>
            {
                cfg.QueryParameters.Select = ["id", "displayName", "mail", "userPrincipalName"];
            });
            email = graphUser?.Mail ?? graphUser?.UserPrincipalName ?? GetEmailFromClaims(User);
            name = graphUser?.DisplayName ?? User.FindFirstValue("name") ?? "Unknown User";
        }
        catch
        {
            email = GetEmailFromClaims(User);
            name = User.FindFirstValue("name") ?? "Unknown User";
        }

        var user = new User
        {
            Id = identityId,
            IdentityId = identityId,
            Email = email,
            Name = name,
            CreatedAtUtc = DateTime.UtcNow
        };

        dbContext.Users.Add(user);

        AppRole? memberRole = await dbContext.Roles
            .Where(r => r.Name == Roles.Member)
            .FirstOrDefaultAsync();

        if (memberRole is not null)
        {
            dbContext.UserRoles.Add(new AppUserRole
            {
                UserId = user.Id,
                RoleId = memberRole.Id
            });
        }

        await dbContext.SaveChangesAsync();
        return user;
    }

    private static string GetEmailFromClaims(ClaimsPrincipal principal)
    {
        return principal.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn")
            ?? principal.FindFirstValue("upn")
            ?? principal.FindFirstValue("email")
            ?? "unknown@example.com";
    }
}
