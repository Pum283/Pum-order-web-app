using Microsoft.EntityFrameworkCore;
using OrderPum.Application.DTOs.Menu;
using OrderPum.Application.Interfaces.Services.Menu;
using OrderPum.Domain.Entities.Menu;
using OrderPum.Infrastructure.Persistence;

namespace OrderPum.Infrastructure.Implementations.Services.Menu;

public class MenuService(AppDbContext dbContext) : IMenuService
{
    private void ValidateBranchAccess(Guid targetBranchId, int userLevel, Guid? userBranchId)
    {
        if (userLevel > 2 && userBranchId.HasValue && userBranchId.Value != targetBranchId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập hoặc chỉnh sửa thực đơn của chi nhánh khác.");
        }
    }

    // ==========================================
    // CATEGORY MANAGEMENT (STT 34)
    // ==========================================

    public async Task<List<MenuCategoryDto>> GetCategoriesByBranchAsync(Guid branchId, bool onlyActive, int userLevel, Guid? userBranchId)
    {
        ValidateBranchAccess(branchId, userLevel, userBranchId);

        var query = dbContext.MenuCategories
            .Where(c => c.BranchId == branchId && !c.IsDeleted);

        if (onlyActive)
        {
            query = query.Where(c => c.IsActive);
        }

        var branch = await dbContext.Branches.FirstOrDefaultAsync(b => b.Id == branchId);
        var branchName = branch?.Name ?? string.Empty;

        var categories = await query
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new MenuCategoryDto
            {
                Id = c.Id,
                BranchId = c.BranchId,
                BranchName = branchName,
                Code = c.Code,
                Name = c.Name,
                ImageUrl = c.ImageUrl,
                SortOrder = c.SortOrder,
                IsActive = c.IsActive,
                ItemCount = dbContext.MenuItems.Count(i => i.CategoryId == c.Id && !i.IsDeleted),
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return categories;
    }

    public async Task<MenuCategoryDto?> GetCategoryByIdAsync(Guid id, int userLevel, Guid? userBranchId)
    {
        var category = await dbContext.MenuCategories
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);

        if (category == null) return null;

        ValidateBranchAccess(category.BranchId, userLevel, userBranchId);

        var branch = await dbContext.Branches.FirstOrDefaultAsync(b => b.Id == category.BranchId);

        return new MenuCategoryDto
        {
            Id = category.Id,
            BranchId = category.BranchId,
            BranchName = branch?.Name ?? string.Empty,
            Code = category.Code,
            Name = category.Name,
            ImageUrl = category.ImageUrl,
            SortOrder = category.SortOrder,
            IsActive = category.IsActive,
            ItemCount = await dbContext.MenuItems.CountAsync(i => i.CategoryId == category.Id && !i.IsDeleted),
            CreatedAt = category.CreatedAt
        };
    }

    public async Task<MenuCategoryDto> CreateCategoryAsync(CreateCategoryRequest request, int userLevel, Guid? userBranchId)
    {
        ValidateBranchAccess(request.BranchId, userLevel, userBranchId);

        var branchExists = await dbContext.Branches.AnyAsync(b => b.Id == request.BranchId && !b.IsDeleted);
        if (!branchExists)
        {
            throw new KeyNotFoundException("Chi nhánh không tồn tại.");
        }

        var code = string.IsNullOrWhiteSpace(request.Code)
            ? $"CAT{new Random().Next(100, 999)}"
            : request.Code.Trim().ToUpper();

        var codeExists = await dbContext.MenuCategories
            .AnyAsync(c => c.BranchId == request.BranchId && c.Code == code && !c.IsDeleted);

        if (codeExists)
        {
            throw new InvalidOperationException($"Mã danh mục '{code}' đã tồn tại trong chi nhánh này.");
        }

        var category = new MenuCategory
        {
            Id = Guid.NewGuid(),
            BranchId = request.BranchId,
            Code = code,
            Name = request.Name.Trim(),
            ImageUrl = request.ImageUrl?.Trim(),
            SortOrder = request.SortOrder,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.MenuCategories.Add(category);
        await dbContext.SaveChangesAsync();

        var branch = await dbContext.Branches.FirstOrDefaultAsync(b => b.Id == request.BranchId);

        return new MenuCategoryDto
        {
            Id = category.Id,
            BranchId = category.BranchId,
            BranchName = branch?.Name ?? string.Empty,
            Code = category.Code,
            Name = category.Name,
            ImageUrl = category.ImageUrl,
            SortOrder = category.SortOrder,
            IsActive = category.IsActive,
            ItemCount = 0,
            CreatedAt = category.CreatedAt
        };
    }

    public async Task<MenuCategoryDto> UpdateCategoryAsync(Guid id, UpdateCategoryRequest request, int userLevel, Guid? userBranchId)
    {
        var category = await dbContext.MenuCategories.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
        if (category == null)
        {
            throw new KeyNotFoundException("Không tìm thấy danh mục món ăn.");
        }

        ValidateBranchAccess(category.BranchId, userLevel, userBranchId);

        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var code = request.Code.Trim().ToUpper();
            var codeExists = await dbContext.MenuCategories
                .AnyAsync(c => c.BranchId == category.BranchId && c.Code == code && c.Id != id && !c.IsDeleted);

            if (codeExists)
            {
                throw new InvalidOperationException($"Mã danh mục '{code}' đã tồn tại trong chi nhánh này.");
            }
            category.Code = code;
        }

        category.Name = request.Name.Trim();
        category.ImageUrl = request.ImageUrl?.Trim();
        category.SortOrder = request.SortOrder;
        category.IsActive = request.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        var branch = await dbContext.Branches.FirstOrDefaultAsync(b => b.Id == category.BranchId);

        return new MenuCategoryDto
        {
            Id = category.Id,
            BranchId = category.BranchId,
            BranchName = branch?.Name ?? string.Empty,
            Code = category.Code,
            Name = category.Name,
            ImageUrl = category.ImageUrl,
            SortOrder = category.SortOrder,
            IsActive = category.IsActive,
            ItemCount = await dbContext.MenuItems.CountAsync(i => i.CategoryId == category.Id && !i.IsDeleted),
            CreatedAt = category.CreatedAt
        };
    }

