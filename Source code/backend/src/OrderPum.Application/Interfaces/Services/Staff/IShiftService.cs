using OrderPum.Application.DTOs.Staff;

namespace OrderPum.Application.Interfaces.Services.Staff;

public interface IShiftService
{
    Task<List<ShiftTemplateDto>> GetShiftTemplatesAsync(
        Guid? branchId = null,
        CancellationToken ct = default);

    Task<ShiftTemplateDto?> GetShiftTemplateByIdAsync(
        Guid id,
        CancellationToken ct = default);

    Task<ShiftTemplateDto> CreateShiftTemplateAsync(
        CreateShiftTemplateRequest request,
        CancellationToken ct = default);

    Task<ShiftTemplateDto> UpdateShiftTemplateAsync(
        Guid id,
        UpdateShiftTemplateRequest request,
        CancellationToken ct = default);

    Task<bool> DeleteShiftTemplateAsync(
        Guid id,
        CancellationToken ct = default);

    Task<WeeklyRosterDto> GetWeeklyRosterAsync(
        Guid branchId,
        DateTime startOfWeek,
        CancellationToken ct = default);

    Task<List<StaffShiftScheduleDto>> GetStaffSchedulesAsync(
        Guid? branchId = null,
        Guid? userId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken ct = default);

    Task<StaffShiftScheduleDto> CreateStaffScheduleAsync(
        CreateStaffScheduleRequest request,
        Guid? assignedByUserId = null,
        CancellationToken ct = default);

    Task<List<StaffShiftScheduleDto>> BatchCreateStaffScheduleAsync(
        BatchCreateStaffScheduleRequest request,
        Guid? assignedByUserId = null,
        CancellationToken ct = default);

    Task<StaffShiftScheduleDto> UpdateStaffScheduleAsync(
        Guid id,
        UpdateStaffScheduleRequest request,
        CancellationToken ct = default);

    Task<bool> DeleteStaffScheduleAsync(
        Guid id,
        CancellationToken ct = default);
}
