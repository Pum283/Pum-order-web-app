using Microsoft.EntityFrameworkCore;
using OrderPum.Application.DTOs.Payment;
using OrderPum.Application.Interfaces.Services.Payment;
using OrderPum.Domain.Entities.Payment;
using OrderPum.Infrastructure.Persistence;

namespace OrderPum.Infrastructure.Implementations.Services.Payment;

public class PaymentGatewayService(AppDbContext db) : IPaymentGatewayService
{
    private const string DefaultVNPaySandboxTmnCode = "PUMVNPAY";
    private const string DefaultVNPaySandboxHashSecret = "VNPAYSECRETKEYPUM2026ORDERREST";
    private const string DefaultVNPaySandboxUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    public async Task<List<PaymentGatewayConfigDto>> GetGatewayConfigsAsync(
        Guid? branchId = null,
        CancellationToken ct = default)
    {
        var query = db.PaymentGatewayConfigs.Where(c => !c.IsDeleted);
        if (branchId.HasValue && branchId.Value != Guid.Empty)
        {
            query = query.Where(c => c.BranchId == null || c.BranchId == branchId.Value);
        }

        var list = await query.OrderBy(c => c.Provider).ToListAsync(ct);
        var branches = await db.Branches.ToListAsync(ct);

        // Ensure default providers (VNPay, MoMo, ZaloPay, VietQR) exist in returned list
        var providers = new[] { "VNPay", "MoMo", "ZaloPay", "VietQR" };
        var result = new List<PaymentGatewayConfigDto>();

        foreach (var p in providers)
        {
            var existing = list.FirstOrDefault(c => c.Provider.Equals(p, StringComparison.OrdinalIgnoreCase));
            if (existing != null)
            {
                var branch = existing.BranchId.HasValue ? branches.FirstOrDefault(b => b.Id == existing.BranchId.Value) : null;
                result.Add(new PaymentGatewayConfigDto
                {
                    Id = existing.Id,
                    BranchId = existing.BranchId,
                    BranchName = branch?.Name ?? "Toàn hệ thống (Mặc định)",
                    Provider = existing.Provider,
                    IsActive = existing.IsActive,
                    IsSandbox = existing.IsSandbox,
                    MerchantId = existing.MerchantId,
                    SecretKey = existing.SecretKey,
                    AccessKey = existing.AccessKey,
                    EndpointUrl = existing.EndpointUrl,
                    ReturnUrl = existing.ReturnUrl,
                    IpnUrl = existing.IpnUrl,
                    CreatedAt = existing.CreatedAt
                });
            }
            else
            {
                result.Add(new PaymentGatewayConfigDto
                {
                    Id = Guid.Empty,
                    BranchId = branchId,
                    BranchName = "Chưa cấu hình",
                    Provider = p,
                    IsActive = p is "VNPay" or "VietQR",
                    IsSandbox = true,
                    MerchantId = p == "VNPay" ? DefaultVNPaySandboxTmnCode : "",
                    SecretKey = p == "VNPay" ? DefaultVNPaySandboxHashSecret : "",
                    EndpointUrl = p == "VNPay" ? DefaultVNPaySandboxUrl : "",
                    ReturnUrl = "http://pumorder.runasp.net/payment/callback",
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        return result;
    }

    public async Task<PaymentGatewayConfigDto> SaveGatewayConfigAsync(
        SavePaymentGatewayConfigRequest request,
        CancellationToken ct = default)
    {
        var existing = await db.PaymentGatewayConfigs.FirstOrDefaultAsync(
            c => c.Provider.ToLower() == request.Provider.ToLower() &&
                 c.BranchId == (request.BranchId == Guid.Empty ? null : request.BranchId) &&
                 !c.IsDeleted, ct);

        if (existing == null)
        {
            existing = new PaymentGatewayConfig
            {
                Id = Guid.NewGuid(),
                BranchId = request.BranchId == Guid.Empty ? null : request.BranchId,
                Provider = request.Provider.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            db.PaymentGatewayConfigs.Add(existing);
        }

        existing.IsActive = request.IsActive;
        existing.IsSandbox = request.IsSandbox;
        existing.MerchantId = request.MerchantId.Trim();
        existing.SecretKey = request.SecretKey.Trim();
        existing.AccessKey = request.AccessKey?.Trim();
        existing.EndpointUrl = request.EndpointUrl?.Trim();
        existing.ReturnUrl = request.ReturnUrl?.Trim();
        existing.IpnUrl = request.IpnUrl?.Trim();
        existing.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        var branch = existing.BranchId.HasValue ? await db.Branches.FirstOrDefaultAsync(b => b.Id == existing.BranchId.Value, ct) : null;

        return new PaymentGatewayConfigDto
        {
            Id = existing.Id,
            BranchId = existing.BranchId,
            BranchName = branch?.Name ?? "Toàn hệ thống (Mặc định)",
            Provider = existing.Provider,
            IsActive = existing.IsActive,
            IsSandbox = existing.IsSandbox,
            MerchantId = existing.MerchantId,
            SecretKey = existing.SecretKey,
            AccessKey = existing.AccessKey,
            EndpointUrl = existing.EndpointUrl,
            ReturnUrl = existing.ReturnUrl,
            IpnUrl = existing.IpnUrl,
            CreatedAt = existing.CreatedAt
        };
    }

    public async Task<GatewayPaymentUrlResultDto> CreateVNPayPaymentUrlAsync(
        Guid invoiceId,
        string clientIp,
        string? returnUrl = null,
        string? bankCode = null,
        CancellationToken ct = default)
    {
        var invoice = await db.Invoices.FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy hóa đơn cần thanh toán.");

        if (invoice.PaymentStatus == "Paid")
            throw new InvalidOperationException("Hóa đơn đã được thanh toán hoàn tất.");

        var config = await db.PaymentGatewayConfigs.FirstOrDefaultAsync(
            c => c.Provider == "VNPay" &&
                (c.BranchId == invoice.BranchId || c.BranchId == null) &&
                c.IsActive && !c.IsDeleted, ct);

        var tmnCode = !string.IsNullOrWhiteSpace(config?.MerchantId) ? config.MerchantId : DefaultVNPaySandboxTmnCode;
        var hashSecret = !string.IsNullOrWhiteSpace(config?.SecretKey) ? config.SecretKey : DefaultVNPaySandboxHashSecret;
        var baseUrl = !string.IsNullOrWhiteSpace(config?.EndpointUrl) ? config.EndpointUrl : DefaultVNPaySandboxUrl;
        var finalReturnUrl = returnUrl ?? config?.ReturnUrl ?? "http://pumorder.runasp.net/payment/callback";

        var vnpay = new VNPayHelper();
        var vnTime = DateTime.UtcNow.AddHours(7);
        var txnRef = $"{invoice.Id:N}_{vnTime.Ticks.ToString()[^6..]}";
        var amountInCents = (long)(invoice.FinalAmount * 100);

        vnpay.AddRequestData("vnp_Version", "2.1.0");
        vnpay.AddRequestData("vnp_Command", "pay");
        vnpay.AddRequestData("vnp_TmnCode", tmnCode);
        vnpay.AddRequestData("vnp_Amount", amountInCents.ToString());
        vnpay.AddRequestData("vnp_CreateDate", vnTime.ToString("yyyyMMddHHmmss"));
        vnpay.AddRequestData("vnp_CurrCode", "VND");
        vnpay.AddRequestData("vnp_IpAddr", string.IsNullOrWhiteSpace(clientIp) ? "127.0.0.1" : clientIp);
        vnpay.AddRequestData("vnp_Locale", "vn");
        vnpay.AddRequestData("vnp_OrderInfo", $"Thanh toan hoa don #{invoice.InvoiceNumber} - Ban {invoice.TableCodeSnapshot}");
        vnpay.AddRequestData("vnp_OrderType", "other");
        vnpay.AddRequestData("vnp_ReturnUrl", finalReturnUrl);
        vnpay.AddRequestData("vnp_TxnRef", txnRef);

        if (!string.IsNullOrWhiteSpace(bankCode))
        {
            vnpay.AddRequestData("vnp_BankCode", bankCode);
        }

        var paymentUrl = vnpay.CreateRequestUrl(baseUrl, hashSecret);

        return new GatewayPaymentUrlResultDto
        {
            Success = true,
            PaymentUrl = paymentUrl,
            TransactionReference = txnRef,
            Message = "Tạo liên kết thanh toán VNPay thành công."
        };
    }

    public async Task<GatewayCallbackResultDto> ProcessVNPayCallbackAsync(
        IDictionary<string, string> queryParams,
        bool isIpn = false,
        CancellationToken ct = default)
    {
        if (!queryParams.TryGetValue("vnp_TxnRef", out var txnRef) || string.IsNullOrEmpty(txnRef))
        {
            return new GatewayCallbackResultDto { IsSuccess = false, RspCode = "99", Message = "Thiếu mã giao dịch vnp_TxnRef." };
        }

        queryParams.TryGetValue("vnp_ResponseCode", out var responseCode);
        queryParams.TryGetValue("vnp_TransactionNo", out var transactionNo);
        queryParams.TryGetValue("vnp_BankCode", out var bankCode);
        queryParams.TryGetValue("vnp_PayDate", out var payDate);
        queryParams.TryGetValue("vnp_Amount", out var amountStr);

        var rawInvoiceId = txnRef.Split('_')[0];
        if (!Guid.TryParse(rawInvoiceId, out var invoiceId))
        {
            return new GatewayCallbackResultDto { IsSuccess = false, RspCode = "01", Message = "Mã hóa đơn không đúng định dạng." };
        }

        var invoice = await db.Invoices
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted, ct);

        if (invoice == null)
        {
            return new GatewayCallbackResultDto { IsSuccess = false, RspCode = "01", Message = "Không tìm thấy hóa đơn." };
        }

        decimal.TryParse(amountStr, out var rawAmount);
        var paidAmount = rawAmount > 0 ? rawAmount / 100m : invoice.FinalAmount;

        var isSuccess = responseCode == "00";

        if (isSuccess && invoice.PaymentStatus != "Paid")
        {
            // Ghi nhận giao dịch thanh toán thành công
            var paymentTxn = new PaymentTransaction
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoice.Id,
                PaymentMethod = "VNPay",
                Amount = paidAmount,
                TransactionCode = transactionNo ?? txnRef,
                Note = $"Cổng VNPay - Ngân hàng: {bankCode} - Ngày: {payDate}",
                Status = "Success",
                PaidAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            db.Payments.Add(paymentTxn);

            invoice.PaidAmount += paidAmount;
            invoice.PaymentStatus = "Paid";
            invoice.PaidAt = DateTime.UtcNow;
            invoice.UpdatedAt = DateTime.UtcNow;

            // Đóng phiên bàn và cập nhật bàn sang trạng thái Chờ dọn dẹp
            var session = await db.TableSessions.FirstOrDefaultAsync(s => s.Id == invoice.SessionId && !s.IsDeleted, ct);
            if (session != null && session.Status != OrderPum.Domain.Enums.Order.TableSessionStatus.Closed)
            {
                session.Status = OrderPum.Domain.Enums.Order.TableSessionStatus.Closed;
                session.ClosedAt = DateTime.UtcNow;
                session.UpdatedAt = DateTime.UtcNow;

                var table = await db.Tables.FirstOrDefaultAsync(t => t.Id == session.TableId && !t.IsDeleted, ct);
                if (table != null)
                {
                    table.Status = "NeedsCleaning";
                    table.UpdatedAt = DateTime.UtcNow;
                }
            }

            await db.SaveChangesAsync(ct);
        }

        return new GatewayCallbackResultDto
        {
            IsSuccess = isSuccess,
            RspCode = responseCode ?? (isSuccess ? "00" : "99"),
            Message = isSuccess ? "Giao dịch VNPay thành công. Hóa đơn đã được thanh toán!" : "Giao dịch VNPay không thành công hoặc bị hủy.",
            InvoiceId = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            Amount = paidAmount,
            TransactionNo = transactionNo,
            BankCode = bankCode,
            PayDate = payDate
        };
    }

    public async Task<GatewayPaymentUrlResultDto> CreateMoMoPaymentUrlAsync(
        Guid invoiceId,
        string? returnUrl = null,
        CancellationToken ct = default)
    {
        var invoice = await db.Invoices.FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted, ct)
            ?? throw new InvalidOperationException("Không tìm thấy hóa đơn.");

        if (invoice.PaymentStatus == "Paid")
            throw new InvalidOperationException("Hóa đơn đã được thanh toán hoàn tất.");

        var txnRef = $"{invoice.Id:N}_{DateTime.UtcNow.Ticks.ToString()[^6..]}";
        var finalReturnUrl = returnUrl ?? "http://pumorder.runasp.net/payment/callback";

        // MoMo Pay simulation QR & Deep link
        var momoQr = $"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=2|99|0969999888|OrderPum|director@pum.vn|0|0|{(int)invoice.FinalAmount}|HD{invoice.InvoiceNumber}|transfer_myqr";

        return new GatewayPaymentUrlResultDto
        {
            Success = true,
            PaymentUrl = $"{finalReturnUrl}?provider=momo&orderId={txnRef}&amount={invoice.FinalAmount}&resultCode=0&message=Thanh+toan+MoMo+thanh+cong",
            QrCodeUrl = momoQr,
            TransactionReference = txnRef,
            Message = "Tạo cổng MoMo Pay thành công."
        };
    }

    public async Task<GatewayCallbackResultDto> ProcessMoMoCallbackAsync(
        IDictionary<string, string> queryParams,
        bool isIpn = false,
        CancellationToken ct = default)
    {
        if (!queryParams.TryGetValue("orderId", out var orderId) || string.IsNullOrEmpty(orderId))
        {
            return new GatewayCallbackResultDto { IsSuccess = false, RspCode = "99", Message = "Thiếu mã đơn hàng MoMo." };
        }

        var rawInvoiceId = orderId.Split('_')[0];
        if (!Guid.TryParse(rawInvoiceId, out var invoiceId))
        {
            return new GatewayCallbackResultDto { IsSuccess = false, RspCode = "01", Message = "Mã hóa đơn không đúng." };
        }

        var invoice = await db.Invoices.FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted, ct);
        if (invoice == null)
        {
            return new GatewayCallbackResultDto { IsSuccess = false, RspCode = "01", Message = "Không tìm thấy hóa đơn." };
        }

        queryParams.TryGetValue("resultCode", out var resultCode);
        var isSuccess = resultCode == "0" || string.IsNullOrEmpty(resultCode);

        if (isSuccess && invoice.PaymentStatus != "Paid")
        {
            var paymentTxn = new PaymentTransaction
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoice.Id,
                PaymentMethod = "EWallet",
                Amount = invoice.FinalAmount,
                TransactionCode = orderId,
                Note = "Cổng Ví Điện Tử MoMo Pay",
                Status = "Success",
                PaidAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            db.Payments.Add(paymentTxn);
            invoice.PaidAmount += invoice.FinalAmount;
            invoice.PaymentStatus = "Paid";
            invoice.PaidAt = DateTime.UtcNow;
            invoice.UpdatedAt = DateTime.UtcNow;

            var session = await db.TableSessions.FirstOrDefaultAsync(s => s.Id == invoice.SessionId && !s.IsDeleted, ct);
            if (session != null && session.Status != OrderPum.Domain.Enums.Order.TableSessionStatus.Closed)
            {
                session.Status = OrderPum.Domain.Enums.Order.TableSessionStatus.Closed;
                session.ClosedAt = DateTime.UtcNow;
                session.UpdatedAt = DateTime.UtcNow;

                var table = await db.Tables.FirstOrDefaultAsync(t => t.Id == session.TableId && !t.IsDeleted, ct);
                if (table != null)
                {
                    table.Status = "NeedsCleaning";
                    table.UpdatedAt = DateTime.UtcNow;
                }
            }

            await db.SaveChangesAsync(ct);
        }

        return new GatewayCallbackResultDto
        {
            IsSuccess = isSuccess,
            RspCode = resultCode ?? "0",
            Message = isSuccess ? "Thanh toán MoMo thành công!" : "Giao dịch MoMo bị hủy.",
            InvoiceId = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            Amount = invoice.FinalAmount
        };
    }
}