    public async Task<bool> DeleteCategoryAsync(Guid id, int userLevel, Guid? userBranchId)
    {
        var category = await dbContext.MenuCategories.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
        if (category == null) return false;

        ValidateBranchAccess(category.BranchId, userLevel, userBranchId);

        var hasItems = await dbContext.MenuItems.AnyAsync(i => i.CategoryId == id && !i.IsDeleted);
        if (hasItems)
        {
            throw new InvalidOperationException("Không thể xóa danh mục đang chứa món ăn. Vui lòng chuyển hoặc xóa các món ăn trước.");
        }

        category.IsDeleted = true;
        category.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
        return true;
    }

    // ==========================================
    // MENU ITEM & OPTION MANAGEMENT (STT 35, 36)
    // ==========================================

    public async Task<List<MenuItemDto>> GetMenuItemsByBranchAsync(Guid branchId, Guid? categoryId, string? search, bool onlyAvailable, int userLevel, Guid? userBranchId)
    {
        ValidateBranchAccess(branchId, userLevel, userBranchId);

        var query = dbContext.MenuItems
            .Include(i => i.Category)
            .Include(i => i.Options)
            .Where(i => i.BranchId == branchId && !i.IsDeleted);

        if (categoryId.HasValue && categoryId.Value != Guid.Empty)
        {
            query = query.Where(i => i.CategoryId == categoryId.Value);
        }

        if (onlyAvailable)
        {
            query = query.Where(i => i.IsAvailable && !i.Is86ed && i.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(i => i.Name.ToLower().Contains(q) || i.Code.ToLower().Contains(q));
        }

        var branch = await dbContext.Branches.FirstOrDefaultAsync(b => b.Id == branchId);
        var branchName = branch?.Name ?? string.Empty;

        var items = await query
            .OrderBy(i => i.Category != null ? i.Category.SortOrder : 99)
            .ThenBy(i => i.Code)
            .Select(i => new MenuItemDto
            {
                Id = i.Id,
                BranchId = i.BranchId,
                BranchName = branchName,
                CategoryId = i.CategoryId,
                CategoryName = i.Category != null ? i.Category.Name : string.Empty,
                Code = i.Code,
                Name = i.Name,
                Description = i.Description,
                ImageUrl = i.ImageUrl,
                Price = i.Price,
                Unit = i.Unit,
                KitchenStation = i.KitchenStation,
                PreparationMinutes = i.PreparationMinutes,
                IsAvailable = i.IsAvailable,
                Is86ed = i.Is86ed,
                IsActive = i.IsActive,
                OptionCount = i.Options.Count(o => !o.IsDeleted),
                CreatedAt = i.CreatedAt
            })
            .ToListAsync();

        return items;
    }

    public async Task<MenuItemDetailDto?> GetMenuItemByIdAsync(Guid id, int userLevel, Guid? userBranchId)
    {
        var item = await dbContext.MenuItems
            .Include(i => i.Category)
            .Include(i => i.Options)
                .ThenInclude(o => o.Values)
            .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

        if (item == null) return null;

        ValidateBranchAccess(item.BranchId, userLevel, userBranchId);

        var branch = await dbContext.Branches.FirstOrDefaultAsync(b => b.Id == item.BranchId);

        return new MenuItemDetailDto
        {
            Id = item.Id,
            BranchId = item.BranchId,
            BranchName = branch?.Name ?? string.Empty,
            CategoryId = item.CategoryId,
            CategoryName = item.Category?.Name ?? string.Empty,
            Code = item.Code,
            Name = item.Name,
            Description = item.Description,
            ImageUrl = item.ImageUrl,
            Price = item.Price,
            Unit = item.Unit,
            KitchenStation = item.KitchenStation,
            PreparationMinutes = item.PreparationMinutes,
            IsAvailable = item.IsAvailable,
            Is86ed = item.Is86ed,
            IsActive = item.IsActive,
            OptionCount = item.Options.Count(o => !o.IsDeleted),
            CreatedAt = item.CreatedAt,
            Options = item.Options
                .Where(o => !o.IsDeleted)
                .OrderBy(o => o.SortOrder)
                .Select(o => new MenuItemOptionDto
                {
                    Id = o.Id,
                    MenuItemId = o.MenuItemId,
                    Name = o.Name,
                    OptionType = o.OptionType,
                    IsRequired = o.IsRequired,
                    SortOrder = o.SortOrder,
                    Values = o.Values
                        .Where(v => !v.IsDeleted)
                        .OrderBy(v => v.SortOrder)
                        .Select(v => new MenuItemOptionValueDto
                        {
                            Id = v.Id,
                            OptionId = v.OptionId,
                            Name = v.Name,
                            ExtraPrice = v.ExtraPrice,
                            IsDefault = v.IsDefault,
                            IsAvailable = v.IsAvailable,
                            SortOrder = v.SortOrder
                        })
                        .ToList()
                })
                .ToList()
        };
    }

    public async Task<MenuItemDetailDto> CreateMenuItemAsync(CreateMenuItemRequest request, int userLevel, Guid? userBranchId)
    {
        ValidateBranchAccess(request.BranchId, userLevel, userBranchId);

        var category = await dbContext.MenuCategories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.BranchId == request.BranchId && !c.IsDeleted);

        if (category == null)
        {
            throw new KeyNotFoundException("Danh mục món ăn không tồn tại trong chi nhánh này.");
        }

        var code = request.Code.Trim().ToUpper();
        var codeExists = await dbContext.MenuItems
            .AnyAsync(i => i.BranchId == request.BranchId && i.Code == code && !i.IsDeleted);

        if (codeExists)
        {
            throw new InvalidOperationException($"Mã món '{code}' đã tồn tại trong chi nhánh này.");
        }

        var menuItem = new MenuItem
        {
            Id = Guid.NewGuid(),
            BranchId = request.BranchId,
            CategoryId = request.CategoryId,
            Code = code,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            ImageUrl = request.ImageUrl?.Trim(),
            Price = request.Price,
            Unit = string.IsNullOrWhiteSpace(request.Unit) ? "Phần" : request.Unit.Trim(),
            KitchenStation = string.IsNullOrWhiteSpace(request.KitchenStation) ? "Kitchen" : request.KitchenStation.Trim(),
            PreparationMinutes = request.PreparationMinutes > 0 ? request.PreparationMinutes : 15,
            IsAvailable = request.IsAvailable,
            Is86ed = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        if (request.Options != null && request.Options.Count > 0)
        {
            int optOrder = 1;
            foreach (var optReq in request.Options)
            {
                var option = new MenuItemOption
                {
                    Id = Guid.NewGuid(),
                    MenuItemId = menuItem.Id,
                    Name = optReq.Name.Trim(),
                    OptionType = optReq.OptionType,
                    IsRequired = optReq.IsRequired,
                    SortOrder = optReq.SortOrder > 0 ? optReq.SortOrder : optOrder++,
                    CreatedAt = DateTime.UtcNow
                };

                if (optReq.Values != null && optReq.Values.Count > 0)
                {
                    int valOrder = 1;
                    foreach (var valReq in optReq.Values)
                    {
                        var val = new MenuItemOptionValue
                        {
                            Id = Guid.NewGuid(),
                            OptionId = option.Id,
                            Name = valReq.Name.Trim(),
                            ExtraPrice = valReq.ExtraPrice,
                            IsDefault = valReq.IsDefault,
                            IsAvailable = valReq.IsAvailable,
                            SortOrder = valReq.SortOrder > 0 ? valReq.SortOrder : valOrder++,
                            CreatedAt = DateTime.UtcNow
                        };
                        option.Values.Add(val);
                    }
                }

                menuItem.Options.Add(option);
            }
        }

        dbContext.MenuItems.Add(menuItem);
        await dbContext.SaveChangesAsync();

        return (await GetMenuItemByIdAsync(menuItem.Id, userLevel, userBranchId))!;
    }

    public async Task<MenuItemDetailDto> UpdateMenuItemAsync(Guid id, UpdateMenuItemRequest request, int userLevel, Guid? userBranchId)
    {
        var menuItem = await dbContext.MenuItems
            .Include(i => i.Options)
                .ThenInclude(o => o.Values)
            .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);

        if (menuItem == null)
        {
            throw new KeyNotFoundException("Không tìm thấy món ăn.");
        }

        ValidateBranchAccess(menuItem.BranchId, userLevel, userBranchId);

        var category = await dbContext.MenuCategories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.BranchId == menuItem.BranchId && !c.IsDeleted);

