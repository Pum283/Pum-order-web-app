using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderPum.Application.DTOs.Report;
using OrderPum.Application.Interfaces.Services.Report;

namespace OrderPum.Api.Controllers.Report;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportController(IReportService reportService) : ControllerBase
{
    [HttpGet("revenue")]
    public async Task<ActionResult<RevenueReportResponseDto>> GetRevenueReport(
        [FromQuery] Guid? branchId = null,
        [FromQuery] string preset = "Today",
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken ct = default)
    {
        try
        {
            var req = new GetRevenueReportRequest
            {
                BranchId = branchId,
                Preset = preset,
                FromDate = fromDate,
                ToDate = toDate
            };
            var result = await reportService.GetRevenueReportAsync(req, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("top-items")]
    public async Task<ActionResult<List<TopSellingItemDto>>> GetTopItems(
        [FromQuery] Guid? branchId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int top = 10,
        CancellationToken ct = default)
    {
        try
        {
            var result = await reportService.GetTopSellingItemsAsync(branchId, fromDate, toDate, top, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("payment-methods")]
    public async Task<ActionResult<List<PaymentMethodRevenueDto>>> GetPaymentMethods(
        [FromQuery] Guid? branchId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken ct = default)
    {
        try
        {
            var result = await reportService.GetPaymentMethodRevenueAsync(branchId, fromDate, toDate, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("branch-comparison")]
    public async Task<ActionResult<List<BranchRevenueDto>>> GetBranchComparison(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken ct = default)
    {
        try
        {
            var result = await reportService.GetBranchRevenuesAsync(fromDate, toDate, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
