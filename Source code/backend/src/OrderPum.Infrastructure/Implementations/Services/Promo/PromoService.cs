using Microsoft.EntityFrameworkCore;
using OrderPum.Application.DTOs.Payment;
using OrderPum.Application.DTOs.Promo;
using OrderPum.Application.Interfaces.Services.Promo;
using OrderPum.Domain.Entities.Promo;
using OrderPum.Infrastructure.Persistence;

namespace OrderPum.Infrastructure.Implementations.Services.Promo;

public class PromoService(AppDbContext db) : IPromoService
{
    public async Task<List<PromotionDto>> GetPromotionsAsync(
        Guid? branchId = null,
        bool activeOnly = false,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var query = db.Promotions.Where(p => !p.IsDeleted);

        if (branchId.HasValue && branchId.Value != Guid.Empty)
        {
            query = query.Where(p => p.BranchId == null || p.BranchId == branchId.Value);
        }

        if (activeOnly)
        {
            query = query.Where(p => p.IsActive &&
                (p.StartAt == null || p.StartAt <= now) &&
                (p.EndAt == null || p.EndAt >= now) &&
                (p.UsageLimit == null || p.UsedCount < p.UsageLimit));
        }

        var list = await query.OrderByDescending(p => p.CreatedAt).ToListAsync(ct);
        var branches = await db.Branches.ToListAsync(ct);
        var categories = await db.MenuCategories.ToListAsync(ct);
        var menuItems = await db.MenuItems.ToListAsync(ct);

        return list.Select(p =>
        {
            var branch = p.BranchId.HasValue ? branches.FirstOrDefault(b => b.Id == p.BranchId.Value) : null;
            string? targetName = null;
            if (p.TargetType == "Category" && p.TargetId.HasValue)
            {
                targetName = categories.FirstOrDefault(c => c.Id == p.TargetId.Value)?.Name;
            }
            else if (p.TargetType == "MenuItem" && p.TargetId.HasValue)
            {
                targetName = menuItems.FirstOrDefault(m => m.Id == p.TargetId.Value)?.Name;
            }

            return new PromotionDto
            {
                Id = p.Id,
                BranchId = p.BranchId,
                BranchName = branch?.Name ?? "Tất cả chi nhánh",
                Code = p.Code,
                Name = p.Name,
                Description = p.Description,
                DiscountType = p.DiscountType,
                DiscountValue = p.DiscountValue,
                MaxDiscountAmount = p.MaxDiscountAmount,
                MinOrderAmount = p.MinOrderAmount,
                TargetType = p.TargetType,
                TargetId = p.TargetId,
                TargetName = targetName,
                IsAutoApply = p.IsAutoApply,
                StartAt = p.StartAt,
                EndAt = p.EndAt,
                UsageLimit = p.UsageLimit,
                UsedCount = p.UsedCount,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt
            };
        }).ToList();
    }

    public async Task<PromotionDto?> GetPromotionByIdAsync(Guid id, CancellationToken ct = default)
    {
        var p = await db.Promotions.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct);
        if (p is null) return null;

        var branch = p.BranchId.HasValue ? await db.Branches.FirstOrDefaultAsync(b => b.Id == p.BranchId.Value, ct) : null;
        string? targetName = null;
        if (p.TargetType == "Category" && p.TargetId.HasValue)
        {
            targetName = (await db.MenuCategories.FirstOrDefaultAsync(c => c.Id == p.TargetId.Value, ct))?.Name;
        }
        else if (p.TargetType == "MenuItem" && p.TargetId.HasValue)
        {
            targetName = (await db.MenuItems.FirstOrDefaultAsync(m => m.Id == p.TargetId.Value, ct))?.Name;
        }

