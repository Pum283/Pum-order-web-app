using Microsoft.EntityFrameworkCore;
using OrderPum.Application.DTOs.Report;
using OrderPum.Application.Interfaces.Services.Report;
using OrderPum.Infrastructure.Persistence;

namespace OrderPum.Infrastructure.Implementations.Services.Report;

public class ReportService(AppDbContext db) : IReportService
{
    public async Task<RevenueReportResponseDto> GetRevenueReportAsync(
        GetRevenueReportRequest request,
        CancellationToken ct = default)
    {
        var (startUtc, endUtc, prevStartUtc, prevEndUtc) = ResolveDateRange(request);

        var branch = request.BranchId.HasValue && request.BranchId.Value != Guid.Empty
            ? await db.Branches.FirstOrDefaultAsync(b => b.Id == request.BranchId.Value && !b.IsDeleted, ct)
            : null;

        var query = db.Invoices
            .Where(i => !i.IsDeleted && i.PaymentStatus == "Paid" && i.CreatedAt >= startUtc && i.CreatedAt <= endUtc);

        if (branch != null)
        {
            query = query.Where(i => i.BranchId == branch.Id);
        }

        var paidInvoices = await query.ToListAsync(ct);

        // Previous Period Query for Growth Rate
        var prevQuery = db.Invoices
            .Where(i => !i.IsDeleted && i.PaymentStatus == "Paid" && i.CreatedAt >= prevStartUtc && i.CreatedAt <= prevEndUtc);

        if (branch != null)
        {
            prevQuery = prevQuery.Where(i => i.BranchId == branch.Id);
        }

        var prevRevenue = await prevQuery.SumAsync(i => (decimal?)i.FinalAmount, ct) ?? 0;

        // Calculate Summary Totals
        var totalRevenue = paidInvoices.Sum(i => i.FinalAmount);
        var totalGross = paidInvoices.Sum(i => i.SubTotalAmount);
        var totalDiscount = paidInvoices.Sum(i => i.DiscountAmount);
        var totalTax = paidInvoices.Sum(i => i.TaxAmount);
        var totalServiceCharge = paidInvoices.Sum(i => i.ServiceChargeAmount);
        var totalInvoicesCount = paidInvoices.Count;
        var aov = totalInvoicesCount > 0 ? Math.Round(totalRevenue / totalInvoicesCount, 0) : 0;
        var growthRate = prevRevenue > 0
            ? Math.Round(((totalRevenue - prevRevenue) / prevRevenue) * 100, 1)
            : 0;

        var summary = new RevenueOverviewSummaryDto
        {
            TotalRevenue = totalRevenue,
            TotalGrossSales = totalGross,
            TotalDiscount = totalDiscount,
            TotalTax = totalTax,
            TotalServiceCharge = totalServiceCharge,
            TotalInvoicesCount = totalInvoicesCount,
            AverageOrderValue = aov,
            PreviousPeriodRevenue = prevRevenue,
            GrowthRate = growthRate
        };

        // Timeline Points
        var timeline = BuildTimeline(paidInvoices, startUtc, endUtc, request.Preset);

        // Payment Methods Breakdown
        var paymentMethods = await GetPaymentMethodRevenueAsync(branch?.Id, startUtc, endUtc, ct);

        // Top Selling Items
        var topItems = await GetTopSellingItemsAsync(branch?.Id, startUtc, endUtc, 10, ct);

        // Branch Revenues Comparison
        var branchRevenues = await GetBranchRevenuesAsync(startUtc, endUtc, ct);

        return new RevenueReportResponseDto
        {
            BranchId = branch?.Id,
            BranchName = branch?.Name ?? "Toàn chuỗi nhà hàng",
            FromDate = startUtc,
            ToDate = endUtc,
            Preset = request.Preset,
            Summary = summary,
            Timeline = timeline,
            PaymentMethods = paymentMethods,
            TopSellingItems = topItems,
            BranchRevenues = branchRevenues
        };
    }

