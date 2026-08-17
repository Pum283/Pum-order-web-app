using OrderPum.Domain.Base;

namespace OrderPum.Domain.Entities.Promo;

public class Promotion : EntityBase
{
    public Guid? BranchId { get; set; } // Null nếu áp dụng toàn hệ thống
    public string Code { get; set; } = string.Empty; // Mã voucher nhập vào (VD: SALE10, PUMOPEN), trống nếu tự động
    public string Name { get; set; } = string.Empty; // Tên chương trình (VD: Giảm 10% Khai Trương)
    public string? Description { get; set; }
    
    public string DiscountType { get; set; } = "Percent"; // Percent, FixedAmount, ItemDiscount
    public decimal DiscountValue { get; set; } // 10 (10%) hoặc 50000 (50,000đ)
    public decimal? MaxDiscountAmount { get; set; } // Số tiền giảm tối đa (với loại %)
    public decimal MinOrderAmount { get; set; } = 0; // Giá trị đơn hàng tối thiểu
    
    public string TargetType { get; set; } = "Invoice"; // Invoice (toàn đơn), Category (theo danh mục), MenuItem (theo món)
    public Guid? TargetId { get; set; } // CategoryId hoặc MenuItemId
    
    public bool IsAutoApply { get; set; } = false; // Tự động áp dụng không cần nhập mã (STT 71)
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int? UsageLimit { get; set; } // Tổng số lượt dùng tối đa
    public int UsedCount { get; set; } = 0; // Số lượt đã dùng
    
    public bool IsActive { get; set; } = true;
}
