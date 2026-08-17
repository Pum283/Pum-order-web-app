namespace OrderPum.Application.DTOs.Auth;

public record LoginRequest(string PhoneOrEmail, string Password);

public record PinLoginRequest(string PhoneOrEmail, string Pin);

public record LoginResponse(
    string AccessToken,
    Guid UserId,
    string DisplayName,
    string PhoneOrEmail,
    Guid? RoleId,
    string RoleCode,
    int RoleLevel,
    string RoleDisplayName,
    Guid? BranchId,
    string? BranchName,
    List<Guid>? AssignedAreaIds = null,
    List<string>? AssignedAreaNames = null
);

public record UserDto(
    Guid Id,
    string PhoneOrEmail,
    string DisplayName,
    Guid? RoleId,
    string RoleCode,
    int RoleLevel,
    string RoleDisplayName,
    Guid? BranchId,
    string? BranchName,
    List<Guid> AssignedAreaIds,
    List<string> AssignedAreaNames,
    bool HasPin,
    bool IsLocked,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record CreateUserRequest(
    string PhoneOrEmail,
    string Password,
    string? Pin,
    string DisplayName,
    Guid? RoleId,
    string? RoleCode,
    Guid? BranchId,
    List<Guid>? AssignedAreaIds = null
);

public record UpdateUserRequest(
    string PhoneOrEmail,
    string? Password,
    string? Pin,
    string DisplayName,
    Guid? RoleId,
    string? RoleCode,
    Guid? BranchId,
    List<Guid>? AssignedAreaIds = null
);

public record AssignStaffAreasRequest(
    List<Guid> AreaIds
);

public record ChangePasswordRequest(
    string OldPassword,
    string NewPassword
);

public record SetPinRequest(
    string Pin
);

public record UserFilterQuery(
    string? Keyword = null,
    Guid? RoleId = null,
    string? RoleCode = null,
    Guid? BranchId = null,
    bool? IsLocked = null,
    int Page = 1,
    int PageSize = 50
);

public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

public record BranchSimpleDto(
    Guid Id,
    string Name,
    string? Address,
    string? Phone,
    bool IsActive
);
