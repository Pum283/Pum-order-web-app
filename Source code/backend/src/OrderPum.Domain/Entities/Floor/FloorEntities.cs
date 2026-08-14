using OrderPum.Domain.Base;

namespace OrderPum.Domain.Entities.Floor;

public class Area : EntityBase
{
    public Guid BranchId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class DiningTable : EntityBase
{
    public Guid BranchId { get; set; }
    public Guid AreaId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Name { get; set; }
    public int Capacity { get; set; }
    public string QrToken { get; set; } = Guid.NewGuid().ToString("N");
}
