using OrderPum.Application.DTOs.Payment;

namespace OrderPum.Application.Interfaces.Services.Payment;

public interface IPaymentService
{
    Task<InvoiceDto> CreateInvoiceFromSessionAsync(
        CreateInvoiceRequest request,
        Guid? cashierUserId = null,
        CancellationToken ct = default);

    Task<InvoiceDto> MergeTablesInvoiceAsync(
        MergeTablesInvoiceRequest request,
        Guid? cashierUserId = null,
        CancellationToken ct = default);

    Task<InvoiceDto?> GetInvoiceByIdAsync(
        Guid invoiceId,
        CancellationToken ct = default);

    Task<List<InvoiceDto>> GetInvoicesByBranchAsync(
        Guid branchId,
        string? status = null,
        DateTime? date = null,
        CancellationToken ct = default);

    Task<InvoiceDto> SettlePaymentAsync(
        SettlePaymentRequest request,
        Guid? cashierUserId = null,
        CancellationToken ct = default);

    Task<VietQrInfoDto> GenerateVietQrAsync(
        Guid invoiceId,
        CancellationToken ct = default);
}
