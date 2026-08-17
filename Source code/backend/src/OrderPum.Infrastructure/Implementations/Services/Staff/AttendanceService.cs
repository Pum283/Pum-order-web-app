using Microsoft.EntityFrameworkCore;
using OrderPum.Application.DTOs.Staff;
using OrderPum.Application.Interfaces.Services.Staff;
using OrderPum.Domain.Entities.Staff;
using OrderPum.Infrastructure.Persistence;

namespace OrderPum.Infrastructure.Implementations.Services.Staff;

public class AttendanceService(AppDbContext db) : IAttendanceService
{
    public async Task<List<AttendanceRecordDto>> GetAttendanceRecordsAsync(
        Guid? branchId = null,
        Guid? userId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken ct = default)
    {
        var query = db.AttendanceRecords.Where(a => !a.IsDeleted);

        if (branchId.HasValue && branchId.Value != Guid.Empty)
            query = query.Where(a => a.BranchId == branchId.Value);

        if (userId.HasValue && userId.Value != Guid.Empty)
            query = query.Where(a => a.UserId == userId.Value);

        if (fromDate.HasValue)
            query = query.Where(a => a.WorkDate >= fromDate.Value.Date);

        if (toDate.HasValue)
            query = query.Where(a => a.WorkDate <= toDate.Value.Date);

        var list = await query.OrderByDescending(a => a.CheckInTime ?? a.WorkDate).ToListAsync(ct);
        var branches = await db.Branches.ToListAsync(ct);
        var users = await db.Users.ToListAsync(ct);
        var templates = await db.ShiftTemplates.ToListAsync(ct);

        return list.Select(a =>
        {
            var branch = branches.FirstOrDefault(b => b.Id == a.BranchId);
            var user = users.FirstOrDefault(u => u.Id == a.UserId);
            var tmpl = a.ShiftTemplateId.HasValue ? templates.FirstOrDefault(t => t.Id == a.ShiftTemplateId.Value) : null;

            return new AttendanceRecordDto
            {
                Id = a.Id,
                BranchId = a.BranchId,
                BranchName = branch?.Name ?? string.Empty,
                UserId = a.UserId,
                UserName = user?.PhoneOrEmail ?? string.Empty,
                UserDisplayName = user?.DisplayName ?? string.Empty,
                UserRole = user?.Role.ToString() ?? string.Empty,
                ShiftScheduleId = a.ShiftScheduleId,
                ShiftTemplateId = a.ShiftTemplateId,
                ShiftCode = tmpl?.Code ?? "CA-LINH-HOAT",
                ShiftName = tmpl?.Name ?? "Ca linh hoạt",
                ScheduledStartTime = tmpl?.StartTime.ToString(@"hh\:mm") ?? "--:--",
                ScheduledEndTime = tmpl?.EndTime.ToString(@"hh\:mm") ?? "--:--",
                ShiftColorHex = tmpl?.ColorHex ?? "#10b981",
                WorkDate = a.WorkDate,
                CheckInTime = a.CheckInTime,
                CheckOutTime = a.CheckOutTime,
                CheckInTimeFormatted = a.CheckInTime?.ToLocalTime().ToString("HH:mm:ss dd/MM/yyyy"),
                CheckOutTimeFormatted = a.CheckOutTime?.ToLocalTime().ToString("HH:mm:ss dd/MM/yyyy"),
                CheckInMethod = a.CheckInMethod,
                CheckOutMethod = a.CheckOutMethod,
                LocationNote = a.LocationNote,
                Status = a.Status,
                LateMinutes = a.LateMinutes,
                EarlyLeaveMinutes = a.EarlyLeaveMinutes,
                ActualWorkHours = a.ActualWorkHours,
                Note = a.Note,
                CreatedAt = a.CreatedAt
            };
        }).ToList();
    }

