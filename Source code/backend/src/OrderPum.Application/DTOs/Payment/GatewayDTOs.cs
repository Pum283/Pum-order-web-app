namespace OrderPum.Application.DTOs.Payment;

public class PaymentGatewayConfigDto
{
    public Guid Id { get; set; }
    public Guid? BranchId { get; set; }
    public string? BranchName { get; set; }
    public string Provider { get; set; } = "VNPay"; // VNPay, MoMo, ZaloPay, VietQR
    public bool IsActive { get; set; } = true;
    public bool IsSandbox { get; set; } = true;
    public string MerchantId { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string? AccessKey { get; set; }
    public string? EndpointUrl { get; set; }
    public string? ReturnUrl { get; set; }
    public string? IpnUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SavePaymentGatewayConfigRequest
{
    public Guid? BranchId { get; set; }
    public string Provider { get; set; } = "VNPay";
    public bool IsActive { get; set; } = true;
    public bool IsSandbox { get; set; } = true;
    public string MerchantId { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string? AccessKey { get; set; }
    public string? EndpointUrl { get; set; }
    public string? ReturnUrl { get; set; }
    public string? IpnUrl { get; set; }
}

public class CreateGatewayPaymentUrlRequest
{
    public Guid InvoiceId { get; set; }
    public string Provider { get; set; } = "VNPay"; // VNPay, MoMo
    public string? ReturnUrl { get; set; }
    public string? BankCode { get; set; } // VNBANK, VNPAYQR, INTCARD, etc.
}

public class GatewayPaymentUrlResultDto
{
    public bool Success { get; set; }
    public string PaymentUrl { get; set; } = string.Empty;
    public string? QrCodeUrl { get; set; }
    public string? TransactionReference { get; set; }
    public string? Message { get; set; }
}

public class GatewayCallbackResultDto
{
    public bool IsSuccess { get; set; }
    public string RspCode { get; set; } = "00";
    public string Message { get; set; } = string.Empty;
    public Guid? InvoiceId { get; set; }
    public string? InvoiceNumber { get; set; }
    public decimal Amount { get; set; }
    public string? TransactionNo { get; set; }
    public string? BankCode { get; set; }
    public string? PayDate { get; set; }
}
