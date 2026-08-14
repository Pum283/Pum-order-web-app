using System.ComponentModel.DataAnnotations;

namespace OrderPum.Application.DTOs.Menu;

// ==========================================
// CATEGORY DTOs (STT 34)
// ==========================================

public class MenuCategoryDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public int ItemCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCategoryRequest
{
    [Required(ErrorMessage = "Chi nhánh không được để trống")]
    public Guid BranchId { get; set; }

    [MaxLength(50, ErrorMessage = "Mã danh mục tối đa 50 ký tự")]
    public string? Code { get; set; }

    [Required(ErrorMessage = "Tên danh mục không được để trống")]
    [MaxLength(150, ErrorMessage = "Tên danh mục tối đa 150 ký tự")]
    public string Name { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; } = 1;
}

public class UpdateCategoryRequest
{
    [MaxLength(50, ErrorMessage = "Mã danh mục tối đa 50 ký tự")]
    public string? Code { get; set; }

    [Required(ErrorMessage = "Tên danh mục không được để trống")]
    [MaxLength(150, ErrorMessage = "Tên danh mục tối đa 150 ký tự")]
    public string Name { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

// ==========================================
// OPTION / MODIFIER DTOs (STT 36)
// ==========================================

public class MenuItemOptionValueDto
{
    public Guid Id { get; set; }
    public Guid OptionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal ExtraPrice { get; set; }
    public bool IsDefault { get; set; }
    public bool IsAvailable { get; set; }
    public int SortOrder { get; set; }
}

public class CreateOptionValueRequest
{
    public Guid? Id { get; set; }

    [Required(ErrorMessage = "Tên giá trị tùy chọn không được để trống")]
    [MaxLength(100, ErrorMessage = "Tên giá trị tùy chọn tối đa 100 ký tự")]
    public string Name { get; set; } = string.Empty;

    [Range(0, 10000000, ErrorMessage = "Giá cộng thêm phải >= 0")]
    public decimal ExtraPrice { get; set; } = 0;

    public bool IsDefault { get; set; } = false;
    public bool IsAvailable { get; set; } = true;
    public int SortOrder { get; set; } = 1;
}

public class MenuItemOptionDto
{
    public Guid Id { get; set; }
    public Guid MenuItemId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string OptionType { get; set; } = "Single"; // Single, Multiple
    public bool IsRequired { get; set; }
    public int SortOrder { get; set; }
    public List<MenuItemOptionValueDto> Values { get; set; } = [];
}

public class CreateOptionRequest
{
    public Guid? Id { get; set; }

    [Required(ErrorMessage = "Tên nhóm tùy chọn không được để trống")]
    [MaxLength(100, ErrorMessage = "Tên nhóm tùy chọn tối đa 100 ký tự")]
    public string Name { get; set; } = string.Empty;

    public string OptionType { get; set; } = "Single"; // Single, Multiple
    public bool IsRequired { get; set; } = false;
    public int SortOrder { get; set; } = 1;
    public List<CreateOptionValueRequest> Values { get; set; } = [];
}

// ==========================================
// MENU ITEM DTOs (STT 35, 36)
// ==========================================

public class MenuItemDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public decimal Price { get; set; }
    public string Unit { get; set; } = "Phần";
    public string KitchenStation { get; set; } = "Kitchen";
    public int PreparationMinutes { get; set; }
    public bool IsAvailable { get; set; }
    public bool Is86ed { get; set; }
    public bool IsActive { get; set; }
    public int OptionCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class MenuItemDetailDto : MenuItemDto
{
    public List<MenuItemOptionDto> Options { get; set; } = [];
}

public class CreateMenuItemRequest
{
    [Required(ErrorMessage = "Chi nhánh không được để trống")]
    public Guid BranchId { get; set; }

    [Required(ErrorMessage = "Danh mục không được để trống")]
    public Guid CategoryId { get; set; }

    [Required(ErrorMessage = "Mã món không được để trống")]
    [MaxLength(50, ErrorMessage = "Mã món tối đa 50 ký tự")]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tên món không được để trống")]
    [MaxLength(200, ErrorMessage = "Tên món tối đa 200 ký tự")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Mô tả tối đa 1000 ký tự")]
    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    [Range(0, 1000000000, ErrorMessage = "Giá món ăn phải >= 0")]
    public decimal Price { get; set; }

    [MaxLength(50, ErrorMessage = "Đơn vị tính tối đa 50 ký tự")]
    public string Unit { get; set; } = "Phần";

    public string KitchenStation { get; set; } = "Kitchen"; // Kitchen, Bar, Pastry
    public int PreparationMinutes { get; set; } = 15;
    public bool IsAvailable { get; set; } = true;
    public List<CreateOptionRequest> Options { get; set; } = [];
}

public class UpdateMenuItemRequest
{
    [Required(ErrorMessage = "Danh mục không được để trống")]
    public Guid CategoryId { get; set; }

    [Required(ErrorMessage = "Mã món không được để trống")]
    [MaxLength(50, ErrorMessage = "Mã món tối đa 50 ký tự")]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tên món không được để trống")]
    [MaxLength(200, ErrorMessage = "Tên món tối đa 200 ký tự")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Mô tả tối đa 1000 ký tự")]
    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    [Range(0, 1000000000, ErrorMessage = "Giá món ăn phải >= 0")]
    public decimal Price { get; set; }

    [MaxLength(50, ErrorMessage = "Đơn vị tính tối đa 50 ký tự")]
    public string Unit { get; set; } = "Phần";

    public string KitchenStation { get; set; } = "Kitchen";
    public int PreparationMinutes { get; set; } = 15;
    public bool IsAvailable { get; set; } = true;
    public bool Is86ed { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public List<CreateOptionRequest> Options { get; set; } = [];
}

public class ToggleItemAvailabilityRequest
{
    public bool IsAvailable { get; set; }
}

public class ToggleItem86Request
{
    public bool Is86ed { get; set; }
}
