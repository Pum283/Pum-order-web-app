namespace OrderPum.Application.DTOs.Payment;

public class InvoiceLineDto
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public Guid? OrderLineId { get; set; }
    public Guid MenuItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public string? SelectedOptionsText { get; set; }
    public string? Note { get; set; }
}

public class PaymentTransactionDto
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public string PaymentMethod { get; set; } = "Cash"; // Cash, BankTransfer, CardPos, EWallet
    public decimal Amount { get; set; }
    public string? TransactionCode { get; set; }
    public string? Note { get; set; }
    public string Status { get; set; } = "Success";
    public DateTime PaidAt { get; set; }
}

public class InvoiceDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string BranchAddress { get; set; } = string.Empty;
    public string BranchPhone { get; set; } = string.Empty;
    public string? ReceiptHeaderNote { get; set; }
    public string? ReceiptFooterNote { get; set; }
    
    public Guid? SessionId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string TableCodeSnapshot { get; set; } = string.Empty;
    public string TableNameSnapshot { get; set; } = string.Empty;
    
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
    
    public string PaymentStatus { get; set; } = "Unpaid";
    public Guid? CashierUserId { get; set; }
    public string CashierNameSnapshot { get; set; } = string.Empty;
    
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }

    public List<InvoiceLineDto> Lines { get; set; } = [];
    public List<PaymentTransactionDto> Payments { get; set; } = [];
}

public class CreateInvoiceRequest
{
    public Guid SessionId { get; set; }
    public List<Guid>? SelectedLineIds { get; set; } // Nếu tách bill theo món, null nếu lấy toàn bộ
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? Note { get; set; }
}

public class MergeTablesInvoiceRequest
{
    public Guid BranchId { get; set; }
    public List<Guid> SessionIds { get; set; } = [];
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? Note { get; set; }
}

public class SplitBillEqualRequest
{
    public Guid SessionId { get; set; }
    public int NumberOfParts { get; set; } = 2;
}

public class PaymentItemRequest
{
    public string PaymentMethod { get; set; } = "Cash"; // Cash, BankTransfer, CardPos, EWallet
    public decimal Amount { get; set; }
    public string? TransactionCode { get; set; }
    public string? Note { get; set; }
}

public class SettlePaymentRequest
{
    public Guid InvoiceId { get; set; }
    public List<PaymentItemRequest> Payments { get; set; } = [];
    public decimal ReceivedCashAmount { get; set; } // Tiền mặt khách đưa (để tính tiền thối)
    public bool CloseSessionAfterPayment { get; set; } = true;
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
}

public class VietQrInfoDto
{
    public string BankCode { get; set; } = "MB";
    public string AccountNo { get; set; } = "0901234567";
    public string AccountName { get; set; } = "NHA HANG ORDERPUM";
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string QrUrl { get; set; } = string.Empty;
}
