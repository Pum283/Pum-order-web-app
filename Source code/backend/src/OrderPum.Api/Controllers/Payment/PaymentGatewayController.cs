using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderPum.Application.DTOs.Payment;
using OrderPum.Application.Interfaces.Services.Payment;

namespace OrderPum.Api.Controllers.Payment;

[ApiController]
[Route("api/payment-gateways")]
public class PaymentGatewayController(IPaymentGatewayService gatewayService) : ControllerBase
{
    [HttpGet("configs")]
    [Authorize]
    public async Task<ActionResult<List<PaymentGatewayConfigDto>>> GetConfigs(
        [FromQuery] Guid? branchId = null,
        CancellationToken ct = default)
    {
        try
        {
            var result = await gatewayService.GetGatewayConfigsAsync(branchId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("configs")]
    [Authorize]
    public async Task<ActionResult<PaymentGatewayConfigDto>> SaveConfig(
        [FromBody] SavePaymentGatewayConfigRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var result = await gatewayService.SaveGatewayConfigAsync(request, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("vnpay/create-payment-url")]
    [AllowAnonymous]
    public async Task<ActionResult<GatewayPaymentUrlResultDto>> CreateVNPayUrl(
        [FromBody] CreateGatewayPaymentUrlRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var result = await gatewayService.CreateVNPayPaymentUrlAsync(
                request.InvoiceId,
                clientIp,
                request.ReturnUrl,
                request.BankCode,
                ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("vnpay/callback")]
    [AllowAnonymous]
    public async Task<ActionResult<GatewayCallbackResultDto>> VNPayCallback(CancellationToken ct = default)
    {
        var dict = Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString());
        var result = await gatewayService.ProcessVNPayCallbackAsync(dict, isIpn: false, ct);
        return Ok(result);
    }

    [HttpGet("vnpay/ipn")]
    [HttpPost("vnpay/ipn")]
    [AllowAnonymous]
    public async Task<IActionResult> VNPayIpn(CancellationToken ct = default)
    {
        var dict = Request.Query.Count > 0
            ? Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString())
            : Request.HasFormContentType
                ? Request.Form.ToDictionary(f => f.Key, f => f.Value.ToString())
                : new Dictionary<string, string>();

        var result = await gatewayService.ProcessVNPayCallbackAsync(dict, isIpn: true, ct);
        
        // VNPay IPN requires RspCode and Message in specific JSON format
        return Ok(new { RspCode = result.RspCode, Message = result.Message });
    }

    [HttpPost("momo/create-payment-url")]
    [AllowAnonymous]
    public async Task<ActionResult<GatewayPaymentUrlResultDto>> CreateMoMoUrl(
        [FromBody] CreateGatewayPaymentUrlRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var result = await gatewayService.CreateMoMoPaymentUrlAsync(
                request.InvoiceId,
                request.ReturnUrl,
                ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("momo/callback")]
    [HttpPost("momo/ipn")]
    [AllowAnonymous]
    public async Task<ActionResult<GatewayCallbackResultDto>> MoMoCallback(CancellationToken ct = default)
    {
        var dict = Request.Query.Count > 0
            ? Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString())
            : Request.HasFormContentType
                ? Request.Form.ToDictionary(f => f.Key, f => f.Value.ToString())
                : new Dictionary<string, string>();

        var result = await gatewayService.ProcessMoMoCallbackAsync(dict, isIpn: true, ct);
        return Ok(result);
    }
}
