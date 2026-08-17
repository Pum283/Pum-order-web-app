using OrderPum.Domain.Base;

namespace OrderPum.Domain.Entities.Staff;

public class AttendanceRecord : EntityBase
{
    public Guid BranchId { get; set; }
    public Guid UserId { get; set; }
    public Guid? ShiftScheduleId { get; set; } // Liên kết lịch xếp ca nếu có
    public Guid? ShiftTemplateId { get; set; } // Mẫu ca áp dụng

    public DateTime WorkDate { get; set; } // Ngày làm việc (yyyy-MM-dd)
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }

    public string CheckInMethod { get; set; } = "WebSelf"; // QuickPin, QRCode, WebSelf, ManagerManual
    public string? CheckOutMethod { get; set; }

    public string? CheckInPhotoUrl { get; set; }
    public string? LocationNote { get; set; }

    public string Status { get; set; } = "Present"; // Present, Late, EarlyLeave, OnTime, Overtime, InProgress
    public int LateMinutes { get; set; }
    public int EarlyLeaveMinutes { get; set; }
    public decimal ActualWorkHours { get; set; }

    public string? Note { get; set; }
    public Guid? ApprovedByUserId { get; set; }
}
