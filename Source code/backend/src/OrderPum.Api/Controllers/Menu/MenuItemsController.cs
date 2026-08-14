using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderPum.Application.DTOs.Menu;
using OrderPum.Application.Interfaces.Services.Menu;
using OrderPum.Domain.Enums.Auth;

namespace OrderPum.Api.Controllers.Menu;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MenuItemsController(IMenuService menuService) : ControllerBase
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
    [AllowAnonymous]
    public async Task<IActionResult> GetMenuItems(
        [FromQuery] Guid branchId,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? search = null,
        [FromQuery] bool onlyAvailable = false)
    {
        if (branchId == Guid.Empty)
        {
            return BadRequest(new { message = "Tham số branchId không hợp lệ." });
        }

        var (level, userBranchId) = User.Identity?.IsAuthenticated == true ? GetActorContext() : (10, (Guid?)null);
        try
        {
            var items = await menuService.GetMenuItemsByBranchAsync(branchId, categoryId, search, onlyAvailable, level, userBranchId);
            return Ok(items);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMenuItemById(Guid id)
    {
        var (level, userBranchId) = User.Identity?.IsAuthenticated == true ? GetActorContext() : (10, (Guid?)null);
        try
        {
            var item = await menuService.GetMenuItemByIdAsync(id, level, userBranchId);
            if (item == null)
            {
                return NotFound(new { message = "Không tìm thấy món ăn." });
            }
            return Ok(item);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateMenuItem([FromBody] CreateMenuItemRequest request)
    {
        var (level, userBranchId) = GetActorContext();
        if (level > 3)
        {
            return StatusCode(403, new { message = "Chỉ Quản lý (Level 3) hoặc Giám đốc/Chủ nhà hàng mới có quyền thêm món ăn vào thực đơn." });
        }

        try
        {
            var created = await menuService.CreateMenuItemAsync(request, level, userBranchId);
            return CreatedAtAction(nameof(GetMenuItemById), new { id = created.Id }, created);
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

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateMenuItem(Guid id, [FromBody] UpdateMenuItemRequest request)
    {
        var (level, userBranchId) = GetActorContext();
        if (level > 3)
        {
            return StatusCode(403, new { message = "Chỉ Quản lý (Level 3) hoặc Giám đốc/Chủ nhà hàng mới có quyền chỉnh sửa món ăn." });
        }

        try
        {
            var updated = await menuService.UpdateMenuItemAsync(id, request, level, userBranchId);
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

    [HttpPatch("{id:guid}/availability")]
    public async Task<IActionResult> ToggleAvailability(Guid id, [FromBody] ToggleItemAvailabilityRequest request)
    {
        var (level, userBranchId) = GetActorContext();
        if (level > 4) // Trưởng ca (Level 4) và Quản lý (Level 3) được phép bật/tắt bán
        {
            return StatusCode(403, new { message = "Bạn không có quyền thay đổi trạng thái bán của món ăn." });
        }

        try
        {
            var success = await menuService.ToggleItemAvailabilityAsync(id, request.IsAvailable, level, userBranchId);
            if (!success)
            {
                return NotFound(new { message = "Không tìm thấy món ăn." });
            }
            return Ok(new { success = true, isAvailable = request.IsAvailable, message = "Đã cập nhật trạng thái bán thành công." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/86")]
    public async Task<IActionResult> Toggle86(Guid id, [FromBody] ToggleItem86Request request)
    {
        var (level, userBranchId) = GetActorContext();
        // Bếp/Bar, Trưởng ca, Quản lý đều được báo hết hàng (86'ed) trong ca
        try
        {
            var success = await menuService.ToggleItem86Async(id, request.Is86ed, level, userBranchId);
            if (!success)
            {
                return NotFound(new { message = "Không tìm thấy món ăn." });
            }
            return Ok(new { success = true, is86ed = request.Is86ed, message = request.Is86ed ? "Đã đánh dấu món tạm hết (86'ed)." : "Đã mở lại món phục vụ." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteMenuItem(Guid id)
    {
        var (level, userBranchId) = GetActorContext();
        if (level > 3)
        {
            return StatusCode(403, new { message = "Chỉ Quản lý (Level 3) hoặc Giám đốc/Chủ nhà hàng mới có quyền xóa món ăn." });
        }

        try
        {
            var success = await menuService.DeleteMenuItemAsync(id, level, userBranchId);
            if (!success)
            {
                return NotFound(new { message = "Không tìm thấy món ăn cần xóa." });
            }
            return Ok(new { message = "Đã xóa món ăn khỏi thực đơn thành công." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }
}
