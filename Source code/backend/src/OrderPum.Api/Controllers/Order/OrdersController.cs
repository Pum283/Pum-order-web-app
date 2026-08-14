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
    [HttpPost("sessions/open")]
    [Authorize]
    public async Task<ActionResult<SessionDto>> OpenSession([FromBody] OpenSessionRequest request, CancellationToken ct)
        => Ok(await orders.OpenSessionAsync(request, GetUserId(), ct));

    [HttpPost("staff")]
    [Authorize]
    public async Task<ActionResult<OrderTicketDto>> StaffOrder([FromBody] StaffPlaceOrderRequest request, CancellationToken ct)
    {
        var ticket = await orders.PlaceStaffOrderAsync(request, GetUserId(), ct);
        await hub.Clients.All.SendAsync("order.created", ticket, ct);
        return Ok(ticket);
    }

    [HttpPost("qr")]
    [AllowAnonymous]
    public async Task<ActionResult<OrderTicketDto>> QrOrder([FromBody] QrPlaceOrderRequest request, CancellationToken ct)
    {
        var ticket = await orders.PlaceQrOrderAsync(request, ct);
        await hub.Clients.All.SendAsync("order.pending_confirm", ticket, ct);
        return Ok(ticket);
    }

    [HttpPost("qr/{ticketId:guid}/confirm")]
    [Authorize]
    public async Task<IActionResult> ConfirmQr(Guid ticketId, CancellationToken ct)
    {
        await orders.ConfirmQrTicketAsync(ticketId, GetUserId(), ct);
        await hub.Clients.All.SendAsync("order.confirmed", ticketId, ct);
        return NoContent();
    }

    [HttpGet("sessions/{sessionId:guid}")]
    [Authorize]
    public async Task<ActionResult<SessionDto>> GetSession(Guid sessionId, CancellationToken ct)
    {
        var session = await orders.GetSessionAsync(sessionId, ct);
        return session is null ? NotFound() : Ok(session);
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.Parse(sub!);
    }
}
