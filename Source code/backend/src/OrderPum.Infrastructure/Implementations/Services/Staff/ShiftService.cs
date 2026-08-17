using Microsoft.EntityFrameworkCore;
using OrderPum.Application.DTOs.Staff;
using OrderPum.Application.Interfaces.Services.Staff;
using OrderPum.Domain.Entities.Staff;
using OrderPum.Infrastructure.Persistence;

namespace OrderPum.Infrastructure.Implementations.Services.Staff;

public class ShiftService(AppDbContext db) : IShiftService
{
    public async Task<List<ShiftTemplateDto>> GetShiftTemplatesAsync(Guid? branchId = null, CancellationToken ct = default)
    {
        var query = db.ShiftTemplates.Where(s => !s.IsDeleted);
        if (branchId.HasValue && branchId.Value != Guid.Empty)
        {
            query = query.Where(s => s.BranchId == null || s.BranchId == branchId.Value);
        }

        var list = await query.OrderBy(s => s.StartTime).ToListAsync(ct);
        var branches = await db.Branches.ToListAsync(ct);

        return list.Select(s =>
        {
            var branch = s.BranchId.HasValue ? branches.FirstOrDefault(b => b.Id == s.BranchId.Value) : null;
            return new ShiftTemplateDto
            {
                Id = s.Id,
                BranchId = s.BranchId,
                BranchName = branch?.Name ?? "Toàn hệ thống (Chung)",
                Code = s.Code,
                Name = s.Name,
                Description = s.Description,
                StartTime = s.StartTime.ToString(@"hh\:mm"),
                EndTime = s.EndTime.ToString(@"hh\:mm"),
                BreakMinutes = s.BreakMinutes,
                HourlyRateMultiplier = s.HourlyRateMultiplier,
                ColorHex = s.ColorHex,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt
            };
        }).ToList();
    }

    public async Task<ShiftTemplateDto?> GetShiftTemplateByIdAsync(Guid id, CancellationToken ct = default)
    {
        var s = await db.ShiftTemplates.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct);
        if (s is null) return null;

        var branch = s.BranchId.HasValue ? await db.Branches.FirstOrDefaultAsync(b => b.Id == s.BranchId.Value, ct) : null;

