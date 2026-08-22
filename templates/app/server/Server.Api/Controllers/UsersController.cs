using System.Net.Mime;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Api.Database;
using Server.Api.DTOs.Common;
using Server.Api.DTOs.Users;
using Server.Api.Entities;
using Server.Api.Services;

namespace Server.Api.Controllers;

[Authorize] // Base authentication required
[ApiController]
[Route("api/users")]
[Produces(
    MediaTypeNames.Application.Json,
    CustomMediaTypeNames.Application.JsonV1,
    CustomMediaTypeNames.Application.HateoasJson,
    CustomMediaTypeNames.Application.HateoasJsonV1)]
public sealed class UsersController(
    ApplicationDbContext dbContext,
    UserContext userContext,
    LinkService linkService) : ControllerBase
{
    /// <summary>
    /// Get a user by id (Admin or Users Manager only)
    /// </summary>
    /// <param name="id"></param>
    /// <returns>
    /// <response code="200">The user</response>
    /// <response code="401">The user is not authorized</response>
    /// <response code="403">The user is forbidden</response>
    /// <response code="404">The user not found</response>
    /// </returns>
    [HttpGet("{id}")]
    [Authorize(Policy = "UsersRead")]
    public async Task<ActionResult<UserDto>> GetUserById(string id)
    {
        UserDto? user = await dbContext.Users
            .Where(u => u.Id == id)
            .Select(UserQueries.ProjectToDto())
            .FirstOrDefaultAsync();

        if (user is null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    /// <summary>
    /// Get the current user (own profile access)
    /// </summary>
    /// <param name="acceptHeaderDto"></param>
    /// <returns>
    /// <response code="200">The user</response>
    /// <response code="401">The user is not authorized</response>
    /// <response code="404">The user not found</response>
    /// </returns>
    [HttpGet("me")]
    [Authorize(Policy = "OwnProfileAccess")]
    public async Task<ActionResult<UserDto>> GetCurrentUser([FromHeader] AcceptHeaderDto acceptHeaderDto)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        UserDto? user = await dbContext.Users
            .Where(u => u.Id == userId)
            .Select(UserQueries.ProjectToDto())
            .FirstOrDefaultAsync();

        if (user is null)
        {
            return NotFound();
        }

        if (acceptHeaderDto.IncludeLinks)
        {
            user.Links = CreateLinksForUser();
        }

        return Ok(user);
    }

    /// <summary>
    /// Update the current user's profile (own profile access)
    /// </summary>
    /// <param name="dto"></param>
    /// <returns>
    /// <response code="204">The user profile updated</response>
    /// <response code="401">The user is not authorized</response>
    /// <response code="404">The user not found</response>
    /// </returns>
    [HttpPut("me/profile")]
    [Authorize(Policy = "OwnProfileAccess")]
    public async Task<ActionResult> UpdateProfile(UpdateUserProfileDto dto)
    {
        string? userId = await userContext.GetUserIdAsync();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        User? user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
        {
            return NotFound();
        }

        user.Name = dto.Name;
        user.UpdatedAtUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    private List<LinkDto> CreateLinksForUser()
    {
        List<LinkDto> links =
        [
            linkService.Create(nameof(GetCurrentUser), "self", HttpMethods.Get),
            linkService.Create(nameof(UpdateProfile), "update-profile", HttpMethods.Put)
        ];

        return links;
    }
}