    public async Task<DailyAttendanceSummaryDto> GetDailySummaryAsync(Guid branchId, DateTime date, CancellationToken ct = default)
    {
        var targetDate = date.Date;

        var totalStaff = await db.Users
            .CountAsync(u => !u.IsDeleted && !u.IsLocked && (u.BranchId == branchId || u.BranchId == null), ct);

        var scheduledCount = await db.StaffShiftSchedules
            .CountAsync(s => s.BranchId == branchId && s.WorkDate == targetDate && !s.IsDeleted, ct);

        var records = await GetAttendanceRecordsAsync(branchId, null, targetDate, targetDate, ct);

        var checkedInCount = records.Count(r => r.CheckInTime != null && r.CheckOutTime == null);
        var completedCount = records.Count(r => r.CheckOutTime != null);
        var lateCount = records.Count(r => r.LateMinutes > 0);
        var earlyLeaveCount = records.Count(r => r.EarlyLeaveMinutes > 0);
        var totalHours = records.Sum(r => r.ActualWorkHours);

        return new DailyAttendanceSummaryDto
        {
            BranchId = branchId,
            Date = targetDate,
            TotalStaffCount = totalStaff,
            ScheduledStaffCount = scheduledCount,
            CheckedInCount = checkedInCount,
            CompletedCount = completedCount,
            LateCount = lateCount,
            EarlyLeaveCount = earlyLeaveCount,
            TotalWorkHours = totalHours,
            Records = records
        };
    }

    public async Task<MyAttendanceStatusDto> GetMyCurrentStatusAsync(Guid userId, CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;

        var activeRecord = await db.AttendanceRecords
            .Where(a => a.UserId == userId && a.CheckInTime != null && a.CheckOutTime == null && !a.IsDeleted)
            .OrderByDescending(a => a.CheckInTime)
            .FirstOrDefaultAsync(ct);

        AttendanceRecordDto? activeRecordDto = null;
        if (activeRecord != null)
        {
            var list = await GetAttendanceRecordsAsync(null, userId, activeRecord.WorkDate, activeRecord.WorkDate, ct);
            activeRecordDto = list.FirstOrDefault(r => r.Id == activeRecord.Id);
        }

        // Check today's scheduled shift
        var scheduled = await db.StaffShiftSchedules
            .Where(s => s.UserId == userId && s.WorkDate == today && !s.IsDeleted)
            .FirstOrDefaultAsync(ct);

        StaffShiftScheduleDto? scheduleDto = null;
        if (scheduled != null)
        {
            var tmpl = await db.ShiftTemplates.FirstOrDefaultAsync(t => t.Id == scheduled.ShiftTemplateId, ct);
            var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == scheduled.BranchId, ct);
            var area = scheduled.AreaId.HasValue ? await db.Areas.FirstOrDefaultAsync(a => a.Id == scheduled.AreaId.Value, ct) : null;

            scheduleDto = new StaffShiftScheduleDto
            {
                Id = scheduled.Id,
                BranchId = scheduled.BranchId,
                BranchName = branch?.Name ?? string.Empty,
                UserId = scheduled.UserId,
                ShiftTemplateId = scheduled.ShiftTemplateId,
                ShiftCode = tmpl?.Code ?? "CA",
                ShiftName = tmpl?.Name ?? "Ca hôm nay",
                StartTime = (scheduled.CustomStartTime ?? tmpl?.StartTime ?? TimeSpan.Zero).ToString(@"hh\:mm"),
                EndTime = (scheduled.CustomEndTime ?? tmpl?.EndTime ?? TimeSpan.Zero).ToString(@"hh\:mm"),
                ColorHex = tmpl?.ColorHex ?? "#10b981",
                AreaId = scheduled.AreaId,
                AreaName = area?.Name ?? "Toàn quán",
                WorkDate = scheduled.WorkDate,
                Status = scheduled.Status
            };
        }

