namespace OrderPum.Application.DTOs.Auth;

public record RoleDto(
    Guid Id,
    string Code,
    string Name,
    int Level,
    string? Description,
    bool IsSystem,
    bool IsActive,
    int UserCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record CreateRoleRequest(
    string Code,
    string Name,
    int Level,
    string? Description,
    bool IsActive = true
);

public record UpdateRoleRequest(
    string Name,
    int Level,
    string? Description,
    bool IsActive
);
