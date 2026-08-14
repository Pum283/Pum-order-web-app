using OrderPum.Application.DTOs.Branch;

namespace OrderPum.Application.Interfaces.Services.Branch;

public interface IBranchService
{
    Task<IReadOnlyList<BranchDto>> ListBranchesAsync(bool includeInactive = false, int actorRoleLevel = 99, Guid? actorBranchId = null, CancellationToken ct = default);
    Task<BranchDto> GetBranchByIdAsync(Guid id, int actorRoleLevel = 99, Guid? actorBranchId = null, CancellationToken ct = default);
    Task<BranchDto> CreateBranchAsync(CreateBranchRequest request, int actorRoleLevel, CancellationToken ct = default);
    Task<BranchDto> UpdateBranchAsync(Guid id, UpdateBranchRequest request, int actorRoleLevel, Guid? actorBranchId = null, CancellationToken ct = default);
    Task<BranchDto> UpdateFinancialConfigAsync(Guid id, UpdateFinancialConfigRequest request, int actorRoleLevel, CancellationToken ct = default);
    Task<bool> ToggleActiveAsync(Guid id, int actorRoleLevel, CancellationToken ct = default);
    Task DeleteBranchAsync(Guid id, int actorRoleLevel, CancellationToken ct = default);
}
