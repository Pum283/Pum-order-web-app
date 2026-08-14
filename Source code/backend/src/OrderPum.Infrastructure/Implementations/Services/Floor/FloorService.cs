using Microsoft.EntityFrameworkCore;
using OrderPum.Application.DTOs.Floor;
using OrderPum.Application.Interfaces.Services.Floor;
using OrderPum.Domain.Entities.Floor;
using OrderPum.Infrastructure.Persistence;

namespace OrderPum.Infrastructure.Implementations.Services.Floor;

public class FloorService(AppDbContext dbContext) : IFloorService
{
    private static void ValidateBranchAccess(Guid branchId, int userLevel, Guid? userBranchId)
    {
        if (userLevel > 2 && userBranchId.HasValue && userBranchId.Value != branchId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập dữ liệu của chi nhánh này.");
        }
    }

    // ==========================================
    // AREA OPERATIONS
    // ==========================================

    public async Task<List<AreaDto>> GetAreasByBranchAsync(Guid branchId, int userLevel, Guid? userBranchId)
    {
        ValidateBranchAccess(branchId, userLevel, userBranchId);

        var branch = await dbContext.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == branchId && !b.IsDeleted);
        var branchName = branch?.Name ?? "Chi nhánh";

        var areas = await dbContext.Areas
            .AsNoTracking()
            .Include(a => a.Tables.Where(t => !t.IsDeleted))
            .Where(a => a.BranchId == branchId && !a.IsDeleted)
            .OrderBy(a => a.SortOrder)
            .ThenBy(a => a.Name)
            .ToListAsync();

