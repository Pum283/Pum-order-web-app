namespace OrderPum.Domain.Enums.Order;

public enum OrderSource
{
    StaffAssisted = 1,
    CustomerQr = 2
}

public enum OrderItemStatus
{
    PendingConfirm = 0,
    SentToKitchen = 1,
    Preparing = 2,
    Ready = 3,
    Served = 4,
    Cancelled = 5
}

public enum TableSessionStatus
{
    Open = 1,
    Paying = 2,
    Closed = 3
}
