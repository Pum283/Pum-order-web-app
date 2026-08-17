using OrderPum.Domain.Base;

namespace OrderPum.Domain.Entities.Payment;

public class Invoice : EntityBase
{
    public Guid BranchId { get; set; }
    public Guid? SessionId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string TableCodeSnapshot { get; set; } = string.Empty;
    public string TableNameSnapshot { get; set; } = string.Empty;
    public string? MergedSessionIdsText { get; set; } // Nếu gộp nhiều bàn (VD "id1,id2")
    
    public decimal SubTotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? VoucherCode { get; set; }
    
    public decimal TaxRatePercent { get; set; }
    public decimal TaxAmount { get; set; }
    public bool IsTaxIncludedInPrice { get; set; }
    
    public decimal ServiceChargePercent { get; set; }
    public decimal ServiceChargeAmount { get; set; }
    public bool IsServiceChargeIncluded { get; set; }
    
    public decimal FinalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal ChangeAmount { get; set; }
    
    public string PaymentStatus { get; set; } = "Unpaid"; // Unpaid, PartiallyPaid, Paid, Refunded, Cancelled
    public Guid? CashierUserId { get; set; }
    public string CashierNameSnapshot { get; set; } = string.Empty;
    
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? Note { get; set; }
    public DateTime? PaidAt { get; set; }

    public List<InvoiceLine> Lines { get; set; } = [];
    public List<PaymentTransaction> Payments { get; set; } = [];
}

public class InvoiceLine : EntityBase
{
    public Guid InvoiceId { get; set; }
    public Guid? OrderLineId { get; set; }
    public Guid MenuItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal TotalPrice { get; set; }
    public string? SelectedOptionsText { get; set; }
    public string? Note { get; set; }
}

public class PaymentTransaction : EntityBase
{
    public Guid InvoiceId { get; set; }
    public string PaymentMethod { get; set; } = "Cash"; // Cash, BankTransfer, CardPos, EWallet
    public decimal Amount { get; set; }
    public string? TransactionCode { get; set; }
    public string? Note { get; set; }
    public string Status { get; set; } = "Success"; // Success, Pending, Failed
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
}
