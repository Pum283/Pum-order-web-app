using OrderPum.Application.DTOs.Staff;

namespace OrderPum.Application.Interfaces.Services.Staff;

public interface IAttendanceService
{
    Task<List<AttendanceRecordDto>> GetAttendanceRecordsAsync(
        Guid? branchId = null,
        Guid? userId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken ct = default);

    Task<DailyAttendanceSummaryDto> GetDailySummaryAsync(
        Guid branchId,
        DateTime date,
        CancellationToken ct = default);

    Task<MyAttendanceStatusDto> GetMyCurrentStatusAsync(
        Guid userId,
        CancellationToken ct = default);

    Task<AttendanceRecordDto> CheckInAsync(
        CheckInRequest request,
        Guid userId,
        CancellationToken ct = default);

    Task<AttendanceRecordDto> CheckOutAsync(
        CheckOutRequest request,
        Guid userId,
        CancellationToken ct = default);

    Task<AttendanceRecordDto> QuickPinAttendanceAsync(
        QuickPinAttendanceRequest request,
        CancellationToken ct = default);

    Task<AttendanceRecordDto> ManualUpsertAttendanceAsync(
        ManualAttendanceRequest request,
        Guid managerUserId,
        CancellationToken ct = default);

    Task<bool> DeleteAttendanceAsync(
        Guid id,
        CancellationToken ct = default);
}
