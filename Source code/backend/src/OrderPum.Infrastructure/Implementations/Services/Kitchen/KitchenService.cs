using Microsoft.EntityFrameworkCore;
using OrderPum.Application.DTOs.Kitchen;
using OrderPum.Application.Interfaces.Services.Kitchen;
using OrderPum.Domain.Entities.Order;
using OrderPum.Domain.Enums.Order;
using OrderPum.Infrastructure.Persistence;

namespace OrderPum.Infrastructure.Implementations.Services.Kitchen;

public class KitchenService(AppDbContext db) : IKitchenService
{
    public async Task<List<KitchenOrderTicketDto>> GetActiveKitchenTicketsAsync(
        Guid branchId,
        string? station = null,
        string? statusFilter = null,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        // Tìm tất cả các phiên bàn đang mở/đang thanh toán tại chi nhánh
        var sessions = await db.TableSessions
            .Where(s => s.BranchId == branchId && (s.Status == TableSessionStatus.Open || s.Status == TableSessionStatus.Paying) && !s.IsDeleted)
            .ToListAsync(ct);

        if (sessions.Count == 0) return [];

        var sessionIds = sessions.Select(s => s.Id).ToList();

        // Lấy tất cả tickets của các phiên này
        var tickets = await db.OrderTickets
            .Where(t => sessionIds.Contains(t.SessionId) && !t.IsDeleted)
            .OrderBy(t => t.OrderedAt)
            .ToListAsync(ct);

        if (tickets.Count == 0) return [];

        var ticketIds = tickets.Select(t => t.Id).ToList();

        // Lấy lines tương ứng
        var query = db.OrderLines
            .Where(l => ticketIds.Contains(l.TicketId) && !l.IsDeleted && l.Status != OrderItemStatus.PendingConfirm);

        // Lọc theo trạm (Kitchen / Bar / Pastry)
        if (!string.IsNullOrWhiteSpace(station) && !station.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(l => l.KitchenStation == station);
        }

        // Lọc theo trạng thái
        if (!string.IsNullOrWhiteSpace(statusFilter) && !statusFilter.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            if (statusFilter.Equals("Active", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(l => l.Status == OrderItemStatus.SentToKitchen || l.Status == OrderItemStatus.Preparing || l.Status == OrderItemStatus.Ready);
            }
            else if (Enum.TryParse<OrderItemStatus>(statusFilter, true, out var parsedStatus))
            {
                query = query.Where(l => l.Status == parsedStatus);
            }
        }
        else
        {
            // Mặc định KDS hiển thị các món đang chờ, đang làm và vừa nấu xong chờ bưng
            query = query.Where(l => l.Status == OrderItemStatus.SentToKitchen || l.Status == OrderItemStatus.Preparing || l.Status == OrderItemStatus.Ready);
        }

        var lines = await query.ToListAsync(ct);
        if (lines.Count == 0) return [];

        // Tra cứu thông tin Bàn & Khu vực
        var tables = await db.Tables.Where(t => t.BranchId == branchId && !t.IsDeleted).ToListAsync(ct);
        var areas = await db.Areas.Where(a => a.BranchId == branchId && !a.IsDeleted).ToListAsync(ct);
        var menuItems = await db.MenuItems.Where(m => m.BranchId == branchId && !m.IsDeleted).ToListAsync(ct);
        var users = await db.Users.ToListAsync(ct);

        var result = new List<KitchenOrderTicketDto>();

        foreach (var ticket in tickets)
        {
            var ticketLines = lines.Where(l => l.TicketId == ticket.Id).ToList();
            if (ticketLines.Count == 0) continue;

            var session = sessions.FirstOrDefault(s => s.Id == ticket.SessionId);
            var table = session != null ? tables.FirstOrDefault(t => t.Id == session.TableId) : null;
            var area = table != null ? areas.FirstOrDefault(a => a.Id == table.AreaId) : null;
            var creator = ticket.CreatedByUserId.HasValue ? users.FirstOrDefault(u => u.Id == ticket.CreatedByUserId.Value) : null;

            var elapsedMinutes = (int)Math.Max(0, (now - ticket.OrderedAt).TotalMinutes);
            var urgency = elapsedMinutes switch
            {
                >= 15 => "Critical",
                >= 7 => "Warning",
                _ => "Normal"
            };

            var lineDtos = ticketLines.Select(l =>
            {
                var menuItem = menuItems.FirstOrDefault(m => m.Id == l.MenuItemId);
                var lineElapsed = (int)Math.Max(0, (now - l.CreatedAt).TotalMinutes);

                return new KitchenOrderLineDto
                {
                    Id = l.Id,
                    TicketId = l.TicketId,
                    SessionId = l.SessionId,
                    MenuItemId = l.MenuItemId,
                    ItemCode = l.ItemCodeSnapshot,
                    ItemName = l.ItemNameSnapshot,
                    Quantity = l.Quantity,
                    UnitPrice = l.UnitPrice,
                    SelectedOptionsText = l.SelectedOptionsText,
                    Note = l.Note,
                    KitchenStation = l.KitchenStation,
                    Status = l.Status.ToString(),
                    PreparationMinutes = menuItem?.PreparationMinutes ?? 15,
                    ReadyAt = l.ReadyAt,
                    ServedAt = l.ServedAt,
                    CreatedAt = l.CreatedAt,
                    ElapsedMinutes = lineElapsed
                };
            }).OrderBy(l => l.Status == "SentToKitchen" ? 1 : l.Status == "Preparing" ? 2 : 3)
              .ThenBy(l => l.CreatedAt)
              .ToList();

            result.Add(new KitchenOrderTicketDto
            {
                Id = ticket.Id,
                SessionId = ticket.SessionId,
                SessionCode = session?.SessionCode ?? string.Empty,
                BranchId = branchId,
                TableId = table?.Id ?? Guid.Empty,
                TableCode = table?.Code ?? string.Empty,
                TableName = table?.Name ?? table?.Code ?? string.Empty,
                AreaName = area?.Name ?? string.Empty,
                GuestCount = session?.GuestCount ?? 1,
                TicketNumber = ticket.TicketNumber,
                Source = ticket.Source.ToString(),
                CreatedByUserName = creator?.DisplayName,
                Note = ticket.Note,
                OrderedAt = ticket.OrderedAt,
                ElapsedMinutes = elapsedMinutes,
                UrgencyLevel = urgency,
                Lines = lineDtos
            });
        }

        return result.OrderByDescending(t => t.UrgencyLevel == "Critical")
                     .ThenByDescending(t => t.UrgencyLevel == "Warning")
                     .ThenBy(t => t.OrderedAt)
                     .ToList();
    }

    public async Task<List<KitchenAggregateItemDto>> GetAggregateItemsAsync(
        Guid branchId,
        string? station = null,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var sessions = await db.TableSessions
            .Where(s => s.BranchId == branchId && (s.Status == TableSessionStatus.Open || s.Status == TableSessionStatus.Paying) && !s.IsDeleted)
            .ToListAsync(ct);

        if (sessions.Count == 0) return [];

        var sessionIds = sessions.Select(s => s.Id).ToList();

        var query = db.OrderLines
            .Where(l => sessionIds.Contains(l.SessionId) && !l.IsDeleted &&
                       (l.Status == OrderItemStatus.SentToKitchen || l.Status == OrderItemStatus.Preparing));

        if (!string.IsNullOrWhiteSpace(station) && !station.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(l => l.KitchenStation == station);
        }

        var lines = await query.ToListAsync(ct);
        if (lines.Count == 0) return [];

        var tables = await db.Tables.Where(t => t.BranchId == branchId && !t.IsDeleted).ToListAsync(ct);

        var groups = lines.GroupBy(l => l.MenuItemId);
        var result = new List<KitchenAggregateItemDto>();

        foreach (var g in groups)
        {
            var first = g.First();
            var totalQty = g.Sum(x => x.Quantity);
            var pendingQty = g.Where(x => x.Status == OrderItemStatus.SentToKitchen).Sum(x => x.Quantity);
            var prepQty = g.Where(x => x.Status == OrderItemStatus.Preparing).Sum(x => x.Quantity);

            var tableDetails = new List<KitchenAggregateTableDetailDto>();
            foreach (var line in g.OrderBy(x => x.CreatedAt))
            {
                var sess = sessions.FirstOrDefault(s => s.Id == line.SessionId);
                var tbl = sess != null ? tables.FirstOrDefault(t => t.Id == sess.TableId) : null;
                var lineElapsed = (int)Math.Max(0, (now - line.CreatedAt).TotalMinutes);

                tableDetails.Add(new KitchenAggregateTableDetailDto
                {
                    LineId = line.Id,
                    TableCode = tbl?.Code ?? string.Empty,
                    TableName = tbl?.Name ?? tbl?.Code ?? string.Empty,
                    Quantity = line.Quantity,
                    SelectedOptionsText = line.SelectedOptionsText,
                    Note = line.Note,
                    Status = line.Status.ToString(),
                    ElapsedMinutes = lineElapsed
                });
            }

            result.Add(new KitchenAggregateItemDto
            {
                MenuItemId = g.Key,
                ItemCode = first.ItemCodeSnapshot,
                ItemName = first.ItemNameSnapshot,
                KitchenStation = first.KitchenStation,
                TotalQuantity = totalQty,
                PendingQuantity = pendingQty,
                PreparingQuantity = prepQty,
                TableDetails = tableDetails
            });
        }

        return result.OrderByDescending(x => x.TotalQuantity).ToList();
    }

    public async Task<KitchenStatsDto> GetKitchenStatsAsync(Guid branchId, CancellationToken ct = default)
    {
        var startOfDay = DateTime.UtcNow.Date;

        var sessionsToday = await db.TableSessions
            .Where(s => s.BranchId == branchId && s.CreatedAt >= startOfDay && !s.IsDeleted)
            .Select(s => s.Id)
            .ToListAsync(ct);

        var activeSessionIds = await db.TableSessions
            .Where(s => s.BranchId == branchId && (s.Status == TableSessionStatus.Open || s.Status == TableSessionStatus.Paying) && !s.IsDeleted)
            .Select(s => s.Id)
            .ToListAsync(ct);

        var activeLines = await db.OrderLines
            .Where(l => activeSessionIds.Contains(l.SessionId) && !l.IsDeleted && l.Status != OrderItemStatus.PendingConfirm)
            .ToListAsync(ct);

        var pendingCount = activeLines.Count(l => l.Status == OrderItemStatus.SentToKitchen);
        var preparingCount = activeLines.Count(l => l.Status == OrderItemStatus.Preparing);
        var readyCount = activeLines.Count(l => l.Status == OrderItemStatus.Ready);

        var allLinesToday = await db.OrderLines
            .Where(l => sessionsToday.Contains(l.SessionId) && !l.IsDeleted)
            .ToListAsync(ct);

        var servedTodayCount = allLinesToday.Count(l => l.Status == OrderItemStatus.Served);

        var completedLinesWithReady = allLinesToday
            .Where(l => l.ReadyAt.HasValue && l.CreatedAt <= l.ReadyAt.Value)
            .ToList();

        var avgPrepMinutes = completedLinesWithReady.Count > 0
            ? Math.Round(completedLinesWithReady.Average(l => (l.ReadyAt!.Value - l.CreatedAt).TotalMinutes), 1)
            : 0;

        return new KitchenStatsDto
        {
            PendingCount = pendingCount,
            PreparingCount = preparingCount,
            ReadyCount = readyCount,
            ServedTodayCount = servedTodayCount,
            AvgPreparationMinutes = avgPrepMinutes
        };
    }

    public async Task<KitchenOrderLineDto> UpdateLineStatusAsync(
        Guid lineId,
        UpdateLineStatusRequest request,
        Guid? staffUserId = null,
        CancellationToken ct = default)
    {
        var line = await db.OrderLines.FirstOrDefaultAsync(l => l.Id == lineId && !l.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy món trong đơn bếp.");

        if (!Enum.TryParse<OrderItemStatus>(request.NewStatus, true, out var targetStatus))
        {
            throw new InvalidOperationException($"Trạng thái '{request.NewStatus}' không hợp lệ.");
        }

        var oldStatus = line.Status;
        line.Status = targetStatus;
        line.UpdatedAt = DateTime.UtcNow;

        if (targetStatus == OrderItemStatus.Ready)
        {
            line.ReadyAt = DateTime.UtcNow;

            // Tự động tạo thông báo gửi tới Nhân viên phục vụ (STT 95)
            var session = await db.TableSessions.FirstOrDefaultAsync(s => s.Id == line.SessionId, ct);
            if (session != null)
            {
                var table = await db.Tables.FirstOrDefaultAsync(t => t.Id == session.TableId, ct);
                var notif = new TableNotification
                {
                    Id = Guid.NewGuid(),
                    BranchId = session.BranchId,
                    TableId = session.TableId,
                    SessionId = session.Id,
                    Type = "ItemReady",
                    Message = $"🔔 Bàn {table?.Code ?? "..."}: Món \"{line.ItemNameSnapshot}\" (x{line.Quantity}) đã sẵn sàng phục vụ!",
                    IsHandled = false,
                    CreatedAt = DateTime.UtcNow
                };
                db.TableNotifications.Add(notif);
            }
        }
        else if (targetStatus == OrderItemStatus.Served)
        {
            line.ServedAt = DateTime.UtcNow;
        }
        else if (targetStatus == OrderItemStatus.Cancelled)
        {
            if (!string.IsNullOrWhiteSpace(request.CancelReason))
            {
                line.Note = string.IsNullOrWhiteSpace(line.Note)
                    ? $"[Hủy bếp: {request.CancelReason.Trim()}]"
                    : $"{line.Note} | [Hủy bếp: {request.CancelReason.Trim()}]";
            }
        }

        await db.SaveChangesAsync(ct);

        var menuItem = await db.MenuItems.FirstOrDefaultAsync(m => m.Id == line.MenuItemId, ct);
        var elapsed = (int)Math.Max(0, (DateTime.UtcNow - line.CreatedAt).TotalMinutes);

        return new KitchenOrderLineDto
        {
            Id = line.Id,
            TicketId = line.TicketId,
            SessionId = line.SessionId,
            MenuItemId = line.MenuItemId,
            ItemCode = line.ItemCodeSnapshot,
            ItemName = line.ItemNameSnapshot,
            Quantity = line.Quantity,
            UnitPrice = line.UnitPrice,
            SelectedOptionsText = line.SelectedOptionsText,
            Note = line.Note,
            KitchenStation = line.KitchenStation,
            Status = line.Status.ToString(),
            PreparationMinutes = menuItem?.PreparationMinutes ?? 15,
            ReadyAt = line.ReadyAt,
            ServedAt = line.ServedAt,
            CreatedAt = line.CreatedAt,
            ElapsedMinutes = elapsed
        };
    }

    public async Task<bool> UpdateTicketStatusAsync(
        Guid ticketId,
        UpdateTicketStatusRequest request,
        Guid? staffUserId = null,
        CancellationToken ct = default)
    {
        var ticket = await db.OrderTickets.FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy đợt order.");

        if (!Enum.TryParse<OrderItemStatus>(request.NewStatus, true, out var targetStatus))
        {
            throw new InvalidOperationException($"Trạng thái '{request.NewStatus}' không hợp lệ.");
        }

        var lines = await db.OrderLines
            .Where(l => l.TicketId == ticketId && !l.IsDeleted && l.Status != OrderItemStatus.Cancelled && l.Status != OrderItemStatus.Served)
            .ToListAsync(ct);

        if (lines.Count == 0) return true;

        var session = await db.TableSessions.FirstOrDefaultAsync(s => s.Id == ticket.SessionId, ct);
        var table = session != null ? await db.Tables.FirstOrDefaultAsync(t => t.Id == session.TableId, ct) : null;

        foreach (var line in lines)
        {
            line.Status = targetStatus;
            line.UpdatedAt = DateTime.UtcNow;

            if (targetStatus == OrderItemStatus.Ready)
            {
                line.ReadyAt = DateTime.UtcNow;
            }
            else if (targetStatus == OrderItemStatus.Served)
            {
                line.ServedAt = DateTime.UtcNow;
            }
        }

        if (targetStatus == OrderItemStatus.Ready && session != null)
        {
            var notif = new TableNotification
            {
                Id = Guid.NewGuid(),
                BranchId = session.BranchId,
                TableId = session.TableId,
                SessionId = session.Id,
                Type = "ItemReady",
                Message = $"🔔 Bàn {table?.Code ?? "..."}: Tất cả các món trong đợt gọi #{ticket.TicketNumber} đã nấu xong!",
                IsHandled = false,
                CreatedAt = DateTime.UtcNow
            };
            db.TableNotifications.Add(notif);
        }

        await db.SaveChangesAsync(ct);
        return true;
    }
}
