using Microsoft.EntityFrameworkCore;
using OrderPum.Application.DTOs.Order;
using OrderPum.Application.Interfaces.Services.Order;
using OrderPum.Domain.Entities.Order;
using OrderPum.Domain.Enums.Order;
using OrderPum.Infrastructure.Persistence;

namespace OrderPum.Infrastructure.Implementations.Services.Order;

public class OrderService(AppDbContext db) : IOrderService
{
    public async Task<SessionDto> OpenSessionAsync(OpenSessionRequest request, Guid? staffUserId, CancellationToken ct = default)
    {
        var table = await db.Tables.FirstOrDefaultAsync(x => x.Id == request.TableId && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy bàn.");

        var existing = await db.TableSessions
            .FirstOrDefaultAsync(x => x.TableId == table.Id && x.Status == TableSessionStatus.Open && !x.IsDeleted, ct);
        if (existing is not null)
            return (await GetSessionAsync(existing.Id, ct))!;

        var session = new TableSession
        {
            BranchId = table.BranchId,
            TableId = table.Id,
            Status = TableSessionStatus.Open
        };
        db.TableSessions.Add(session);
        await db.SaveChangesAsync(ct);
        return (await GetSessionAsync(session.Id, ct))!;
    }

    public async Task<OrderTicketDto> PlaceStaffOrderAsync(StaffPlaceOrderRequest request, Guid staffUserId, CancellationToken ct = default)
    {
        var session = await RequireOpenSession(request.SessionId, ct);
        var ticket = await CreateTicketAsync(session, OrderSource.StaffAssisted, staffUserId, request.Lines, sendStraightToKitchen: true, ct);
        return await MapTicket(ticket.Id, ct);
    }

    public async Task<OrderTicketDto> PlaceQrOrderAsync(QrPlaceOrderRequest request, CancellationToken ct = default)
    {
        var table = await db.Tables.FirstOrDefaultAsync(x => x.QrToken == request.TableQrToken && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("QR bàn không hợp lệ.");

        var session = await db.TableSessions
            .FirstOrDefaultAsync(x => x.TableId == table.Id && x.Status == TableSessionStatus.Open && !x.IsDeleted, ct);
        if (session is null)
        {
            session = new TableSession { BranchId = table.BranchId, TableId = table.Id };
            db.TableSessions.Add(session);
            await db.SaveChangesAsync(ct);
        }

        var ticket = await CreateTicketAsync(session, OrderSource.CustomerQr, null, request.Lines, sendStraightToKitchen: false, ct);
        return await MapTicket(ticket.Id, ct);
    }

    public async Task ConfirmQrTicketAsync(Guid ticketId, Guid staffUserId, CancellationToken ct = default)
    {
        var ticket = await db.OrderTickets.FirstOrDefaultAsync(x => x.Id == ticketId, ct)
            ?? throw new InvalidOperationException("Không tìm thấy order.");
        if (ticket.Source != OrderSource.CustomerQr)
            throw new InvalidOperationException("Chỉ xác nhận order từ khách QR.");

        var lines = await db.OrderLines.Where(x => x.TicketId == ticketId).ToListAsync(ct);
        foreach (var line in lines.Where(x => x.Status == OrderItemStatus.PendingConfirm))
            line.Status = OrderItemStatus.SentToKitchen;

        await db.SaveChangesAsync(ct);
    }

    public async Task<SessionDto?> GetSessionAsync(Guid sessionId, CancellationToken ct = default)
    {
        var session = await db.TableSessions.FirstOrDefaultAsync(x => x.Id == sessionId && !x.IsDeleted, ct);
        if (session is null) return null;

        var tickets = await db.OrderTickets.Where(x => x.SessionId == sessionId).OrderBy(x => x.OrderedAt).ToListAsync(ct);
        var ticketDtos = new List<OrderTicketDto>();
        foreach (var t in tickets)
            ticketDtos.Add(await MapTicket(t.Id, ct));

        return new SessionDto(session.Id, session.TableId, session.Status.ToString(), ticketDtos);
    }

    private async Task<TableSession> RequireOpenSession(Guid sessionId, CancellationToken ct)
    {
        var session = await db.TableSessions.FirstOrDefaultAsync(x => x.Id == sessionId && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy phiên bàn.");
        if (session.Status != TableSessionStatus.Open)
            throw new InvalidOperationException("Phiên bàn đã đóng.");
        return session;
    }

    private async Task<OrderTicket> CreateTicketAsync(
        TableSession session,
        OrderSource source,
        Guid? staffUserId,
        IReadOnlyList<StaffOrderLineRequest> lines,
        bool sendStraightToKitchen,
        CancellationToken ct)
    {
        if (lines.Count == 0) throw new InvalidOperationException("Order trống.");

        var ticket = new OrderTicket
        {
            SessionId = session.Id,
            Source = source,
            CreatedByUserId = staffUserId
        };
        db.OrderTickets.Add(ticket);

        foreach (var line in lines)
        {
            var item = await db.MenuItems.FirstOrDefaultAsync(x => x.Id == line.MenuItemId && x.IsAvailable && !x.IsDeleted, ct)
                ?? throw new InvalidOperationException("Món không khả dụng.");
            db.OrderLines.Add(new OrderLine
            {
                TicketId = ticket.Id,
                MenuItemId = item.Id,
                ItemNameSnapshot = item.Name,
                UnitPrice = item.Price,
                Quantity = line.Quantity,
                Note = line.Note,
                Status = sendStraightToKitchen ? OrderItemStatus.SentToKitchen : OrderItemStatus.PendingConfirm
            });
        }

        await db.SaveChangesAsync(ct);
        return ticket;
    }

    private async Task<OrderTicketDto> MapTicket(Guid ticketId, CancellationToken ct)
    {
        var ticket = await db.OrderTickets.FirstAsync(x => x.Id == ticketId, ct);
        var lines = await db.OrderLines.Where(x => x.TicketId == ticketId).ToListAsync(ct);
        return new OrderTicketDto(
            ticket.Id,
            ticket.Source.ToString(),
            ticket.OrderedAt,
            lines.Select(l => new OrderLineDto(l.Id, l.ItemNameSnapshot, l.Quantity, l.UnitPrice, l.Note, l.Status.ToString())).ToList());
    }
}
