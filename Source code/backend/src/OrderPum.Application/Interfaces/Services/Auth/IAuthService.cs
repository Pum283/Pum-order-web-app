using OrderPum.Application.DTOs.Auth;

namespace OrderPum.Application.Interfaces.Services.Auth;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<LoginResponse> LoginWithPinAsync(PinLoginRequest request, CancellationToken ct = default);
    Task<UserDto> GetCurrentUserAsync(Guid currentUserId, CancellationToken ct = default);
    Task ChangePasswordAsync(Guid currentUserId, ChangePasswordRequest request, CancellationToken ct = default);
    Task SetPinAsync(Guid currentUserId, SetPinRequest request, CancellationToken ct = default);

    Task<PagedResult<UserDto>> ListUsersAsync(
        UserFilterQuery query,
        Guid? currentUserId = null,
        int? currentRoleLevel = null,
        Guid? currentBranchId = null,
        CancellationToken ct = default
    );

    Task<UserDto> GetUserByIdAsync(Guid id, CancellationToken ct = default);

    Task<UserDto> CreateUserAsync(
        CreateUserRequest request,
        int currentRoleLevel,
        Guid? currentBranchId,
        CancellationToken ct = default
    );

    Task<UserDto> UpdateUserAsync(
        Guid id,
        UpdateUserRequest request,
        int currentRoleLevel,
        Guid? currentBranchId,
        CancellationToken ct = default
    );

    Task<bool> ToggleLockAsync(
        Guid id,
        Guid currentUserId,
        int currentRoleLevel,
        Guid? currentBranchId,
        CancellationToken ct = default
    );

    Task<bool> DeleteUserAsync(
        Guid id,
        Guid currentUserId,
        int currentRoleLevel,
        Guid? currentBranchId,
        CancellationToken ct = default
    );

    Task<IReadOnlyList<BranchSimpleDto>> ListBranchesAsync(CancellationToken ct = default);
}
