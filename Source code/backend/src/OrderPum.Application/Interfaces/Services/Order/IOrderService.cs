using OrderPum.Application.DTOs.Order;

namespace OrderPum.Application.Interfaces.Services.Order;

public interface IOrderService
{
    Task<SessionDto> OpenSessionAsync(OpenSessionRequest request, Guid? staffUserId, CancellationToken ct = default);
    Task<OrderTicketDto> PlaceStaffOrderAsync(StaffPlaceOrderRequest request, Guid staffUserId, CancellationToken ct = default);
    Task<OrderTicketDto> PlaceQrOrderAsync(QrPlaceOrderRequest request, CancellationToken ct = default);
    Task ConfirmQrTicketAsync(Guid ticketId, Guid staffUserId, CancellationToken ct = default);
    Task<SessionDto?> GetSessionAsync(Guid sessionId, CancellationToken ct = default);
}