        if (category == null)
        {
            throw new KeyNotFoundException("Danh mục món ăn không hợp lệ.");
        }

        var code = request.Code.Trim().ToUpper();
        var codeExists = await dbContext.MenuItems
            .AnyAsync(i => i.BranchId == menuItem.BranchId && i.Code == code && i.Id != id && !i.IsDeleted);

        if (codeExists)
        {
            throw new InvalidOperationException($"Mã món '{code}' đã tồn tại trong chi nhánh này.");
        }

        menuItem.CategoryId = request.CategoryId;
        menuItem.Code = code;
        menuItem.Name = request.Name.Trim();
        menuItem.Description = request.Description?.Trim();
        menuItem.ImageUrl = request.ImageUrl?.Trim();
        menuItem.Price = request.Price;
        menuItem.Unit = string.IsNullOrWhiteSpace(request.Unit) ? "Phần" : request.Unit.Trim();
        menuItem.KitchenStation = string.IsNullOrWhiteSpace(request.KitchenStation) ? "Kitchen" : request.KitchenStation.Trim();
        menuItem.PreparationMinutes = request.PreparationMinutes > 0 ? request.PreparationMinutes : 15;
        menuItem.IsAvailable = request.IsAvailable;
        menuItem.Is86ed = request.Is86ed;
        menuItem.IsActive = request.IsActive;
        menuItem.UpdatedAt = DateTime.UtcNow;

