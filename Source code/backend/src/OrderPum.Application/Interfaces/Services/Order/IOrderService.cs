using OrderPum.Application.DTOs.Order;

namespace OrderPum.Application.Interfaces.Services.Order;

public interface IOrderService
{
    Task<TableSessionDetailDto> OpenSessionAsync(OpenSessionRequest request, Guid? staffUserId, CancellationToken ct = default);
    Task<TableSessionDetailDto?> GetActiveSessionByTableAsync(Guid tableId, CancellationToken ct = default);
    Task<TableSessionDetailDto?> GetSessionByIdAsync(Guid sessionId, CancellationToken ct = default);
    Task<OrderTicketDto> PlaceStaffOrderAsync(StaffPlaceOrderRequest request, Guid staffUserId, CancellationToken ct = default);
    Task<OrderTicketDto> PlaceQrOrderAsync(QrPlaceOrderRequest request, CancellationToken ct = default);
    Task ConfirmQrTicketAsync(Guid ticketId, Guid staffUserId, CancellationToken ct = default);
    Task RejectQrTicketAsync(Guid ticketId, string reason, Guid staffUserId, CancellationToken ct = default);
    Task<bool> CloseSessionAsync(Guid sessionId, Guid staffUserId, CancellationToken ct = default);

    // QR Guest flow (STT 22, 23, 25)
    Task<QrTableInfoDto> GetQrTableInfoAsync(string qrToken, CancellationToken ct = default);
    Task<TableSessionDetailDto?> GetQrSessionStatusAsync(string qrToken, CancellationToken ct = default);

    // Table Interactions (STT 27, 28, 95)
    Task<TableNotificationDto> CallStaffAsync(CallStaffRequest request, CancellationToken ct = default);
    Task<TableNotificationDto> RequestBillAsync(RequestBillRequest request, CancellationToken ct = default);
    Task<List<TableNotificationDto>> GetActiveNotificationsAsync(Guid branchId, CancellationToken ct = default);
    Task DismissNotificationAsync(Guid notificationId, Guid staffUserId, CancellationToken ct = default);
}
