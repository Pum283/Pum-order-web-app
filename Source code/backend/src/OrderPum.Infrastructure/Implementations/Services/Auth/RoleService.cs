using Microsoft.EntityFrameworkCore;
using OrderPum.Application.DTOs.Auth;
using OrderPum.Application.Interfaces.Services.Auth;
using OrderPum.Domain.Entities.Auth;
using OrderPum.Infrastructure.Persistence;

namespace OrderPum.Infrastructure.Implementations.Services.Auth;

public class RoleService(AppDbContext db) : IRoleService
{
    public async Task<IReadOnlyList<RoleDto>> ListRolesAsync(bool includeInactive = false, CancellationToken ct = default)
    {
        var q = db.Roles.Where(r => !r.IsDeleted);
        if (!includeInactive)
        {
            q = q.Where(r => r.IsActive);
        }

        var roles = await q.OrderBy(r => r.Level).ThenBy(r => r.Name).ToListAsync(ct);

        // Lấy số lượng user theo từng role
        var roleCounts = await db.Users
            .Where(u => !u.IsDeleted && u.RoleId.HasValue)
            .GroupBy(u => u.RoleId!.Value)
            .Select(g => new { RoleId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RoleId, x => x.Count, ct);

        return roles.Select(r => new RoleDto(
            r.Id,
            r.Code,
            r.Name,
            r.Level,
            r.Description,
            r.IsSystem,
            r.IsActive,
            roleCounts.TryGetValue(r.Id, out var count) ? count : 0,
            r.CreatedAt,
            r.UpdatedAt
        )).ToList();
    }

    public async Task<RoleDto> GetRoleByIdAsync(Guid id, CancellationToken ct = default)
    {
        var r = await db.Roles.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy vai trò.");

        var count = await db.Users.CountAsync(u => u.RoleId == id && !u.IsDeleted, ct);

        return new RoleDto(
            r.Id,
            r.Code,
            r.Name,
            r.Level,
            r.Description,
            r.IsSystem,
            r.IsActive,
            count,
            r.CreatedAt,
            r.UpdatedAt
        );
    }

    public async Task<RoleDto> CreateRoleAsync(CreateRoleRequest request, int currentActorLevel, CancellationToken ct = default)
    {
        // Chỉ cấp 1 (Giám đốc) và cấp 2 (Chủ nhà hàng) mới được tạo role
        if (currentActorLevel > 2)
            throw new InvalidOperationException("Bạn không có quyền tạo vai trò mới trong hệ thống.");

        var code = request.Code?.Trim() ?? string.Empty;
        var name = request.Name?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(code))
            throw new InvalidOperationException("Mã vai trò không được để trống.");
        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("Tên vai trò không được để trống.");

        if (request.Level < 1 || request.Level > 10)
            throw new InvalidOperationException("Cấp bậc vai trò phải từ 1 đến 10.");

        // Không được tạo vai trò có cấp bậc cao hơn chính mình
        if (request.Level < currentActorLevel)
            throw new InvalidOperationException($"Bạn không thể tạo vai trò có cấp bậc ({request.Level}) cao hơn cấp bậc hiện tại của mình ({currentActorLevel}).");

        var exists = await db.Roles.AnyAsync(r => (r.Code == code || r.Name == name) && !r.IsDeleted, ct);
        if (exists)
            throw new InvalidOperationException($"Mã hoặc tên vai trò '{code}' / '{name}' đã tồn tại.");

        var role = new Role
        {
            Code = code,
            Name = name,
            Level = request.Level,
            Description = request.Description?.Trim(),
            IsSystem = false,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        db.Roles.Add(role);
        await db.SaveChangesAsync(ct);

        return new RoleDto(
            role.Id,
            role.Code,
            role.Name,
            role.Level,
            role.Description,
            role.IsSystem,
            role.IsActive,
            0,
            role.CreatedAt,
            role.UpdatedAt
        );
    }

    public async Task<RoleDto> UpdateRoleAsync(Guid id, UpdateRoleRequest request, int currentActorLevel, CancellationToken ct = default)
    {
        if (currentActorLevel > 2)
            throw new InvalidOperationException("Bạn không có quyền chỉnh sửa cấu hình vai trò.");

        var role = await db.Roles.FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy vai trò cần cập nhật.");

        var name = request.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("Tên vai trò không được để trống.");

        if (request.Level < 1 || request.Level > 10)
            throw new InvalidOperationException("Cấp bậc vai trò phải từ 1 đến 10.");

        if (role.IsSystem && role.Level != request.Level)
            throw new InvalidOperationException("Không thể thay đổi cấp bậc của vai trò hệ thống mặc định.");

        var dup = await db.Roles.AnyAsync(r => r.Id != id && r.Name == name && !r.IsDeleted, ct);
        if (dup)
            throw new InvalidOperationException($"Tên vai trò '{name}' đã được sử dụng.");

        role.Name = name;
        if (!role.IsSystem)
        {
            role.Level = request.Level;
        }
        role.Description = request.Description?.Trim();
        role.IsActive = request.IsActive;
        role.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        var count = await db.Users.CountAsync(u => u.RoleId == id && !u.IsDeleted, ct);

        return new RoleDto(
            role.Id,
            role.Code,
            role.Name,
            role.Level,
            role.Description,
            role.IsSystem,
            role.IsActive,
            count,
            role.CreatedAt,
            role.UpdatedAt
        );
    }

    public async Task<bool> DeleteRoleAsync(Guid id, int currentActorLevel, CancellationToken ct = default)
    {
        if (currentActorLevel > 2)
            throw new InvalidOperationException("Bạn không có quyền xóa vai trò.");

        var role = await db.Roles.FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy vai trò.");

        if (role.IsSystem)
            throw new InvalidOperationException("Không thể xóa vai trò mặc định của hệ thống.");

        var hasUsers = await db.Users.AnyAsync(u => u.RoleId == id && !u.IsDeleted, ct);
        if (hasUsers)
            throw new InvalidOperationException("Đang có nhân viên được gán vai trò này. Vui lòng chuyển vai trò cho nhân viên trước khi xóa.");

        role.IsDeleted = true;
        role.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }
}
