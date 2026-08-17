using Microsoft.EntityFrameworkCore;
using OrderPum.Application.DTOs.Menu;
using OrderPum.Application.DTOs.Order;
using OrderPum.Application.Interfaces.Services.Order;
using OrderPum.Domain.Entities.Order;
using OrderPum.Domain.Enums.Order;
using OrderPum.Infrastructure.Persistence;

namespace OrderPum.Infrastructure.Implementations.Services.Order;

public class OrderService(AppDbContext db) : IOrderService
{
    public async Task<TableSessionDetailDto> OpenSessionAsync(OpenSessionRequest request, Guid? staffUserId, CancellationToken ct = default)
    {
        var table = await db.Tables.FirstOrDefaultAsync(x => x.Id == request.TableId && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy bàn ăn.");

        var existing = await db.TableSessions
            .FirstOrDefaultAsync(x => x.TableId == table.Id && x.Status == TableSessionStatus.Open && !x.IsDeleted, ct);

        if (existing is not null)
        {
            return (await GetSessionByIdAsync(existing.Id, ct))!;
        }

        var sessionCode = $"SES-{DateTime.UtcNow:yyMMdd}-{new Random().Next(100, 999)}";
        var session = new TableSession
        {
            Id = Guid.NewGuid(),
            BranchId = table.BranchId,
            TableId = table.Id,
            SessionCode = sessionCode,
            GuestCount = request.GuestCount > 0 ? request.GuestCount : table.Capacity,
            OpenedByUserId = staffUserId,
            Status = TableSessionStatus.Open,
            OpenedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        table.Status = "Occupied";
        table.UpdatedAt = DateTime.UtcNow;

        db.TableSessions.Add(session);
        await db.SaveChangesAsync(ct);

        return (await GetSessionByIdAsync(session.Id, ct))!;
    }

    public async Task<TableSessionDetailDto?> GetActiveSessionByTableAsync(Guid tableId, CancellationToken ct = default)
    {
        var session = await db.TableSessions
            .FirstOrDefaultAsync(x => x.TableId == tableId && (x.Status == TableSessionStatus.Open || x.Status == TableSessionStatus.Paying) && !x.IsDeleted, ct);

        if (session is null) return null;

        return await GetSessionByIdAsync(session.Id, ct);
    }

    public async Task<TableSessionDetailDto?> GetSessionByIdAsync(Guid sessionId, CancellationToken ct = default)
    {
        var session = await db.TableSessions.FirstOrDefaultAsync(x => x.Id == sessionId && !x.IsDeleted, ct);
        if (session is null) return null;

        var table = await db.Tables.FirstOrDefaultAsync(t => t.Id == session.TableId, ct);
        var area = table != null ? await db.Areas.FirstOrDefaultAsync(a => a.Id == table.AreaId, ct) : null;
        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == session.BranchId, ct);

        var tickets = await db.OrderTickets
            .Where(x => x.SessionId == sessionId && !x.IsDeleted)
            .OrderBy(x => x.OrderedAt)
            .ToListAsync(ct);

        var ticketDtos = new List<OrderTicketDto>();
        foreach (var t in tickets)
        {
            var lines = await db.OrderLines.Where(x => x.TicketId == t.Id && !x.IsDeleted).ToListAsync(ct);
            string? staffName = null;
            if (t.CreatedByUserId.HasValue)
            {
                staffName = await db.Users
                    .Where(u => u.Id == t.CreatedByUserId.Value)
                    .Select(u => u.DisplayName)
                    .FirstOrDefaultAsync(ct);
            }

            ticketDtos.Add(new OrderTicketDto
            {
                Id = t.Id,
                SessionId = t.SessionId,
                TicketNumber = t.TicketNumber,
                Source = t.Source.ToString(),
                CreatedByUserName = staffName,
                Note = t.Note,
                OrderedAt = t.OrderedAt,
                Lines = lines.Select(l => new OrderLineDto
                {
                    Id = l.Id,
                    TicketId = l.TicketId,
                    MenuItemId = l.MenuItemId,
                    ItemCode = l.ItemCodeSnapshot,
                    ItemName = l.ItemNameSnapshot,
                    Quantity = l.Quantity,
                    UnitPrice = l.UnitPrice,
                    SelectedOptionsText = l.SelectedOptionsText,
                    Note = l.Note,
                    KitchenStation = l.KitchenStation,
                    Status = l.Status.ToString()
                }).ToList()
            });
        }

        return new TableSessionDetailDto
        {
            Id = session.Id,
            BranchId = session.BranchId,
            BranchName = branch?.Name ?? string.Empty,
            TableId = session.TableId,
            TableCode = table?.Code ?? string.Empty,
            TableName = table?.Name ?? table?.Code ?? string.Empty,
            AreaName = area?.Name ?? string.Empty,
            SessionCode = session.SessionCode,
            CustomerName = session.CustomerName,
            CustomerPhone = session.CustomerPhone,
            GuestCount = session.GuestCount,
            Status = session.Status.ToString(),
            OpenedAt = session.OpenedAt,
            ClosedAt = session.ClosedAt,
            Tickets = ticketDtos
        };
    }

    public async Task<OrderTicketDto> PlaceStaffOrderAsync(StaffPlaceOrderRequest request, Guid staffUserId, CancellationToken ct = default)
    {
        var session = await db.TableSessions.FirstOrDefaultAsync(x => x.Id == request.SessionId && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy phiên bàn.");

        if (session.Status == TableSessionStatus.Closed)
            throw new InvalidOperationException("Phiên bàn đã kết thúc.");

        if (!string.IsNullOrWhiteSpace(request.CustomerName))
            session.CustomerName = request.CustomerName.Trim();
        if (!string.IsNullOrWhiteSpace(request.CustomerPhone))
            session.CustomerPhone = request.CustomerPhone.Trim();

        var ticket = await CreateTicketAsync(session, OrderSource.StaffAssisted, staffUserId, request.CustomerName, request.CustomerPhone, request.Note, request.Lines, sendStraightToKitchen: true, ct);

        // Update table to Occupied
        var table = await db.Tables.FirstOrDefaultAsync(t => t.Id == session.TableId, ct);
        if (table != null && table.Status != "Occupied")
        {
            table.Status = "Occupied";
            table.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }

        return await MapTicketDtoAsync(ticket.Id, ct);
    }

    public async Task<OrderTicketDto> PlaceQrOrderAsync(QrPlaceOrderRequest request, CancellationToken ct = default)
    {
        var table = await db.Tables.FirstOrDefaultAsync(x => x.QrToken == request.TableQrToken && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Mã QR bàn không hợp lệ hoặc đã bị vô hiệu hóa.");

        var session = await db.TableSessions
            .FirstOrDefaultAsync(x => x.TableId == table.Id && (x.Status == TableSessionStatus.Open || x.Status == TableSessionStatus.Paying) && !x.IsDeleted, ct);

        if (session is null)
        {
            session = new TableSession
            {
                Id = Guid.NewGuid(),
                BranchId = table.BranchId,
                TableId = table.Id,
                SessionCode = $"SES-{DateTime.UtcNow:yyMMdd}-{new Random().Next(100, 999)}",
                GuestCount = table.Capacity,
                CustomerName = request.CustomerName?.Trim(),
                CustomerPhone = request.CustomerPhone?.Trim(),
                Status = TableSessionStatus.Open,
                OpenedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            db.TableSessions.Add(session);
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(request.CustomerName))
                session.CustomerName = request.CustomerName.Trim();
            if (!string.IsNullOrWhiteSpace(request.CustomerPhone))
                session.CustomerPhone = request.CustomerPhone.Trim();
        }

        if (table.Status != "Occupied")
        {
            table.Status = "Occupied";
            table.UpdatedAt = DateTime.UtcNow;
        }

        // QR Orders start with PendingConfirm (waiting for staff confirmation - STT 24)
        var ticket = await CreateTicketAsync(session, OrderSource.CustomerQr, null, request.CustomerName, request.CustomerPhone, request.Note, request.Lines, sendStraightToKitchen: false, ct);

        // Create Realtime Notification for Staff / POS (STT 24)
        var guestInfo = !string.IsNullOrWhiteSpace(request.CustomerName) ? $" ({request.CustomerName})" : "";
        var totalQty = request.Lines.Sum(l => l.Quantity > 0 ? l.Quantity : 1);
        var notif = new TableNotification
        {
            Id = Guid.NewGuid(),
            BranchId = table.BranchId,
            TableId = table.Id,
            SessionId = session.Id,
            Type = "NewQrOrder",
            Message = $"Bàn {table.Name} vừa gửi gọi {totalQty} món{guestInfo}. Cần xác nhận gửi bếp!",
            IsHandled = false,
            CreatedAt = DateTime.UtcNow
        };
        db.TableNotifications.Add(notif);
        await db.SaveChangesAsync(ct);

        return await MapTicketDtoAsync(ticket.Id, ct);
    }

    public async Task ConfirmQrTicketAsync(Guid ticketId, Guid staffUserId, CancellationToken ct = default)
    {
        var ticket = await db.OrderTickets.FirstOrDefaultAsync(x => x.Id == ticketId && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy đợt gọi món.");

        if (ticket.Source != OrderSource.CustomerQr)
            throw new InvalidOperationException("Chỉ xác nhận order từ khách QR.");

        var lines = await db.OrderLines.Where(x => x.TicketId == ticketId && !x.IsDeleted).ToListAsync(ct);
        foreach (var line in lines.Where(x => x.Status == OrderItemStatus.PendingConfirm))
        {
            line.Status = OrderItemStatus.SentToKitchen;
            line.UpdatedAt = DateTime.UtcNow;
        }

        // Auto-mark any unhandled NewQrOrder notifications for this session as handled
        var pendingNotifs = await db.TableNotifications
            .Where(n => n.SessionId == ticket.SessionId && n.Type == "NewQrOrder" && !n.IsHandled && !n.IsDeleted)
            .ToListAsync(ct);
        foreach (var n in pendingNotifs)
        {
            n.IsHandled = true;
            n.HandledByUserId = staffUserId;
            n.HandledAt = DateTime.UtcNow;
            n.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task RejectQrTicketAsync(Guid ticketId, string reason, Guid staffUserId, CancellationToken ct = default)
    {
        var ticket = await db.OrderTickets.FirstOrDefaultAsync(x => x.Id == ticketId && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy đợt gọi món.");

        ticket.Note = string.IsNullOrWhiteSpace(ticket.Note)
            ? $"[Từ chối bởi NV: {reason}]"
            : $"{ticket.Note} | [Từ chối: {reason}]";

        var lines = await db.OrderLines.Where(x => x.TicketId == ticketId && !x.IsDeleted).ToListAsync(ct);
        foreach (var line in lines.Where(x => x.Status == OrderItemStatus.PendingConfirm))
        {
            line.Status = OrderItemStatus.Cancelled;
            line.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task<bool> CloseSessionAsync(Guid sessionId, Guid staffUserId, CancellationToken ct = default)
    {
        var session = await db.TableSessions.FirstOrDefaultAsync(x => x.Id == sessionId && !x.IsDeleted, ct);
        if (session is null) return false;

        session.Status = TableSessionStatus.Closed;
        session.ClosedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        var table = await db.Tables.FirstOrDefaultAsync(t => t.Id == session.TableId, ct);
        if (table != null)
        {
            table.Status = "NeedsCleaning";
            table.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<QrTableInfoDto> GetQrTableInfoAsync(string qrToken, CancellationToken ct = default)
    {
        var table = await db.Tables.FirstOrDefaultAsync(x => x.QrToken == qrToken && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Mã QR không hợp lệ hoặc đã bị thay đổi. Vui lòng quét lại mã QR tại bàn.");

        var area = await db.Areas.FirstOrDefaultAsync(a => a.Id == table.AreaId, ct);
        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == table.BranchId, ct)
            ?? throw new InvalidOperationException("Không tìm thấy thông tin chi nhánh.");

        // Active Session
        var session = await GetActiveSessionByTableAsync(table.Id, ct);

        // Categories
        var categories = await db.MenuCategories
            .Where(c => c.BranchId == table.BranchId && c.IsActive && !c.IsDeleted)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new MenuCategoryDto
            {
                Id = c.Id,
                BranchId = c.BranchId,
                Code = c.Code,
                Name = c.Name,
                SortOrder = c.SortOrder,
                ImageUrl = c.ImageUrl,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync(ct);

        // Menu Items with Options and Values
        var menuItemsDb = await db.MenuItems
            .Include(m => m.Category)
            .Include(m => m.Options.OrderBy(o => o.SortOrder))
                .ThenInclude(o => o.Values.OrderBy(v => v.SortOrder))
            .Where(m => m.BranchId == table.BranchId && m.IsActive && m.IsAvailable && !m.Is86ed && !m.IsDeleted)
            .OrderBy(m => m.Category != null ? m.Category.SortOrder : 99)
            .ThenBy(m => m.Name)
            .ToListAsync(ct);

        var menuItemDtos = menuItemsDb.Select(m => new MenuItemDetailDto
        {
            Id = m.Id,
            BranchId = m.BranchId,
            CategoryId = m.CategoryId,
            CategoryName = m.Category?.Name ?? string.Empty,
            Code = m.Code,
            Name = m.Name,
            Description = m.Description,
            ImageUrl = m.ImageUrl,
            Price = m.Price,
            Unit = m.Unit,
            KitchenStation = m.KitchenStation,
            PreparationMinutes = m.PreparationMinutes,
            IsAvailable = m.IsAvailable,
            Is86ed = m.Is86ed,
            IsActive = m.IsActive,
            CreatedAt = m.CreatedAt,
            Options = m.Options.Where(o => !o.IsDeleted).Select(o => new MenuItemOptionDto
            {
                Id = o.Id,
                MenuItemId = o.MenuItemId,
                Name = o.Name,
                OptionType = o.OptionType,
                IsRequired = o.IsRequired,
                SortOrder = o.SortOrder,
                Values = o.Values.Where(v => !v.IsDeleted && v.IsAvailable).Select(v => new MenuItemOptionValueDto
                {
                    Id = v.Id,
                    OptionId = v.OptionId,
                    Name = v.Name,
                    ExtraPrice = v.ExtraPrice,
                    IsDefault = v.IsDefault,
                    IsAvailable = v.IsAvailable,
                    SortOrder = v.SortOrder
                }).ToList()
            }).ToList()
        }).ToList();

        return new QrTableInfoDto
        {
            TableId = table.Id,
            TableCode = table.Code,
            TableName = table.Name ?? table.Code,
            AreaName = area?.Name ?? string.Empty,
            Capacity = table.Capacity,
            QrToken = table.QrToken,
            BranchId = branch.Id,
            BranchName = branch.Name,
            BranchAddress = branch.Address ?? string.Empty,
            BranchPhone = branch.Phone ?? string.Empty,
            Currency = branch.Currency ?? "VND",
            TaxRatePercent = branch.TaxRatePercent,
            ServiceChargePercent = branch.ServiceChargePercent,
            IsTaxIncludedInPrice = branch.IsTaxIncludedInPrice,
            CurrentSession = session,
            Categories = categories,
            MenuItems = menuItemDtos
        };
    }

    public async Task<TableSessionDetailDto?> GetQrSessionStatusAsync(string qrToken, CancellationToken ct = default)
    {
        var table = await db.Tables.FirstOrDefaultAsync(x => x.QrToken == qrToken && !x.IsDeleted, ct);
        if (table is null) return null;

        return await GetActiveSessionByTableAsync(table.Id, ct);
    }

    public async Task<TableNotificationDto> CallStaffAsync(CallStaffRequest request, CancellationToken ct = default)
    {
        var table = await db.Tables.FirstOrDefaultAsync(x => x.QrToken == request.TableQrToken && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Mã QR không hợp lệ.");

        var area = await db.Areas.FirstOrDefaultAsync(a => a.Id == table.AreaId, ct);
        var session = await db.TableSessions.FirstOrDefaultAsync(s => s.TableId == table.Id && s.Status == TableSessionStatus.Open && !s.IsDeleted, ct);

        var msg = string.IsNullOrWhiteSpace(request.Reason) ? "Bàn yêu cầu nhân viên hỗ trợ" : request.Reason.Trim();

        var notification = new TableNotification
        {
            Id = Guid.NewGuid(),
            BranchId = table.BranchId,
            TableId = table.Id,
            SessionId = session?.Id,
            Type = "CallStaff",
            Message = msg,
            IsHandled = false,
            CreatedAt = DateTime.UtcNow
        };

        db.TableNotifications.Add(notification);
        await db.SaveChangesAsync(ct);

        return new TableNotificationDto
        {
            Id = notification.Id,
            BranchId = notification.BranchId,
            TableId = notification.TableId,
            TableCode = table.Code,
            TableName = table.Name ?? table.Code,
            AreaName = area?.Name ?? string.Empty,
            Type = notification.Type,
            Message = notification.Message,
            IsHandled = notification.IsHandled,
            CreatedAt = notification.CreatedAt
        };
    }

    public async Task<TableNotificationDto> RequestBillAsync(RequestBillRequest request, CancellationToken ct = default)
    {
        var table = await db.Tables.FirstOrDefaultAsync(x => x.QrToken == request.TableQrToken && !x.IsDeleted, ct)
            ?? throw new InvalidOperationException("Mã QR không hợp lệ.");

        var area = await db.Areas.FirstOrDefaultAsync(a => a.Id == table.AreaId, ct);
        var session = await db.TableSessions.FirstOrDefaultAsync(s => s.TableId == table.Id && s.Status == TableSessionStatus.Open && !s.IsDeleted, ct);

        if (session != null)
        {
            session.Status = TableSessionStatus.Paying;
            session.UpdatedAt = DateTime.UtcNow;
        }

        var methodLabel = request.PaymentMethod switch
        {
            "VietQr" => "Chuyển khoản VietQR",
            "Card" => "Thẻ / POS",
            _ => "Tiền mặt"
        };

        var msg = $"Khách yêu cầu tính tiền ({methodLabel}){(string.IsNullOrWhiteSpace(request.Note) ? "" : $" - {request.Note}")}";

        var notification = new TableNotification
        {
            Id = Guid.NewGuid(),
            BranchId = table.BranchId,
            TableId = table.Id,
            SessionId = session?.Id,
            Type = "RequestBill",
            Message = msg,
            IsHandled = false,
            CreatedAt = DateTime.UtcNow
        };

        db.TableNotifications.Add(notification);
        await db.SaveChangesAsync(ct);

        return new TableNotificationDto
        {
            Id = notification.Id,
            BranchId = notification.BranchId,
            TableId = notification.TableId,
            TableCode = table.Code,
            TableName = table.Name ?? table.Code,
            AreaName = area?.Name ?? string.Empty,
            Type = notification.Type,
            Message = notification.Message,
            IsHandled = notification.IsHandled,
            CreatedAt = notification.CreatedAt
        };
    }

    public async Task<List<TableNotificationDto>> GetActiveNotificationsAsync(Guid branchId, CancellationToken ct = default)
    {
        var list = await db.TableNotifications
            .Where(n => n.BranchId == branchId && !n.IsHandled && !n.IsDeleted)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(ct);

        var result = new List<TableNotificationDto>();
        foreach (var n in list)
        {
            var table = await db.Tables.FirstOrDefaultAsync(t => t.Id == n.TableId, ct);
            var area = table != null ? await db.Areas.FirstOrDefaultAsync(a => a.Id == table.AreaId, ct) : null;
            result.Add(new TableNotificationDto
            {
                Id = n.Id,
                BranchId = n.BranchId,
                TableId = n.TableId,
                TableCode = table?.Code ?? string.Empty,
                TableName = table?.Name ?? table?.Code ?? string.Empty,
                AreaName = area?.Name ?? string.Empty,
                Type = n.Type,
                Message = n.Message,
                IsHandled = n.IsHandled,
                CreatedAt = n.CreatedAt
            });
        }
        return result;
    }

    public async Task DismissNotificationAsync(Guid notificationId, Guid staffUserId, CancellationToken ct = default)
    {
        var notif = await db.TableNotifications.FirstOrDefaultAsync(n => n.Id == notificationId && !n.IsDeleted, ct);
        if (notif != null)
        {
            notif.IsHandled = true;
            notif.HandledByUserId = staffUserId;
            notif.HandledAt = DateTime.UtcNow;
            notif.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }
    }

    public async Task<List<OrderTicketDto>> GetPendingQrTicketsAsync(Guid branchId, CancellationToken ct = default)
    {
        var sessionIds = await db.TableSessions
            .Where(s => s.BranchId == branchId && (s.Status == TableSessionStatus.Open || s.Status == TableSessionStatus.Paying) && !s.IsDeleted)
            .Select(s => s.Id)
            .ToListAsync(ct);

        if (sessionIds.Count == 0) return [];

        var tickets = await db.OrderTickets
            .Where(t => sessionIds.Contains(t.SessionId) && t.Source == OrderSource.CustomerQr && !t.IsDeleted)
            .OrderByDescending(t => t.OrderedAt)
            .ToListAsync(ct);

        var result = new List<OrderTicketDto>();
        foreach (var ticket in tickets)
        {
            var lines = await db.OrderLines
                .Where(l => l.TicketId == ticket.Id && !l.IsDeleted && l.Status == OrderItemStatus.PendingConfirm)
                .ToListAsync(ct);

            if (lines.Count > 0)
            {
                var session = await db.TableSessions.FirstOrDefaultAsync(s => s.Id == ticket.SessionId, ct);
                var table = session != null ? await db.Tables.FirstOrDefaultAsync(t => t.Id == session.TableId, ct) : null;

                result.Add(new OrderTicketDto
                {
                    Id = ticket.Id,
                    SessionId = ticket.SessionId,
                    TicketNumber = ticket.TicketNumber,
                    Source = ticket.Source.ToString(),
                    CustomerName = ticket.CustomerName ?? session?.CustomerName,
                    CustomerPhone = ticket.CustomerPhone ?? session?.CustomerPhone,
                    Note = ticket.Note,
                    OrderedAt = ticket.OrderedAt,
                    Lines = lines.Select(l => new OrderLineDto
                    {
                        Id = l.Id,
                        TicketId = l.TicketId,
                        MenuItemId = l.MenuItemId,
                        ItemCode = l.ItemCodeSnapshot,
                        ItemName = l.ItemNameSnapshot,
                        Quantity = l.Quantity,
                        UnitPrice = l.UnitPrice,
                        SelectedOptionsText = l.SelectedOptionsText,
                        Note = l.Note,
                        KitchenStation = l.KitchenStation,
                        Status = l.Status.ToString()
                    }).ToList()
                });
            }
        }
        return result;
    }

    public async Task<List<TableSessionDetailDto>> GetActiveSessionsAsync(Guid branchId, CancellationToken ct = default)
    {
        var sessions = await db.TableSessions
            .Where(s => s.BranchId == branchId && (s.Status == TableSessionStatus.Open || s.Status == TableSessionStatus.Paying) && !s.IsDeleted)
            .OrderByDescending(s => s.OpenedAt)
            .ToListAsync(ct);

        var result = new List<TableSessionDetailDto>();
        foreach (var s in sessions)
        {
            var detail = await GetSessionByIdAsync(s.Id, ct);
            if (detail != null)
            {
                result.Add(detail);
            }
        }
        return result;
    }

    private async Task<OrderTicket> CreateTicketAsync(
        TableSession session,
        OrderSource source,
        Guid? staffUserId,
        string? customerName,
        string? customerPhone,
        string? ticketNote,
        IReadOnlyList<StaffOrderLineRequest> lines,
        bool sendStraightToKitchen,
        CancellationToken ct)
    {
        if (lines.Count == 0) throw new InvalidOperationException("Đơn gọi món đang trống.");

        var ticketCount = await db.OrderTickets.CountAsync(t => t.SessionId == session.Id, ct);
        var ticket = new OrderTicket
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            TicketNumber = ticketCount + 1,
            Source = source,
            CreatedByUserId = staffUserId,
            CustomerName = customerName?.Trim() ?? session.CustomerName,
            CustomerPhone = customerPhone?.Trim() ?? session.CustomerPhone,
            Note = ticketNote?.Trim(),
            OrderedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        db.OrderTickets.Add(ticket);

        foreach (var line in lines)
        {
            var item = await db.MenuItems.FirstOrDefaultAsync(x => x.Id == line.MenuItemId && x.IsAvailable && !x.Is86ed && !x.IsDeleted, ct)
                ?? throw new InvalidOperationException($"Món ăn ID {line.MenuItemId} không khả dụng hoặc đã hết.");

            decimal extraSum = 0;
            var optionDescList = new List<string>();

            if (line.SelectedOptions != null && line.SelectedOptions.Count > 0)
            {
                foreach (var opt in line.SelectedOptions)
                {
                    extraSum += opt.ExtraPrice;
                    var extraText = opt.ExtraPrice > 0 ? $" (+{opt.ExtraPrice:N0}đ)" : "";
                    optionDescList.Add($"{opt.OptionName}: {opt.ValueName}{extraText}");
                }
            }

            var lineUnitPrice = item.Price + extraSum;
            var optionsSnapshotText = optionDescList.Count > 0 ? string.Join(" • ", optionDescList) : null;

            db.OrderLines.Add(new OrderLine
            {
                Id = Guid.NewGuid(),
                TicketId = ticket.Id,
                SessionId = session.Id,
                MenuItemId = item.Id,
                ItemCodeSnapshot = item.Code,
                ItemNameSnapshot = item.Name,
                UnitPrice = lineUnitPrice,
                Quantity = line.Quantity > 0 ? line.Quantity : 1,
                SelectedOptionsText = optionsSnapshotText,
                Note = line.Note?.Trim(),
                KitchenStation = item.KitchenStation,
                Status = sendStraightToKitchen ? OrderItemStatus.SentToKitchen : OrderItemStatus.PendingConfirm,
                CreatedAt = DateTime.UtcNow
            });
        }

        await db.SaveChangesAsync(ct);
        return ticket;
    }

    private async Task<OrderTicketDto> MapTicketDtoAsync(Guid ticketId, CancellationToken ct)
    {
        var ticket = await db.OrderTickets.FirstAsync(x => x.Id == ticketId, ct);
        var lines = await db.OrderLines.Where(x => x.TicketId == ticketId && !x.IsDeleted).ToListAsync(ct);
        string? staffName = null;
        if (ticket.CreatedByUserId.HasValue)
        {
            staffName = await db.Users
                .Where(u => u.Id == ticket.CreatedByUserId.Value)
                .Select(u => u.DisplayName)
                .FirstOrDefaultAsync(ct);
        }

        return new OrderTicketDto
        {
            Id = ticket.Id,
            SessionId = ticket.SessionId,
            TicketNumber = ticket.TicketNumber,
            Source = ticket.Source.ToString(),
            CustomerName = ticket.CustomerName,
            CustomerPhone = ticket.CustomerPhone,
            CreatedByUserName = staffName,
            Note = ticket.Note,
            OrderedAt = ticket.OrderedAt,
            Lines = lines.Select(l => new OrderLineDto
            {
                Id = l.Id,
                TicketId = l.TicketId,
                MenuItemId = l.MenuItemId,
                ItemCode = l.ItemCodeSnapshot,
                ItemName = l.ItemNameSnapshot,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                SelectedOptionsText = l.SelectedOptionsText,
                Note = l.Note,
                KitchenStation = l.KitchenStation,
                Status = l.Status.ToString()
            }).ToList()
        };
    }
}
