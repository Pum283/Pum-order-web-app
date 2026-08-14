namespace OrderPum.Application.DTOs.Order;

public record OpenSessionRequest(Guid TableId);
public record StaffOrderLineRequest(Guid MenuItemId, int Quantity, string? Note);
public record StaffPlaceOrderRequest(Guid SessionId, IReadOnlyList<StaffOrderLineRequest> Lines);
public record QrPlaceOrderRequest(string TableQrToken, IReadOnlyList<StaffOrderLineRequest> Lines);
public record OrderLineDto(Guid Id, string ItemName, int Quantity, decimal UnitPrice, string? Note, string Status);
public record OrderTicketDto(Guid Id, string Source, DateTime OrderedAt, IReadOnlyList<OrderLineDto> Lines);
public record SessionDto(Guid Id, Guid TableId, string Status, IReadOnlyList<OrderTicketDto> Tickets);
