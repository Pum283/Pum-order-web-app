namespace OrderPum.Application.DTOs.Branch;

public record BranchDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Address { get; init; }
    public string? Phone { get; init; }
    public string? OpenHours { get; init; }
    public string? ImageUrl { get; init; }
    public decimal TaxRatePercent { get; init; }
    public decimal ServiceChargePercent { get; init; }
    public string Currency { get; init; } = "VND";
    public bool IsTaxIncludedInPrice { get; init; }
    public bool IsServiceChargeIncluded { get; init; }
    public string? ReceiptHeaderNote { get; init; }
    public string? ReceiptFooterNote { get; init; }
    public bool IsActive { get; init; }
    public int StaffCount { get; init; }
    public int TableCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public record BranchSimpleDto(Guid Id, string Code, string Name, string? Address, string? Phone, bool IsActive);

public record CreateBranchRequest
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Address { get; init; }
    public string? Phone { get; init; }
    public string? OpenHours { get; init; }
    public string? ImageUrl { get; init; }
    public decimal TaxRatePercent { get; init; } = 8;
    public decimal ServiceChargePercent { get; init; } = 0;
    public string Currency { get; init; } = "VND";
    public bool IsTaxIncludedInPrice { get; init; } = false;
    public bool IsServiceChargeIncluded { get; init; } = false;
    public string? ReceiptHeaderNote { get; init; }
    public string? ReceiptFooterNote { get; init; }
    public bool IsActive { get; init; } = true;
}

public record UpdateBranchRequest
{
    public string Name { get; init; } = string.Empty;
    public string? Address { get; init; }
    public string? Phone { get; init; }
    public string? OpenHours { get; init; }
    public string? ImageUrl { get; init; }
    public bool IsActive { get; init; } = true;
}

public record UpdateFinancialConfigRequest
{
    public decimal TaxRatePercent { get; init; }
    public decimal ServiceChargePercent { get; init; }
    public string Currency { get; init; } = "VND";
    public bool IsTaxIncludedInPrice { get; init; }
    public bool IsServiceChargeIncluded { get; init; }
    public string? ReceiptHeaderNote { get; init; }
    public string? ReceiptFooterNote { get; init; }
}
