using OrderPum.Domain.Base;

namespace OrderPum.Domain.Entities.Staff;

public class ShiftTemplate : EntityBase
{
    public Guid? BranchId { get; set; } // Null nếu áp dụng toàn hệ thống
    public string Code { get; set; } = string.Empty; // CA-SANG, CA-CHIEU, CA-TOI
    public string Name { get; set; } = string.Empty; // Ca Sáng (06:30 - 14:30)
    public string? Description { get; set; }
    public TimeSpan StartTime { get; set; } = new(6, 30, 0);
    public TimeSpan EndTime { get; set; } = new(14, 30, 0);
    public int BreakMinutes { get; set; } = 30;
    public decimal HourlyRateMultiplier { get; set; } = 1.0m;
    public string ColorHex { get; set; } = "#10b981"; // Emerald, Amber, Indigo, Rose
    public bool IsActive { get; set; } = true;
}

public class StaffShiftSchedule : EntityBase
{
    public Guid BranchId { get; set; }
    public Guid UserId { get; set; }
    public Guid ShiftTemplateId { get; set; }
    public Guid? AreaId { get; set; } // Khu vực / Tầng phân công phụ trách trong ca (STT 80)
    
    public DateTime WorkDate { get; set; } // Ngày làm việc (yyyy-MM-dd)
    public TimeSpan? CustomStartTime { get; set; }
    public TimeSpan? CustomEndTime { get; set; }
    
    public string Status { get; set; } = "Scheduled"; // Scheduled, CheckedIn, Completed, Absent, Cancelled
    public string? Note { get; set; }
    public Guid? AssignedByUserId { get; set; }
}
