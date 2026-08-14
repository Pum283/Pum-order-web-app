using Microsoft.EntityFrameworkCore;
using OrderPum.Application.DTOs.Auth;
using OrderPum.Application.Interfaces.Services.Auth;
using OrderPum.Domain.Entities.Auth;
using OrderPum.Domain.Enums.Auth;
using OrderPum.Infrastructure.Persistence;
using OrderPum.Infrastructure.Security;

namespace OrderPum.Infrastructure.Implementations.Services.Auth;

public class AuthService(AppDbContext db, IJwtTokenService jwt) : IAuthService
{
    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var input = request.PhoneOrEmail?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(input) || string.IsNullOrEmpty(request.Password))
            throw new InvalidOperationException("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");

        var user = await db.Users
            .Include(x => x.RoleRef)
            .FirstOrDefaultAsync(x => x.PhoneOrEmail == input && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Số điện thoại / Email hoặc mật khẩu không chính xác.");

        if (user.IsLocked)
            throw new InvalidOperationException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản lý.");

        if (!PasswordHasher.Verify(request.Password, user.PasswordHash))
            throw new InvalidOperationException("Số điện thoại / Email hoặc mật khẩu không chính xác.");

        string? branchName = null;
        if (user.BranchId.HasValue)
        {
            branchName = await db.Branches
                .Where(b => b.Id == user.BranchId.Value)
                .Select(b => b.Name)
                .FirstOrDefaultAsync(ct);
        }

        var (roleId, roleCode, roleLevel, roleDisplayName) = ResolveRoleInfo(user);

        return new LoginResponse(
            jwt.CreateToken(user.Id, user.DisplayName, user.Role, user.BranchId),
            user.Id,
            user.DisplayName,
            user.PhoneOrEmail,
            roleId,
            roleCode,
            roleLevel,
            roleDisplayName,
            user.BranchId,
            branchName
        );
    }

    public async Task<LoginResponse> LoginWithPinAsync(PinLoginRequest request, CancellationToken ct = default)
    {
        var input = request.PhoneOrEmail?.Trim() ?? string.Empty;
        var pin = request.Pin?.Trim() ?? string.Empty;

        if (string.IsNullOrEmpty(input) || string.IsNullOrEmpty(pin))
            throw new InvalidOperationException("Vui lòng nhập tài khoản và mã PIN.");

        var user = await db.Users
            .Include(x => x.RoleRef)
            .FirstOrDefaultAsync(x => x.PhoneOrEmail == input && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Tài khoản hoặc mã PIN không chính xác.");

        if (user.IsLocked)
            throw new InvalidOperationException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản lý.");

        if (string.IsNullOrEmpty(user.PinHash))
            throw new InvalidOperationException("Tài khoản này chưa được thiết lập mã PIN đăng nhập nhanh.");

        if (!PasswordHasher.Verify(pin, user.PinHash))
            throw new InvalidOperationException("Mã PIN không chính xác.");

        string? branchName = null;
        if (user.BranchId.HasValue)
        {
            branchName = await db.Branches
                .Where(b => b.Id == user.BranchId.Value)
                .Select(b => b.Name)
                .FirstOrDefaultAsync(ct);
        }

        var (roleId, roleCode, roleLevel, roleDisplayName) = ResolveRoleInfo(user);

        return new LoginResponse(
            jwt.CreateToken(user.Id, user.DisplayName, user.Role, user.BranchId),
            user.Id,
            user.DisplayName,
            user.PhoneOrEmail,
            roleId,
            roleCode,
            roleLevel,
            roleDisplayName,
            user.BranchId,
            branchName
        );
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid currentUserId, CancellationToken ct = default)
    {
        var user = await db.Users
            .Include(x => x.RoleRef)
            .FirstOrDefaultAsync(x => x.Id == currentUserId && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy thông tin tài khoản.");

        string? branchName = null;
        if (user.BranchId.HasValue)
        {
            branchName = await db.Branches
                .Where(b => b.Id == user.BranchId.Value)
                .Select(b => b.Name)
                .FirstOrDefaultAsync(ct);
        }

        return MapToDto(user, branchName);
    }

    public async Task ChangePasswordAsync(Guid currentUserId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            throw new InvalidOperationException("Mật khẩu mới phải có ít nhất 6 ký tự.");

        var user = await db.Users
            .FirstOrDefaultAsync(x => x.Id == currentUserId && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy người dùng.");

        if (!PasswordHasher.Verify(request.OldPassword, user.PasswordHash))
            throw new InvalidOperationException("Mật khẩu cũ không chính xác.");

        user.PasswordHash = PasswordHasher.Hash(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    public async Task SetPinAsync(Guid currentUserId, SetPinRequest request, CancellationToken ct = default)
    {
        var pin = request.Pin?.Trim() ?? string.Empty;
        if (pin.Length < 4 || pin.Length > 6 || !pin.All(char.IsDigit))
            throw new InvalidOperationException("Mã PIN phải gồm 4 đến 6 chữ số.");

        var user = await db.Users
            .FirstOrDefaultAsync(x => x.Id == currentUserId && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy người dùng.");

        user.PinHash = PasswordHasher.Hash(pin);
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<UserDto>> ListUsersAsync(
        UserFilterQuery query,
        Guid? currentUserId = null,
        int? currentRoleLevel = null,
        Guid? currentBranchId = null,
        CancellationToken ct = default)
    {
        var q = db.Users.Include(x => x.RoleRef).Where(x => !x.IsDeleted);

        // Phân quyền theo cấp độ Level (Cấp 3 là Quản lý, chỉ xem trong chi nhánh của mình và cấp từ 3 trở xuống)
        if (currentRoleLevel.HasValue && currentRoleLevel.Value == 3)
        {
            if (currentBranchId.HasValue)
            {
                q = q.Where(x => x.BranchId == currentBranchId.Value);
            }
            q = q.Where(x => (x.RoleRef != null ? x.RoleRef.Level : (int)x.Role) >= 3);
        }

        // Lọc từ khóa
        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var kw = query.Keyword.Trim();
            q = q.Where(x => x.DisplayName.Contains(kw) || x.PhoneOrEmail.Contains(kw));
        }

        // Lọc theo RoleId
        if (query.RoleId.HasValue && query.RoleId.Value != Guid.Empty)
        {
            q = q.Where(x => x.RoleId == query.RoleId.Value);
        }

        // Lọc theo RoleCode
        if (!string.IsNullOrWhiteSpace(query.RoleCode))
        {
            if (Enum.TryParse<StaffRole>(query.RoleCode, true, out var roleEnum))
            {
                q = q.Where(x => x.Role == roleEnum || (x.RoleRef != null && x.RoleRef.Code == query.RoleCode));
            }
            else
            {
                q = q.Where(x => x.RoleRef != null && x.RoleRef.Code == query.RoleCode);
            }
        }

        // Lọc theo chi nhánh
        if (query.BranchId.HasValue && query.BranchId.Value != Guid.Empty)
        {
            q = q.Where(x => x.BranchId == query.BranchId.Value);
        }

        // Lọc theo trạng thái khóa
        if (query.IsLocked.HasValue)
        {
            q = q.Where(x => x.IsLocked == query.IsLocked.Value);
        }

        var totalCount = await q.CountAsync(ct);
        var page = query.Page <= 0 ? 1 : query.Page;
        var pageSize = query.PageSize <= 0 ? 20 : Math.Min(query.PageSize, 100);
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var users = await q
            .OrderBy(x => x.RoleRef != null ? x.RoleRef.Level : (int)x.Role)
            .ThenBy(x => x.DisplayName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        // Lấy thông tin Branch names
        var branchIds = users.Where(u => u.BranchId.HasValue).Select(u => u.BranchId!.Value).Distinct().ToList();
        var branches = await db.Branches
            .Where(b => branchIds.Contains(b.Id))
            .ToDictionaryAsync(b => b.Id, b => b.Name, ct);

        var items = users.Select(u => MapToDto(u, u.BranchId.HasValue && branches.TryGetValue(u.BranchId.Value, out var bn) ? bn : null)).ToList();

        return new PagedResult<UserDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<UserDto> GetUserByIdAsync(Guid id, CancellationToken ct = default)
    {
        var user = await db.Users
            .Include(x => x.RoleRef)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy nhân viên.");

        string? branchName = null;
        if (user.BranchId.HasValue)
        {
            branchName = await db.Branches
                .Where(b => b.Id == user.BranchId.Value)
                .Select(b => b.Name)
                .FirstOrDefaultAsync(ct);
        }

        return MapToDto(user, branchName);
    }

    public async Task<UserDto> CreateUserAsync(
        CreateUserRequest request,
        int currentRoleLevel,
        Guid? currentBranchId,
        CancellationToken ct = default)
    {
        var phoneOrEmail = request.PhoneOrEmail?.Trim() ?? string.Empty;
        var displayName = request.DisplayName?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(phoneOrEmail))
            throw new InvalidOperationException("Số điện thoại hoặc Email không được để trống.");

        if (string.IsNullOrWhiteSpace(displayName))
            throw new InvalidOperationException("Tên hiển thị nhân viên không được để trống.");

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            throw new InvalidOperationException("Mật khẩu khởi tạo phải có ít nhất 6 ký tự.");

        // Tìm role từ RoleId hoặc RoleCode
        Role? targetRole = null;
        if (request.RoleId.HasValue && request.RoleId.Value != Guid.Empty)
        {
            targetRole = await db.Roles.FirstOrDefaultAsync(r => r.Id == request.RoleId.Value && !r.IsDeleted, ct);
        }
        else if (!string.IsNullOrWhiteSpace(request.RoleCode))
        {
            targetRole = await db.Roles.FirstOrDefaultAsync(r => r.Code == request.RoleCode && !r.IsDeleted, ct);
        }

        if (targetRole == null)
            throw new InvalidOperationException("Vui lòng chọn vai trò hợp lệ từ danh sách.");

        // Kiểm tra thẩm quyền phân cấp theo Level
        if (currentRoleLevel > targetRole.Level)
            throw new InvalidOperationException($"Bạn không có quyền tạo tài khoản với vai trò '{targetRole.Name}' (Cấp {targetRole.Level}).");

        // Nếu là Quản lý chi nhánh (Level 3), bắt buộc gán vào chi nhánh của mình
        var branchId = request.BranchId;
        if (currentRoleLevel == 3)
        {
            if (!currentBranchId.HasValue)
                throw new InvalidOperationException("Tài khoản Quản lý hiện tại chưa được liên kết với chi nhánh.");
            branchId = currentBranchId.Value;
        }

        // Kiểm tra trùng tài khoản
        var exists = await db.Users.AnyAsync(x => x.PhoneOrEmail == phoneOrEmail && !x.IsDeleted, ct);
        if (exists)
            throw new InvalidOperationException($"Tài khoản '{phoneOrEmail}' đã tồn tại trong hệ thống.");

        // Xử lý mã PIN nếu có
        string? pinHash = null;
        if (!string.IsNullOrWhiteSpace(request.Pin))
        {
            var pin = request.Pin.Trim();
            if (pin.Length < 4 || pin.Length > 6 || !pin.All(char.IsDigit))
                throw new InvalidOperationException("Mã PIN phải gồm từ 4 đến 6 chữ số.");
            pinHash = PasswordHasher.Hash(pin);
        }

        Enum.TryParse<StaffRole>(targetRole.Code, true, out var legacyRole);

        var entity = new UserAccount
        {
            PhoneOrEmail = phoneOrEmail,
            DisplayName = displayName,
            PasswordHash = PasswordHasher.Hash(request.Password),
            PinHash = pinHash,
            RoleId = targetRole.Id,
            Role = legacyRole != default ? legacyRole : StaffRole.FullTimeStaff,
            CustomRoleCode = targetRole.Code,
            BranchId = branchId,
            IsLocked = false,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(entity);
        await db.SaveChangesAsync(ct);

        entity.RoleRef = targetRole;

        string? branchName = null;
        if (entity.BranchId.HasValue)
        {
            branchName = await db.Branches
                .Where(b => b.Id == entity.BranchId.Value)
                .Select(b => b.Name)
                .FirstOrDefaultAsync(ct);
        }

        return MapToDto(entity, branchName);
    }

    public async Task<UserDto> UpdateUserAsync(
        Guid id,
        UpdateUserRequest request,
        int currentRoleLevel,
        Guid? currentBranchId,
        CancellationToken ct = default)
    {
        var user = await db.Users
            .Include(x => x.RoleRef)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy nhân viên cần cập nhật.");

        var (_, _, userLevel, userRoleName) = ResolveRoleInfo(user);

        // Kiểm tra thẩm quyền với đối tượng hiện tại
        if (currentRoleLevel > userLevel)
            throw new InvalidOperationException($"Bạn không có quyền chỉnh sửa tài khoản cấp '{userRoleName}'.");

        if (currentRoleLevel == 3 && user.BranchId != currentBranchId)
            throw new InvalidOperationException("Bạn chỉ được phép chỉnh sửa nhân viên thuộc chi nhánh của mình.");

        // Tìm role mới
        Role? targetRole = null;
        if (request.RoleId.HasValue && request.RoleId.Value != Guid.Empty)
        {
            targetRole = await db.Roles.FirstOrDefaultAsync(r => r.Id == request.RoleId.Value && !r.IsDeleted, ct);
        }
        else if (!string.IsNullOrWhiteSpace(request.RoleCode))
        {
            targetRole = await db.Roles.FirstOrDefaultAsync(r => r.Code == request.RoleCode && !r.IsDeleted, ct);
        }

        if (targetRole != null)
        {
            if (currentRoleLevel > targetRole.Level)
                throw new InvalidOperationException($"Bạn không có quyền phân vai trò '{targetRole.Name}' (Cấp {targetRole.Level}).");

            user.RoleId = targetRole.Id;
            user.RoleRef = targetRole;
            if (Enum.TryParse<StaffRole>(targetRole.Code, true, out var legacyRole))
                user.Role = legacyRole;
            user.CustomRoleCode = targetRole.Code;
        }

        var phoneOrEmail = request.PhoneOrEmail?.Trim() ?? string.Empty;
        var displayName = request.DisplayName?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(phoneOrEmail))
            throw new InvalidOperationException("Số điện thoại hoặc Email không được để trống.");

        if (string.IsNullOrWhiteSpace(displayName))
            throw new InvalidOperationException("Tên hiển thị không được để trống.");

        // Kiểm tra trùng phone/email với user khác
        var duplicate = await db.Users.AnyAsync(x => x.Id != id && x.PhoneOrEmail == phoneOrEmail && !x.IsDeleted, ct);
        if (duplicate)
            throw new InvalidOperationException($"Tài khoản '{phoneOrEmail}' đã được sử dụng bởi nhân viên khác.");

        user.PhoneOrEmail = phoneOrEmail;
        user.DisplayName = displayName;

        if (currentRoleLevel != 3)
        {
            user.BranchId = request.BranchId;
        }

        // Cập nhật mật khẩu nếu có nhập
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            if (request.Password.Length < 6)
                throw new InvalidOperationException("Mật khẩu mới phải có ít nhất 6 ký tự.");
            user.PasswordHash = PasswordHasher.Hash(request.Password);
        }

        // Cập nhật mã PIN nếu có nhập
        if (!string.IsNullOrWhiteSpace(request.Pin))
        {
            var pin = request.Pin.Trim();
            if (pin.Length < 4 || pin.Length > 6 || !pin.All(char.IsDigit))
                throw new InvalidOperationException("Mã PIN phải gồm từ 4 đến 6 chữ số.");
            user.PinHash = PasswordHasher.Hash(pin);
        }

        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        string? branchName = null;
        if (user.BranchId.HasValue)
        {
            branchName = await db.Branches
                .Where(b => b.Id == user.BranchId.Value)
                .Select(b => b.Name)
                .FirstOrDefaultAsync(ct);
        }

        return MapToDto(user, branchName);
    }

    public async Task<bool> ToggleLockAsync(
        Guid id,
        Guid currentUserId,
        int currentRoleLevel,
        Guid? currentBranchId,
        CancellationToken ct = default)
    {
        if (id == currentUserId)
            throw new InvalidOperationException("Bạn không thể tự khóa tài khoản của chính mình.");

        var user = await db.Users
            .Include(x => x.RoleRef)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy nhân viên.");

        var (_, _, userLevel, userRoleName) = ResolveRoleInfo(user);

        if (currentRoleLevel > userLevel)
            throw new InvalidOperationException($"Bạn không có quyền thay đổi trạng thái của tài khoản cấp '{userRoleName}'.");

        if (currentRoleLevel == 3 && user.BranchId != currentBranchId)
            throw new InvalidOperationException("Bạn chỉ được thao tác với nhân viên trong chi nhánh của mình.");

        user.IsLocked = !user.IsLocked;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return user.IsLocked;
    }

    public async Task<bool> DeleteUserAsync(
        Guid id,
        Guid currentUserId,
        int currentRoleLevel,
        Guid? currentBranchId,
        CancellationToken ct = default)
    {
        if (id == currentUserId)
            throw new InvalidOperationException("Bạn không thể tự xóa tài khoản của chính mình.");

        var user = await db.Users
            .Include(x => x.RoleRef)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy nhân viên.");

        var (_, _, userLevel, userRoleName) = ResolveRoleInfo(user);

        if (currentRoleLevel > userLevel)
            throw new InvalidOperationException($"Bạn không có quyền xóa tài khoản cấp '{userRoleName}'.");

        if (currentRoleLevel == 3 && user.BranchId != currentBranchId)
            throw new InvalidOperationException("Bạn chỉ được thao tác với nhân viên trong chi nhánh của mình.");

        user.IsDeleted = true;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<IReadOnlyList<BranchSimpleDto>> ListBranchesAsync(CancellationToken ct = default)
    {
        return await db.Branches
            .Where(b => !b.IsDeleted)
            .OrderBy(b => b.Name)
            .Select(b => new BranchSimpleDto(b.Id, b.Name, b.Address, b.Phone, b.IsActive))
            .ToListAsync(ct);
    }

    private static (Guid? RoleId, string RoleCode, int Level, string DisplayName) ResolveRoleInfo(UserAccount u)
    {
        if (u.RoleRef != null)
        {
            return (u.RoleRef.Id, u.RoleRef.Code, u.RoleRef.Level, u.RoleRef.Name);
        }

        return (
            null,
            u.CustomRoleCode ?? u.Role.ToString(),
            u.Role.GetHierarchyLevel(),
            u.Role.GetDisplayName()
        );
    }

    private static UserDto MapToDto(UserAccount u, string? branchName)
    {
        var (roleId, roleCode, roleLevel, roleDisplayName) = ResolveRoleInfo(u);

        return new UserDto(
            u.Id,
            u.PhoneOrEmail,
            u.DisplayName,
            roleId,
            roleCode,
            roleLevel,
            roleDisplayName,
            u.BranchId,
            branchName,
            !string.IsNullOrEmpty(u.PinHash),
            u.IsLocked,
            u.CreatedAt,
            u.UpdatedAt
        );
    }
}
