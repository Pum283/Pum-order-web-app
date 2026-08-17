using OrderPum.Application.DTOs.Kitchen;

namespace OrderPum.Application.Interfaces.Services.Kitchen;

public interface IKitchenService
{
    Task<List<KitchenOrderTicketDto>> GetActiveKitchenTicketsAsync(
        Guid branchId,
        string? station = null,
        string? statusFilter = null,
        CancellationToken ct = default);

    Task<List<KitchenAggregateItemDto>> GetAggregateItemsAsync(
        Guid branchId,
        string? station = null,
        CancellationToken ct = default);

    Task<KitchenStatsDto> GetKitchenStatsAsync(
        Guid branchId,
        CancellationToken ct = default);

    Task<KitchenOrderLineDto> UpdateLineStatusAsync(
        Guid lineId,
        UpdateLineStatusRequest request,
        Guid? staffUserId = null,
        CancellationToken ct = default);

    Task<bool> UpdateTicketStatusAsync(
        Guid ticketId,
        UpdateTicketStatusRequest request,
        Guid? staffUserId = null,
        CancellationToken ct = default);
}
