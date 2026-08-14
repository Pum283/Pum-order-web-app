using OrderPum.Application.DTOs.Menu;

namespace OrderPum.Application.Interfaces.Services.Menu;

public interface IMenuService
{
    // Category (STT 34)
    Task<List<MenuCategoryDto>> GetCategoriesByBranchAsync(Guid branchId, bool onlyActive, int userLevel, Guid? userBranchId);
    Task<MenuCategoryDto?> GetCategoryByIdAsync(Guid id, int userLevel, Guid? userBranchId);
    Task<MenuCategoryDto> CreateCategoryAsync(CreateCategoryRequest request, int userLevel, Guid? userBranchId);
    Task<MenuCategoryDto> UpdateCategoryAsync(Guid id, UpdateCategoryRequest request, int userLevel, Guid? userBranchId);
    Task<bool> DeleteCategoryAsync(Guid id, int userLevel, Guid? userBranchId);

    // Menu Item (STT 35, 36)
    Task<List<MenuItemDto>> GetMenuItemsByBranchAsync(Guid branchId, Guid? categoryId, string? search, bool onlyAvailable, int userLevel, Guid? userBranchId);
    Task<MenuItemDetailDto?> GetMenuItemByIdAsync(Guid id, int userLevel, Guid? userBranchId);
    Task<MenuItemDetailDto> CreateMenuItemAsync(CreateMenuItemRequest request, int userLevel, Guid? userBranchId);
    Task<MenuItemDetailDto> UpdateMenuItemAsync(Guid id, UpdateMenuItemRequest request, int userLevel, Guid? userBranchId);
    Task<bool> ToggleItemAvailabilityAsync(Guid id, bool isAvailable, int userLevel, Guid? userBranchId);
    Task<bool> ToggleItem86Async(Guid id, bool is86ed, int userLevel, Guid? userBranchId);
    Task<bool> DeleteMenuItemAsync(Guid id, int userLevel, Guid? userBranchId);
}
