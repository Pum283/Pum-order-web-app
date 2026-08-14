using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderPum.Application.DTOs.Floor;
using OrderPum.Application.Interfaces.Services.Floor;
using OrderPum.Domain.Enums.Auth;

namespace OrderPum.Api.Controllers.Floor;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AreasController(IFloorService floorService) : ControllerBase
{
    private (int Level, Guid? BranchId) GetActorContext()
    {
        var roleStr = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role");
        var level = 5;
        if (Enum.TryParse<StaffRole>(roleStr, true, out var role))
        {
            level = role.GetHierarchyLevel();
        }
        else if (int.TryParse(roleStr, out var parsedLevel))
        {
            level = parsedLevel;
        }

        var branchStr = User.FindFirstValue("branch_id") ?? User.FindFirstValue("BranchId");
        Guid? branchId = null;
        if (!string.IsNullOrEmpty(branchStr) && Guid.TryParse(branchStr, out var parsedBranchId))
        {
            branchId = parsedBranchId;
        }

        return (level, branchId);
    }

    [HttpGet]
    public async Task<IActionResult> GetAreas([FromQuery] Guid branchId)
    {
        if (branchId == Guid.Empty)
        {
            return BadRequest(new { message = "Tham số branchId không hợp lệ." });
        }

        var (level, userBranchId) = GetActorContext();
        try
        {
            var areas = await floorService.GetAreasByBranchAsync(branchId, level, userBranchId);
            return Ok(areas);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAreaById(Guid id)
    {
        var (level, userBranchId) = GetActorContext();
        try
        {
            var area = await floorService.GetAreaByIdAsync(id, level, userBranchId);
            if (area == null)
            {
                return NotFound(new { message = "Không tìm thấy khu vực." });
            }
            return Ok(area);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateArea([FromBody] CreateAreaRequest request)
    {
        var (level, userBranchId) = GetActorContext();
        try
        {
            var created = await floorService.CreateAreaAsync(request, level, userBranchId);
            return CreatedAtAction(nameof(GetAreaById), new { id = created.Id }, created);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateArea(Guid id, [FromBody] UpdateAreaRequest request)
    {
        var (level, userBranchId) = GetActorContext();
        try
        {
            var updated = await floorService.UpdateAreaAsync(id, request, level, userBranchId);
            return Ok(updated);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteArea(Guid id)
    {
        var (level, userBranchId) = GetActorContext();
        try
        {
            var success = await floorService.DeleteAreaAsync(id, level, userBranchId);
            if (!success)
            {
                return NotFound(new { message = "Không tìm thấy khu vực cần xóa." });
            }
            return Ok(new { message = "Đã xóa khu vực thành công." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
