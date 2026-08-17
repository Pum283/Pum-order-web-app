"use client";

import React, { useState, useEffect } from "react";
import {
  api,
  BranchDto,
  PaymentGatewayConfigDto,
  SavePaymentGatewayConfigRequest,
} from "@/shared/api/client";
import { useAuth } from "@/shared/context/AuthContext";
import {
  CreditCard,
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  QrCode,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function PaymentGatewaysPage() {
  const { user, token, isLoading: authLoading } = useAuth();

  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [configs, setConfigs] = useState<PaymentGatewayConfigDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states per provider
  const [vnpayState, setVnpayState] = useState<SavePaymentGatewayConfigRequest>({
    provider: "VNPay",
    isActive: true,
    isSandbox: true,
    merchantId: "PUMVNPAY",
    secretKey: "VNPAYSECRETKEYPUM2026ORDERREST",
    endpointUrl: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl: "http://pumorder.runasp.net/payment/callback",
    ipnUrl: "http://pumorderapi.runasp.net/api/payment-gateways/vnpay/ipn",
  });

  const [momoState, setMomoState] = useState<SavePaymentGatewayConfigRequest>({
    provider: "MoMo",
    isActive: true,
    isSandbox: true,
    merchantId: "MOMOPUM01",
    secretKey: "MOMOSECRETKEY123456",
    accessKey: "MOMOACCESS01",
    endpointUrl: "https://test-payment.momo.vn/v2/gateway/api/create",
    returnUrl: "http://pumorder.runasp.net/payment/callback",
    ipnUrl: "http://pumorderapi.runasp.net/api/payment-gateways/momo/ipn",
  });

  useEffect(() => {
    if (!token && !authLoading) return;
    loadData();
  }, [token, authLoading, selectedBranchId]);

  const loadData = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const [branchList, configList] = await Promise.all([
        api.getBranches(),
        api.getPaymentGatewayConfigs(selectedBranchId === "ALL" ? undefined : selectedBranchId),
      ]);
      setBranches(branchList);
      setConfigs(configList);

      const vnConfig = configList.find((c) => c.provider.toLowerCase() === "vnpay");
      if (vnConfig) {
        setVnpayState({
          branchId: selectedBranchId === "ALL" ? undefined : selectedBranchId,
          provider: "VNPay",
          isActive: vnConfig.isActive,
          isSandbox: vnConfig.isSandbox,
          merchantId: vnConfig.merchantId,
          secretKey: vnConfig.secretKey,
          endpointUrl: vnConfig.endpointUrl || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
          returnUrl: vnConfig.returnUrl || "http://pumorder.runasp.net/payment/callback",
          ipnUrl: vnConfig.ipnUrl || "http://pumorderapi.runasp.net/api/payment-gateways/vnpay/ipn",
        });
      }

      const mmConfig = configList.find((c) => c.provider.toLowerCase() === "momo");
      if (mmConfig) {
        setMomoState({
          branchId: selectedBranchId === "ALL" ? undefined : selectedBranchId,
          provider: "MoMo",
          isActive: mmConfig.isActive,
          isSandbox: mmConfig.isSandbox,
          merchantId: mmConfig.merchantId,
          secretKey: mmConfig.secretKey,
          accessKey: mmConfig.accessKey || "",
          endpointUrl: mmConfig.endpointUrl || "https://test-payment.momo.vn/v2/gateway/api/create",
          returnUrl: mmConfig.returnUrl || "http://pumorder.runasp.net/payment/callback",
          ipnUrl: mmConfig.ipnUrl || "http://pumorderapi.runasp.net/api/payment-gateways/momo/ipn",
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      setMsg({ type: "error", text: "Lỗi tải cấu hình: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (provider: string, data: SavePaymentGatewayConfigRequest) => {
    setSavingProvider(provider);
    setMsg(null);
    try {
      await api.savePaymentGatewayConfig({
        ...data,
        branchId: selectedBranchId === "ALL" ? undefined : selectedBranchId,
      });
      setMsg({ type: "success", text: `Đã lưu cấu hình cổng ${provider} thành công!` });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setMsg({ type: "error", text: "Lỗi lưu cấu hình: " + error.message });
    } finally {
      setSavingProvider(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                CỔNG THANH TOÁN ĐIỆN TỬ
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold">
                  STT 102
                </span>
              </h1>
              <p className="text-xs text-stone-400">
                Tích hợp VNPay, MoMo, ZaloPay, VietQR động — kết nối ngoài duy nhất liên quan dòng tiền
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-stone-900 border border-stone-800 text-stone-200 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Toàn hệ thống (Mặc định)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-400" : ""}`} />
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 font-medium ${
            msg.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Gateway Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================== */}
        {/* VNPAY GATEWAY CONFIG (STT 102)             */}
        {/* ========================================== */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center font-black text-sky-400 text-sm">
                VNPAY
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Cổng thanh toán VNPay
                  {vnpayState.isSandbox && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                      Sandbox (Test)
                    </span>
                  )}
                </h3>
                <span className="text-[11px] text-stone-400">
                  Hỗ trợ quét QR VNPAY-QR, Thẻ ATM Nội địa & Thẻ Quốc tế
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="vnpayActive"
                checked={vnpayState.isActive}
                onChange={(e) => setVnpayState((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
              <label htmlFor="vnpayActive" className="text-xs font-bold text-stone-300 cursor-pointer">
                Kích hoạt
              </label>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* Mode selection */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setVnpayState((prev) => ({
                    ...prev,
                    isSandbox: true,
                    endpointUrl: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
                  }))
                }
                className={`py-2 rounded-xl font-bold border transition ${
                  vnpayState.isSandbox
                    ? "bg-amber-500/20 text-amber-300 border-amber-500"
                    : "bg-stone-950 text-stone-400 border-stone-800"
                }`}
              >
                Môi trường Sandbox (Thử nghiệm)
              </button>
              <button
                type="button"
                onClick={() =>
                  setVnpayState((prev) => ({
                    ...prev,
                    isSandbox: false,
                    endpointUrl: "https://pay.vnpay.vn/vpcpay.html",
                  }))
                }
                className={`py-2 rounded-xl font-bold border transition ${
                  !vnpayState.isSandbox
                    ? "bg-sky-500/20 text-sky-300 border-sky-500"
                    : "bg-stone-950 text-stone-400 border-stone-800"
                }`}
              >
                Môi trường Production (Thật)
              </button>
            </div>

            <div>
              <label className="block text-stone-300 font-bold mb-1">Mã Website (vnp_TmnCode):</label>
              <input
                type="text"
                value={vnpayState.merchantId}
                onChange={(e) => setVnpayState((prev) => ({ ...prev, merchantId: e.target.value }))}
                placeholder="VD: PUMVNPAY"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-sky-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-bold mb-1">Chuỗi bí mật tạo Checksum (vnp_HashSecret):</label>
              <input
                type="password"
                value={vnpayState.secretKey}
                onChange={(e) => setVnpayState((prev) => ({ ...prev, secretKey: e.target.value }))}
                placeholder="Khóa bí mật HMAC-SHA512..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-bold mb-1">Địa chỉ Cổng VNPay (vnp_Url):</label>
              <input
                type="text"
                value={vnpayState.endpointUrl || ""}
                onChange={(e) => setVnpayState((prev) => ({ ...prev, endpointUrl: e.target.value }))}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-300 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-bold mb-1">Địa chỉ Nhận kết quả (vnp_ReturnUrl):</label>
              <input
                type="text"
                value={vnpayState.returnUrl || ""}
                onChange={(e) => setVnpayState((prev) => ({ ...prev, returnUrl: e.target.value }))}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-300 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
            <span className="text-[11px] text-stone-500">Chuẩn HMAC-SHA512 v2.1.0</span>
            <button
              type="button"
              disabled={savingProvider === "VNPay"}
              onClick={() => handleSaveConfig("VNPay", vnpayState)}
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-stone-950 text-xs font-black shadow-lg shadow-sky-500/20 transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProvider === "VNPay" ? "Đang lưu..." : "Lưu Cổng VNPay"}</span>
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* MOMO GATEWAY CONFIG (STT 102)              */}
        {/* ========================================== */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center font-black text-pink-400 text-sm">
                MOMO
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Cổng Ví MoMo Pay
                  {momoState.isSandbox && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                      Sandbox (Test)
                    </span>
                  )}
                </h3>
                <span className="text-[11px] text-stone-400">
                  Thanh toán qua Ví MoMo, Quét mã QR MoMo & App-to-App
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="momoActive"
                checked={momoState.isActive}
                onChange={(e) => setMomoState((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
              />
              <label htmlFor="momoActive" className="text-xs font-bold text-stone-300 cursor-pointer">
                Kích hoạt
              </label>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* Mode selection */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMomoState((prev) => ({ ...prev, isSandbox: true }))}
                className={`py-2 rounded-xl font-bold border transition ${
                  momoState.isSandbox
                    ? "bg-amber-500/20 text-amber-300 border-amber-500"
                    : "bg-stone-950 text-stone-400 border-stone-800"
                }`}
              >
                Môi trường Sandbox
              </button>
              <button
                type="button"
                onClick={() => setMomoState((prev) => ({ ...prev, isSandbox: false }))}
                className={`py-2 rounded-xl font-bold border transition ${
                  !momoState.isSandbox
                    ? "bg-pink-500/20 text-pink-300 border-pink-500"
                    : "bg-stone-950 text-stone-400 border-stone-800"
                }`}
              >
                Môi trường Live (Doanh nghiệp)
              </button>
            </div>

            <div>
              <label className="block text-stone-300 font-bold mb-1">Mã Đối Tác (Partner Code):</label>
              <input
                type="text"
                value={momoState.merchantId}
                onChange={(e) => setMomoState((prev) => ({ ...prev, merchantId: e.target.value }))}
                placeholder="VD: MOMOPUM01"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-pink-400 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-bold mb-1">Khóa Truy Cập (Access Key):</label>
              <input
                type="text"
                value={momoState.accessKey || ""}
                onChange={(e) => setMomoState((prev) => ({ ...prev, accessKey: e.target.value }))}
                placeholder="MoMo Access Key..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-bold mb-1">Khóa Bí Mật (Secret Key):</label>
              <input
                type="password"
                value={momoState.secretKey}
                onChange={(e) => setMomoState((prev) => ({ ...prev, secretKey: e.target.value }))}
                placeholder="MoMo Secret Key..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-bold mb-1">Địa chỉ Nhận kết quả (Return Url):</label>
              <input
                type="text"
                value={momoState.returnUrl || ""}
                onChange={(e) => setMomoState((prev) => ({ ...prev, returnUrl: e.target.value }))}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-300 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
            <span className="text-[11px] text-stone-500">Chuẩn MoMo API v2</span>
            <button
              type="button"
              disabled={savingProvider === "MoMo"}
              onClick={() => handleSaveConfig("MoMo", momoState)}
              className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-stone-950 text-xs font-black shadow-lg shadow-pink-500/20 transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProvider === "MoMo" ? "Đang lưu..." : "Lưu Cổng MoMo"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
