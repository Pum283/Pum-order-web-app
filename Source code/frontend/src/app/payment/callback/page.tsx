"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api, GatewayCallbackResultDto } from "@/shared/api/client";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Receipt,
  ArrowLeft,
  Store,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<GatewayCallbackResultDto | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const queryStr = searchParams.toString();
        const provider = searchParams.get("provider");

        let res: GatewayCallbackResultDto;
        if (provider === "momo" || searchParams.has("orderId")) {
          res = await api.processMoMoCallback(queryStr);
        } else {
          // Default is VNPay
          res = await api.processVNPayCallback(queryStr);
        }

        setResult(res);
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message || "Lỗi xử lý kết quả thanh toán.");
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 text-stone-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-amber-500/20">
            P
          </div>
          <span className="text-base font-extrabold tracking-tight text-white">OrderPum Pay</span>
        </div>

        {loading ? (
          <div className="py-12 space-y-3">
            <RefreshCw className="w-10 h-10 animate-spin text-amber-400 mx-auto" />
            <p className="text-sm font-bold text-white">Đang xác thực giao dịch từ Cổng thanh toán...</p>
            <p className="text-xs text-stone-400">Vui lòng không tắt hoặc tải lại trang web.</p>
          </div>
        ) : errorMsg ? (
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <XCircle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">GIAO DỊCH KHÔNG THÀNH CÔNG</h2>
              <p className="text-xs text-rose-300 mt-1">{errorMsg}</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại trang chủ</span>
            </Link>
          </div>
        ) : result && result.isSuccess ? (
          <div className="py-4 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">THANH TOÁN THÀNH CÔNG!</h2>
              <p className="text-xs text-stone-400 mt-1">{result.message}</p>
            </div>

            {/* Receipt Summary Box */}
            <div className="bg-stone-950 rounded-2xl p-4 border border-stone-800/80 text-xs space-y-2 text-left">
              <div className="flex justify-between text-stone-400 pb-2 border-b border-stone-800">
                <span>Mã hóa đơn:</span>
                <strong className="font-mono text-amber-400">#{result.invoiceNumber}</strong>
              </div>

              <div className="flex justify-between text-stone-400">
                <span>Số tiền thanh toán:</span>
                <span className="font-mono text-emerald-400 font-extrabold text-sm">
                  {result.amount.toLocaleString("vi-VN")}đ
                </span>
              </div>

              {result.bankCode && (
                <div className="flex justify-between text-stone-400">
                  <span>Ngân hàng / Kênh:</span>
                  <span className="font-bold text-stone-200">{result.bankCode}</span>
                </div>
              )}

              {result.transactionNo && (
                <div className="flex justify-between text-stone-400">
                  <span>Mã GD Cổng:</span>
                  <span className="font-mono text-stone-300">{result.transactionNo}</span>
                </div>
              )}

              {result.payDate && (
                <div className="flex justify-between text-stone-400">
                  <span>Thời gian:</span>
                  <span className="font-mono text-stone-400">{result.payDate}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/admin/pos"
                className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-lg transition"
              >
                Về Màn hình POS
              </Link>
              <Link
                href="/admin/invoices"
                className="flex-1 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-700 transition"
              >
                Xem Hóa đơn
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <XCircle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">THANH TOÁN THẤT BẠI HOẶC ĐÃ HỦY</h2>
              <p className="text-xs text-stone-400 mt-1">{result?.message || "Giao dịch không thành công."}</p>
            </div>
            <Link
              href="/admin/pos"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại POS để thử lại</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mr-2" /> Đang tải dữ liệu thanh toán...
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
