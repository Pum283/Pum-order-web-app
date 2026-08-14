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
public class CategoriesController(IMenuService menuService) : ControllerBase
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
    public async Task<IActionResult> GetCategories([FromQuery] Guid branchId, [FromQuery] bool onlyActive = false)
    {
        if (branchId == Guid.Empty)
        {
            return BadRequest(new { message = "Tham số branchId không hợp lệ." });
        }

        var (level, userBranchId) = User.Identity?.IsAuthenticated == true ? GetActorContext() : (10, (Guid?)null);
        try
        {
            var categories = await menuService.GetCategoriesByBranchAsync(branchId, onlyActive, level, userBranchId);
            return Ok(categories);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategoryById(Guid id)
    {
        var (level, userBranchId) = User.Identity?.IsAuthenticated == true ? GetActorContext() : (10, (Guid?)null);
        try
        {
            var category = await menuService.GetCategoryByIdAsync(id, level, userBranchId);
            if (category == null)
            {
                return NotFound(new { message = "Không tìm thấy danh mục món ăn." });
            }
            return Ok(category);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        var (level, userBranchId) = GetActorContext();
        if (level > 3)
        {
            return StatusCode(403, new { message = "Chỉ Quản lý (Level 3) hoặc Giám đốc/Chủ nhà hàng mới có quyền tạo danh mục món ăn." });
        }

        try
        {
            var created = await menuService.CreateCategoryAsync(request, level, userBranchId);
            return CreatedAtAction(nameof(GetCategoryById), new { id = created.Id }, created);
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
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateCategoryRequest request)
    {
        var (level, userBranchId) = GetActorContext();
        if (level > 3)
        {
            return StatusCode(403, new { message = "Chỉ Quản lý (Level 3) hoặc Giám đốc/Chủ nhà hàng mới có quyền cập nhật danh mục món ăn." });
        }

        try
        {
            var updated = await menuService.UpdateCategoryAsync(id, request, level, userBranchId);
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
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        var (level, userBranchId) = GetActorContext();
        if (level > 3)
        {
            return StatusCode(403, new { message = "Chỉ Quản lý (Level 3) hoặc Giám đốc/Chủ nhà hàng mới có quyền xóa danh mục món ăn." });
        }

        try
        {
            var success = await menuService.DeleteCategoryAsync(id, level, userBranchId);
            if (!success)
            {
                return NotFound(new { message = "Không tìm thấy danh mục cần xóa." });
            }
            return Ok(new { message = "Đã xóa danh mục món ăn thành công." });
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