        // Sync Options: Remove old options and add updated options
        dbContext.MenuItemOptionValues.RemoveRange(menuItem.Options.SelectMany(o => o.Values));
        dbContext.MenuItemOptions.RemoveRange(menuItem.Options);

        if (request.Options != null && request.Options.Count > 0)
        {
            int optOrder = 1;
            foreach (var optReq in request.Options)
            {
                var option = new MenuItemOption
                {
                    Id = Guid.NewGuid(),
                    MenuItemId = menuItem.Id,
                    Name = optReq.Name.Trim(),
                    OptionType = optReq.OptionType,
                    IsRequired = optReq.IsRequired,
                    SortOrder = optReq.SortOrder > 0 ? optReq.SortOrder : optOrder++,
                    CreatedAt = DateTime.UtcNow
                };

                if (optReq.Values != null && optReq.Values.Count > 0)
                {
                    int valOrder = 1;
                    foreach (var valReq in optReq.Values)
                    {
                        var val = new MenuItemOptionValue
                        {
                            Id = Guid.NewGuid(),
                            OptionId = option.Id,
                            Name = valReq.Name.Trim(),
                            ExtraPrice = valReq.ExtraPrice,
                            IsDefault = valReq.IsDefault,
                            IsAvailable = valReq.IsAvailable,
                            SortOrder = valReq.SortOrder > 0 ? valReq.SortOrder : valOrder++,
                            CreatedAt = DateTime.UtcNow
                        };
                        option.Values.Add(val);
                    }
                }

                menuItem.Options.Add(option);
            }
        }

        await dbContext.SaveChangesAsync();

        return (await GetMenuItemByIdAsync(menuItem.Id, userLevel, userBranchId))!;
    }

    public async Task<bool> ToggleItemAvailabilityAsync(Guid id, bool isAvailable, int userLevel, Guid? userBranchId)
    {
        var item = await dbContext.MenuItems.FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);
        if (item == null) return false;

        ValidateBranchAccess(item.BranchId, userLevel, userBranchId);

        item.IsAvailable = isAvailable;
        item.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleItem86Async(Guid id, bool is86ed, int userLevel, Guid? userBranchId)
    {
        var item = await dbContext.MenuItems.FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);
        if (item == null) return false;

        ValidateBranchAccess(item.BranchId, userLevel, userBranchId);

        item.Is86ed = is86ed;
        item.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteMenuItemAsync(Guid id, int userLevel, Guid? userBranchId)
    {
        var item = await dbContext.MenuItems.FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);
        if (item == null) return false;

        ValidateBranchAccess(item.BranchId, userLevel, userBranchId);

        item.IsDeleted = true;
        item.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
        return true;
    }
}