        return new PromotionDto
        {
            Id = p.Id,
            BranchId = p.BranchId,
            BranchName = branch?.Name ?? "Tất cả chi nhánh",
            Code = p.Code,
            Name = p.Name,
            Description = p.Description,
            DiscountType = p.DiscountType,
            DiscountValue = p.DiscountValue,
            MaxDiscountAmount = p.MaxDiscountAmount,
            MinOrderAmount = p.MinOrderAmount,
            TargetType = p.TargetType,
            TargetId = p.TargetId,
            TargetName = targetName,
            IsAutoApply = p.IsAutoApply,
            StartAt = p.StartAt,
            EndAt = p.EndAt,
            UsageLimit = p.UsageLimit,
            UsedCount = p.UsedCount,
            IsActive = p.IsActive,
            CreatedAt = p.CreatedAt
        };
    }

    public async Task<PromotionDto> CreatePromotionAsync(CreatePromotionRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Tên chương trình khuyến mãi không được để trống.");

        var code = request.Code?.Trim().ToUpperInvariant() ?? string.Empty;
        if (!string.IsNullOrEmpty(code))
        {
            var exists = await db.Promotions.AnyAsync(p => p.Code == code && !p.IsDeleted, ct);
            if (exists)
                throw new InvalidOperationException($"Mã khuyến mãi '{code}' đã tồn tại.");
        }

        var promo = new Promotion
        {
            Id = Guid.NewGuid(),
            BranchId = request.BranchId == Guid.Empty ? null : request.BranchId,
            Code = code,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            DiscountType = request.DiscountType,
            DiscountValue = request.DiscountValue,
            MaxDiscountAmount = request.MaxDiscountAmount,
            MinOrderAmount = request.MinOrderAmount,
            TargetType = request.TargetType,
            TargetId = request.TargetId,
            IsAutoApply = request.IsAutoApply,
            StartAt = request.StartAt,
            EndAt = request.EndAt,
            UsageLimit = request.UsageLimit,
            UsedCount = 0,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        db.Promotions.Add(promo);
        await db.SaveChangesAsync(ct);

        return (await GetPromotionByIdAsync(promo.Id, ct))!;
    }

    public async Task<PromotionDto> UpdatePromotionAsync(Guid id, UpdatePromotionRequest request, CancellationToken ct = default)
    {
        var promo = await db.Promotions.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy chương trình khuyến mãi.");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Tên chương trình không được để trống.");

        var code = request.Code?.Trim().ToUpperInvariant() ?? string.Empty;
        if (!string.IsNullOrEmpty(code) && code != promo.Code)
        {
            var exists = await db.Promotions.AnyAsync(p => p.Code == code && p.Id != id && !p.IsDeleted, ct);
            if (exists)
                throw new InvalidOperationException($"Mã khuyến mãi '{code}' đã tồn tại.");
        }

        promo.BranchId = request.BranchId == Guid.Empty ? null : request.BranchId;
        promo.Code = code;
        promo.Name = request.Name.Trim();
        promo.Description = request.Description?.Trim();
        promo.DiscountType = request.DiscountType;
        promo.DiscountValue = request.DiscountValue;
        promo.MaxDiscountAmount = request.MaxDiscountAmount;
        promo.MinOrderAmount = request.MinOrderAmount;
        promo.TargetType = request.TargetType;
        promo.TargetId = request.TargetId;
        promo.IsAutoApply = request.IsAutoApply;
        promo.StartAt = request.StartAt;
        promo.EndAt = request.EndAt;
        promo.UsageLimit = request.UsageLimit;
        promo.IsActive = request.IsActive;
        promo.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return (await GetPromotionByIdAsync(promo.Id, ct))!;
    }

    public async Task<bool> DeletePromotionAsync(Guid id, CancellationToken ct = default)
    {
        var promo = await db.Promotions.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct);
        if (promo is null) return false;

        promo.IsDeleted = true;
        promo.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> TogglePromotionStatusAsync(Guid id, CancellationToken ct = default)
    {
        var promo = await db.Promotions.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy chương trình khuyến mãi.");

        promo.IsActive = !promo.IsActive;
        promo.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return promo.IsActive;
    }

    public async Task<PromoCalculationResultDto> EvaluatePromoAsync(ValidatePromoRequest request, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var activePromos = await db.Promotions
            .Where(p => !p.IsDeleted && p.IsActive &&
                       (p.BranchId == null || p.BranchId == request.BranchId) &&
                       (p.StartAt == null || p.StartAt <= now) &&
                       (p.EndAt == null || p.EndAt >= now) &&
                       (p.UsageLimit == null || p.UsedCount < p.UsageLimit))
            .ToListAsync(ct);

        Promotion? targetPromo = null;

        if (!string.IsNullOrWhiteSpace(request.VoucherCode))
        {
            var code = request.VoucherCode.Trim().ToUpperInvariant();
            targetPromo = activePromos.FirstOrDefault(p => p.Code.Equals(code, StringComparison.OrdinalIgnoreCase));
            if (targetPromo == null)
            {
                return new PromoCalculationResultDto
                {
                    IsValid = false,
                    Message = $"Mã giảm giá '{code}' không tồn tại hoặc đã hết hạn.",
                    DiscountAmount = 0
                };
            }
        }
        else
        {
            // Tìm CTKM tự động áp dụng (STT 71)
            var autoPromos = activePromos.Where(p => p.IsAutoApply && request.SubTotal >= p.MinOrderAmount).ToList();
            if (autoPromos.Count > 0)
            {
                // Chọn khuyến mãi cho mức giảm cao nhất
                Promotion? bestPromo = null;
                decimal maxDiscount = 0;

                foreach (var p in autoPromos)
                {
                    var d = CalculateDiscount(p, request.SubTotal, request.Items);
                    if (d > maxDiscount)
                    {
                        maxDiscount = d;
                        bestPromo = p;
                    }
                }

                if (bestPromo != null && maxDiscount > 0)
                {
                    targetPromo = bestPromo;
                }
            }
        }

        if (targetPromo == null)
        {
            return new PromoCalculationResultDto
            {
                IsValid = false,
                Message = "Không có khuyến mãi phù hợp.",
                DiscountAmount = 0
            };
        }

        // Kiểm tra điều kiện giá trị đơn hàng tối thiểu (STT 66)
        if (request.SubTotal < targetPromo.MinOrderAmount)
        {
            return new PromoCalculationResultDto
            {
                IsValid = false,
                Message = $"Chương trình '{targetPromo.Name}' yêu cầu đơn hàng từ {targetPromo.MinOrderAmount:N0}đ trở lên.",
                DiscountAmount = 0
            };
        }

        var discount = CalculateDiscount(targetPromo, request.SubTotal, request.Items);
        if (discount <= 0)
        {
            return new PromoCalculationResultDto
            {
                IsValid = false,
                Message = "Đơn hàng chưa có món ăn áp dụng được khuyến mãi này.",
                DiscountAmount = 0
            };
        }

        return new PromoCalculationResultDto
        {
            IsValid = true,
            PromotionId = targetPromo.Id,
            PromotionCode = targetPromo.Code,
            PromotionName = targetPromo.Name,
            DiscountAmount = discount,
            Message = $"Áp dụng thành công '{targetPromo.Name}' (Giảm {discount:N0}đ)"
        };
    }

    public async Task<InvoiceDto> ApplyPromoToInvoiceAsync(
        Guid invoiceId,
        ApplyPromoToInvoiceRequest request,
        CancellationToken ct = default)
    {
        var invoice = await db.Invoices
            .Include(i => i.Lines)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy hóa đơn.");

        if (invoice.PaymentStatus == "Paid")
            throw new InvalidOperationException("Hóa đơn đã thanh toán hoàn tất, không thể thay đổi khuyến mãi.");

        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == invoice.BranchId, ct)
            ?? throw new InvalidOperationException("Không tìm thấy chi nhánh.");

        var items = new List<PromoLineItemDto>();
        var menuItems = await db.MenuItems.Where(m => m.BranchId == invoice.BranchId && !m.IsDeleted).ToListAsync(ct);

        foreach (var l in invoice.Lines)
        {
            var mi = menuItems.FirstOrDefault(m => m.Id == l.MenuItemId);
            items.Add(new PromoLineItemDto
            {
                MenuItemId = l.MenuItemId,
                CategoryId = mi?.CategoryId,
                UnitPrice = l.UnitPrice,
                Quantity = l.Quantity,
                TotalPrice = l.TotalPrice
            });
        }

        var eval = await EvaluatePromoAsync(new ValidatePromoRequest
        {
            BranchId = invoice.BranchId,
            SubTotal = invoice.SubTotalAmount,
            Items = items,
            VoucherCode = request.VoucherCode
        }, ct);

        if (!eval.IsValid)
            throw new InvalidOperationException(eval.Message ?? "Mã khuyến mãi không hợp lệ.");

        // Cập nhật chiết khấu cho hóa đơn
        invoice.DiscountAmount = eval.DiscountAmount;
        invoice.VoucherCode = eval.PromotionCode;

        // Tính lại Phí DV & Thuế VAT sau khi giảm giá (STT 61)
        var taxableBase = Math.Max(0, invoice.SubTotalAmount - invoice.DiscountAmount);

        var serviceChargeAmount = 0m;
        if (!branch.IsServiceChargeIncluded && branch.ServiceChargePercent > 0)
        {
            serviceChargeAmount = Math.Round(taxableBase * (branch.ServiceChargePercent / 100m), 0);
        }

        var taxAmount = 0m;
        if (!branch.IsTaxIncludedInPrice && branch.TaxRatePercent > 0)
        {
            taxAmount = Math.Round((taxableBase + serviceChargeAmount) * (branch.TaxRatePercent / 100m), 0);
        }

        invoice.ServiceChargeAmount = serviceChargeAmount;
        invoice.TaxAmount = taxAmount;
        invoice.FinalAmount = taxableBase
            + (branch.IsTaxIncludedInPrice ? 0 : taxAmount)
            + (branch.IsServiceChargeIncluded ? 0 : serviceChargeAmount);

        invoice.UpdatedAt = DateTime.UtcNow;

        // Tăng UsedCount của promotion
        if (eval.PromotionId.HasValue)
        {
            var promo = await db.Promotions.FirstOrDefaultAsync(p => p.Id == eval.PromotionId.Value, ct);
            if (promo != null)
            {
                promo.UsedCount += 1;
            }
        }

        await db.SaveChangesAsync(ct);

        return new InvoiceDto
        {
            Id = invoice.Id,
            BranchId = invoice.BranchId,
            BranchName = branch.Name,
            BranchAddress = branch.Address ?? string.Empty,
            BranchPhone = branch.Phone ?? string.Empty,
            ReceiptHeaderNote = branch.ReceiptHeaderNote,
            ReceiptFooterNote = branch.ReceiptFooterNote,
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

    private static decimal CalculateDiscount(Promotion promo, decimal subTotal, List<PromoLineItemDto> items)
    {
        decimal applicableBaseAmount = subTotal;

        if (promo.TargetType == "Category" && promo.TargetId.HasValue)
        {
            // Giảm theo danh mục món ăn (STT 65)
            applicableBaseAmount = items.Where(i => i.CategoryId == promo.TargetId.Value).Sum(i => i.TotalPrice);
        }
        else if (promo.TargetType == "MenuItem" && promo.TargetId.HasValue)
        {
            // Giảm theo món ăn cụ thể (STT 65)
            applicableBaseAmount = items.Where(i => i.MenuItemId == promo.TargetId.Value).Sum(i => i.TotalPrice);
        }

        if (applicableBaseAmount <= 0) return 0;

        decimal discount = 0;
        if (promo.DiscountType == "Percent")
        {
            discount = Math.Round(applicableBaseAmount * (promo.DiscountValue / 100m), 0);
            if (promo.MaxDiscountAmount.HasValue && promo.MaxDiscountAmount.Value > 0)
            {
                discount = Math.Min(discount, promo.MaxDiscountAmount.Value);
            }
        }
        else // FixedAmount
        {
            discount = Math.Min(promo.DiscountValue, applicableBaseAmount);
        }

        return Math.Max(0, discount);
    }
}
