using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderPum.Application.DTOs.Staff;
using OrderPum.Application.Interfaces.Services.Staff;

namespace OrderPum.Api.Controllers.Staff;

[ApiController]
[Route("api/shifts")]
[Authorize]
public class ShiftController(IShiftService shiftService) : ControllerBase
{
    private Guid? CurrentUserId
    {
        get
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    [HttpGet("templates")]
    public async Task<ActionResult<List<ShiftTemplateDto>>> GetTemplates(
        [FromQuery] Guid? branchId = null,
        CancellationToken ct = default)
    {
        try
        {
            var result = await shiftService.GetShiftTemplatesAsync(branchId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("templates/{id:guid}")]
    public async Task<ActionResult<ShiftTemplateDto>> GetTemplate(Guid id, CancellationToken ct = default)
    {
        var result = await shiftService.GetShiftTemplateByIdAsync(id, ct);
        if (result is null) return NotFound(new { message = "Không tìm thấy mẫu ca làm việc." });
        return Ok(result);
    }

    [HttpPost("templates")]
    public async Task<ActionResult<ShiftTemplateDto>> CreateTemplate(
        [FromBody] CreateShiftTemplateRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var result = await shiftService.CreateShiftTemplateAsync(request, ct);
            return CreatedAtAction(nameof(GetTemplate), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("templates/{id:guid}")]
    public async Task<ActionResult<ShiftTemplateDto>> UpdateTemplate(
        Guid id,
        [FromBody] UpdateShiftTemplateRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var result = await shiftService.UpdateShiftTemplateAsync(id, request, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("templates/{id:guid}")]
    public async Task<IActionResult> DeleteTemplate(Guid id, CancellationToken ct = default)
    {
        var success = await shiftService.DeleteShiftTemplateAsync(id, ct);
        if (!success) return NotFound(new { message = "Không tìm thấy mẫu ca làm việc." });
        return Ok(new { success = true, message = "Đã xóa mẫu ca làm việc." });
    }

    [HttpGet("roster/weekly")]
    public async Task<ActionResult<WeeklyRosterDto>> GetWeeklyRoster(
        [FromQuery] Guid branchId,
        [FromQuery] DateTime? startOfWeek = null,
        CancellationToken ct = default)
    {
        try
        {
            var start = startOfWeek ?? DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek + (int)DayOfWeek.Monday);
            var result = await shiftService.GetWeeklyRosterAsync(branchId, start, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("schedules")]
    public async Task<ActionResult<List<StaffShiftScheduleDto>>> GetSchedules(
        [FromQuery] Guid? branchId = null,
        [FromQuery] Guid? userId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken ct = default)
    {
        try
        {
            var result = await shiftService.GetStaffSchedulesAsync(branchId, userId, fromDate, toDate, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("schedules")]
    public async Task<ActionResult<StaffShiftScheduleDto>> CreateSchedule(
        [FromBody] CreateStaffScheduleRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var result = await shiftService.CreateStaffScheduleAsync(request, CurrentUserId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("schedules/batch")]
    public async Task<ActionResult<List<StaffShiftScheduleDto>>> BatchCreateSchedule(
        [FromBody] BatchCreateStaffScheduleRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var result = await shiftService.BatchCreateStaffScheduleAsync(request, CurrentUserId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("schedules/{id:guid}")]
    public async Task<ActionResult<StaffShiftScheduleDto>> UpdateSchedule(
        Guid id,
        [FromBody] UpdateStaffScheduleRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var result = await shiftService.UpdateStaffScheduleAsync(id, request, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("schedules/{id:guid}")]
    public async Task<IActionResult> DeleteSchedule(Guid id, CancellationToken ct = default)
    {
        var success = await shiftService.DeleteStaffScheduleAsync(id, ct);
        if (!success) return NotFound(new { message = "Không tìm thấy lịch phân ca." });
        return Ok(new { success = true, message = "Đã xóa lịch phân ca." });
    }
}
