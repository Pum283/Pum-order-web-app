namespace OrderPum.Application.DTOs.Staff;

public class AttendanceRecordDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserDisplayName { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;

    public Guid? ShiftScheduleId { get; set; }
    public Guid? ShiftTemplateId { get; set; }
    public string ShiftCode { get; set; } = string.Empty;
    public string ShiftName { get; set; } = string.Empty;
    public string ScheduledStartTime { get; set; } = string.Empty;
    public string ScheduledEndTime { get; set; } = string.Empty;
    public string ShiftColorHex { get; set; } = string.Empty;

    public DateTime WorkDate { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string? CheckInTimeFormatted { get; set; }
    public string? CheckOutTimeFormatted { get; set; }

    public string CheckInMethod { get; set; } = "WebSelf";
    public string? CheckOutMethod { get; set; }
    public string? LocationNote { get; set; }

    public string Status { get; set; } = "Present";
    public int LateMinutes { get; set; }
    public int EarlyLeaveMinutes { get; set; }
    public decimal ActualWorkHours { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CheckInRequest
{
    public Guid? BranchId { get; set; }
    public Guid? ShiftTemplateId { get; set; }
    public string? Method { get; set; } = "WebSelf";
    public string? LocationNote { get; set; }
    public string? Note { get; set; }
}

public class CheckOutRequest
{
    public Guid? AttendanceId { get; set; }
    public string? Method { get; set; } = "WebSelf";
    public string? Note { get; set; }
}

public class QuickPinAttendanceRequest
{
    public Guid BranchId { get; set; }
    public string PinCode { get; set; } = string.Empty; // Mã PIN 4-6 số của NV
    public string Action { get; set; } = "Auto"; // Auto, CheckIn, CheckOut
    public Guid? ShiftTemplateId { get; set; }
    public string? LocationNote { get; set; }
}

public class ManualAttendanceRequest
{
    public Guid? Id { get; set; }
    public Guid BranchId { get; set; }
    public Guid UserId { get; set; }
    public Guid? ShiftTemplateId { get; set; }
    public DateTime WorkDate { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string Status { get; set; } = "Present";
    public string? Note { get; set; }
}

public class MyAttendanceStatusDto
{
    public bool IsCheckedIn { get; set; }
    public AttendanceRecordDto? ActiveRecord { get; set; }
    public StaffShiftScheduleDto? TodayScheduledShift { get; set; }
    public List<ShiftTemplateDto> AvailableShifts { get; set; } = [];
}

public class DailyAttendanceSummaryDto
{
    public Guid BranchId { get; set; }
    public DateTime Date { get; set; }
    public int TotalStaffCount { get; set; }
    public int ScheduledStaffCount { get; set; }
    public int CheckedInCount { get; set; }
    public int CompletedCount { get; set; }
    public int LateCount { get; set; }
    public int EarlyLeaveCount { get; set; }
    public decimal TotalWorkHours { get; set; }
    public List<AttendanceRecordDto> Records { get; set; } = [];
}
