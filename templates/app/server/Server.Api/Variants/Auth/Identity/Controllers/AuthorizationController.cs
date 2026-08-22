using System.Net.Mime;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Api.Database;
using Server.Api.DTOs.Auth;
using Server.Api.Entities;
using Server.Api.Services;

namespace Server.Api.Controllers;

[ApiController]
[Route("api/authorization")]
[Authorize(Roles = Roles.Admin)]
[Produces(
    MediaTypeNames.Application.Json,
    CustomMediaTypeNames.Application.JsonV1,
    CustomMediaTypeNames.Application.HateoasJson,
    CustomMediaTypeNames.Application.HateoasJsonV1)]
public sealed class AuthorizationController(
    UserManager<IdentityUser> userManager,
    RoleManager<IdentityRole> roleManager,
    ApplicationIdentityDbContext identityDbContext,
    ApplicationDbContext applicationDbContext) : ControllerBase
{


    /// <summary>
    /// Gets all roles
    /// </summary>
    /// <returns>List of all roles</returns>
    [HttpGet("roles")]
    [ProducesResponseType<List<RoleDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<RoleDto>>> GetRoles()
    {
        var roles = await roleManager.Roles
            .Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name!,
                NormalizedName = r.NormalizedName!,
                ConcurrencyStamp = r.ConcurrencyStamp
            })
            .ToListAsync();

        return Ok(roles);
    }

    /// <summary>
    /// Gets a specific role by ID
    /// </summary>
    /// <param name="roleId">The role ID</param>
    /// <returns>The role details</returns>
    [HttpGet("roles/{roleId}")]
    [ProducesResponseType<RoleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleDto>> GetRole(string roleId)
    {
        var role = await roleManager.FindByIdAsync(roleId);

        if (role is null)
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        var roleDto = new RoleDto
        {
            Id = role.Id,
            Name = role.Name!,
            NormalizedName = role.NormalizedName!,
            ConcurrencyStamp = role.ConcurrencyStamp
        };

        return Ok(roleDto);
    }

    /// <summary>
    /// Creates a new role
    /// </summary>
    /// <param name="createRoleDto">The role details</param>
    /// <returns>The created role</returns>
    [HttpPost("roles")]
    [ProducesResponseType<RoleDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RoleDto>> CreateRole(CreateRoleDto createRoleDto)
    {
        var role = new IdentityRole(createRoleDto.Name);
        var result = await roleManager.CreateAsync(role);

        if (!result.Succeeded)
        {
            var extensions = new Dictionary<string, object?>
            {
                { "errors", result.Errors.ToDictionary(e => e.Code, e => e.Description) }
            };

            return Problem(
                detail: "Unable to create role",
                statusCode: StatusCodes.Status400BadRequest,
                extensions: extensions);
        }

        var roleDto = new RoleDto
        {
            Id = role.Id,
            Name = role.Name!,
            NormalizedName = role.NormalizedName!,
            ConcurrencyStamp = role.ConcurrencyStamp
        };

        return CreatedAtAction(nameof(GetRole), new { roleId = role.Id }, roleDto);
    }

    /// <summary>
    /// Updates an existing role
    /// </summary>
    /// <param name="roleId">The role ID</param>
    /// <param name="updateRoleDto">The updated role details</param>
    /// <returns>The updated role</returns>
    [HttpPut("roles/{roleId}")]
    [ProducesResponseType<RoleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleDto>> UpdateRole(string roleId, UpdateRoleDto updateRoleDto)
    {
        var role = await roleManager.FindByIdAsync(roleId);

        if (role is null)
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        role.Name = updateRoleDto.Name;
        var result = await roleManager.UpdateAsync(role);

        if (!result.Succeeded)
        {
            var extensions = new Dictionary<string, object?>
            {
                { "errors", result.Errors.ToDictionary(e => e.Code, e => e.Description) }
            };

            return Problem(
                detail: "Unable to update role",
                statusCode: StatusCodes.Status400BadRequest,
                extensions: extensions);
        }

        var roleDto = new RoleDto
        {
            Id = role.Id,
            Name = role.Name!,
            NormalizedName = role.NormalizedName!,
            ConcurrencyStamp = role.ConcurrencyStamp
        };

        return Ok(roleDto);
    }

    /// <summary>
    /// Deletes a role
    /// </summary>
    /// <param name="roleId">The role ID</param>
    /// <returns>No content if successful</returns>
    [HttpDelete("roles/{roleId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRole(string roleId)
    {
        var role = await roleManager.FindByIdAsync(roleId);

        if (role is null)
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        var result = await roleManager.DeleteAsync(role);

        if (!result.Succeeded)
        {
            var extensions = new Dictionary<string, object?>
            {
                { "errors", result.Errors.ToDictionary(e => e.Code, e => e.Description) }
            };

            return Problem(
                detail: "Unable to delete role",
                statusCode: StatusCodes.Status400BadRequest,
                extensions: extensions);
        }

        return NoContent();
    }





    /// <summary>
    /// Gets all claims for a specific role
    /// </summary>
    /// <param name="roleId">The role ID</param>
    /// <returns>List of role claims</returns>
    [HttpGet("roles/{roleId}/claims")]
    [ProducesResponseType<List<RoleClaimDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<RoleClaimDto>>> GetRoleClaims(string roleId)
    {
        var role = await roleManager.FindByIdAsync(roleId);

        if (role is null)
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        var claims = await roleManager.GetClaimsAsync(role);
        var roleClaims = claims.Select((claim, index) => new RoleClaimDto
        {
            Id = index, // Note: Identity doesn't expose claim IDs directly
            RoleId = roleId,
            ClaimType = claim.Type,
            ClaimValue = claim.Value
        }).ToList();

        return Ok(roleClaims);
    }

    /// <summary>
    /// Adds a claim to a role
    /// </summary>
    /// <param name="roleId">The role ID</param>
    /// <param name="createClaimDto">The claim details</param>
    /// <returns>The created claim</returns>
    [HttpPost("roles/{roleId}/claims")]
    [ProducesResponseType<RoleClaimDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleClaimDto>> AddClaimToRole(string roleId, CreateClaimDto createClaimDto)
    {
        var role = await roleManager.FindByIdAsync(roleId);

        if (role is null)
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        // Check if the claim already exists for this role
        var existingClaims = await roleManager.GetClaimsAsync(role);
        var claimExists = existingClaims.Any(c => c.Type == createClaimDto.ClaimType && c.Value == createClaimDto.ClaimValue);

        if (claimExists)
        {
            return Problem(
                detail: $"Claim '{createClaimDto.ClaimType}:{createClaimDto.ClaimValue}' already exists for this role",
                statusCode: StatusCodes.Status400BadRequest);
        }


        var claim = new Claim(createClaimDto.ClaimType, createClaimDto.ClaimValue);
        var result = await roleManager.AddClaimAsync(role, claim);

        if (!result.Succeeded)
        {
            var extensions = new Dictionary<string, object?>
            {
                { "errors", result.Errors.ToDictionary(e => e.Code, e => e.Description) }
            };

            return Problem(
                detail: "Unable to add claim to role",
                statusCode: StatusCodes.Status400BadRequest,
                extensions: extensions);
        }

        var roleClaimDto = new RoleClaimDto
        {
            Id = 0, // Identity doesn't provide claim ID
            RoleId = roleId,
            ClaimType = claim.Type,
            ClaimValue = claim.Value
        };

        return CreatedAtAction(nameof(GetRoleClaims), new { roleId }, roleClaimDto);
    }

    /// <summary>
    /// Removes a claim from a role
    /// </summary>
    /// <param name="roleId">The role ID</param>
    /// <param name="claimType">The claim type</param>
    /// <param name="claimValue">The claim value</param>
    /// <returns>No content if successful</returns>
    [HttpDelete("roles/{roleId}/claims")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveClaimFromRole(string roleId, [FromQuery] string claimType, [FromQuery] string claimValue)
    {
        var role = await roleManager.FindByIdAsync(roleId);

        if (role is null)
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        var claim = new Claim(claimType, claimValue);
        var result = await roleManager.RemoveClaimAsync(role, claim);

        if (!result.Succeeded)
        {
            var extensions = new Dictionary<string, object?>
            {
                { "errors", result.Errors.ToDictionary(e => e.Code, e => e.Description) }
            };

            return Problem(
                detail: "Unable to remove claim from role",
                statusCode: StatusCodes.Status400BadRequest,
                extensions: extensions);
        }

        return NoContent();
    }




    /// <summary>
    /// Gets all available claim types and their possible values
    /// </summary>
    /// <returns>Dictionary of claim types and their available values</returns>
    [HttpGet("claims/available")]
    [ProducesResponseType<Dictionary<string, List<string>>>(StatusCodes.Status200OK)]
    public ActionResult<Dictionary<string, List<string>>> GetAvailableClaimsMetadata()
    {
        var availableClaims = new Dictionary<string, List<string>>
        {
            {
                Claims.Types.Todos,
                new List<string>
                {
                    Claims.Values.Read,
                    Claims.Values.Create,
                    Claims.Values.Update,
                    Claims.Values.Delete
                }
            },
            {
                Claims.Types.Users,
                new List<string>
                {
                    Claims.Values.Read,
                    Claims.Values.Update,
                    Claims.Values.ReadOwn,
                    Claims.Values.UpdateOwn
                }
            },
            {
                Claims.Types.Permission,
                new List<string>
                {
                    Claims.Values.UsersManage,
                    Claims.Values.RolesManage
                }
            }
        };

        return Ok(availableClaims);
    }


    /// <summary>
    /// Gets all users for role assignment dropdowns
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType<List<AuthorizationUserDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AuthorizationUserDto>>> GetUsers()
    {
        var identityUsers = await userManager.Users.AsNoTracking().ToListAsync();
        var identityIds = identityUsers.Select(u => u.Id).ToList();

        var namesByIdentityId = await applicationDbContext.Users
            .AsNoTracking()
            .Where(u => identityIds.Contains(u.IdentityId))
            .ToDictionaryAsync(u => u.IdentityId, u => u.Name);

        var users = identityUsers
            .Select(u => new AuthorizationUserDto
            {
                Id = u.Id,
                Email = u.Email ?? u.UserName ?? string.Empty,
                Name = namesByIdentityId.GetValueOrDefault(u.Id) ?? u.Email ?? u.UserName ?? string.Empty
            })
            .OrderBy(u => u.Name)
            .ToList();

        return Ok(users);
    }

    /// <summary>
    /// Gets paginated user-role assignments with optional search and role filter
    /// </summary>
    [HttpGet("users/roles/assignments")]
    [ProducesResponseType<UserRoleAssignmentsPageDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<UserRoleAssignmentsPageDto>> GetUserRoleAssignments(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? q = null,
        [FromQuery] string? roleName = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query =
            from userRole in identityDbContext.UserRoles.AsNoTracking()
            join identityUser in identityDbContext.Users.AsNoTracking() on userRole.UserId equals identityUser.Id
            join role in identityDbContext.Roles.AsNoTracking() on userRole.RoleId equals role.Id
            select new
            {
                identityUser.Id,
                identityUser.Email,
                identityUser.UserName,
                RoleId = role.Id,
                RoleName = role.Name!
            };

        if (!string.IsNullOrWhiteSpace(roleName))
        {
            query = query.Where(x => x.RoleName == roleName);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var search = q.Trim().ToLower();
            var matchingIdentityIds = applicationDbContext.Users
                .AsNoTracking()
                .Where(u => u.Name.ToLower().Contains(search) || u.Email.ToLower().Contains(search))
                .Select(u => u.IdentityId);

            query = query.Where(x =>
                (x.Email ?? string.Empty).ToLower().Contains(search) ||
                (x.UserName ?? string.Empty).ToLower().Contains(search) ||
                matchingIdentityIds.Contains(x.Id));
        }

        var totalCount = await query.CountAsync();

        var pageRows = await query
            .OrderBy(x => x.Email)
            .ThenBy(x => x.RoleName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var pageIdentityIds = pageRows.Select(x => x.Id).Distinct().ToList();
        var namesByIdentityId = await applicationDbContext.Users
            .AsNoTracking()
            .Where(u => pageIdentityIds.Contains(u.IdentityId))
            .ToDictionaryAsync(u => u.IdentityId, u => u.Name);

        var items = pageRows
            .Select(x => new UserRoleAssignmentDto
            {
                UserId = x.Id,
                UserEmail = x.Email ?? x.UserName ?? string.Empty,
                UserName = namesByIdentityId.GetValueOrDefault(x.Id) ?? x.Email ?? x.UserName ?? string.Empty,
                RoleId = x.RoleId,
                RoleName = x.RoleName
            })
            .ToList();

        return Ok(new UserRoleAssignmentsPageDto
        {
            Items = items,
            TotalCount = totalCount,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Gets all roles for a specific user
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>List of user roles</returns>
    [HttpGet("users/{userId}/roles")]
    [ProducesResponseType<List<string>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<string>>> GetUserRoles(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);

        if (user is null)
        {
            return NotFound($"User with ID '{userId}' not found.");
        }

        var roles = await userManager.GetRolesAsync(user);
        return Ok(roles.ToList());
    }

    /// <summary>
    /// Assigns a role to a user
    /// </summary>
    /// <param name="assignRoleDto">The role assignment details</param>
    /// <returns>No content if successful</returns>
    [HttpPost("users/roles")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignRoleToUser(AssignRoleToUserDto assignRoleDto)
    {
        var user = await userManager.FindByIdAsync(assignRoleDto.UserId);

        if (user is null)
        {
            return NotFound($"User with ID '{assignRoleDto.UserId}' not found.");
        }

        if (!await roleManager.RoleExistsAsync(assignRoleDto.RoleName))
        {
            return NotFound($"Role '{assignRoleDto.RoleName}' not found.");
        }

        var result = await userManager.AddToRoleAsync(user, assignRoleDto.RoleName);

        if (!result.Succeeded)
        {
            var extensions = new Dictionary<string, object?>
            {
                { "errors", result.Errors.ToDictionary(e => e.Code, e => e.Description) }
            };

            return Problem(
                detail: "Unable to assign role to user",
                statusCode: StatusCodes.Status400BadRequest,
                extensions: extensions);
        }

        return NoContent();
    }

    /// <summary>
    /// Removes a role from a user
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="roleName">The role name to remove</param>
    /// <returns>No content if successful</returns>
    [HttpDelete("users/{userId}/roles/{roleName}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveRoleFromUser(string userId, string roleName)
    {
        var user = await userManager.FindByIdAsync(userId);

        if (user is null)
        {
            return NotFound($"User with ID '{userId}' not found.");
        }

        if (!await roleManager.RoleExistsAsync(roleName))
        {
            return NotFound($"Role '{roleName}' not found.");
        }

        var result = await userManager.RemoveFromRoleAsync(user, roleName);

        if (!result.Succeeded)
        {
            var extensions = new Dictionary<string, object?>
            {
                { "errors", result.Errors.ToDictionary(e => e.Code, e => e.Description) }
            };

            return Problem(
                detail: "Unable to remove role from user",
                statusCode: StatusCodes.Status400BadRequest,
                extensions: extensions);
        }

        return NoContent();
    }





    /// <summary>
    /// Gets all claims for a specific user
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>List of user claims</returns>
    [HttpGet("users/{userId}/claims")]
    [ProducesResponseType<List<Claim>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<Claim>>> GetUserClaims(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);

        if (user is null)
        {
            return NotFound($"User with ID '{userId}' not found.");
        }

        var claims = await userManager.GetClaimsAsync(user);
        return Ok(claims.ToList());
    }

    /// <summary>
    /// Adds a claim to a user
    /// </summary>
    /// <param name="assignClaimDto">The claim assignment details</param>
    /// <returns>No content if successful</returns>
    [HttpPost("users/claims")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignClaimToUser(AssignClaimToUserDto assignClaimDto)
    {
        var user = await userManager.FindByIdAsync(assignClaimDto.UserId);

        if (user is null)
        {
            return NotFound($"User with ID '{assignClaimDto.UserId}' not found.");
        }

        var claim = new Claim(assignClaimDto.ClaimType, assignClaimDto.ClaimValue);
        var result = await userManager.AddClaimAsync(user, claim);

        if (!result.Succeeded)
        {
            var extensions = new Dictionary<string, object?>
            {
                { "errors", result.Errors.ToDictionary(e => e.Code, e => e.Description) }
            };

            return Problem(
                detail: "Unable to assign claim to user",
                statusCode: StatusCodes.Status400BadRequest,
                extensions: extensions);
        }

        return NoContent();
    }

    /// <summary>
    /// Removes a claim from a user
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="claimType">The claim type</param>
    /// <param name="claimValue">The claim value</param>
    /// <returns>No content if successful</returns>
    [HttpDelete("users/{userId}/claims")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveClaimFromUser(string userId, [FromQuery] string claimType, [FromQuery] string claimValue)
    {
        var user = await userManager.FindByIdAsync(userId);

        if (user is null)
        {
            return NotFound($"User with ID '{userId}' not found.");
        }

        var claim = new Claim(claimType, claimValue);
        var result = await userManager.RemoveClaimAsync(user, claim);

        if (!result.Succeeded)
        {
            var extensions = new Dictionary<string, object?>
            {
                { "errors", result.Errors.ToDictionary(e => e.Code, e => e.Description) }
            };

            return Problem(
                detail: "Unable to remove claim from user",
                statusCode: StatusCodes.Status400BadRequest,
                extensions: extensions);
        }

        return NoContent();
    }


}