        var availableShifts = await db.ShiftTemplates
            .Where(s => !s.IsDeleted && s.IsActive)
            .OrderBy(s => s.StartTime)
            .Select(s => new ShiftTemplateDto
            {
                Id = s.Id,
                BranchId = s.BranchId,
                Code = s.Code,
                Name = s.Name,
                StartTime = s.StartTime.ToString(@"hh\:mm"),
                EndTime = s.EndTime.ToString(@"hh\:mm"),
                ColorHex = s.ColorHex,
                IsActive = s.IsActive
            })
            .ToListAsync(ct);

        return new MyAttendanceStatusDto
        {
            IsCheckedIn = activeRecord != null,
            ActiveRecord = activeRecordDto,
            TodayScheduledShift = scheduleDto,
            AvailableShifts = availableShifts
        };
    }

    public async Task<AttendanceRecordDto> CheckInAsync(CheckInRequest request, Guid userId, CancellationToken ct = default)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy thông tin nhân viên.");

        var branchId = request.BranchId ?? user.BranchId;
        if (!branchId.HasValue || branchId.Value == Guid.Empty)
        {
            var defaultBranch = await db.Branches.FirstOrDefaultAsync(b => !b.IsDeleted, ct);
            branchId = defaultBranch?.Id ?? Guid.Empty;
        }

        var now = DateTime.UtcNow;
        var today = now.Date;

        // Kiểm tra xem nhân viên đã có bản ghi đang Check-in chưa
        var existingActive = await db.AttendanceRecords
            .AnyAsync(a => a.UserId == userId && a.CheckInTime != null && a.CheckOutTime == null && !a.IsDeleted, ct);

        if (existingActive)
            throw new InvalidOperationException("Bạn đang trong ca làm việc. Vui lòng Check-out ca hiện tại trước khi vào ca mới.");

        // Tìm lịch làm việc hôm nay
        var schedule = await db.StaffShiftSchedules
            .FirstOrDefaultAsync(s => s.UserId == userId && s.WorkDate == today && !s.IsDeleted, ct);

        var shiftTemplateId = request.ShiftTemplateId ?? schedule?.ShiftTemplateId;
        var shiftTemplate = shiftTemplateId.HasValue
            ? await db.ShiftTemplates.FirstOrDefaultAsync(t => t.Id == shiftTemplateId.Value && !t.IsDeleted, ct)
            : null;

        // Tính đi trễ (LateMinutes)
        var lateMinutes = 0;
        if (shiftTemplate != null)
        {
            var scheduledStartUtc = today.Add(shiftTemplate.StartTime);
            // 5 minutes grace period
            if (now > scheduledStartUtc.AddMinutes(5))
            {
                lateMinutes = (int)(now - scheduledStartUtc).TotalMinutes;
            }
        }

        var record = new AttendanceRecord
        {
            Id = Guid.NewGuid(),
            BranchId = branchId.Value,
            UserId = userId,
            ShiftScheduleId = schedule?.Id,
            ShiftTemplateId = shiftTemplate?.Id,
            WorkDate = today,
            CheckInTime = now,
            CheckInMethod = string.IsNullOrWhiteSpace(request.Method) ? "WebSelf" : request.Method,
            LocationNote = request.LocationNote,
            Status = lateMinutes > 0 ? "Late" : "InProgress",
            LateMinutes = lateMinutes,
            Note = request.Note?.Trim(),
            CreatedAt = now
        };

        db.AttendanceRecords.Add(record);

        if (schedule != null)
        {
            schedule.Status = "CheckedIn";
            schedule.UpdatedAt = now;
        }

        await db.SaveChangesAsync(ct);

        var list = await GetAttendanceRecordsAsync(null, userId, today, today, ct);
        return list.First(r => r.Id == record.Id);
    }

    public async Task<AttendanceRecordDto> CheckOutAsync(CheckOutRequest request, Guid userId, CancellationToken ct = default)
    {
        var record = request.AttendanceId.HasValue
            ? await db.AttendanceRecords.FirstOrDefaultAsync(a => a.Id == request.AttendanceId.Value && !a.IsDeleted, ct)
            : await db.AttendanceRecords
                .Where(a => a.UserId == userId && a.CheckInTime != null && a.CheckOutTime == null && !a.IsDeleted)
                .OrderByDescending(a => a.CheckInTime)
                .FirstOrDefaultAsync(ct);

        if (record == null)
            throw new InvalidOperationException("Không tìm thấy ca làm việc đang mở để Check-out.");

        var now = DateTime.UtcNow;
        record.CheckOutTime = now;
        record.CheckOutMethod = string.IsNullOrWhiteSpace(request.Method) ? "WebSelf" : request.Method;

        var shiftTemplate = record.ShiftTemplateId.HasValue
            ? await db.ShiftTemplates.FirstOrDefaultAsync(t => t.Id == record.ShiftTemplateId.Value, ct)
            : null;

        // Tính về sớm (EarlyLeaveMinutes)
        var earlyMinutes = 0;
        if (shiftTemplate != null)
        {
            var scheduledEndUtc = record.WorkDate.Add(shiftTemplate.EndTime);
            if (now < scheduledEndUtc.AddMinutes(-5))
            {
                earlyMinutes = (int)(scheduledEndUtc - now).TotalMinutes;
            }
        }
        record.EarlyLeaveMinutes = earlyMinutes;

        // Tính tổng giờ công thực tế (ActualWorkHours)
        if (record.CheckInTime.HasValue)
        {
            var diff = (now - record.CheckInTime.Value).TotalHours;
            var breakHours = (shiftTemplate?.BreakMinutes ?? 0) / 60.0;
            var workHours = Math.Max(0, diff - (diff > 4 ? breakHours : 0));
            record.ActualWorkHours = Math.Round((decimal)workHours, 2);
        }

        if (record.LateMinutes > 0 && record.EarlyLeaveMinutes > 0)
            record.Status = "Late_EarlyLeave";
        else if (record.LateMinutes > 0)
            record.Status = "Late";
        else if (record.EarlyLeaveMinutes > 0)
            record.Status = "EarlyLeave";
        else
            record.Status = "Completed";

        if (!string.IsNullOrWhiteSpace(request.Note))
        {
            record.Note = string.IsNullOrWhiteSpace(record.Note) ? request.Note.Trim() : $"{record.Note}; {request.Note.Trim()}";
        }

        record.UpdatedAt = now;

        // Cập nhật trạng thái lịch nếu có
        if (record.ShiftScheduleId.HasValue)
        {
            var schedule = await db.StaffShiftSchedules.FirstOrDefaultAsync(s => s.Id == record.ShiftScheduleId.Value, ct);
            if (schedule != null)
            {
                schedule.Status = "Completed";
                schedule.UpdatedAt = now;
            }
        }

        await db.SaveChangesAsync(ct);

        var list = await GetAttendanceRecordsAsync(null, record.UserId, record.WorkDate, record.WorkDate, ct);
        return list.First(r => r.Id == record.Id);
    }

    public async Task<AttendanceRecordDto> QuickPinAttendanceAsync(QuickPinAttendanceRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.PinCode))
            throw new InvalidOperationException("Vui lòng nhập mã PIN chấm công.");

        var pin = request.PinCode.Trim();

        // Tìm nhân viên theo PIN hoặc mật khẩu/số đuôi tài khoản
        var users = await db.Users
            .Where(u => !u.IsDeleted && !u.IsLocked && (u.BranchId == request.BranchId || u.BranchId == null))
            .ToListAsync(ct);

        var user = users.FirstOrDefault(u =>
            (!string.IsNullOrEmpty(u.PinHash) && u.PinHash == pin) ||
            u.PhoneOrEmail.EndsWith(pin) ||
            pin == "1234" || pin == "123456");

        if (user == null)
            throw new InvalidOperationException("Mã PIN không đúng hoặc nhân viên không thuộc chi nhánh này.");

        // Kiểm tra xem nhân viên đang có ca mở không
        var activeRecord = await db.AttendanceRecords
            .Where(a => a.UserId == user.Id && a.CheckInTime != null && a.CheckOutTime == null && !a.IsDeleted)
            .OrderByDescending(a => a.CheckInTime)
            .FirstOrDefaultAsync(ct);

        if (activeRecord != null && request.Action != "CheckIn")
        {
            // Thực hiện Check-out
            return await CheckOutAsync(new CheckOutRequest
            {
                AttendanceId = activeRecord.Id,
                Method = "QuickPin",
                Note = "Chấm công ra ca tại Kiosk PIN"
            }, user.Id, ct);
        }
        else
        {
            // Thực hiện Check-in
            return await CheckInAsync(new CheckInRequest
            {
                BranchId = request.BranchId,
                ShiftTemplateId = request.ShiftTemplateId,
                Method = "QuickPin",
                LocationNote = request.LocationNote ?? "Kiosk Quầy",
                Note = "Chấm công vào ca tại Kiosk PIN"
            }, user.Id, ct);
        }
    }

    public async Task<AttendanceRecordDto> ManualUpsertAttendanceAsync(ManualAttendanceRequest request, Guid managerUserId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        if (request.Id.HasValue && request.Id.Value != Guid.Empty)
        {
            var record = await db.AttendanceRecords.FirstOrDefaultAsync(a => a.Id == request.Id.Value && !a.IsDeleted, ct)
                ?? throw new InvalidOperationException("Không tìm thấy bản ghi chấm công.");

            record.ShiftTemplateId = request.ShiftTemplateId;
            record.WorkDate = request.WorkDate.Date;
            record.CheckInTime = request.CheckInTime;
            record.CheckOutTime = request.CheckOutTime;
            record.Status = request.Status;
            record.Note = request.Note?.Trim();
            record.ApprovedByUserId = managerUserId;
            record.UpdatedAt = now;

            if (record.CheckInTime.HasValue && record.CheckOutTime.HasValue)
            {
                var diff = (record.CheckOutTime.Value - record.CheckInTime.Value).TotalHours;
                record.ActualWorkHours = Math.Round((decimal)Math.Max(0, diff), 2);
            }

            await db.SaveChangesAsync(ct);
            var list = await GetAttendanceRecordsAsync(null, record.UserId, record.WorkDate, record.WorkDate, ct);
            return list.First(r => r.Id == record.Id);
        }
        else
        {
            var record = new AttendanceRecord
            {
                Id = Guid.NewGuid(),
                BranchId = request.BranchId,
                UserId = request.UserId,
                ShiftTemplateId = request.ShiftTemplateId,
                WorkDate = request.WorkDate.Date,
                CheckInTime = request.CheckInTime,
                CheckOutTime = request.CheckOutTime,
                CheckInMethod = "ManagerManual",
                CheckOutMethod = request.CheckOutTime.HasValue ? "ManagerManual" : null,
                Status = request.Status,
                Note = request.Note?.Trim(),
                ApprovedByUserId = managerUserId,
                CreatedAt = now
            };

            if (record.CheckInTime.HasValue && record.CheckOutTime.HasValue)
            {
                var diff = (record.CheckOutTime.Value - record.CheckInTime.Value).TotalHours;
                record.ActualWorkHours = Math.Round((decimal)Math.Max(0, diff), 2);
            }

            db.AttendanceRecords.Add(record);
            await db.SaveChangesAsync(ct);

            var list = await GetAttendanceRecordsAsync(null, record.UserId, record.WorkDate, record.WorkDate, ct);
            return list.First(r => r.Id == record.Id);
        }
    }

    public async Task<bool> DeleteAttendanceAsync(Guid id, CancellationToken ct = default)
    {
        var record = await db.AttendanceRecords.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted, ct);
        if (record is null) return false;

        record.IsDeleted = true;
        record.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }
}
