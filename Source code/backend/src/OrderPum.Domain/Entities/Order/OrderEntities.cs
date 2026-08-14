using OrderPum.Domain.Base;
using OrderPum.Domain.Enums.Order;

namespace OrderPum.Domain.Entities.Order;

public class TableSession : EntityBase
{
    public Guid BranchId { get; set; }
    public Guid TableId { get; set; }
    public string SessionCode { get; set; } = string.Empty;
    public int GuestCount { get; set; } = 1;
    public Guid? OpenedByUserId { get; set; }
    public TableSessionStatus Status { get; set; } = TableSessionStatus.Open;
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
}

public class OrderTicket : EntityBase
{
    public Guid SessionId { get; set; }
    public int TicketNumber { get; set; } = 1;
    public OrderSource Source { get; set; } = OrderSource.StaffAssisted;
    public Guid? CreatedByUserId { get; set; }
    public string? Note { get; set; }
    public DateTime OrderedAt { get; set; } = DateTime.UtcNow;
}

public class OrderLine : EntityBase
{
    public Guid TicketId { get; set; }
    public Guid SessionId { get; set; }
    public Guid MenuItemId { get; set; }
    public string ItemCodeSnapshot { get; set; } = string.Empty;
    public string ItemNameSnapshot { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
    public string? SelectedOptionsText { get; set; } // Snapshot chi tiết options/topping (VD: Size L, Trân châu hoàng kim...)
    public string? Note { get; set; }
    public string KitchenStation { get; set; } = "Kitchen"; // Kitchen, Bar, Pastry
    public OrderItemStatus Status { get; set; } = OrderItemStatus.SentToKitchen;
    public DateTime? ReadyAt { get; set; }
    public DateTime? ServedAt { get; set; }
}
