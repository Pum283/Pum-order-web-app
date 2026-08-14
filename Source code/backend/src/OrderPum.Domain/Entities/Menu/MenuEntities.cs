using OrderPum.Domain.Base;

namespace OrderPum.Domain.Entities.Menu;

public class MenuCategory : EntityBase
{
    public Guid BranchId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public virtual ICollection<MenuItem> Items { get; set; } = new List<MenuItem>();
}

public class MenuItem : EntityBase
{
    public Guid BranchId { get; set; }
    public Guid CategoryId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public decimal Price { get; set; }
    public string Unit { get; set; } = "Phần";
    public string KitchenStation { get; set; } = "Kitchen"; // Kitchen, Bar, Pastry
    public int PreparationMinutes { get; set; } = 15;
    public bool IsAvailable { get; set; } = true;
    public bool Is86ed { get; set; } = false; // Báo hết hàng nhanh trong ca (STT 31)
    public bool IsActive { get; set; } = true;

    // Navigation
    public virtual MenuCategory? Category { get; set; }
    public virtual ICollection<MenuItemOption> Options { get; set; } = new List<MenuItemOption>();
}

public class MenuItemOption : EntityBase
{
    public Guid MenuItemId { get; set; }
    public string Name { get; set; } = string.Empty; // VD: "Size", "Topping gọi thêm", "Độ cay", "Lượng đường"
    public string OptionType { get; set; } = "Single"; // Single, Multiple
    public bool IsRequired { get; set; } = false;
    public int SortOrder { get; set; } = 1;

    // Navigation
    public virtual MenuItem? MenuItem { get; set; }
    public virtual ICollection<MenuItemOptionValue> Values { get; set; } = new List<MenuItemOptionValue>();
}

public class MenuItemOptionValue : EntityBase
{
    public Guid OptionId { get; set; }
    public string Name { get; set; } = string.Empty; // VD: "Size M", "Size L", "Trân châu hoàng kim"
    public decimal ExtraPrice { get; set; } = 0; // Giá cộng thêm (0 nếu không tính phí)
    public bool IsDefault { get; set; } = false;
    public bool IsAvailable { get; set; } = true;
    public int SortOrder { get; set; } = 1;

    // Navigation
    public virtual MenuItemOption? Option { get; set; }
}
