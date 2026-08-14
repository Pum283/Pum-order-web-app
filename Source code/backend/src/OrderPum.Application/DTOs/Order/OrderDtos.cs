namespace OrderPum.Application.DTOs.Order;

public class OpenSessionRequest
{
    public Guid TableId { get; set; }
    public int GuestCount { get; set; } = 1;
}

public class StaffOrderSelectedOption
{
    public Guid? OptionId { get; set; }
    public string OptionName { get; set; } = string.Empty;
    public Guid? ValueId { get; set; }
    public string ValueName { get; set; } = string.Empty;
    public decimal ExtraPrice { get; set; } = 0;
}

public class StaffOrderLineRequest
{
    public Guid MenuItemId { get; set; }
    public int Quantity { get; set; } = 1;
    public string? Note { get; set; }
    public List<StaffOrderSelectedOption> SelectedOptions { get; set; } = [];
}

public class StaffPlaceOrderRequest
{
    public Guid SessionId { get; set; }
    public string? Note { get; set; }
    public List<StaffOrderLineRequest> Lines { get; set; } = [];
}

public class QrPlaceOrderRequest
{
    public string TableQrToken { get; set; } = string.Empty;
    public string? Note { get; set; }
    public List<StaffOrderLineRequest> Lines { get; set; } = [];
}

public class OrderLineDto
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid MenuItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice => UnitPrice * Quantity;
    public string? SelectedOptionsText { get; set; }
    public string? Note { get; set; }
    public string KitchenStation { get; set; } = "Kitchen";
    public string Status { get; set; } = "SentToKitchen";
}

public class OrderTicketDto
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public int TicketNumber { get; set; }
    public string Source { get; set; } = "StaffAssisted"; // StaffAssisted, CustomerQr
    public string? CreatedByUserName { get; set; }
    public string? Note { get; set; }
    public DateTime OrderedAt { get; set; }
    public List<OrderLineDto> Lines { get; set; } = [];
    public decimal TicketTotal => Lines.Sum(l => l.TotalPrice);
}

public class TableSessionDetailDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public Guid TableId { get; set; }
    public string TableCode { get; set; } = string.Empty;
    public string TableName { get; set; } = string.Empty;
    public string AreaName { get; set; } = string.Empty;
    public string SessionCode { get; set; } = string.Empty;
    public int GuestCount { get; set; } = 1;
    public string Status { get; set; } = "Open";
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public List<OrderTicketDto> Tickets { get; set; } = [];
    public decimal TotalAmount => Tickets.Sum(t => t.TicketTotal);
    public int TotalItemsCount => Tickets.Sum(t => t.Lines.Sum(l => l.Quantity));
}
