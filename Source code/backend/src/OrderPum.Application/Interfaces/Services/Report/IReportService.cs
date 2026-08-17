using OrderPum.Application.DTOs.Report;

namespace OrderPum.Application.Interfaces.Services.Report;

public interface IReportService
{
    Task<RevenueReportResponseDto> GetRevenueReportAsync(
        GetRevenueReportRequest request,
        CancellationToken ct = default);

    Task<List<TopSellingItemDto>> GetTopSellingItemsAsync(
        Guid? branchId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int top = 10,
        CancellationToken ct = default);

    Task<List<PaymentMethodRevenueDto>> GetPaymentMethodRevenueAsync(
        Guid? branchId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken ct = default);

    Task<List<BranchRevenueDto>> GetBranchRevenuesAsync(
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken ct = default);
}
