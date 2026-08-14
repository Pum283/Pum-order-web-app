using Microsoft.EntityFrameworkCore;
using OrderPum.Application.DTOs.Branch;
using OrderPum.Application.Interfaces.Services.Branch;
using OrderPum.Infrastructure.Persistence;

namespace OrderPum.Infrastructure.Implementations.Services.Branch;

public class BranchService(AppDbContext db) : IBranchService
{
    public async Task<IReadOnlyList<BranchDto>> ListBranchesAsync(
        bool includeInactive = false,
        int actorRoleLevel = 99,
        Guid? actorBranchId = null,
        CancellationToken ct = default)
    {
        var q = db.Branches.Where(b => !b.IsDeleted);

        if (!includeInactive)
        {
            q = q.Where(b => b.IsActive);
        }

        // STT 105: Phân quyền truy cập dữ liệu nội bộ nghiêm ngặt
        // Level >= 3 và có actorBranchId thì chỉ xem chi nhánh của mình (nếu không phải Level 1 hoặc Level 2)
        if (actorRoleLevel > 2 && actorBranchId != null)
        {
            q = q.Where(b => b.Id == actorBranchId.Value);
        }

        var branches = await q.OrderBy(b => b.Code).ThenBy(b => b.Name).ToListAsync(ct);

        // Lấy số lượng nhân viên và bàn của từng chi nhánh
        var branchIds = branches.Select(b => b.Id).ToList();

        var staffCounts = await db.Users
            .Where(u => !u.IsDeleted && u.BranchId != null && branchIds.Contains(u.BranchId.Value))
            .GroupBy(u => u.BranchId!.Value)
            .Select(g => new { BranchId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.BranchId, x => x.Count, ct);

        var tableCounts = await db.Tables
            .Where(t => !t.IsDeleted && branchIds.Contains(t.BranchId))
            .GroupBy(t => t.BranchId)
            .Select(g => new { BranchId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.BranchId, x => x.Count, ct);

        return branches.Select(b => MapToDto(b, staffCounts.GetValueOrDefault(b.Id, 0), tableCounts.GetValueOrDefault(b.Id, 0))).ToList();
    }

    public async Task<BranchDto> GetBranchByIdAsync(
        Guid id,
        int actorRoleLevel = 99,
        Guid? actorBranchId = null,
        CancellationToken ct = default)
    {
        if (actorRoleLevel > 2 && actorBranchId != null && actorBranchId.Value != id)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập dữ liệu của chi nhánh này.");
        }

        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy chi nhánh.");

        var staffCount = await db.Users.CountAsync(u => !u.IsDeleted && u.BranchId == id, ct);
        var tableCount = await db.Tables.CountAsync(t => !t.IsDeleted && t.BranchId == id, ct);

        return MapToDto(branch, staffCount, tableCount);
    }

    public async Task<BranchDto> CreateBranchAsync(
        CreateBranchRequest request,
        int actorRoleLevel,
        CancellationToken ct = default)
    {
        // Chỉ Giám đốc (1) và Chủ nhà hàng (2) mới được tạo chi nhánh
        if (actorRoleLevel > 2)
        {
            throw new UnauthorizedAccessException("Chỉ Giám đốc chuỗi hoặc Chủ nhà hàng mới có quyền tạo chi nhánh mới.");
        }

        var code = request.Code.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new InvalidOperationException("Mã chi nhánh không được để trống.");
        }

        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException("Tên chi nhánh không được để trống.");
        }

        if (await db.Branches.AnyAsync(b => !b.IsDeleted && b.Code == code, ct))
        {
            throw new InvalidOperationException($"Mã chi nhánh '{code}' đã tồn tại trong hệ thống.");
        }

        if (await db.Branches.AnyAsync(b => !b.IsDeleted && b.Name == name, ct))
        {
            throw new InvalidOperationException($"Tên chi nhánh '{name}' đã tồn tại trong hệ thống.");
        }

        var branch = new Domain.Entities.Branch.Branch
        {
            Code = code,
            Name = name,
            Address = request.Address?.Trim(),
            Phone = request.Phone?.Trim(),
            OpenHours = request.OpenHours?.Trim(),
            ImageUrl = request.ImageUrl?.Trim(),
            TaxRatePercent = request.TaxRatePercent >= 0 ? request.TaxRatePercent : 8,
            ServiceChargePercent = request.ServiceChargePercent >= 0 ? request.ServiceChargePercent : 0,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "VND" : request.Currency.Trim().ToUpperInvariant(),
            IsTaxIncludedInPrice = request.IsTaxIncludedInPrice,
            IsServiceChargeIncluded = request.IsServiceChargeIncluded,
            ReceiptHeaderNote = request.ReceiptHeaderNote?.Trim(),
            ReceiptFooterNote = request.ReceiptFooterNote?.Trim(),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        db.Branches.Add(branch);
        await db.SaveChangesAsync(ct);

        return MapToDto(branch, 0, 0);
    }

    public async Task<BranchDto> UpdateBranchAsync(
        Guid id,
        UpdateBranchRequest request,
        int actorRoleLevel,
        Guid? actorBranchId = null,
        CancellationToken ct = default)
    {
        // Level 1, 2 có toàn quyền; Level 3 chỉ được sửa thông tin chi nhánh mình đang quản lý
        if (actorRoleLevel > 3)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa thông tin chi nhánh.");
        }

