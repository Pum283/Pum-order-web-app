using Microsoft.EntityFrameworkCore;
using OrderPum.Application.DTOs.Payment;
using OrderPum.Application.Interfaces.Services.Payment;
using OrderPum.Domain.Entities.Order;
using OrderPum.Domain.Entities.Payment;
using OrderPum.Domain.Enums.Order;
using OrderPum.Infrastructure.Persistence;

namespace OrderPum.Infrastructure.Implementations.Services.Payment;

public class PaymentService(AppDbContext db) : IPaymentService
{
    public async Task<InvoiceDto> CreateInvoiceFromSessionAsync(
        CreateInvoiceRequest request,
        Guid? cashierUserId = null,
        CancellationToken ct = default)
    {
        var session = await db.TableSessions.FirstOrDefaultAsync(s => s.Id == request.SessionId && !s.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy phiên bàn.");

        if (session.Status == TableSessionStatus.Closed)
            throw new InvalidOperationException("Phiên bàn đã kết thúc.");

        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == session.BranchId, ct)
            ?? throw new InvalidOperationException("Không tìm thấy chi nhánh.");

        var table = await db.Tables.FirstOrDefaultAsync(t => t.Id == session.TableId, ct);
        var cashier = cashierUserId.HasValue ? await db.Users.FirstOrDefaultAsync(u => u.Id == cashierUserId.Value, ct) : null;

        // Lấy tất cả OrderLines hợp lệ của session (không lấy món bị hủy hoặc đang chờ duyệt QR)
        var linesQuery = db.OrderLines
            .Where(l => l.SessionId == session.Id && !l.IsDeleted &&
                       l.Status != OrderItemStatus.Cancelled && l.Status != OrderItemStatus.PendingConfirm);

        if (request.SelectedLineIds != null && request.SelectedLineIds.Count > 0)
        {
            // Tách bill theo món (STT 58)
            linesQuery = linesQuery.Where(l => request.SelectedLineIds.Contains(l.Id));
        }

        var orderLines = await linesQuery.ToListAsync(ct);
        if (orderLines.Count == 0)
            throw new InvalidOperationException("Không có món ăn nào đủ điều kiện lập hóa đơn.");

        // Sinh mã số hóa đơn định dạng HD-YYMMDD-XXXX
        var invoiceNumber = await GenerateInvoiceNumberAsync(branch.Id, ct);

        // Tính toán các khoản tiền (STT 61)
        var subTotal = orderLines.Sum(l => l.UnitPrice * l.Quantity);
        var discount = 0m;

        // Phí dịch vụ
        var serviceChargeAmount = 0m;
        if (!branch.IsServiceChargeIncluded && branch.ServiceChargePercent > 0)
        {
            serviceChargeAmount = Math.Round((subTotal - discount) * (branch.ServiceChargePercent / 100m), 0);
        }

        // Thuế VAT
        var taxAmount = 0m;
        if (!branch.IsTaxIncludedInPrice && branch.TaxRatePercent > 0)
        {
            taxAmount = Math.Round(((subTotal - discount) + serviceChargeAmount) * (branch.TaxRatePercent / 100m), 0);
        }

        // Tổng số tiền cuối cùng
        var finalAmount = (subTotal - discount)
            + (branch.IsTaxIncludedInPrice ? 0 : taxAmount)
            + (branch.IsServiceChargeIncluded ? 0 : serviceChargeAmount);

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            BranchId = branch.Id,
            SessionId = session.Id,
            InvoiceNumber = invoiceNumber,
            TableCodeSnapshot = table?.Code ?? string.Empty,
            TableNameSnapshot = table?.Name ?? table?.Code ?? string.Empty,
            SubTotalAmount = subTotal,
            DiscountAmount = discount,
            TaxRatePercent = branch.TaxRatePercent,
            TaxAmount = taxAmount,
            IsTaxIncludedInPrice = branch.IsTaxIncludedInPrice,
            ServiceChargePercent = branch.ServiceChargePercent,
            ServiceChargeAmount = serviceChargeAmount,
            IsServiceChargeIncluded = branch.IsServiceChargeIncluded,
            FinalAmount = finalAmount,
            PaidAmount = 0,
            ChangeAmount = 0,
            PaymentStatus = "Unpaid",
            CashierUserId = cashierUserId,
            CashierNameSnapshot = cashier?.DisplayName ?? "Thu ngân",
            CustomerName = request.CustomerName?.Trim(),
            CustomerPhone = request.CustomerPhone?.Trim(),
            Note = request.Note?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        foreach (var ol in orderLines)
        {
            invoice.Lines.Add(new InvoiceLine
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoice.Id,
                OrderLineId = ol.Id,
                MenuItemId = ol.MenuItemId,
                ItemCode = ol.ItemCodeSnapshot,
                ItemName = ol.ItemNameSnapshot,
                UnitPrice = ol.UnitPrice,
                Quantity = ol.Quantity,
                TotalPrice = ol.UnitPrice * ol.Quantity,
                SelectedOptionsText = ol.SelectedOptionsText,
                Note = ol.Note,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Cập nhật trạng thái session sang Paying
        session.Status = TableSessionStatus.Paying;
        session.UpdatedAt = DateTime.UtcNow;

        db.Invoices.Add(invoice);
        await db.SaveChangesAsync(ct);

        return await MapInvoiceDtoAsync(invoice.Id, ct);
    }

    public async Task<InvoiceDto> MergeTablesInvoiceAsync(
        MergeTablesInvoiceRequest request,
        Guid? cashierUserId = null,
        CancellationToken ct = default)
    {
        if (request.SessionIds.Count < 2)
            throw new InvalidOperationException("Cần chọn ít nhất 2 bàn/phiên để thực hiện gộp hóa đơn.");

        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == request.BranchId, ct)
            ?? throw new InvalidOperationException("Không tìm thấy chi nhánh.");

        var sessions = await db.TableSessions
            .Where(s => request.SessionIds.Contains(s.Id) && s.BranchId == branch.Id && !s.IsDeleted)
            .ToListAsync(ct);

        if (sessions.Count != request.SessionIds.Count)
            throw new InvalidOperationException("Một số phiên bàn được chọn không tồn tại hoặc không cùng chi nhánh.");

        if (sessions.Any(s => s.Status == TableSessionStatus.Closed))
            throw new InvalidOperationException("Có phiên bàn đã đóng, không thể gộp hóa đơn.");

        var tableIds = sessions.Select(s => s.TableId).ToList();
        var tables = await db.Tables.Where(t => tableIds.Contains(t.Id)).ToListAsync(ct);
        var tableCodes = string.Join(", ", tables.Select(t => t.Code));
        var tableNames = string.Join(", ", tables.Select(t => t.Name ?? t.Code));

        var cashier = cashierUserId.HasValue ? await db.Users.FirstOrDefaultAsync(u => u.Id == cashierUserId.Value, ct) : null;

        // Lấy tất cả OrderLines của tất cả các session được gộp
        var orderLines = await db.OrderLines
            .Where(l => request.SessionIds.Contains(l.SessionId) && !l.IsDeleted &&
                       l.Status != OrderItemStatus.Cancelled && l.Status != OrderItemStatus.PendingConfirm)
            .ToListAsync(ct);

        if (orderLines.Count == 0)
            throw new InvalidOperationException("Không có món ăn nào trong các bàn đã chọn.");

        var invoiceNumber = await GenerateInvoiceNumberAsync(branch.Id, ct);

        var subTotal = orderLines.Sum(l => l.UnitPrice * l.Quantity);
        var discount = 0m;

        var serviceChargeAmount = 0m;
        if (!branch.IsServiceChargeIncluded && branch.ServiceChargePercent > 0)
        {
            serviceChargeAmount = Math.Round((subTotal - discount) * (branch.ServiceChargePercent / 100m), 0);
        }

        var taxAmount = 0m;
        if (!branch.IsTaxIncludedInPrice && branch.TaxRatePercent > 0)
        {
            taxAmount = Math.Round(((subTotal - discount) + serviceChargeAmount) * (branch.TaxRatePercent / 100m), 0);
        }

        var finalAmount = (subTotal - discount)
            + (branch.IsTaxIncludedInPrice ? 0 : taxAmount)
            + (branch.IsServiceChargeIncluded ? 0 : serviceChargeAmount);

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            BranchId = branch.Id,
            SessionId = sessions[0].Id, // Session chính
            InvoiceNumber = invoiceNumber,
            TableCodeSnapshot = tableCodes,
            TableNameSnapshot = tableNames,
            MergedSessionIdsText = string.Join(",", request.SessionIds),
            SubTotalAmount = subTotal,
            DiscountAmount = discount,
            TaxRatePercent = branch.TaxRatePercent,
            TaxAmount = taxAmount,
            IsTaxIncludedInPrice = branch.IsTaxIncludedInPrice,
            ServiceChargePercent = branch.ServiceChargePercent,
            ServiceChargeAmount = serviceChargeAmount,
            IsServiceChargeIncluded = branch.IsServiceChargeIncluded,
            FinalAmount = finalAmount,
            PaidAmount = 0,
            ChangeAmount = 0,
            PaymentStatus = "Unpaid",
            CashierUserId = cashierUserId,
            CashierNameSnapshot = cashier?.DisplayName ?? "Thu ngân",
            CustomerName = request.CustomerName?.Trim(),
            CustomerPhone = request.CustomerPhone?.Trim(),
            Note = string.IsNullOrWhiteSpace(request.Note) ? $"Gộp các bàn: {tableCodes}" : request.Note.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        foreach (var ol in orderLines)
        {
            invoice.Lines.Add(new InvoiceLine
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoice.Id,
                OrderLineId = ol.Id,
                MenuItemId = ol.MenuItemId,
                ItemCode = ol.ItemCodeSnapshot,
                ItemName = ol.ItemNameSnapshot,
                UnitPrice = ol.UnitPrice,
                Quantity = ol.Quantity,
                TotalPrice = ol.UnitPrice * ol.Quantity,
                SelectedOptionsText = ol.SelectedOptionsText,
                Note = ol.Note,
                CreatedAt = DateTime.UtcNow
            });
        }

        foreach (var s in sessions)
        {
            s.Status = TableSessionStatus.Paying;
            s.UpdatedAt = DateTime.UtcNow;
        }

        db.Invoices.Add(invoice);
        await db.SaveChangesAsync(ct);

        return await MapInvoiceDtoAsync(invoice.Id, ct);
    }

