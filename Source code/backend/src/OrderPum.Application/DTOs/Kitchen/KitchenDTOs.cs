namespace OrderPum.Application.DTOs.Kitchen;

public class KitchenOrderLineDto
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid SessionId { get; set; }
    public Guid MenuItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string? SelectedOptionsText { get; set; }
    public string? Note { get; set; }
    public string KitchenStation { get; set; } = "Kitchen"; // Kitchen, Bar, Pastry
    public string Status { get; set; } = "SentToKitchen"; // SentToKitchen, Preparing, Ready, Served, Cancelled
    public int PreparationMinutes { get; set; } = 15;
    public DateTime? ReadyAt { get; set; }
    public DateTime? ServedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ElapsedMinutes { get; set; }
}

public class KitchenOrderTicketDto
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public string SessionCode { get; set; } = string.Empty;
    public Guid BranchId { get; set; }
    public Guid TableId { get; set; }
    public string TableCode { get; set; } = string.Empty;
    public string TableName { get; set; } = string.Empty;
    public string AreaName { get; set; } = string.Empty;
    public int GuestCount { get; set; } = 1;
    public int TicketNumber { get; set; } = 1;
    public string Source { get; set; } = "StaffAssisted"; // StaffAssisted, CustomerQr
    public string? CreatedByUserName { get; set; }
    public string? Note { get; set; }
    public DateTime OrderedAt { get; set; }
    public int ElapsedMinutes { get; set; }
    public string UrgencyLevel { get; set; } = "Normal"; // Normal (<7m), Warning (7-15m), Critical (>15m)
    public List<KitchenOrderLineDto> Lines { get; set; } = [];
}

public class UpdateLineStatusRequest
{
    public string NewStatus { get; set; } = string.Empty; // Preparing, Ready, Served, Cancelled
    public string? CancelReason { get; set; }
}

public class UpdateTicketStatusRequest
{
    public string NewStatus { get; set; } = string.Empty; // Preparing, Ready, Served
}

public class KitchenStatsDto
{
    public int PendingCount { get; set; }
    public int PreparingCount { get; set; }
    public int ReadyCount { get; set; }
    public int ServedTodayCount { get; set; }
    public double AvgPreparationMinutes { get; set; }
}

public class KitchenAggregateItemDto
{
    public Guid MenuItemId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string KitchenStation { get; set; } = "Kitchen";
    public int TotalQuantity { get; set; }
    public int PendingQuantity { get; set; }
    public int PreparingQuantity { get; set; }
    public List<KitchenAggregateTableDetailDto> TableDetails { get; set; } = [];
}

public class KitchenAggregateTableDetailDto
{
    public Guid LineId { get; set; }
    public string TableCode { get; set; } = string.Empty;
    public string TableName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? SelectedOptionsText { get; set; }
    public string? Note { get; set; }
    public string Status { get; set; } = "SentToKitchen";
    public int ElapsedMinutes { get; set; }
}
