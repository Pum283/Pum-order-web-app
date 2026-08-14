using OrderPum.Domain.Base;

namespace OrderPum.Domain.Entities.Menu;

public class MenuCategory : EntityBase
{
    public Guid BranchId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class MenuItem : EntityBase
{
    public Guid BranchId { get; set; }
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public decimal Price { get; set; }
    public string Unit { get; set; } = "phần";
    public bool IsAvailable { get; set; } = true;
}
