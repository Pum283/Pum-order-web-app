using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using OrderPum.Api.Hubs;
using OrderPum.Application.DTOs.Kitchen;
using OrderPum.Application.Interfaces.Services.Kitchen;

namespace OrderPum.Api.Controllers.Kitchen;

[ApiController]
[Route("api/kitchen")]
[Authorize]
public class KitchenController(IKitchenService kitchenService, IHubContext<OrderHub> hub) : ControllerBase
{
    private Guid? GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (Guid.TryParse(sub, out var guid)) return guid;
        return null;
    }

    [HttpGet("orders")]
    public async Task<ActionResult<List<KitchenOrderTicketDto>>> GetOrders(
        [FromQuery] Guid branchId,
        [FromQuery] string? station = null,
        [FromQuery] string? status = null,
        CancellationToken ct = default)
    {
        if (branchId == Guid.Empty)
            return BadRequest(new { message = "Chi nhánh không hợp lệ." });

        try
        {
            var result = await kitchenService.GetActiveKitchenTicketsAsync(branchId, station, status, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("aggregate")]
    public async Task<ActionResult<List<KitchenAggregateItemDto>>> GetAggregate(
        [FromQuery] Guid branchId,
        [FromQuery] string? station = null,
        CancellationToken ct = default)
    {
        if (branchId == Guid.Empty)
            return BadRequest(new { message = "Chi nhánh không hợp lệ." });

        try
        {
            var result = await kitchenService.GetAggregateItemsAsync(branchId, station, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<ActionResult<KitchenStatsDto>> GetStats(
        [FromQuery] Guid branchId,
        CancellationToken ct = default)
    {
        if (branchId == Guid.Empty)
            return BadRequest(new { message = "Chi nhánh không hợp lệ." });

        try
        {
            var result = await kitchenService.GetKitchenStatsAsync(branchId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("lines/{lineId:guid}/status")]
    public async Task<ActionResult<KitchenOrderLineDto>> UpdateLineStatus(
        Guid lineId,
        [FromBody] UpdateLineStatusRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var userId = GetUserId();
            var result = await kitchenService.UpdateLineStatusAsync(lineId, request, userId, ct);
            await hub.Clients.All.SendAsync("kitchen.updated", new { lineId, status = request.NewStatus }, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("tickets/{ticketId:guid}/status")]
    public async Task<IActionResult> UpdateTicketStatus(
        Guid ticketId,
        [FromBody] UpdateTicketStatusRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var userId = GetUserId();
            var success = await kitchenService.UpdateTicketStatusAsync(ticketId, request, userId, ct);
            await hub.Clients.All.SendAsync("kitchen.updated", new { ticketId, status = request.NewStatus }, ct);
            return Ok(new { success, message = "Đã cập nhật trạng thái toàn bộ món trong order." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
