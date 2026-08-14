using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderPum.Application.DTOs.Auth;
using OrderPum.Application.Interfaces.Services.Auth;
using OrderPum.Domain.Enums.Auth;

namespace OrderPum.Api.Controllers.Auth;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(IAuthService auth) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<UserDto>>> List([FromQuery] UserFilterQuery query, CancellationToken ct)
    {
        try
        {
            var userId = GetUserId();
            var roleLevel = GetUserRoleLevel();
            var branchId = GetUserBranchId();

            var res = await auth.ListUsersAsync(query, userId, roleLevel, branchId, ct);
            return Ok(res);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id, CancellationToken ct)
    {
        try
        {
            var res = await auth.GetUserByIdAsync(id, ct);
            return Ok(res);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        try
        {
            var roleLevel = GetUserRoleLevel();
            var branchId = GetUserBranchId();

            var res = await auth.CreateUserAsync(request, roleLevel, branchId, ct);
            return CreatedAtAction(nameof(GetById), new { id = res.Id }, res);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserDto>> Update(Guid id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        try
        {
            var roleLevel = GetUserRoleLevel();
            var branchId = GetUserBranchId();

            var res = await auth.UpdateUserAsync(id, request, roleLevel, branchId, ct);
            return Ok(res);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/toggle-lock")]
    public async Task<ActionResult<object>> ToggleLock(Guid id, CancellationToken ct)
    {
        try
        {
            var userId = GetUserId();
            var roleLevel = GetUserRoleLevel();
            var branchId = GetUserBranchId();

            var isLocked = await auth.ToggleLockAsync(id, userId, roleLevel, branchId, ct);
            return Ok(new { isLocked, message = isLocked ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            var userId = GetUserId();
            var roleLevel = GetUserRoleLevel();
            var branchId = GetUserBranchId();

            await auth.DeleteUserAsync(id, userId, roleLevel, branchId, ct);
            return Ok(new { message = "Đã xóa tài khoản thành công." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(sub) || !Guid.TryParse(sub, out var guid))
            throw new UnauthorizedAccessException("Không xác thực được người dùng.");
        return guid;
    }

    private int GetUserRoleLevel()
    {
        var roleStr = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role");
        if (Enum.TryParse<StaffRole>(roleStr, true, out var role))
            return role.GetHierarchyLevel();
        return 99;
    }

    private Guid? GetUserBranchId()
    {
        var branchStr = User.FindFirstValue("branch_id");
        if (!string.IsNullOrEmpty(branchStr) && Guid.TryParse(branchStr, out var branchId))
            return branchId;
        return null;
    }
}