    public async Task<List<TopSellingItemDto>> GetTopSellingItemsAsync(
        Guid? branchId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int top = 10,
        CancellationToken ct = default)
    {
        var start = fromDate ?? DateTime.UtcNow.Date;
        var end = toDate ?? start.AddDays(1).AddTicks(-1);

        var query = db.Invoices
            .Where(i => !i.IsDeleted && i.PaymentStatus == "Paid" && i.CreatedAt >= start && i.CreatedAt <= end);

        if (branchId.HasValue && branchId.Value != Guid.Empty)
            query = query.Where(i => i.BranchId == branchId.Value);

        var invoiceIds = await query.Select(i => i.Id).ToListAsync(ct);

        if (invoiceIds.Count == 0) return [];

        var lines = await db.InvoiceLines
            .Where(l => invoiceIds.Contains(l.InvoiceId))
            .ToListAsync(ct);

        var menuItems = await db.MenuItems.ToListAsync(ct);
        var categories = await db.MenuCategories.ToListAsync(ct);

        var grouped = lines
            .GroupBy(l => l.MenuItemId)
            .Select(g =>
            {
                var menuItem = menuItems.FirstOrDefault(m => m.Id == g.Key);
                var category = menuItem != null ? categories.FirstOrDefault(c => c.Id == menuItem.CategoryId) : null;
                var totalQty = g.Sum(x => x.Quantity);
                var totalRev = g.Sum(x => x.TotalPrice);

                return new
                {
                    ProductId = g.Key,
                    ProductName = menuItem?.Name ?? g.First().ItemName,
                    CategoryName = category?.Name ?? "Thực đơn",
                    QuantitySold = totalQty,
                    TotalRevenue = totalRev
                };
            })
            .OrderByDescending(x => x.TotalRevenue)
            .Take(top)
            .ToList();

        var grandTotal = grouped.Sum(x => x.TotalRevenue);

        return grouped.Select(x => new TopSellingItemDto
        {
            ProductId = x.ProductId,
            ProductName = x.ProductName,
            CategoryName = x.CategoryName,
            QuantitySold = x.QuantitySold,
            TotalRevenue = x.TotalRevenue,
            Percentage = grandTotal > 0 ? Math.Round((x.TotalRevenue / grandTotal) * 100, 1) : 0
        }).ToList();
    }

    public async Task<List<PaymentMethodRevenueDto>> GetPaymentMethodRevenueAsync(
        Guid? branchId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken ct = default)
    {
        var start = fromDate ?? DateTime.UtcNow.Date;
        var end = toDate ?? start.AddDays(1).AddTicks(-1);

        var invQuery = db.Invoices
            .Where(i => !i.IsDeleted && i.PaymentStatus == "Paid" && i.CreatedAt >= start && i.CreatedAt <= end);

        if (branchId.HasValue && branchId.Value != Guid.Empty)
            invQuery = invQuery.Where(i => i.BranchId == branchId.Value);

        var invoiceIds = await invQuery.Select(i => i.Id).ToListAsync(ct);

        if (invoiceIds.Count == 0)
        {
            return
            [
                new() { PaymentMethod = "Cash", DisplayName = "Tiền mặt", TotalAmount = 0, TransactionCount = 0, Percentage = 0, ColorHex = "#10b981" },
                new() { PaymentMethod = "BankTransfer", DisplayName = "VietQR / Chuyển khoản", TotalAmount = 0, TransactionCount = 0, Percentage = 0, ColorHex = "#0ea5e9" },
                new() { PaymentMethod = "VNPay", DisplayName = "Cổng VNPay", TotalAmount = 0, TransactionCount = 0, Percentage = 0, ColorHex = "#38bdf8" },
                new() { PaymentMethod = "MoMo", DisplayName = "Ví MoMo", TotalAmount = 0, TransactionCount = 0, Percentage = 0, ColorHex = "#ec4899" }
            ];
        }

        var payments = await db.Payments
            .Where(p => invoiceIds.Contains(p.InvoiceId) && p.Status == "Success")
            .ToListAsync(ct);

        var grandTotal = payments.Sum(p => p.Amount);
        if (grandTotal <= 0) grandTotal = 1;

        var colorMap = new Dictionary<string, (string Name, string Color)>
        {
            ["Cash"] = ("Tiền mặt", "#10b981"),
            ["BankTransfer"] = ("VietQR / Chuyển khoản", "#0ea5e9"),
            ["VNPay"] = ("Cổng VNPay", "#38bdf8"),
            ["MoMo"] = ("Ví MoMo", "#ec4899"),
            ["CardPos"] = ("Thẻ POS", "#a855f7"),
            ["EWallet"] = ("Ví ZaloPay", "#3b82f6")
        };

        var grouped = payments
            .GroupBy(p => p.PaymentMethod)
            .Select(g =>
            {
                var methodKey = g.Key;
                var info = colorMap.TryGetValue(methodKey, out var val) ? val : (methodKey, "#64748b");
                var total = g.Sum(p => p.Amount);

                return new PaymentMethodRevenueDto
                {
                    PaymentMethod = methodKey,
                    DisplayName = info.Item1,
                    TotalAmount = total,
                    TransactionCount = g.Count(),
                    Percentage = Math.Round((total / grandTotal) * 100, 1),
                    ColorHex = info.Item2
                };
            })
            .OrderByDescending(p => p.TotalAmount)
            .ToList();

        return grouped;
    }

