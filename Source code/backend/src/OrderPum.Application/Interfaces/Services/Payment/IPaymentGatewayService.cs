using OrderPum.Application.DTOs.Payment;

namespace OrderPum.Application.Interfaces.Services.Payment;

public interface IPaymentGatewayService
{
    Task<List<PaymentGatewayConfigDto>> GetGatewayConfigsAsync(
        Guid? branchId = null,
        CancellationToken ct = default);

    Task<PaymentGatewayConfigDto> SaveGatewayConfigAsync(
        SavePaymentGatewayConfigRequest request,
        CancellationToken ct = default);

    Task<GatewayPaymentUrlResultDto> CreateVNPayPaymentUrlAsync(
        Guid invoiceId,
        string clientIp,
        string? returnUrl = null,
        string? bankCode = null,
        CancellationToken ct = default);

    Task<GatewayCallbackResultDto> ProcessVNPayCallbackAsync(
        IDictionary<string, string> queryParams,
        bool isIpn = false,
        CancellationToken ct = default);

    Task<GatewayPaymentUrlResultDto> CreateMoMoPaymentUrlAsync(
        Guid invoiceId,
        string? returnUrl = null,
        CancellationToken ct = default);

    Task<GatewayCallbackResultDto> ProcessMoMoCallbackAsync(
        IDictionary<string, string> queryParams,
        bool isIpn = false,
        CancellationToken ct = default);
}
