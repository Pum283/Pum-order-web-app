using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderPum.Application.DTOs.Auth;
using OrderPum.Application.Interfaces.Services.Auth;
using OrderPum.Domain.Enums.Auth;

namespace OrderPum.Api.Controllers.Auth;

[ApiController]
[Route("api/roles")]
public class RolesController(IRoleService roleService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<RoleDto>>> List([FromQuery] bool includeInactive = false, CancellationToken ct = default)
    {
        var roles = await roleService.ListRolesAsync(includeInactive, ct);
        return Ok(roles);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<RoleDto>> GetById(Guid id, CancellationToken ct)
    {
        try
        {
            var role = await roleService.GetRoleByIdAsync(id, ct);
            return Ok(role);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<RoleDto>> Create([FromBody] CreateRoleRequest request, CancellationToken ct)
    {
        try
        {
            var currentLevel = GetUserRoleLevel();
            var res = await roleService.CreateRoleAsync(request, currentLevel, ct);
            return CreatedAtAction(nameof(GetById), new { id = res.Id }, res);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<RoleDto>> Update(Guid id, [FromBody] UpdateRoleRequest request, CancellationToken ct)
    {
        try
        {
            var currentLevel = GetUserRoleLevel();
            var res = await roleService.UpdateRoleAsync(id, request, currentLevel, ct);
            return Ok(res);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            var currentLevel = GetUserRoleLevel();
            await roleService.DeleteRoleAsync(id, currentLevel, ct);
            return Ok(new { message = "Xóa vai trò thành công." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private int GetUserRoleLevel()
    {
        var roleStr = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role");
        if (Enum.TryParse<StaffRole>(roleStr, true, out var role))
            return role.GetHierarchyLevel();
        return 99;
    }
}
