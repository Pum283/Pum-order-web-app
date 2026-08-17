namespace OrderPum.Application.DTOs.Staff;

public class ShiftTemplateDto
{
    public Guid Id { get; set; }
    public Guid? BranchId { get; set; }
    public string? BranchName { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string StartTime { get; set; } = "06:30";
    public string EndTime { get; set; } = "14:30";
    public int BreakMinutes { get; set; }
    public decimal HourlyRateMultiplier { get; set; }
    public string ColorHex { get; set; } = "#10b981";
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateShiftTemplateRequest
{
    public Guid? BranchId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string StartTime { get; set; } = "06:30";
    public string EndTime { get; set; } = "14:30";
    public int BreakMinutes { get; set; } = 30;
    public decimal HourlyRateMultiplier { get; set; } = 1.0m;
    public string ColorHex { get; set; } = "#10b981";
    public bool IsActive { get; set; } = true;
}

public class UpdateShiftTemplateRequest
{
    public Guid? BranchId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string StartTime { get; set; } = "06:30";
    public string EndTime { get; set; } = "14:30";
    public int BreakMinutes { get; set; } = 30;
    public decimal HourlyRateMultiplier { get; set; } = 1.0m;
    public string ColorHex { get; set; } = "#10b981";
    public bool IsActive { get; set; } = true;
}

public class StaffShiftScheduleDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserDisplayName { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public Guid ShiftTemplateId { get; set; }
    public string ShiftCode { get; set; } = string.Empty;
    public string ShiftName { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string ColorHex { get; set; } = string.Empty;
    public Guid? AreaId { get; set; }
    public string? AreaName { get; set; }
    public DateTime WorkDate { get; set; }
    public string Status { get; set; } = "Scheduled";
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateStaffScheduleRequest
{
    public Guid BranchId { get; set; }
    public Guid UserId { get; set; }
    public Guid ShiftTemplateId { get; set; }
    public Guid? AreaId { get; set; }
    public DateTime WorkDate { get; set; }
    public string? Note { get; set; }
}

public class BatchCreateStaffScheduleRequest
{
    public Guid BranchId { get; set; }
    public List<Guid> UserIds { get; set; } = [];
    public Guid ShiftTemplateId { get; set; }
    public Guid? AreaId { get; set; }
    public List<DateTime> WorkDates { get; set; } = [];
    public string? Note { get; set; }
}

public class UpdateStaffScheduleRequest
{
    public Guid ShiftTemplateId { get; set; }
    public Guid? AreaId { get; set; }
    public DateTime WorkDate { get; set; }
    public string Status { get; set; } = "Scheduled";
    public string? Note { get; set; }
}

public class DayScheduleCellDto
{
    public DateTime Date { get; set; }
    public string DayOfWeekName { get; set; } = string.Empty;
    public List<StaffShiftScheduleDto> Shifts { get; set; } = [];
}

public class StaffWeeklyRosterRowDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserDisplayName { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public List<DayScheduleCellDto> Days { get; set; } = [];
    public int TotalShiftsCount { get; set; }
}

public class WeeklyRosterDto
{
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public DateTime StartOfWeek { get; set; }
    public DateTime EndOfWeek { get; set; }
    public List<StaffWeeklyRosterRowDto> StaffRows { get; set; } = [];
    public List<ShiftTemplateDto> AvailableShifts { get; set; } = [];
}
