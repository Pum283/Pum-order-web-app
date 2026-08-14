using OrderPum.Domain.Base;
using OrderPum.Domain.Entities.Auth;

namespace OrderPum.Domain.Entities.Branch;

public class Branch : EntityBase
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? OpenHours { get; set; }
    public string? ImageUrl { get; set; }
    public decimal TaxRatePercent { get; set; } = 8;
    public decimal ServiceChargePercent { get; set; } = 0;
    public string Currency { get; set; } = "VND";
    public bool IsTaxIncludedInPrice { get; set; } = false;
    public bool IsServiceChargeIncluded { get; set; } = false;
    public string? ReceiptHeaderNote { get; set; }
    public string? ReceiptFooterNote { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<UserAccount> Users { get; set; } = [];
}
