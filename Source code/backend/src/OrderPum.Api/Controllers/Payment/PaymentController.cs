using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderPum.Application.DTOs.Payment;
using OrderPum.Application.Interfaces.Services.Payment;

namespace OrderPum.Api.Controllers.Payment;

[ApiController]
[Route("api/payment")]
[Authorize]
public class PaymentController(IPaymentService paymentService) : ControllerBase
{
    private Guid? GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (Guid.TryParse(sub, out var guid)) return guid;
        return null;
    }

    [HttpPost("invoices/session")]
    public async Task<ActionResult<InvoiceDto>> CreateInvoiceFromSession(
        [FromBody] CreateInvoiceRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var userId = GetUserId();
            var result = await paymentService.CreateInvoiceFromSessionAsync(request, userId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("invoices/merge")]
    public async Task<ActionResult<InvoiceDto>> MergeTablesInvoice(
        [FromBody] MergeTablesInvoiceRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var userId = GetUserId();
            var result = await paymentService.MergeTablesInvoiceAsync(request, userId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("invoices/{invoiceId:guid}")]
    public async Task<ActionResult<InvoiceDto>> GetInvoice(
        Guid invoiceId,
        CancellationToken ct = default)
    {
        var result = await paymentService.GetInvoiceByIdAsync(invoiceId, ct);
        if (result is null) return NotFound(new { message = "Không tìm thấy hóa đơn." });
        return Ok(result);
    }

    [HttpGet("invoices")]
    public async Task<ActionResult<List<InvoiceDto>>> GetInvoices(
        [FromQuery] Guid branchId,
        [FromQuery] string? status = null,
        [FromQuery] DateTime? date = null,
        CancellationToken ct = default)
    {
        if (branchId == Guid.Empty)
            return BadRequest(new { message = "Chi nhánh không hợp lệ." });

        try
        {
            var result = await paymentService.GetInvoicesByBranchAsync(branchId, status, date, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("invoices/settle")]
    public async Task<ActionResult<InvoiceDto>> SettlePayment(
        [FromBody] SettlePaymentRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var userId = GetUserId();
            var result = await paymentService.SettlePaymentAsync(request, userId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("invoices/{invoiceId:guid}/vietqr")]
    public async Task<ActionResult<VietQrInfoDto>> GenerateVietQr(
        Guid invoiceId,
        CancellationToken ct = default)
    {
        try
        {
            var result = await paymentService.GenerateVietQrAsync(invoiceId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
