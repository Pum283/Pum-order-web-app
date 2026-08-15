using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using OrderPum.Api.Hubs;
using OrderPum.Application.DTOs.Order;
using OrderPum.Application.Interfaces.Services.Order;

namespace OrderPum.Api.Controllers.Order;

[ApiController]
[Route("api/orders")]
public class OrdersController(IOrderService orders, IHubContext<OrderHub> hub) : ControllerBase
{
    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (Guid.TryParse(sub, out var id)) return id;
        return Guid.Empty;
    }

    [HttpPost("sessions/open")]
    [Authorize]
    public async Task<ActionResult<TableSessionDetailDto>> OpenSession([FromBody] OpenSessionRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        var session = await orders.OpenSessionAsync(request, userId != Guid.Empty ? userId : null, ct);
        return Ok(session);
    }

    [HttpGet("sessions/by-table/{tableId:guid}")]
    [Authorize]
    public async Task<ActionResult<TableSessionDetailDto>> GetActiveSessionByTable(Guid tableId, CancellationToken ct)
    {
        var session = await orders.GetActiveSessionByTableAsync(tableId, ct);
        if (session == null) return NotFound(new { message = "Bàn hiện chưa có phiên phục vụ đang mở." });
        return Ok(session);
    }

    [HttpGet("sessions/{sessionId:guid}")]
    [Authorize]
    public async Task<ActionResult<TableSessionDetailDto>> GetSession(Guid sessionId, CancellationToken ct)
    {
        var session = await orders.GetSessionByIdAsync(sessionId, ct);
        return session is null ? NotFound(new { message = "Không tìm thấy phiên bàn." }) : Ok(session);
    }

    [HttpPost("sessions/{sessionId:guid}/close")]
    [Authorize]
    public async Task<IActionResult> CloseSession(Guid sessionId, CancellationToken ct)
    {
        var userId = GetUserId();
        var success = await orders.CloseSessionAsync(sessionId, userId, ct);
        if (!success) return NotFound(new { message = "Không tìm thấy phiên bàn cần đóng." });
        await hub.Clients.All.SendAsync("session.closed", sessionId, ct);
        return Ok(new { success = true, message = "Đã đóng phiên bàn thành công." });
    }

    [HttpPost("staff")]
    [Authorize]
    public async Task<ActionResult<OrderTicketDto>> StaffOrder([FromBody] StaffPlaceOrderRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        var ticket = await orders.PlaceStaffOrderAsync(request, userId, ct);
        await hub.Clients.All.SendAsync("order.created", ticket, ct);
        return Ok(ticket);
    }

    // ==========================================
    // QR GUEST ENDPOINTS (STT 22, 23, 24, 25, 27, 28)
    // ==========================================

    [HttpGet("qr/info")]
    [AllowAnonymous]
    public async Task<ActionResult<QrTableInfoDto>> GetQrInfo([FromQuery] string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { message = "Thiếu mã QR Token của bàn." });

        try
        {
            var info = await orders.GetQrTableInfoAsync(token.Trim(), ct);
            return Ok(info);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("qr/session")]
    [AllowAnonymous]
    public async Task<ActionResult<TableSessionDetailDto>> GetQrSession([FromQuery] string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { message = "Thiếu mã QR Token của bàn." });

        var session = await orders.GetQrSessionStatusAsync(token.Trim(), ct);
        return Ok(session);
    }

    [HttpPost("qr")]
    [AllowAnonymous]
    public async Task<ActionResult<OrderTicketDto>> QrOrder([FromBody] QrPlaceOrderRequest request, CancellationToken ct)
    {
        try
        {
            var ticket = await orders.PlaceQrOrderAsync(request, ct);
            // Notify staff dashboard and KDS
            await hub.Clients.All.SendAsync("order.pending_confirm", ticket, ct);
            return Ok(ticket);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("qr/{ticketId:guid}/confirm")]
    [Authorize]
    public async Task<IActionResult> ConfirmQr(Guid ticketId, CancellationToken ct)
    {
        var userId = GetUserId();
        await orders.ConfirmQrTicketAsync(ticketId, userId, ct);
        await hub.Clients.All.SendAsync("order.confirmed", ticketId, ct);
        return NoContent();
    }

    [HttpPost("qr/{ticketId:guid}/reject")]
    [Authorize]
    public async Task<IActionResult> RejectQr(Guid ticketId, [FromBody] RejectQrTicketRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        await orders.RejectQrTicketAsync(ticketId, request.Reason, userId, ct);
        await hub.Clients.All.SendAsync("order.rejected", new { ticketId, reason = request.Reason }, ct);
        return NoContent();
    }

    // STT 27: Gọi nhân viên
    [HttpPost("qr/call-staff")]
    [AllowAnonymous]
    public async Task<ActionResult<TableNotificationDto>> CallStaff([FromBody] CallStaffRequest request, CancellationToken ct)
    {
        try
        {
            var notification = await orders.CallStaffAsync(request, ct);
            await hub.Clients.All.SendAsync("staff.called", notification, ct);
            return Ok(notification);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // STT 28: Gọi thanh toán
    [HttpPost("qr/request-bill")]
    [AllowAnonymous]
    public async Task<ActionResult<TableNotificationDto>> RequestBill([FromBody] RequestBillRequest request, CancellationToken ct)
    {
        try
        {
            var notification = await orders.RequestBillAsync(request, ct);
            await hub.Clients.All.SendAsync("bill.requested", notification, ct);
            return Ok(notification);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // STT 95: Danh sách thông báo realtime tại chi nhánh
    [HttpGet("notifications")]
    [Authorize]
    public async Task<ActionResult<List<TableNotificationDto>>> GetNotifications([FromQuery] Guid branchId, CancellationToken ct)
    {
        var list = await orders.GetActiveNotificationsAsync(branchId, ct);
        return Ok(list);
    }

    [HttpPost("notifications/{notificationId:guid}/dismiss")]
    [Authorize]
    public async Task<IActionResult> DismissNotification(Guid notificationId, CancellationToken ct)
    {
        var userId = GetUserId();
        await orders.DismissNotificationAsync(notificationId, userId, ct);
        await hub.Clients.All.SendAsync("notification.dismissed", notificationId, ct);
        return NoContent();
    }
}
