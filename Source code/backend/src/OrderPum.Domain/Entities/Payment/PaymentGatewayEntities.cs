using OrderPum.Domain.Base;

namespace OrderPum.Domain.Entities.Payment;

public class PaymentGatewayConfig : EntityBase
{
    public Guid? BranchId { get; set; } // Null nếu áp dụng toàn chuỗi
    public string Provider { get; set; } = "VNPay"; // VNPay, MoMo, ZaloPay, VietQR
    public bool IsActive { get; set; } = true;
    public bool IsSandbox { get; set; } = true;
    
    public string MerchantId { get; set; } = string.Empty; // VNPay: TmnCode, MoMo: PartnerCode
    public string SecretKey { get; set; } = string.Empty; // VNPay: HashSecret, MoMo: SecretKey
    public string? AccessKey { get; set; } // MoMo: AccessKey
    public string? EndpointUrl { get; set; }
    public string? ReturnUrl { get; set; }
    public string? IpnUrl { get; set; }
    public string? ExtraSettingsJson { get; set; }
}
