namespace OrderPum.Application.DTOs.Report;

public class GetRevenueReportRequest
{
    public Guid? BranchId { get; set; }
    public string Preset { get; set; } = "Today"; // Today, Yesterday, ThisWeek, ThisMonth, LastMonth, Custom
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

public class TimeRevenuePointDto
{
    public string Label { get; set; } = string.Empty; // e.g. "08:00", "17/08", "Tuần 32", "Tháng 08"
    public string Date { get; set; } = string.Empty; // YYYY-MM-DD
    public decimal Revenue { get; set; }
    public decimal GrossSales { get; set; }
    public decimal Discount { get; set; }
    public int InvoiceCount { get; set; }
}

public class BranchRevenueDto
{
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string BranchCode { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int InvoiceCount { get; set; }
    public decimal AverageOrderValue { get; set; }
    public decimal RevenuePercentage { get; set; }
}

public class PaymentMethodRevenueDto
{
    public string PaymentMethod { get; set; } = string.Empty; // Cash, BankTransfer, VNPay, MoMo, CardPos, EWallet
    public string DisplayName { get; set; } = string.Empty; // Tiền mặt, VietQR, VNPay, MoMo, Thẻ POS...
    public decimal TotalAmount { get; set; }
    public int TransactionCount { get; set; }
    public decimal Percentage { get; set; }
    public string ColorHex { get; set; } = "#10b981";
}

public class TopSellingItemDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal Percentage { get; set; }
}

public class RevenueOverviewSummaryDto
{
    public decimal TotalRevenue { get; set; } // Doanh thu thực thu
    public decimal TotalGrossSales { get; set; } // Tạm tính món
    public decimal TotalDiscount { get; set; } // Giảm giá / KM
    public decimal TotalTax { get; set; } // Thuế VAT
    public decimal TotalServiceCharge { get; set; } // Phí phục vụ
    public int TotalInvoicesCount { get; set; }
    public decimal AverageOrderValue { get; set; } // AOV
    public decimal PreviousPeriodRevenue { get; set; } // Doanh thu kỳ trước để so sánh
    public decimal GrowthRate { get; set; } // % tăng trưởng
}

public class RevenueReportResponseDto
{
    public Guid? BranchId { get; set; }
    public string BranchName { get; set; } = "Toàn chuỗi";
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public string Preset { get; set; } = "Today";

    public RevenueOverviewSummaryDto Summary { get; set; } = new();
    public List<TimeRevenuePointDto> Timeline { get; set; } = [];
    public List<PaymentMethodRevenueDto> PaymentMethods { get; set; } = [];
    public List<TopSellingItemDto> TopSellingItems { get; set; } = [];
    public List<BranchRevenueDto> BranchRevenues { get; set; } = [];
}