        return areas.Select(a => new AreaDto
        {
            Id = a.Id,
            BranchId = a.BranchId,
            BranchName = branchName,
            Name = a.Name,
            SortOrder = a.SortOrder,
            IsActive = a.IsActive,
            TableCount = a.Tables.Count,
            CreatedAt = a.CreatedAt
        }).ToList();
    }

    public async Task<AreaDto?> GetAreaByIdAsync(Guid id, int userLevel, Guid? userBranchId)
    {
        var area = await dbContext.Areas
            .AsNoTracking()
            .Include(a => a.Tables.Where(t => !t.IsDeleted))
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (area == null) return null;

        ValidateBranchAccess(area.BranchId, userLevel, userBranchId);

        var branch = await dbContext.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == area.BranchId);

        return new AreaDto
        {
            Id = area.Id,
            BranchId = area.BranchId,
            BranchName = branch?.Name ?? "Chi nhánh",
            Name = area.Name,
            SortOrder = area.SortOrder,
            IsActive = area.IsActive,
            TableCount = area.Tables.Count,
            CreatedAt = area.CreatedAt
        };
    }

    public async Task<AreaDto> CreateAreaAsync(CreateAreaRequest request, int userLevel, Guid? userBranchId)
    {
        if (userLevel > 3)
        {
            throw new UnauthorizedAccessException("Chỉ Quản lý (Level 3) hoặc Giám đốc/Chủ nhà hàng mới có quyền tạo khu vực.");
        }

        ValidateBranchAccess(request.BranchId, userLevel, userBranchId);

        var branchExists = await dbContext.Branches.AnyAsync(b => b.Id == request.BranchId && !b.IsDeleted);
        if (!branchExists)
        {
            throw new InvalidOperationException("Chi nhánh không tồn tại.");
        }

        var duplicateName = await dbContext.Areas
            .AnyAsync(a => a.BranchId == request.BranchId && a.Name.ToLower() == request.Name.Trim().ToLower() && !a.IsDeleted);
        if (duplicateName)
        {
            throw new InvalidOperationException($"Khu vực '{request.Name.Trim()}' đã tồn tại trong chi nhánh này.");
        }

        var area = new Area
        {
            BranchId = request.BranchId,
            Name = request.Name.Trim(),
            SortOrder = request.SortOrder,
            IsActive = true
        };

        dbContext.Areas.Add(area);
        await dbContext.SaveChangesAsync();

        var branch = await dbContext.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == area.BranchId);

        return new AreaDto
        {
            Id = area.Id,
            BranchId = area.BranchId,
            BranchName = branch?.Name ?? "Chi nhánh",
            Name = area.Name,
            SortOrder = area.SortOrder,
            IsActive = area.IsActive,
            TableCount = 0,
            CreatedAt = area.CreatedAt
        };
    }

    public async Task<AreaDto> UpdateAreaAsync(Guid id, UpdateAreaRequest request, int userLevel, Guid? userBranchId)
    {
        if (userLevel > 3)
        {
            throw new UnauthorizedAccessException("Chỉ Quản lý hoặc Giám đốc/Chủ nhà hàng mới có quyền sửa khu vực.");
        }

        var area = await dbContext.Areas
            .Include(a => a.Tables.Where(t => !t.IsDeleted))
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (area == null)
        {
            throw new KeyNotFoundException("Không tìm thấy khu vực.");
        }

        ValidateBranchAccess(area.BranchId, userLevel, userBranchId);

        var duplicateName = await dbContext.Areas
            .AnyAsync(a => a.BranchId == area.BranchId && a.Id != id && a.Name.ToLower() == request.Name.Trim().ToLower() && !a.IsDeleted);
        if (duplicateName)
        {
            throw new InvalidOperationException($"Tên khu vực '{request.Name.Trim()}' đã được dùng cho khu vực khác trong chi nhánh.");
        }

        area.Name = request.Name.Trim();
        area.SortOrder = request.SortOrder;
        area.IsActive = request.IsActive;
        area.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        var branch = await dbContext.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == area.BranchId);

        return new AreaDto
        {
            Id = area.Id,
            BranchId = area.BranchId,
            BranchName = branch?.Name ?? "Chi nhánh",
            Name = area.Name,
            SortOrder = area.SortOrder,
            IsActive = area.IsActive,
            TableCount = area.Tables.Count,
            CreatedAt = area.CreatedAt
        };
    }

    public async Task<bool> DeleteAreaAsync(Guid id, int userLevel, Guid? userBranchId)
    {
        if (userLevel > 3)
        {
            throw new UnauthorizedAccessException("Chỉ Quản lý hoặc Giám đốc/Chủ nhà hàng mới có quyền xóa khu vực.");
        }

        var area = await dbContext.Areas
            .Include(a => a.Tables.Where(t => !t.IsDeleted))
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (area == null) return false;

        ValidateBranchAccess(area.BranchId, userLevel, userBranchId);

        if (area.Tables.Any())
        {
            throw new InvalidOperationException($"Không thể xóa khu vực '{area.Name}' vì vẫn còn {area.Tables.Count} bàn thuộc khu vực này. Hãy chuyển bàn sang khu vực khác hoặc xóa bàn trước.");
        }

        area.IsDeleted = true;
        area.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
        return true;
    }

    // ==========================================
    // DINING TABLE OPERATIONS
    // ==========================================

    public async Task<List<DiningTableDto>> GetTablesByBranchAsync(Guid branchId, Guid? areaId, int userLevel, Guid? userBranchId, string baseUrl = "http://localhost:1212")
    {
        ValidateBranchAccess(branchId, userLevel, userBranchId);

        var query = dbContext.Tables
            .AsNoTracking()
            .Include(t => t.Area)
            .Where(t => t.BranchId == branchId && !t.IsDeleted);

        if (areaId.HasValue && areaId.Value != Guid.Empty)
        {
            query = query.Where(t => t.AreaId == areaId.Value);
        }

        var branch = await dbContext.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == branchId);
        var branchName = branch?.Name ?? "Chi nhánh";

        var tables = await query
            .OrderBy(t => t.Area != null ? t.Area.SortOrder : 0)
            .ThenBy(t => t.Code)
            .ToListAsync();

        return tables.Select(t => new DiningTableDto
        {
            Id = t.Id,
            BranchId = t.BranchId,
            BranchName = branchName,
            AreaId = t.AreaId,
            AreaName = t.Area?.Name ?? "Chưa phân khu",
            Code = t.Code,
            Name = t.Name,
            Capacity = t.Capacity,
            QrToken = t.QrToken,
            QrUrl = $"{baseUrl.TrimEnd('/')}/order?tableId={t.Id}&token={t.QrToken}",
            Status = t.Status ?? "Available",
            PosX = t.PosX,
            PosY = t.PosY,
            IsActive = t.IsActive,
            CreatedAt = t.CreatedAt
        }).ToList();
    }

    public async Task<DiningTableDto?> GetTableByIdAsync(Guid id, int userLevel, Guid? userBranchId, string baseUrl = "http://localhost:1212")
    {
        var table = await dbContext.Tables
            .AsNoTracking()
            .Include(t => t.Area)
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

        if (table == null) return null;

        ValidateBranchAccess(table.BranchId, userLevel, userBranchId);

        var branch = await dbContext.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == table.BranchId);

        return new DiningTableDto
        {
            Id = table.Id,
            BranchId = table.BranchId,
            BranchName = branch?.Name ?? "Chi nhánh",
            AreaId = table.AreaId,
            AreaName = table.Area?.Name ?? "Chưa phân khu",
            Code = table.Code,
            Name = table.Name,
            Capacity = table.Capacity,
            QrToken = table.QrToken,
            QrUrl = $"{baseUrl.TrimEnd('/')}/order?tableId={table.Id}&token={table.QrToken}",
            Status = table.Status ?? "Available",
            PosX = table.PosX,
            PosY = table.PosY,
            IsActive = table.IsActive,
            CreatedAt = table.CreatedAt
        };
    }

    public async Task<DiningTableDto?> GetTableByQrTokenAsync(string qrToken, string baseUrl = "http://localhost:1212")
    {
        var table = await dbContext.Tables
            .AsNoTracking()
            .Include(t => t.Area)
            .FirstOrDefaultAsync(t => t.QrToken == qrToken && !t.IsDeleted && t.IsActive);

        if (table == null) return null;

        var branch = await dbContext.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == table.BranchId);

        return new DiningTableDto
        {
            Id = table.Id,
            BranchId = table.BranchId,
            BranchName = branch?.Name ?? "Chi nhánh",
            AreaId = table.AreaId,
            AreaName = table.Area?.Name ?? "Chưa phân khu",
            Code = table.Code,
            Name = table.Name,
            Capacity = table.Capacity,
            QrToken = table.QrToken,
            QrUrl = $"{baseUrl.TrimEnd('/')}/order?tableId={table.Id}&token={table.QrToken}",
            Status = table.Status ?? "Available",
            PosX = table.PosX,
            PosY = table.PosY,
            IsActive = table.IsActive,
            CreatedAt = table.CreatedAt
        };
    }

    public async Task<DiningTableDto> CreateTableAsync(CreateTableRequest request, int userLevel, Guid? userBranchId, string baseUrl = "http://localhost:1212")
    {
        if (userLevel > 3)
        {
            throw new UnauthorizedAccessException("Chỉ Quản lý hoặc Giám đốc/Chủ nhà hàng mới có quyền tạo bàn.");
        }

        ValidateBranchAccess(request.BranchId, userLevel, userBranchId);

        var branchExists = await dbContext.Branches.AnyAsync(b => b.Id == request.BranchId && !b.IsDeleted);
        if (!branchExists)
        {
            throw new InvalidOperationException("Chi nhánh không tồn tại.");
        }

        var area = await dbContext.Areas.FirstOrDefaultAsync(a => a.Id == request.AreaId && a.BranchId == request.BranchId && !a.IsDeleted);
        if (area == null)
        {
            throw new InvalidOperationException("Khu vực được chọn không tồn tại hoặc không thuộc chi nhánh này.");
        }

        var duplicateCode = await dbContext.Tables
            .AnyAsync(t => t.BranchId == request.BranchId && t.Code.ToLower() == request.Code.Trim().ToLower() && !t.IsDeleted);
        if (duplicateCode)
        {
            throw new InvalidOperationException($"Mã bàn '{request.Code.Trim()}' đã tồn tại trong chi nhánh này.");
        }

        var table = new DiningTable
        {
            BranchId = request.BranchId,
            AreaId = request.AreaId,
            Code = request.Code.Trim().ToUpper(),
            Name = string.IsNullOrWhiteSpace(request.Name) ? request.Code.Trim().ToUpper() : request.Name.Trim(),
            Capacity = request.Capacity > 0 ? request.Capacity : 4,
            QrToken = Guid.NewGuid().ToString("N"),
            Status = "Available",
            PosX = request.PosX,
            PosY = request.PosY,
            IsActive = true
        };

        dbContext.Tables.Add(table);
        await dbContext.SaveChangesAsync();

        var branch = await dbContext.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == table.BranchId);

        return new DiningTableDto
        {
            Id = table.Id,
            BranchId = table.BranchId,
            BranchName = branch?.Name ?? "Chi nhánh",
            AreaId = table.AreaId,
            AreaName = area.Name,
            Code = table.Code,
            Name = table.Name,
            Capacity = table.Capacity,
            QrToken = table.QrToken,
            QrUrl = $"{baseUrl.TrimEnd('/')}/order?tableId={table.Id}&token={table.QrToken}",
            Status = table.Status,
            PosX = table.PosX,
            PosY = table.PosY,
            IsActive = table.IsActive,
            CreatedAt = table.CreatedAt
        };
    }

    public async Task<DiningTableDto> UpdateTableAsync(Guid id, UpdateTableRequest request, int userLevel, Guid? userBranchId, string baseUrl = "http://localhost:1212")
    {
        if (userLevel > 3)
        {
            throw new UnauthorizedAccessException("Chỉ Quản lý hoặc Giám đốc/Chủ nhà hàng mới có quyền sửa thông tin bàn.");
        }

        var table = await dbContext.Tables
            .Include(t => t.Area)
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

        if (table == null)
        {
            throw new KeyNotFoundException("Không tìm thấy bàn.");
        }

        ValidateBranchAccess(table.BranchId, userLevel, userBranchId);

        var area = await dbContext.Areas.FirstOrDefaultAsync(a => a.Id == request.AreaId && a.BranchId == table.BranchId && !a.IsDeleted);
        if (area == null)
        {
            throw new InvalidOperationException("Khu vực được chọn không thuộc chi nhánh này.");
        }

        var duplicateCode = await dbContext.Tables
            .AnyAsync(t => t.BranchId == table.BranchId && t.Id != id && t.Code.ToLower() == request.Code.Trim().ToLower() && !t.IsDeleted);
        if (duplicateCode)
        {
            throw new InvalidOperationException($"Mã bàn '{request.Code.Trim()}' đã được dùng cho bàn khác trong chi nhánh.");
        }

        table.AreaId = request.AreaId;
        table.Code = request.Code.Trim().ToUpper();
        table.Name = string.IsNullOrWhiteSpace(request.Name) ? request.Code.Trim().ToUpper() : request.Name.Trim();
        table.Capacity = request.Capacity > 0 ? request.Capacity : 4;
        table.Status = string.IsNullOrWhiteSpace(request.Status) ? table.Status : request.Status;
        table.PosX = request.PosX;
        table.PosY = request.PosY;
        table.IsActive = request.IsActive;
        table.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        var branch = await dbContext.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == table.BranchId);

        return new DiningTableDto
        {
            Id = table.Id,
            BranchId = table.BranchId,
            BranchName = branch?.Name ?? "Chi nhánh",
            AreaId = table.AreaId,
            AreaName = area.Name,
            Code = table.Code,
            Name = table.Name,
            Capacity = table.Capacity,
            QrToken = table.QrToken,
            QrUrl = $"{baseUrl.TrimEnd('/')}/order?tableId={table.Id}&token={table.QrToken}",
            Status = table.Status,
            PosX = table.PosX,
            PosY = table.PosY,
            IsActive = table.IsActive,
            CreatedAt = table.CreatedAt
        };
    }

    public async Task<DiningTableDto> UpdateTableStatusAsync(Guid id, string status, int userLevel, Guid? userBranchId, string baseUrl = "http://localhost:1212")
    {
        var table = await dbContext.Tables
            .Include(t => t.Area)
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

        if (table == null)
        {
            throw new KeyNotFoundException("Không tìm thấy bàn.");
        }

        ValidateBranchAccess(table.BranchId, userLevel, userBranchId);

        var validStatuses = new[] { "Available", "Occupied", "Reserved", "NeedsCleaning" };
        if (!validStatuses.Contains(status))
        {
            throw new ArgumentException($"Trạng thái '{status}' không hợp lệ. Các trạng thái hợp lệ: Available, Occupied, Reserved, NeedsCleaning");
        }

        table.Status = status;
        table.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        var branch = await dbContext.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == table.BranchId);

        return new DiningTableDto
        {
            Id = table.Id,
            BranchId = table.BranchId,
            BranchName = branch?.Name ?? "Chi nhánh",
            AreaId = table.AreaId,
            AreaName = table.Area?.Name ?? "Chưa phân khu",
            Code = table.Code,
            Name = table.Name,
            Capacity = table.Capacity,
            QrToken = table.QrToken,
            QrUrl = $"{baseUrl.TrimEnd('/')}/order?tableId={table.Id}&token={table.QrToken}",
            Status = table.Status,
            PosX = table.PosX,
            PosY = table.PosY,
            IsActive = table.IsActive,
            CreatedAt = table.CreatedAt
        };
    }

    public async Task<DiningTableDto> RegenerateQrTokenAsync(Guid id, int userLevel, Guid? userBranchId, string baseUrl = "http://localhost:1212")
    {
        if (userLevel > 3)
        {
            throw new UnauthorizedAccessException("Chỉ Quản lý hoặc Giám đốc/Chủ nhà hàng mới có quyền đổi mã Token QR của bàn.");
        }

        var table = await dbContext.Tables
            .Include(t => t.Area)
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

        if (table == null)
        {
            throw new KeyNotFoundException("Không tìm thấy bàn.");
        }

        ValidateBranchAccess(table.BranchId, userLevel, userBranchId);

        table.QrToken = Guid.NewGuid().ToString("N");
        table.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        var branch = await dbContext.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == table.BranchId);

        return new DiningTableDto
        {
            Id = table.Id,
            BranchId = table.BranchId,
            BranchName = branch?.Name ?? "Chi nhánh",
            AreaId = table.AreaId,
            AreaName = table.Area?.Name ?? "Chưa phân khu",
            Code = table.Code,
            Name = table.Name,
            Capacity = table.Capacity,
            QrToken = table.QrToken,
            QrUrl = $"{baseUrl.TrimEnd('/')}/order?tableId={table.Id}&token={table.QrToken}",
            Status = table.Status,
            PosX = table.PosX,
            PosY = table.PosY,
            IsActive = table.IsActive,
            CreatedAt = table.CreatedAt
        };
    }

    public async Task<bool> DeleteTableAsync(Guid id, int userLevel, Guid? userBranchId)
    {
        if (userLevel > 3)
        {
            throw new UnauthorizedAccessException("Chỉ Quản lý hoặc Giám đốc/Chủ nhà hàng mới có quyền xóa bàn.");
        }

        var table = await dbContext.Tables.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);
        if (table == null) return false;

        ValidateBranchAccess(table.BranchId, userLevel, userBranchId);

        // Check if table has active session
        var hasActiveSession = await dbContext.TableSessions.AnyAsync(s => s.TableId == id && s.ClosedAt == null);
        if (hasActiveSession)
        {
            throw new InvalidOperationException($"Bàn '{table.Code}' đang có phiên phục vụ chưa thanh toán / chưa đóng. Vui lòng thanh toán hoặc đóng phiên trước khi xóa.");
        }

        table.IsDeleted = true;
        table.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
        return true;
    }

    // ==========================================
    // FLOOR MAP & TABLE TRANSFER (STT 16, 17)
    // ==========================================

    public async Task<bool> BatchUpdatePositionsAsync(BatchUpdateTablePositionsRequest request, int userLevel, Guid? userBranchId)
    {
        if (userLevel > 3)
        {
            throw new UnauthorizedAccessException("Chỉ Quản lý (Level 3) hoặc Giám đốc/Chủ nhà hàng mới có quyền thay đổi sơ đồ mặt bằng bàn.");
        }

        if (request.Positions == null || request.Positions.Count == 0) return true;

        var tableIds = request.Positions.Select(p => p.TableId).ToList();
        var tables = await dbContext.Tables.Where(t => tableIds.Contains(t.Id) && !t.IsDeleted).ToListAsync();

        foreach (var pos in request.Positions)
        {
            var table = tables.FirstOrDefault(t => t.Id == pos.TableId);
            if (table != null)
            {
                ValidateBranchAccess(table.BranchId, userLevel, userBranchId);
                table.PosX = pos.PosX;
                table.PosY = pos.PosY;
                table.UpdatedAt = DateTime.UtcNow;
            }
        }

        await dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<TransferTableResultDto> TransferTableAsync(TransferTableRequest request, int userLevel, Guid? userBranchId)
    {
        if (request.FromTableId == request.ToTableId)
        {
            throw new InvalidOperationException("Bàn đích không thể trùng với bàn nguồn.");
        }

        var fromTable = await dbContext.Tables.FirstOrDefaultAsync(t => t.Id == request.FromTableId && !t.IsDeleted);
        if (fromTable == null)
        {
            throw new KeyNotFoundException("Không tìm thấy bàn nguồn.");
        }

        ValidateBranchAccess(fromTable.BranchId, userLevel, userBranchId);

        var toTable = await dbContext.Tables.FirstOrDefaultAsync(t => t.Id == request.ToTableId && !t.IsDeleted);
        if (toTable == null)
        {
            throw new KeyNotFoundException("Không tìm thấy bàn đích.");
        }

        if (fromTable.BranchId != toTable.BranchId)
        {
            throw new InvalidOperationException("Chỉ có thể chuyển bàn trong cùng một chi nhánh.");
        }

        if (toTable.Status == "Occupied")
        {
            throw new InvalidOperationException($"Bàn đích '{toTable.Code}' hiện đang có khách. Không thể chuyển vào bàn đang phục vụ.");
        }

        // Tìm phiên bàn đang hoạt động của bàn nguồn
        var activeSession = await dbContext.TableSessions
            .FirstOrDefaultAsync(s => s.TableId == request.FromTableId && s.ClosedAt == null);

        if (activeSession == null)
        {
            fromTable.Status = "Available";
            toTable.Status = "Occupied";
            fromTable.UpdatedAt = DateTime.UtcNow;
            toTable.UpdatedAt = DateTime.UtcNow;

            await dbContext.SaveChangesAsync();

            return new TransferTableResultDto
            {
                FromTableId = fromTable.Id,
                FromTableCode = fromTable.Code,
                ToTableId = toTable.Id,
                ToTableCode = toTable.Code,
                SessionId = Guid.Empty,
                Message = $"Đã chuyển trạng thái phục vụ từ bàn {fromTable.Code} sang bàn {toTable.Code} thành công."
            };
        }

        // Chuyển session sang bàn đích
        activeSession.TableId = toTable.Id;
        activeSession.UpdatedAt = DateTime.UtcNow;

        fromTable.Status = "Available";
        toTable.Status = "Occupied";
        fromTable.UpdatedAt = DateTime.UtcNow;
        toTable.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return new TransferTableResultDto
        {
            FromTableId = fromTable.Id,
            FromTableCode = fromTable.Code,
            ToTableId = toTable.Id,
            ToTableCode = toTable.Code,
            SessionId = activeSession.Id,
            Message = $"Đã chuyển toàn bộ order từ bàn {fromTable.Code} sang bàn {toTable.Code} thành công."
        };
    }
}
