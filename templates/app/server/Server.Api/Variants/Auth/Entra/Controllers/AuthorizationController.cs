using System.Net.Mime;
using Microsoft.AspNetCore.Authorization;
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
public sealed class AuthorizationController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet("roles")]
    [ProducesResponseType<List<RoleDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<RoleDto>>> GetRoles()
    {
        var roles = await db.Roles
            .AsNoTracking()
            .OrderBy(r => r.Name)
            .Select(r => new RoleDto
            {
                Id = r.Id.ToString(),
                Name = r.Name,
                NormalizedName = r.Name.ToUpperInvariant()
            })
            .ToListAsync();

        return Ok(roles);
    }

    [HttpGet("roles/{roleId}")]
    [ProducesResponseType<RoleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleDto>> GetRole(string roleId)
    {
        if (!int.TryParse(roleId, out int id))
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        var role = await db.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);
        if (role is null)
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        return Ok(new RoleDto
        {
            Id = role.Id.ToString(),
            Name = role.Name,
            NormalizedName = role.Name.ToUpperInvariant()
        });
    }

    [HttpPost("roles")]
    [ProducesResponseType<RoleDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RoleDto>> CreateRole(CreateRoleDto createRoleDto)
    {
        bool exists = await db.Roles.AnyAsync(r => r.Name == createRoleDto.Name);
        if (exists)
        {
            return Problem(
                detail: $"Role '{createRoleDto.Name}' already exists.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var role = new AppRole { Name = createRoleDto.Name };
        db.Roles.Add(role);
        await db.SaveChangesAsync();

        var roleDto = new RoleDto
        {
            Id = role.Id.ToString(),
            Name = role.Name,
            NormalizedName = role.Name.ToUpperInvariant()
        };

        return CreatedAtAction(nameof(GetRole), new { roleId = role.Id }, roleDto);
    }

    [HttpPut("roles/{roleId}")]
    [ProducesResponseType<RoleDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleDto>> UpdateRole(string roleId, UpdateRoleDto updateRoleDto)
    {
        if (!int.TryParse(roleId, out int id))
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        var role = await db.Roles.FirstOrDefaultAsync(r => r.Id == id);
        if (role is null)
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        bool nameTaken = await db.Roles.AnyAsync(r => r.Id != id && r.Name == updateRoleDto.Name);
        if (nameTaken)
        {
            return Problem(
                detail: $"Role '{updateRoleDto.Name}' already exists.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        role.Name = updateRoleDto.Name;
        await db.SaveChangesAsync();

        return Ok(new RoleDto
        {
            Id = role.Id.ToString(),
            Name = role.Name,
            NormalizedName = role.Name.ToUpperInvariant()
        });
    }

    [HttpDelete("roles/{roleId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRole(string roleId)
    {
        if (!int.TryParse(roleId, out int id))
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        var role = await db.Roles.FirstOrDefaultAsync(r => r.Id == id);
        if (role is null)
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        db.Roles.Remove(role);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("roles/{roleId}/claims")]
    [ProducesResponseType<List<RoleClaimDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<RoleClaimDto>>> GetRoleClaims(string roleId)
    {
        if (!int.TryParse(roleId, out int id))
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        if (!await db.Roles.AnyAsync(r => r.Id == id))
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        var claims = await db.RoleClaims
            .AsNoTracking()
            .Where(rc => rc.RoleId == id)
            .Select(rc => new RoleClaimDto
            {
                Id = rc.Id,
                RoleId = rc.RoleId.ToString(),
                ClaimType = rc.ClaimType,
                ClaimValue = rc.ClaimValue
            })
            .ToListAsync();

        return Ok(claims);
    }

    [HttpPost("roles/{roleId}/claims")]
    [ProducesResponseType<RoleClaimDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleClaimDto>> AddClaimToRole(string roleId, CreateClaimDto createClaimDto)
    {
        if (!int.TryParse(roleId, out int id))
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        var role = await db.Roles.FirstOrDefaultAsync(r => r.Id == id);
        if (role is null)
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        bool exists = await db.RoleClaims.AnyAsync(rc =>
            rc.RoleId == id &&
            rc.ClaimType == createClaimDto.ClaimType &&
            rc.ClaimValue == createClaimDto.ClaimValue);

        if (exists)
        {
            return Problem(
                detail: $"Claim '{createClaimDto.ClaimType}:{createClaimDto.ClaimValue}' already exists for this role",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var roleClaim = new AppRoleClaim
        {
            RoleId = id,
            ClaimType = createClaimDto.ClaimType,
            ClaimValue = createClaimDto.ClaimValue
        };

        db.RoleClaims.Add(roleClaim);
        await db.SaveChangesAsync();

        var dto = new RoleClaimDto
        {
            Id = roleClaim.Id,
            RoleId = roleClaim.RoleId.ToString(),
            ClaimType = roleClaim.ClaimType,
            ClaimValue = roleClaim.ClaimValue
        };

        return CreatedAtAction(nameof(GetRoleClaims), new { roleId }, dto);
    }

    [HttpDelete("roles/{roleId}/claims")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveClaimFromRole(string roleId, [FromQuery] string claimType, [FromQuery] string claimValue)
    {
        if (!int.TryParse(roleId, out int id))
        {
            return NotFound($"Role with ID '{roleId}' not found.");
        }

        var roleClaim = await db.RoleClaims
            .FirstOrDefaultAsync(rc => rc.RoleId == id && rc.ClaimType == claimType && rc.ClaimValue == claimValue);

        if (roleClaim is null)
        {
            return NotFound("Claim not found for this role.");
        }

        db.RoleClaims.Remove(roleClaim);
        await db.SaveChangesAsync();
        return NoContent();
    }

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

    [HttpGet("users")]
    [ProducesResponseType<List<AuthorizationUserDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AuthorizationUserDto>>> GetUsers()
    {
        var users = await db.Users
            .AsNoTracking()
            .OrderBy(u => u.Name)
            .Select(u => new AuthorizationUserDto
            {
                Id = u.Id,
                Email = u.Email,
                Name = u.Name
            })
            .ToListAsync();

        return Ok(users);
    }

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
            from userRole in db.UserRoles.AsNoTracking()
            join user in db.Users.AsNoTracking() on userRole.UserId equals user.Id
            join role in db.Roles.AsNoTracking() on userRole.RoleId equals role.Id
            select new
            {
                user.Id,
                user.Name,
                user.Email,
                RoleId = role.Id,
                RoleName = role.Name
            };

        if (!string.IsNullOrWhiteSpace(roleName))
        {
            query = query.Where(x => x.RoleName == roleName);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            string search = q.Trim().ToLower();
            query = query.Where(x =>
                x.Name.ToLower().Contains(search) ||
                x.Email.ToLower().Contains(search));
        }

        int totalCount = await query.CountAsync();

        var pageRows = await query
            .OrderBy(x => x.Name)
            .ThenBy(x => x.RoleName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = pageRows
            .Select(x => new UserRoleAssignmentDto
            {
                UserId = x.Id,
                UserEmail = x.Email,
                UserName = x.Name,
                RoleId = x.RoleId.ToString(),
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

    [HttpGet("users/{userId}/roles")]
    [ProducesResponseType<List<string>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<string>>> GetUserRoles(string userId)
    {
        if (!await db.Users.AnyAsync(u => u.Id == userId))
        {
            return NotFound($"User with ID '{userId}' not found.");
        }

        var roles = await db.UserRoles
            .AsNoTracking()
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.Role.Name)
            .ToListAsync();

        return Ok(roles);
    }

    [HttpPost("users/roles")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignRoleToUser(AssignRoleToUserDto assignRoleDto)
    {
        if (!await db.Users.AnyAsync(u => u.Id == assignRoleDto.UserId))
        {
            return NotFound($"User with ID '{assignRoleDto.UserId}' not found.");
        }

        var role = await db.Roles.FirstOrDefaultAsync(r => r.Name == assignRoleDto.RoleName);
        if (role is null)
        {
            return NotFound($"Role '{assignRoleDto.RoleName}' not found.");
        }

        bool alreadyAssigned = await db.UserRoles.AnyAsync(ur =>
            ur.UserId == assignRoleDto.UserId && ur.RoleId == role.Id);

        if (alreadyAssigned)
        {
            return Problem(
                detail: "User already has this role.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        db.UserRoles.Add(new AppUserRole { UserId = assignRoleDto.UserId, RoleId = role.Id });
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("users/{userId}/roles/{roleName}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveRoleFromUser(string userId, string roleName)
    {
        var userRole = await db.UserRoles
            .Include(ur => ur.Role)
            .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.Role.Name == roleName);

        if (userRole is null)
        {
            return NotFound("User does not have this role.");
        }

        db.UserRoles.Remove(userRole);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
