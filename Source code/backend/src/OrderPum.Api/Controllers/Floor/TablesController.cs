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
public class TablesController(IFloorService floorService, IConfiguration config) : ControllerBase
{
    private string GetFrontendBaseUrl()
    {
        var origin = Request.Headers.Origin.FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(origin) && !origin.Contains("localhost"))
            return origin.TrimEnd('/');

        var referer = Request.Headers.Referer.FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(referer) && Uri.TryCreate(referer, UriKind.Absolute, out var refUri) && !refUri.Host.Contains("localhost"))
            return $"{refUri.Scheme}://{refUri.Authority}";

        var configured = config["App:FrontendUrl"];
        if (!string.IsNullOrWhiteSpace(configured))
            return configured.TrimEnd('/');

        return "http://pumorder.runasp.net";
    }

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
    public async Task<IActionResult> GetTables([FromQuery] Guid branchId, [FromQuery] Guid? areaId)
    {
        if (branchId == Guid.Empty)
        {
            return BadRequest(new { message = "Tham số branchId không hợp lệ." });
        }

        var (level, userBranchId) = GetActorContext();
        var baseUrl = GetFrontendBaseUrl();
        try
        {
            var tables = await floorService.GetTablesByBranchAsync(branchId, areaId, level, userBranchId, baseUrl);
            return Ok(tables);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTableById(Guid id)
    {
        var (level, userBranchId) = GetActorContext();
        var baseUrl = GetFrontendBaseUrl();
        try
        {
            var table = await floorService.GetTableByIdAsync(id, level, userBranchId, baseUrl);
            if (table == null)
            {
                return NotFound(new { message = "Không tìm thấy bàn." });
            }
            return Ok(table);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpGet("qr/{qrToken}")]
    public async Task<IActionResult> GetTableByQr(string qrToken)
    {
        if (string.IsNullOrWhiteSpace(qrToken))
        {
            return BadRequest(new { message = "Mã token QR không hợp lệ." });
        }

        var baseUrl = GetFrontendBaseUrl();
        var table = await floorService.GetTableByQrTokenAsync(qrToken.Trim(), baseUrl);
        if (table == null)
        {
            return NotFound(new { message = "Mã QR bàn không hợp lệ hoặc bàn đã ngưng hoạt động." });
        }

        return Ok(table);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTable([FromBody] CreateTableRequest request)
    {
        var (level, userBranchId) = GetActorContext();
        var baseUrl = GetFrontendBaseUrl();
        try
        {
            var created = await floorService.CreateTableAsync(request, level, userBranchId, baseUrl);
            return CreatedAtAction(nameof(GetTableById), new { id = created.Id }, created);
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
    public async Task<IActionResult> UpdateTable(Guid id, [FromBody] UpdateTableRequest request)
    {
        var (level, userBranchId) = GetActorContext();
        var baseUrl = GetFrontendBaseUrl();
        try
        {
            var updated = await floorService.UpdateTableAsync(id, request, level, userBranchId, baseUrl);
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

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateTableStatus(Guid id, [FromBody] UpdateTableStatusRequest request)
    {
        var (level, userBranchId) = GetActorContext();
        var baseUrl = GetFrontendBaseUrl();
        try
        {
            var updated = await floorService.UpdateTableStatusAsync(id, request.Status, level, userBranchId, baseUrl);
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
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/regenerate-qr")]
    public async Task<IActionResult> RegenerateQr(Guid id)
    {
        var (level, userBranchId) = GetActorContext();
        var baseUrl = GetFrontendBaseUrl();
        try
        {
            var updated = await floorService.RegenerateQrTokenAsync(id, level, userBranchId, baseUrl);
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
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> TransferTable([FromBody] TransferTableRequest request)
    {
        var (level, userBranchId) = GetActorContext();
        try
        {
            var result = await floorService.TransferTableAsync(request, level, userBranchId);
            return Ok(result);
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

    [HttpPost("positions")]
    public async Task<IActionResult> UpdatePositions([FromBody] BatchUpdateTablePositionsRequest request)
    {
        var (level, userBranchId) = GetActorContext();
        try
        {
            var success = await floorService.BatchUpdatePositionsAsync(request, level, userBranchId);
            return Ok(new { success, message = "Đã lưu vị trí sơ đồ bàn thành công." });
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

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTable(Guid id)
    {
        var (level, userBranchId) = GetActorContext();
        try
        {
            var success = await floorService.DeleteTableAsync(id, level, userBranchId);
            if (!success)
            {
                return NotFound(new { message = "Không tìm thấy bàn cần xóa." });
            }
            return Ok(new { message = "Đã xóa bàn thành công." });
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
