using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderPum.Application.DTOs.Branch;
using OrderPum.Application.Interfaces.Services.Branch;
using OrderPum.Domain.Enums.Auth;

namespace OrderPum.Api.Controllers.Branch;

[ApiController]
[Route("api/branches")]
public class BranchesController(IBranchService branchService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<BranchDto>>> List(
        [FromQuery] bool includeInactive = false,
        CancellationToken ct = default)
    {
        var roleLevel = GetUserRoleLevel();
        var branchId = GetUserBranchId();
        var branches = await branchService.ListBranchesAsync(includeInactive, roleLevel, branchId, ct);
        return Ok(branches);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<BranchDto>> GetById(Guid id, CancellationToken ct)
    {
        try
        {
            var roleLevel = GetUserRoleLevel();
            var branchId = GetUserBranchId();
            var branch = await branchService.GetBranchByIdAsync(id, roleLevel, branchId, ct);
            return Ok(branch);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<BranchDto>> Create([FromBody] CreateBranchRequest request, CancellationToken ct)
    {
        try
        {
            var roleLevel = GetUserRoleLevel();
            var res = await branchService.CreateBranchAsync(request, roleLevel, ct);
            return CreatedAtAction(nameof(GetById), new { id = res.Id }, res);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<BranchDto>> Update(
        Guid id,
        [FromBody] UpdateBranchRequest request,
        CancellationToken ct)
    {
        try
        {
            var roleLevel = GetUserRoleLevel();
            var branchId = GetUserBranchId();
            var res = await branchService.UpdateBranchAsync(id, request, roleLevel, branchId, ct);
            return Ok(res);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}/financial-config")]
    [Authorize]
    public async Task<ActionResult<BranchDto>> UpdateFinancialConfig(
        Guid id,
        [FromBody] UpdateFinancialConfigRequest request,
        CancellationToken ct)
    {
        try
        {
            var roleLevel = GetUserRoleLevel();
            var res = await branchService.UpdateFinancialConfigAsync(id, request, roleLevel, ct);
            return Ok(res);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/toggle-active")]
    [Authorize]
    public async Task<ActionResult<object>> ToggleActive(Guid id, CancellationToken ct)
    {
        try
        {
            var roleLevel = GetUserRoleLevel();
            var isActive = await branchService.ToggleActiveAsync(id, roleLevel, ct);
            return Ok(new { isActive, message = isActive ? "Chi nhánh đã mở hoạt động trở lại." : "Chi nhánh đã tạm dừng hoạt động." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            var roleLevel = GetUserRoleLevel();
            await branchService.DeleteBranchAsync(id, roleLevel, ct);
            return Ok(new { message = "Đã xóa chi nhánh thành công." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
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
