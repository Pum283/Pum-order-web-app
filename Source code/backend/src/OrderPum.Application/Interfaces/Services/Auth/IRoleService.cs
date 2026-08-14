using OrderPum.Application.DTOs.Auth;

namespace OrderPum.Application.Interfaces.Services.Auth;

public interface IRoleService
{
    Task<IReadOnlyList<RoleDto>> ListRolesAsync(bool includeInactive = false, CancellationToken ct = default);
    Task<RoleDto> GetRoleByIdAsync(Guid id, CancellationToken ct = default);
    Task<RoleDto> CreateRoleAsync(CreateRoleRequest request, int currentActorLevel, CancellationToken ct = default);
    Task<RoleDto> UpdateRoleAsync(Guid id, UpdateRoleRequest request, int currentActorLevel, CancellationToken ct = default);
    Task<bool> DeleteRoleAsync(Guid id, int currentActorLevel, CancellationToken ct = default);
}
