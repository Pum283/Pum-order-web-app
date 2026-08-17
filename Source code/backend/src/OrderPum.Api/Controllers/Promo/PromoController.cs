using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderPum.Application.DTOs.Payment;
using OrderPum.Application.DTOs.Promo;
using OrderPum.Application.Interfaces.Services.Promo;

namespace OrderPum.Api.Controllers.Promo;

[ApiController]
[Route("api/promotions")]
[Authorize]
public class PromoController(IPromoService promoService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<PromotionDto>>> GetPromotions(
        [FromQuery] Guid? branchId = null,
        [FromQuery] bool activeOnly = false,
        CancellationToken ct = default)
    {
        try
        {
            var result = await promoService.GetPromotionsAsync(branchId, activeOnly, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PromotionDto>> GetPromotion(Guid id, CancellationToken ct = default)
    {
        var result = await promoService.GetPromotionByIdAsync(id, ct);
        if (result is null) return NotFound(new { message = "Không tìm thấy chương trình khuyến mãi." });
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<PromotionDto>> CreatePromotion(
        [FromBody] CreatePromotionRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var result = await promoService.CreatePromotionAsync(request, ct);
            return CreatedAtAction(nameof(GetPromotion), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PromotionDto>> UpdatePromotion(
        Guid id,
        [FromBody] UpdatePromotionRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var result = await promoService.UpdatePromotionAsync(id, request, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeletePromotion(Guid id, CancellationToken ct = default)
    {
        var success = await promoService.DeletePromotionAsync(id, ct);
        if (!success) return NotFound(new { message = "Không tìm thấy chương trình khuyến mãi." });
        return Ok(new { success = true, message = "Đã xóa chương trình khuyến mãi." });
    }

    [HttpPatch("{id:guid}/toggle")]
    public async Task<IActionResult> TogglePromotion(Guid id, CancellationToken ct = default)
    {
        try
        {
            var isActive = await promoService.TogglePromotionStatusAsync(id, ct);
            return Ok(new { isActive, message = isActive ? "Đã kích hoạt chương trình." : "Đã tạm dừng chương trình." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("validate")]
    public async Task<ActionResult<PromoCalculationResultDto>> ValidatePromo(
        [FromBody] ValidatePromoRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var result = await promoService.EvaluatePromoAsync(request, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("invoices/{invoiceId:guid}/apply")]
    public async Task<ActionResult<InvoiceDto>> ApplyPromoToInvoice(
        Guid invoiceId,
        [FromBody] ApplyPromoToInvoiceRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var result = await promoService.ApplyPromoToInvoiceAsync(invoiceId, request, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
