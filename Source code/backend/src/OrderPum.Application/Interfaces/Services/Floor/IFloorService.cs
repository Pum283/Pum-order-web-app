using OrderPum.Application.DTOs.Floor;

namespace OrderPum.Application.Interfaces.Services.Floor;

public interface IFloorService
{
    // Area operations
    Task<List<AreaDto>> GetAreasByBranchAsync(Guid branchId, int userLevel, Guid? userBranchId);
    Task<AreaDto?> GetAreaByIdAsync(Guid id, int userLevel, Guid? userBranchId);
    Task<AreaDto> CreateAreaAsync(CreateAreaRequest request, int userLevel, Guid? userBranchId);
    Task<AreaDto> UpdateAreaAsync(Guid id, UpdateAreaRequest request, int userLevel, Guid? userBranchId);
    Task<bool> DeleteAreaAsync(Guid id, int userLevel, Guid? userBranchId);

    // Table operations
    Task<List<DiningTableDto>> GetTablesByBranchAsync(Guid branchId, Guid? areaId, int userLevel, Guid? userBranchId, string baseUrl = "http://localhost:1212");
    Task<DiningTableDto?> GetTableByIdAsync(Guid id, int userLevel, Guid? userBranchId, string baseUrl = "http://localhost:1212");
    Task<DiningTableDto?> GetTableByQrTokenAsync(string qrToken, string baseUrl = "http://localhost:1212");
    Task<DiningTableDto> CreateTableAsync(CreateTableRequest request, int userLevel, Guid? userBranchId, string baseUrl = "http://localhost:1212");
    Task<DiningTableDto> UpdateTableAsync(Guid id, UpdateTableRequest request, int userLevel, Guid? userBranchId, string baseUrl = "http://localhost:1212");
    Task<DiningTableDto> UpdateTableStatusAsync(Guid id, string status, int userLevel, Guid? userBranchId, string baseUrl = "http://localhost:1212");
    Task<DiningTableDto> RegenerateQrTokenAsync(Guid id, int userLevel, Guid? userBranchId, string baseUrl = "http://localhost:1212");
    Task<bool> DeleteTableAsync(Guid id, int userLevel, Guid? userBranchId);
}