        return new ShiftTemplateDto
        {
            Id = s.Id,
            BranchId = s.BranchId,
            BranchName = branch?.Name ?? "Toàn hệ thống (Chung)",
            Code = s.Code,
            Name = s.Name,
            Description = s.Description,
            StartTime = s.StartTime.ToString(@"hh\:mm"),
            EndTime = s.EndTime.ToString(@"hh\:mm"),
            BreakMinutes = s.BreakMinutes,
            HourlyRateMultiplier = s.HourlyRateMultiplier,
            ColorHex = s.ColorHex,
            IsActive = s.IsActive,
            CreatedAt = s.CreatedAt
        };
    }

    public async Task<ShiftTemplateDto> CreateShiftTemplateAsync(CreateShiftTemplateRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Tên mẫu ca không được để trống.");

        var code = request.Code.Trim().ToUpperInvariant();
        if (string.IsNullOrEmpty(code))
            code = "CA-" + DateTime.UtcNow.Ticks.ToString()[^4..];

        TimeSpan.TryParse(request.StartTime, out var startTime);
        TimeSpan.TryParse(request.EndTime, out var endTime);

        var shift = new ShiftTemplate
        {
            Id = Guid.NewGuid(),
            BranchId = request.BranchId == Guid.Empty ? null : request.BranchId,
            Code = code,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            StartTime = startTime,
            EndTime = endTime,
            BreakMinutes = request.BreakMinutes,
            HourlyRateMultiplier = request.HourlyRateMultiplier,
            ColorHex = string.IsNullOrWhiteSpace(request.ColorHex) ? "#10b981" : request.ColorHex.Trim(),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        db.ShiftTemplates.Add(shift);
        await db.SaveChangesAsync(ct);

        return (await GetShiftTemplateByIdAsync(shift.Id, ct))!;
    }

    public async Task<ShiftTemplateDto> UpdateShiftTemplateAsync(Guid id, UpdateShiftTemplateRequest request, CancellationToken ct = default)
    {
        var shift = await db.ShiftTemplates.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy mẫu ca làm việc.");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Tên mẫu ca không được để trống.");

        TimeSpan.TryParse(request.StartTime, out var startTime);
        TimeSpan.TryParse(request.EndTime, out var endTime);

        shift.BranchId = request.BranchId == Guid.Empty ? null : request.BranchId;
        shift.Code = request.Code.Trim().ToUpperInvariant();
        shift.Name = request.Name.Trim();
        shift.Description = request.Description?.Trim();
        shift.StartTime = startTime;
        shift.EndTime = endTime;
        shift.BreakMinutes = request.BreakMinutes;
        shift.HourlyRateMultiplier = request.HourlyRateMultiplier;
        shift.ColorHex = string.IsNullOrWhiteSpace(request.ColorHex) ? "#10b981" : request.ColorHex.Trim();
        shift.IsActive = request.IsActive;
        shift.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return (await GetShiftTemplateByIdAsync(shift.Id, ct))!;
    }

    public async Task<bool> DeleteShiftTemplateAsync(Guid id, CancellationToken ct = default)
    {
        var shift = await db.ShiftTemplates.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, ct);
        if (shift is null) return false;

        shift.IsDeleted = true;
        shift.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<WeeklyRosterDto> GetWeeklyRosterAsync(Guid branchId, DateTime startOfWeek, CancellationToken ct = default)
    {
        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == branchId && !b.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy chi nhánh.");

        // Normalize startOfWeek to beginning of day
        var start = startOfWeek.Date;
        var end = start.AddDays(7);

        // Load all staff in this branch
        var users = await db.Users
            .Where(u => !u.IsDeleted && !u.IsLocked && (u.BranchId == branchId || u.BranchId == null))
            .OrderBy(u => u.Role)
            .ThenBy(u => u.DisplayName)
            .ToListAsync(ct);

        var templates = await db.ShiftTemplates
            .Where(s => !s.IsDeleted && s.IsActive && (s.BranchId == branchId || s.BranchId == null))
            .OrderBy(s => s.StartTime)
            .ToListAsync(ct);

        var areas = await db.Areas
            .Where(a => a.BranchId == branchId && !a.IsDeleted)
            .ToListAsync(ct);

        var schedules = await db.StaffShiftSchedules
            .Where(s => s.BranchId == branchId && !s.IsDeleted && s.WorkDate >= start && s.WorkDate < end)
            .ToListAsync(ct);

        var dayNames = new[] { "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật" };

        var staffRows = new List<StaffWeeklyRosterRowDto>();

        foreach (var user in users)
        {
            var userDays = new List<DayScheduleCellDto>();
            var totalShifts = 0;

            for (var i = 0; i < 7; i++)
            {
                var curDate = start.AddDays(i);
                var dayShifts = schedules
                    .Where(s => s.UserId == user.Id && s.WorkDate.Date == curDate)
                    .Select(s =>
                    {
                        var tmpl = templates.FirstOrDefault(t => t.Id == s.ShiftTemplateId);
                        var area = s.AreaId.HasValue ? areas.FirstOrDefault(a => a.Id == s.AreaId.Value) : null;
                        return new StaffShiftScheduleDto
                        {
                            Id = s.Id,
                            BranchId = s.BranchId,
                            BranchName = branch.Name,
                            UserId = user.Id,
                            UserName = user.PhoneOrEmail,
                            UserDisplayName = user.DisplayName,
                            UserRole = user.Role.ToString(),
                            ShiftTemplateId = s.ShiftTemplateId,
                            ShiftCode = tmpl?.Code ?? "CA",
                            ShiftName = tmpl?.Name ?? "Ca làm việc",
                            StartTime = (s.CustomStartTime ?? tmpl?.StartTime ?? TimeSpan.Zero).ToString(@"hh\:mm"),
                            EndTime = (s.CustomEndTime ?? tmpl?.EndTime ?? TimeSpan.Zero).ToString(@"hh\:mm"),
                            ColorHex = tmpl?.ColorHex ?? "#10b981",
                            AreaId = s.AreaId,
                            AreaName = area?.Name ?? "Toàn quán",
                            WorkDate = s.WorkDate,
                            Status = s.Status,
                            Note = s.Note,
                            CreatedAt = s.CreatedAt
                        };
                    }).ToList();

                totalShifts += dayShifts.Count;

                userDays.Add(new DayScheduleCellDto
                {
                    Date = curDate,
                    DayOfWeekName = dayNames[i],
                    Shifts = dayShifts
                });
            }

            staffRows.Add(new StaffWeeklyRosterRowDto
            {
                UserId = user.Id,
                UserName = user.PhoneOrEmail,
                UserDisplayName = user.DisplayName,
                UserRole = user.Role.ToString(),
                Phone = user.PhoneOrEmail,
                Days = userDays,
                TotalShiftsCount = totalShifts
            });
        }

        return new WeeklyRosterDto
        {
            BranchId = branch.Id,
            BranchName = branch.Name,
            StartOfWeek = start,
            EndOfWeek = end.AddDays(-1),
            StaffRows = staffRows,
            AvailableShifts = templates.Select(t => new ShiftTemplateDto
            {
                Id = t.Id,
                BranchId = t.BranchId,
                BranchName = branch.Name,
                Code = t.Code,
                Name = t.Name,
                StartTime = t.StartTime.ToString(@"hh\:mm"),
                EndTime = t.EndTime.ToString(@"hh\:mm"),
                ColorHex = t.ColorHex,
                IsActive = t.IsActive
            }).ToList()
        };
    }

    public async Task<List<StaffShiftScheduleDto>> GetStaffSchedulesAsync(
        Guid? branchId = null,
        Guid? userId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken ct = default)
    {
        var query = db.StaffShiftSchedules.Where(s => !s.IsDeleted);

        if (branchId.HasValue && branchId.Value != Guid.Empty)
            query = query.Where(s => s.BranchId == branchId.Value);

        if (userId.HasValue && userId.Value != Guid.Empty)
            query = query.Where(s => s.UserId == userId.Value);

        if (fromDate.HasValue)
            query = query.Where(s => s.WorkDate >= fromDate.Value.Date);

        if (toDate.HasValue)
            query = query.Where(s => s.WorkDate <= toDate.Value.Date);

        var list = await query.OrderByDescending(s => s.WorkDate).ToListAsync(ct);
        var branches = await db.Branches.ToListAsync(ct);
        var users = await db.Users.ToListAsync(ct);
        var templates = await db.ShiftTemplates.ToListAsync(ct);
        var areas = await db.Areas.ToListAsync(ct);

        return list.Select(s =>
        {
            var branch = branches.FirstOrDefault(b => b.Id == s.BranchId);
            var user = users.FirstOrDefault(u => u.Id == s.UserId);
            var tmpl = templates.FirstOrDefault(t => t.Id == s.ShiftTemplateId);
            var area = s.AreaId.HasValue ? areas.FirstOrDefault(a => a.Id == s.AreaId.Value) : null;

            return new StaffShiftScheduleDto
            {
                Id = s.Id,
                BranchId = s.BranchId,
                BranchName = branch?.Name ?? string.Empty,
                UserId = s.UserId,
                UserName = user?.PhoneOrEmail ?? string.Empty,
                UserDisplayName = user?.DisplayName ?? string.Empty,
                UserRole = user?.Role.ToString() ?? string.Empty,
                ShiftTemplateId = s.ShiftTemplateId,
                ShiftCode = tmpl?.Code ?? "CA",
                ShiftName = tmpl?.Name ?? "Ca làm",
                StartTime = (s.CustomStartTime ?? tmpl?.StartTime ?? TimeSpan.Zero).ToString(@"hh\:mm"),
                EndTime = (s.CustomEndTime ?? tmpl?.EndTime ?? TimeSpan.Zero).ToString(@"hh\:mm"),
                ColorHex = tmpl?.ColorHex ?? "#10b981",
                AreaId = s.AreaId,
                AreaName = area?.Name ?? "Toàn quán",
                WorkDate = s.WorkDate,
                Status = s.Status,
                Note = s.Note,
                CreatedAt = s.CreatedAt
            };
        }).ToList();
    }

    public async Task<StaffShiftScheduleDto> CreateStaffScheduleAsync(
        CreateStaffScheduleRequest request,
        Guid? assignedByUserId = null,
        CancellationToken ct = default)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId && !u.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy nhân viên.");

        var tmpl = await db.ShiftTemplates.FirstOrDefaultAsync(t => t.Id == request.ShiftTemplateId && !t.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy mẫu ca làm việc.");

        // Kiểm tra xem nhân viên đã được xếp ca này vào ngày này chưa
        var exists = await db.StaffShiftSchedules.AnyAsync(
            s => s.UserId == request.UserId &&
                 s.WorkDate.Date == request.WorkDate.Date &&
                 s.ShiftTemplateId == request.ShiftTemplateId &&
                 !s.IsDeleted, ct);

        if (exists)
            throw new InvalidOperationException($"Nhân viên {user.DisplayName} đã có lịch ca {tmpl.Name} vào ngày {request.WorkDate:dd/MM/yyyy}.");

        var schedule = new StaffShiftSchedule
        {
            Id = Guid.NewGuid(),
            BranchId = request.BranchId,
            UserId = request.UserId,
            ShiftTemplateId = request.ShiftTemplateId,
            AreaId = request.AreaId == Guid.Empty ? null : request.AreaId,
            WorkDate = request.WorkDate.Date,
            Status = "Scheduled",
            Note = request.Note?.Trim(),
            AssignedByUserId = assignedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        db.StaffShiftSchedules.Add(schedule);
        await db.SaveChangesAsync(ct);

        var list = await GetStaffSchedulesAsync(request.BranchId, request.UserId, request.WorkDate.Date, request.WorkDate.Date, ct);
        return list.First(s => s.Id == schedule.Id);
    }

    public async Task<List<StaffShiftScheduleDto>> BatchCreateStaffScheduleAsync(
        BatchCreateStaffScheduleRequest request,
        Guid? assignedByUserId = null,
        CancellationToken ct = default)
    {
        var tmpl = await db.ShiftTemplates.FirstOrDefaultAsync(t => t.Id == request.ShiftTemplateId && !t.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy mẫu ca làm việc.");

        var created = new List<StaffShiftSchedule>();

        foreach (var userId in request.UserIds)
        {
            foreach (var date in request.WorkDates)
            {
                var workDate = date.Date;
                var exists = await db.StaffShiftSchedules.AnyAsync(
                    s => s.UserId == userId &&
                         s.WorkDate.Date == workDate &&
                         s.ShiftTemplateId == request.ShiftTemplateId &&
                         !s.IsDeleted, ct);

                if (!exists)
                {
                    var schedule = new StaffShiftSchedule
                    {
                        Id = Guid.NewGuid(),
                        BranchId = request.BranchId,
                        UserId = userId,
                        ShiftTemplateId = request.ShiftTemplateId,
                        AreaId = request.AreaId == Guid.Empty ? null : request.AreaId,
                        WorkDate = workDate,
                        Status = "Scheduled",
                        Note = request.Note?.Trim(),
                        AssignedByUserId = assignedByUserId,
                        CreatedAt = DateTime.UtcNow
                    };
                    created.Add(schedule);
                }
            }
        }

        if (created.Count > 0)
        {
            db.StaffShiftSchedules.AddRange(created);
            await db.SaveChangesAsync(ct);
        }

        return await GetStaffSchedulesAsync(request.BranchId, null, null, null, ct);
    }

    public async Task<StaffShiftScheduleDto> UpdateStaffScheduleAsync(
        Guid id,
        UpdateStaffScheduleRequest request,
        CancellationToken ct = default)
    {
        var schedule = await db.StaffShiftSchedules.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy lịch phân ca.");

        schedule.ShiftTemplateId = request.ShiftTemplateId;
        schedule.AreaId = request.AreaId == Guid.Empty ? null : request.AreaId;
        schedule.WorkDate = request.WorkDate.Date;
        schedule.Status = request.Status;
        schedule.Note = request.Note?.Trim();
        schedule.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        var list = await GetStaffSchedulesAsync(schedule.BranchId, schedule.UserId, schedule.WorkDate.Date, schedule.WorkDate.Date, ct);
        return list.First(s => s.Id == schedule.Id);
    }

    public async Task<bool> DeleteStaffScheduleAsync(Guid id, CancellationToken ct = default)
    {
        var schedule = await db.StaffShiftSchedules.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, ct);
        if (schedule is null) return false;

        schedule.IsDeleted = true;
        schedule.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }
}