    public async Task<InvoiceDto?> GetInvoiceByIdAsync(Guid invoiceId, CancellationToken ct = default)
    {
        var exists = await db.Invoices.AnyAsync(x => x.Id == invoiceId && !x.IsDeleted, ct);
        if (!exists) return null;
        return await MapInvoiceDtoAsync(invoiceId, ct);
    }

    public async Task<List<InvoiceDto>> GetInvoicesByBranchAsync(
        Guid branchId,
        string? status = null,
        DateTime? date = null,
        CancellationToken ct = default)
    {
        var query = db.Invoices
            .Where(i => i.BranchId == branchId && !i.IsDeleted);

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(i => i.PaymentStatus == status);
        }

        if (date.HasValue)
        {
            var start = date.Value.Date;
            var end = start.AddDays(1);
            query = query.Where(i => i.CreatedAt >= start && i.CreatedAt < end);
        }

        var list = await query
            .OrderByDescending(i => i.CreatedAt)
            .Take(100)
            .ToListAsync(ct);

        var result = new List<InvoiceDto>();
        foreach (var inv in list)
        {
            result.Add(await MapInvoiceDtoAsync(inv.Id, ct));
        }
        return result;
    }

    public async Task<InvoiceDto> SettlePaymentAsync(
        SettlePaymentRequest request,
        Guid? cashierUserId = null,
        CancellationToken ct = default)
    {
        var invoice = await db.Invoices
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == request.InvoiceId && !i.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy hóa đơn.");

        if (invoice.PaymentStatus == "Paid")
            throw new InvalidOperationException("Hóa đơn này đã được thanh toán hoàn tất.");

        if (request.Payments.Count == 0 && request.ReceivedCashAmount <= 0)
            throw new InvalidOperationException("Chưa nhập thông tin số tiền thanh toán.");

        var cashier = cashierUserId.HasValue ? await db.Users.FirstOrDefaultAsync(u => u.Id == cashierUserId.Value, ct) : null;
        if (cashier != null)
        {
            invoice.CashierUserId = cashier.Id;
            invoice.CashierNameSnapshot = cashier.DisplayName;
        }

        if (!string.IsNullOrWhiteSpace(request.CustomerName)) invoice.CustomerName = request.CustomerName.Trim();
        if (!string.IsNullOrWhiteSpace(request.CustomerPhone)) invoice.CustomerPhone = request.CustomerPhone.Trim();

        decimal newPaidSum = invoice.Payments.Where(p => p.Status == "Success").Sum(p => p.Amount);

        // Thêm các giao dịch thanh toán
        foreach (var p in request.Payments)
        {
            if (p.Amount <= 0) continue;

            var txn = new PaymentTransaction
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoice.Id,
                PaymentMethod = p.PaymentMethod,
                Amount = p.Amount,
                TransactionCode = p.TransactionCode,
                Note = p.Note,
                Status = "Success",
                PaidAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            db.Payments.Add(txn);
            newPaidSum += p.Amount;
        }

        // Nếu khách thanh toán tiền mặt và nhập số tiền nhận
        decimal change = 0m;
        if (request.ReceivedCashAmount > 0)
        {
            var remainingBeforeCash = Math.Max(0, invoice.FinalAmount - (newPaidSum - request.Payments.Where(x => x.PaymentMethod == "Cash").Sum(x => x.Amount)));
            if (request.ReceivedCashAmount >= remainingBeforeCash)
            {
                change = request.ReceivedCashAmount - remainingBeforeCash;
            }
        }

        invoice.PaidAmount = newPaidSum;
        invoice.ChangeAmount = change;
        invoice.UpdatedAt = DateTime.UtcNow;

        if (invoice.PaidAmount >= invoice.FinalAmount)
        {
            invoice.PaymentStatus = "Paid";
            invoice.PaidAt = DateTime.UtcNow;

            // Đóng phiên bàn khi thanh toán xong
            if (request.CloseSessionAfterPayment)
            {
                var sessionIdsToClose = new List<Guid>();
                if (invoice.SessionId.HasValue) sessionIdsToClose.Add(invoice.SessionId.Value);

                if (!string.IsNullOrWhiteSpace(invoice.MergedSessionIdsText))
                {
                    var mergedIds = invoice.MergedSessionIdsText.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(id => Guid.TryParse(id, out var g) ? g : Guid.Empty)
                        .Where(g => g != Guid.Empty);
                    sessionIdsToClose.AddRange(mergedIds);
                }

                foreach (var sId in sessionIdsToClose.Distinct())
                {
                    var sess = await db.TableSessions.FirstOrDefaultAsync(s => s.Id == sId && !s.IsDeleted, ct);
                    if (sess != null)
                    {
                        sess.Status = TableSessionStatus.Closed;
                        sess.ClosedAt = DateTime.UtcNow;
                        sess.UpdatedAt = DateTime.UtcNow;

                        var tbl = await db.Tables.FirstOrDefaultAsync(t => t.Id == sess.TableId, ct);
                        if (tbl != null)
                        {
                            tbl.Status = "NeedsCleaning";
                            tbl.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                }

                // Tạo thông báo hoàn tất
                var notif = new TableNotification
                {
                    Id = Guid.NewGuid(),
                    BranchId = invoice.BranchId,
                    TableId = Guid.Empty,
                    SessionId = invoice.SessionId,
                    Type = "InvoicePaid",
                    Message = $"💵 Bàn {invoice.TableCodeSnapshot}: Hóa đơn {invoice.InvoiceNumber} đã thanh toán ({invoice.FinalAmount:N0}đ). Bàn sẵn sàng dọn dẹp.",
                    IsHandled = false,
                    CreatedAt = DateTime.UtcNow
                };
                db.TableNotifications.Add(notif);
            }
        }
        else
        {
            invoice.PaymentStatus = "PartiallyPaid";
        }

        await db.SaveChangesAsync(ct);

        return await MapInvoiceDtoAsync(invoice.Id, ct);
    }

    public async Task<VietQrInfoDto> GenerateVietQrAsync(Guid invoiceId, CancellationToken ct = default)
    {
        var invoice = await db.Invoices.FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy hóa đơn.");

        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == invoice.BranchId, ct);
        var remainingAmount = Math.Max(0, invoice.FinalAmount - invoice.PaidAmount);

        var bankCode = "MB";
        var accountNo = "0901234567";
        var accountName = "ORDERPUM RESTAURANT";
        var desc = $"TT {invoice.InvoiceNumber}";

        var encodedDesc = Uri.EscapeDataString(desc);
        var encodedAccountName = Uri.EscapeDataString(accountName);
        var qrUrl = $"https://img.vietqr.io/image/{bankCode}-{accountNo}-compact2.png?amount={remainingAmount:0}&addInfo={encodedDesc}&accountName={encodedAccountName}";

        return new VietQrInfoDto
        {
            BankCode = bankCode,
            AccountNo = accountNo,
            AccountName = accountName,
            Amount = remainingAmount,
            Description = desc,
            QrUrl = qrUrl
        };
    }

    private async Task<string> GenerateInvoiceNumberAsync(Guid branchId, CancellationToken ct)
    {
        var today = DateTime.UtcNow.ToString("yyMMdd");
        var startOfDay = DateTime.UtcNow.Date;
        var endOfDay = startOfDay.AddDays(1);

        var countToday = await db.Invoices
            .CountAsync(i => i.BranchId == branchId && i.CreatedAt >= startOfDay && i.CreatedAt < endOfDay, ct);

        return $"HD-{today}-{(countToday + 1):D4}";
    }

    private async Task<InvoiceDto> MapInvoiceDtoAsync(Guid invoiceId, CancellationToken ct)
    {
        var invoice = await db.Invoices
            .Include(i => i.Lines)
            .Include(i => i.Payments)
            .FirstAsync(i => i.Id == invoiceId, ct);

        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == invoice.BranchId, ct);

        return new InvoiceDto
        {
            Id = invoice.Id,
            BranchId = invoice.BranchId,
            BranchName = branch?.Name ?? string.Empty,
            BranchAddress = branch?.Address ?? string.Empty,
            BranchPhone = branch?.Phone ?? string.Empty,
            ReceiptHeaderNote = branch?.ReceiptHeaderNote,
            ReceiptFooterNote = branch?.ReceiptFooterNote,
            SessionId = invoice.SessionId,
            InvoiceNumber = invoice.InvoiceNumber,
            TableCodeSnapshot = invoice.TableCodeSnapshot,
            TableNameSnapshot = invoice.TableNameSnapshot,
            SubTotalAmount = invoice.SubTotalAmount,
            DiscountAmount = invoice.DiscountAmount,
            VoucherCode = invoice.VoucherCode,
            TaxRatePercent = invoice.TaxRatePercent,
            TaxAmount = invoice.TaxAmount,
            IsTaxIncludedInPrice = invoice.IsTaxIncludedInPrice,
            ServiceChargePercent = invoice.ServiceChargePercent,
            ServiceChargeAmount = invoice.ServiceChargeAmount,
            IsServiceChargeIncluded = invoice.IsServiceChargeIncluded,
            FinalAmount = invoice.FinalAmount,
            PaidAmount = invoice.PaidAmount,
            ChangeAmount = invoice.ChangeAmount,
            PaymentStatus = invoice.PaymentStatus,
            CashierUserId = invoice.CashierUserId,
            CashierNameSnapshot = invoice.CashierNameSnapshot,
            CustomerName = invoice.CustomerName,
            CustomerPhone = invoice.CustomerPhone,
            Note = invoice.Note,
            CreatedAt = invoice.CreatedAt,
            PaidAt = invoice.PaidAt,
            Lines = invoice.Lines.Select(l => new InvoiceLineDto
            {
                Id = l.Id,
                InvoiceId = l.InvoiceId,
                OrderLineId = l.OrderLineId,
                MenuItemId = l.MenuItemId,
                ItemCode = l.ItemCode,
                ItemName = l.ItemName,
                UnitPrice = l.UnitPrice,
                Quantity = l.Quantity,
                TotalPrice = l.TotalPrice,
                SelectedOptionsText = l.SelectedOptionsText,
                Note = l.Note
            }).ToList(),
            Payments = invoice.Payments.Select(p => new PaymentTransactionDto
            {
                Id = p.Id,
                InvoiceId = p.InvoiceId,
                PaymentMethod = p.PaymentMethod,
                Amount = p.Amount,
                TransactionCode = p.TransactionCode,
                Note = p.Note,
                Status = p.Status,
                PaidAt = p.PaidAt
            }).ToList()
        };
    }
}
