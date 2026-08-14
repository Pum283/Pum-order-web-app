using OrderPum.Domain.Base;
using OrderPum.Domain.Enums.Order;

namespace OrderPum.Domain.Entities.Order;

public class TableSession : EntityBase
{
    public Guid BranchId { get; set; }
    public Guid TableId { get; set; }
    public TableSessionStatus Status { get; set; } = TableSessionStatus.Open;
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
}

public class OrderTicket : EntityBase
{
    public Guid SessionId { get; set; }
    public OrderSource Source { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public DateTime OrderedAt { get; set; } = DateTime.UtcNow;
}

public class OrderLine : EntityBase
{
    public Guid TicketId { get; set; }
    public Guid MenuItemId { get; set; }
    public string ItemNameSnapshot { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
    public string? Note { get; set; }
    public OrderItemStatus Status { get; set; } = OrderItemStatus.SentToKitchen;
}