    public async Task<List<BranchRevenueDto>> GetBranchRevenuesAsync(
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken ct = default)
    {
        var start = fromDate ?? DateTime.UtcNow.Date;
        var end = toDate ?? start.AddDays(1).AddTicks(-1);

        var branches = await db.Branches.Where(b => !b.IsDeleted).ToListAsync(ct);

        var invoices = await db.Invoices
            .Where(i => !i.IsDeleted && i.PaymentStatus == "Paid" && i.CreatedAt >= start && i.CreatedAt <= end)
            .ToListAsync(ct);

        var grandTotal = invoices.Sum(i => i.FinalAmount);
        if (grandTotal <= 0) grandTotal = 1;

        var result = new List<BranchRevenueDto>();

        foreach (var b in branches)
        {
            var branchInvoices = invoices.Where(i => i.BranchId == b.Id).ToList();
            var rev = branchInvoices.Sum(i => i.FinalAmount);
            var count = branchInvoices.Count;
            var aov = count > 0 ? Math.Round(rev / count, 0) : 0;

            result.Add(new BranchRevenueDto
            {
                BranchId = b.Id,
                BranchName = b.Name,
                BranchCode = b.Code,
                Revenue = rev,
                InvoiceCount = count,
                AverageOrderValue = aov,
                RevenuePercentage = Math.Round((rev / grandTotal) * 100, 1)
            });
        }

        return result.OrderByDescending(b => b.Revenue).ToList();
    }

    private static (DateTime Start, DateTime End, DateTime PrevStart, DateTime PrevEnd) ResolveDateRange(GetRevenueReportRequest req)
    {
        var now = DateTime.UtcNow;
        var today = now.Date;

        switch (req.Preset?.ToLowerInvariant())
        {
            case "yesterday":
                var yest = today.AddDays(-1);
                return (yest, yest.AddDays(1).AddTicks(-1), yest.AddDays(-1), yest.AddTicks(-1));

            case "thisweek":
                var diff = (int)today.DayOfWeek - (int)DayOfWeek.Monday;
                if (diff < 0) diff += 7;
                var mon = today.AddDays(-diff);
                var sun = mon.AddDays(7).AddTicks(-1);
                var prevMon = mon.AddDays(-7);
                var prevSun = mon.AddTicks(-1);
                return (mon, sun, prevMon, prevSun);

            case "thismonth":
                var firstDay = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                var lastDay = firstDay.AddMonths(1).AddTicks(-1);
                var prevFirstDay = firstDay.AddMonths(-1);
                var prevLastDay = firstDay.AddTicks(-1);
                return (firstDay, lastDay, prevFirstDay, prevLastDay);

            case "lastmonth":
                var lastMonthFirst = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-1);
                var lastMonthEnd = lastMonthFirst.AddMonths(1).AddTicks(-1);
                var twoMonthsAgoFirst = lastMonthFirst.AddMonths(-1);
                var twoMonthsAgoEnd = lastMonthFirst.AddTicks(-1);
                return (lastMonthFirst, lastMonthEnd, twoMonthsAgoFirst, twoMonthsAgoEnd);

            case "custom":
                if (req.FromDate.HasValue && req.ToDate.HasValue)
                {
                    var cStart = req.FromDate.Value.Date;
                    var cEnd = req.ToDate.Value.Date.AddDays(1).AddTicks(-1);
                    var duration = cEnd - cStart;
                    var pStart = cStart - duration;
                    var pEnd = cStart.AddTicks(-1);
                    return (cStart, cEnd, pStart, pEnd);
                }
                goto default;

            case "today":
            default:
                var start = today;
                var end = today.AddDays(1).AddTicks(-1);
                var pYesterday = today.AddDays(-1);
                var pYesterdayEnd = today.AddTicks(-1);
                return (start, end, pYesterday, pYesterdayEnd);
        }
    }

    private static List<TimeRevenuePointDto> BuildTimeline(
        List<Domain.Entities.Payment.Invoice> invoices,
        DateTime start,
        DateTime end,
        string preset)
    {
        var points = new List<TimeRevenuePointDto>();
        var totalDays = (end - start).TotalDays;

        if (totalDays <= 1.5) // Theo khung giờ trong ngày (Hôm nay / Hôm qua)
        {
            for (var hour = 6; hour <= 23; hour++)
            {
                var hourInvoices = invoices.Where(i => i.CreatedAt.ToLocalTime().Hour == hour).ToList();
                points.Add(new TimeRevenuePointDto
                {
                    Label = $"{hour:D2}:00",
                    Date = start.ToString("yyyy-MM-dd"),
                    Revenue = hourInvoices.Sum(i => i.FinalAmount),
                    GrossSales = hourInvoices.Sum(i => i.SubTotalAmount),
                    Discount = hourInvoices.Sum(i => i.DiscountAmount),
                    InvoiceCount = hourInvoices.Count
                });
            }
        }
        else // Theo từng ngày trong tuần / tháng
        {
            var cur = start.Date;
            var endDate = end.Date;
            while (cur <= endDate)
            {
                var next = cur.AddDays(1);
                var dayInvoices = invoices.Where(i => i.CreatedAt >= cur && i.CreatedAt < next).ToList();
                points.Add(new TimeRevenuePointDto
                {
                    Label = cur.ToString("dd/MM"),
                    Date = cur.ToString("yyyy-MM-dd"),
                    Revenue = dayInvoices.Sum(i => i.FinalAmount),
                    GrossSales = dayInvoices.Sum(i => i.SubTotalAmount),
                    Discount = dayInvoices.Sum(i => i.DiscountAmount),
                    InvoiceCount = dayInvoices.Count
                });
                cur = next;
            }
        }

        return points;
    }
}