        if (actorRoleLevel == 3 && actorBranchId != id)
        {
            throw new UnauthorizedAccessException("Quản lý chỉ có quyền chỉnh sửa thông tin tại chi nhánh của mình.");
        }

        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy chi nhánh cần chỉnh sửa.");

        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException("Tên chi nhánh không được để trống.");
        }

        if (await db.Branches.AnyAsync(b => !b.IsDeleted && b.Id != id && b.Name == name, ct))
        {
            throw new InvalidOperationException($"Tên chi nhánh '{name}' đã được sử dụng bởi chi nhánh khác.");
        }

        branch.Name = name;
        branch.Address = request.Address?.Trim();
        branch.Phone = request.Phone?.Trim();
        branch.OpenHours = request.OpenHours?.Trim();
        branch.ImageUrl = request.ImageUrl?.Trim();

        // Chỉ Level 1 và 2 mới được thay đổi trạng thái kích hoạt chi nhánh
        if (actorRoleLevel <= 2)
        {
            branch.IsActive = request.IsActive;
        }

        branch.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        var staffCount = await db.Users.CountAsync(u => !u.IsDeleted && u.BranchId == id, ct);
        var tableCount = await db.Tables.CountAsync(t => !t.IsDeleted && t.BranchId == id, ct);

        return MapToDto(branch, staffCount, tableCount);
    }

    public async Task<BranchDto> UpdateFinancialConfigAsync(
        Guid id,
        UpdateFinancialConfigRequest request,
        int actorRoleLevel,
        CancellationToken ct = default)
    {
        // STT 99: Cấu hình thuế, phí DV, tiền tệ (Chỉ GĐ Level 1 và CNH Level 2)
        if (actorRoleLevel > 2)
        {
            throw new UnauthorizedAccessException("Chỉ Giám đốc chuỗi hoặc Chủ nhà hàng mới có quyền cấu hình tài chính & thuế phí.");
        }

        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy chi nhánh cần cấu hình.");

        if (request.TaxRatePercent < 0 || request.TaxRatePercent > 100)
        {
            throw new InvalidOperationException("Thuế suất VAT phải nằm trong khoảng từ 0% đến 100%.");
        }

        if (request.ServiceChargePercent < 0 || request.ServiceChargePercent > 100)
        {
            throw new InvalidOperationException("Phí dịch vụ phải nằm trong khoảng từ 0% đến 100%.");
        }

        branch.TaxRatePercent = request.TaxRatePercent;
        branch.ServiceChargePercent = request.ServiceChargePercent;
        branch.Currency = string.IsNullOrWhiteSpace(request.Currency) ? "VND" : request.Currency.Trim().ToUpperInvariant();
        branch.IsTaxIncludedInPrice = request.IsTaxIncludedInPrice;
        branch.IsServiceChargeIncluded = request.IsServiceChargeIncluded;
        branch.ReceiptHeaderNote = request.ReceiptHeaderNote?.Trim();
        branch.ReceiptFooterNote = request.ReceiptFooterNote?.Trim();
        branch.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        var staffCount = await db.Users.CountAsync(u => !u.IsDeleted && u.BranchId == id, ct);
        var tableCount = await db.Tables.CountAsync(t => !t.IsDeleted && t.BranchId == id, ct);

        return MapToDto(branch, staffCount, tableCount);
    }

    public async Task<bool> ToggleActiveAsync(Guid id, int actorRoleLevel, CancellationToken ct = default)
    {
        if (actorRoleLevel > 2)
        {
            throw new UnauthorizedAccessException("Chỉ Giám đốc chuỗi hoặc Chủ nhà hàng mới có quyền đóng/mở hoạt động chi nhánh.");
        }

        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy chi nhánh.");

        branch.IsActive = !branch.IsActive;
        branch.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return branch.IsActive;
    }

    public async Task DeleteBranchAsync(Guid id, int actorRoleLevel, CancellationToken ct = default)
    {
        // Chỉ Giám đốc chuỗi (Level 1) mới được xóa chi nhánh
        if (actorRoleLevel > 1)
        {
            throw new UnauthorizedAccessException("Chỉ Giám đốc chuỗi mới có quyền xóa chi nhánh.");
        }

        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy chi nhánh cần xóa.");

        // Kiểm tra ràng buộc an toàn: Không được xóa nếu còn nhân viên đang được phân công
        var staffCount = await db.Users.CountAsync(u => !u.IsDeleted && u.BranchId == id, ct);
        if (staffCount > 0)
        {
            throw new InvalidOperationException($"Không thể xóa chi nhánh '{branch.Name}' vì vẫn còn {staffCount} nhân viên đang trực thuộc. Vui lòng chuyển công tác nhân sự trước.");
        }

        // Kiểm tra ràng buộc bàn
        var tableCount = await db.Tables.CountAsync(t => !t.IsDeleted && t.BranchId == id, ct);
        if (tableCount > 0)
        {
            throw new InvalidOperationException($"Không thể xóa chi nhánh '{branch.Name}' vì vẫn còn {tableCount} bàn được cấu hình.");
        }

        branch.IsDeleted = true;
        branch.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private static BranchDto MapToDto(Domain.Entities.Branch.Branch b, int staffCount, int tableCount) => new()
    {
        Id = b.Id,
        Code = b.Code,
        Name = b.Name,
        Address = b.Address,
        Phone = b.Phone,
        OpenHours = b.OpenHours,
        ImageUrl = b.ImageUrl,
        TaxRatePercent = b.TaxRatePercent,
        ServiceChargePercent = b.ServiceChargePercent,
        Currency = b.Currency,
        IsTaxIncludedInPrice = b.IsTaxIncludedInPrice,
        IsServiceChargeIncluded = b.IsServiceChargeIncluded,
        ReceiptHeaderNote = b.ReceiptHeaderNote,
        ReceiptFooterNote = b.ReceiptFooterNote,
        IsActive = b.IsActive,
        StaffCount = staffCount,
        TableCount = tableCount,
        CreatedAt = b.CreatedAt,
        UpdatedAt = b.UpdatedAt
    };
}
