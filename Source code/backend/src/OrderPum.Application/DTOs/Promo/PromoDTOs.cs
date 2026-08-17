namespace OrderPum.Application.DTOs.Promo;

public class PromotionDto
{
    public Guid Id { get; set; }
    public Guid? BranchId { get; set; }
    public string? BranchName { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DiscountType { get; set; } = "Percent"; // Percent, FixedAmount, ItemDiscount
    public decimal DiscountValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal MinOrderAmount { get; set; }
    public string TargetType { get; set; } = "Invoice"; // Invoice, Category, MenuItem
    public Guid? TargetId { get; set; }
    public string? TargetName { get; set; }
    public bool IsAutoApply { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int? UsageLimit { get; set; }
    public int UsedCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePromotionRequest
{
    public Guid? BranchId { get; set; }
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DiscountType { get; set; } = "Percent"; // Percent, FixedAmount, ItemDiscount
    public decimal DiscountValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal MinOrderAmount { get; set; } = 0;
    public string TargetType { get; set; } = "Invoice"; // Invoice, Category, MenuItem
    public Guid? TargetId { get; set; }
    public bool IsAutoApply { get; set; } = false;
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int? UsageLimit { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdatePromotionRequest
{
    public Guid? BranchId { get; set; }
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DiscountType { get; set; } = "Percent";
    public decimal DiscountValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal MinOrderAmount { get; set; } = 0;
    public string TargetType { get; set; } = "Invoice";
    public Guid? TargetId { get; set; }
    public bool IsAutoApply { get; set; } = false;
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int? UsageLimit { get; set; }
    public bool IsActive { get; set; } = true;
}

public class PromoLineItemDto
{
    public Guid MenuItemId { get; set; }
    public Guid? CategoryId { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
}

public class ValidatePromoRequest
{
    public Guid BranchId { get; set; }
    public decimal SubTotal { get; set; }
    public List<PromoLineItemDto> Items { get; set; } = [];
    public string? VoucherCode { get; set; }
}

public class PromoCalculationResultDto
{
    public bool IsValid { get; set; }
    public string? Message { get; set; }
    public Guid? PromotionId { get; set; }
    public string? PromotionCode { get; set; }
    public string? PromotionName { get; set; }
    public decimal DiscountAmount { get; set; }
}

public class ApplyPromoToInvoiceRequest
{
    public string? VoucherCode { get; set; }
    public Guid? PromotionId { get; set; }
}
