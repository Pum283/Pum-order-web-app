using OrderPum.Application.DTOs.Payment;
using OrderPum.Application.DTOs.Promo;

namespace OrderPum.Application.Interfaces.Services.Promo;

public interface IPromoService
{
    Task<List<PromotionDto>> GetPromotionsAsync(
        Guid? branchId = null,
        bool activeOnly = false,
        CancellationToken ct = default);

    Task<PromotionDto?> GetPromotionByIdAsync(
        Guid id,
        CancellationToken ct = default);

    Task<PromotionDto> CreatePromotionAsync(
        CreatePromotionRequest request,
        CancellationToken ct = default);

    Task<PromotionDto> UpdatePromotionAsync(
        Guid id,
        UpdatePromotionRequest request,
        CancellationToken ct = default);

    Task<bool> DeletePromotionAsync(
        Guid id,
        CancellationToken ct = default);

    Task<bool> TogglePromotionStatusAsync(
        Guid id,
        CancellationToken ct = default);

    Task<PromoCalculationResultDto> EvaluatePromoAsync(
        ValidatePromoRequest request,
        CancellationToken ct = default);

    Task<InvoiceDto> ApplyPromoToInvoiceAsync(
        Guid invoiceId,
        ApplyPromoToInvoiceRequest request,
        CancellationToken ct = default);
}
