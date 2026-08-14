using OrderPum.Domain.Base;

namespace OrderPum.Domain.Entities.Branch;

public class Branch : EntityBase
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? OpenHours { get; set; }
    public decimal TaxRatePercent { get; set; }
    public decimal ServiceChargePercent { get; set; }
    public string Currency { get; set; } = "VND";
    public bool IsActive { get; set; } = true;
}
