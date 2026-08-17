using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderPum.Application.DTOs.Staff;
using OrderPum.Application.Interfaces.Services.Staff;

namespace OrderPum.Api.Controllers.Staff;

[ApiController]
[Route("api/attendance")]
[Authorize]
public class AttendanceController(IAttendanceService attendanceService) : ControllerBase
{
    private Guid CurrentUserId
    {
        get
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<AttendanceRecordDto>>> GetRecords(
        [FromQuery] Guid? branchId = null,
        [FromQuery] Guid? userId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken ct = default)
    {
        try
        {
            var result = await attendanceService.GetAttendanceRecordsAsync(branchId, userId, fromDate, toDate, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("summary/daily")]
    public async Task<ActionResult<DailyAttendanceSummaryDto>> GetDailySummary(
        [FromQuery] Guid branchId,
        [FromQuery] DateTime? date = null,
        CancellationToken ct = default)
    {
        try
        {
            var targetDate = date ?? DateTime.UtcNow.Date;
            var result = await attendanceService.GetDailySummaryAsync(branchId, targetDate, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("my-status")]
    public async Task<ActionResult<MyAttendanceStatusDto>> GetMyStatus(CancellationToken ct = default)
    {
        try
        {
            if (CurrentUserId == Guid.Empty)
                return Unauthorized(new { message = "Chưa xác thực người dùng." });

            var result = await attendanceService.GetMyCurrentStatusAsync(CurrentUserId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("check-in")]
    public async Task<ActionResult<AttendanceRecordDto>> CheckIn(
        [FromBody] CheckInRequest request,
        CancellationToken ct = default)
    {
        try
        {
            if (CurrentUserId == Guid.Empty)
                return Unauthorized(new { message = "Chưa xác thực người dùng." });

            var result = await attendanceService.CheckInAsync(request, CurrentUserId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("check-out")]
    public async Task<ActionResult<AttendanceRecordDto>> CheckOut(
        [FromBody] CheckOutRequest request,
        CancellationToken ct = default)
    {
        try
        {
            if (CurrentUserId == Guid.Empty)
                return Unauthorized(new { message = "Chưa xác thực người dùng." });

            var result = await attendanceService.CheckOutAsync(request, CurrentUserId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("quick-pin")]
    [AllowAnonymous]
    public async Task<ActionResult<AttendanceRecordDto>> QuickPin(
        [FromBody] QuickPinAttendanceRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var result = await attendanceService.QuickPinAttendanceAsync(request, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("manual")]
    public async Task<ActionResult<AttendanceRecordDto>> ManualUpsert(
        [FromBody] ManualAttendanceRequest request,
        CancellationToken ct = default)
    {
        try
        {
            if (CurrentUserId == Guid.Empty)
                return Unauthorized(new { message = "Chưa xác thực người dùng." });

            var result = await attendanceService.ManualUpsertAttendanceAsync(request, CurrentUserId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct = default)
    {
        var success = await attendanceService.DeleteAttendanceAsync(id, ct);
        if (!success) return NotFound(new { message = "Không tìm thấy bản ghi chấm công." });
        return Ok(new { success = true, message = "Đã xóa bản ghi chấm công." });
    }
}
