"use client";

import React, { useState, useEffect } from "react";
import {
  api,
  BranchDto,
  RevenueReportResponseDto,
} from "@/shared/api/client";
import { useAuth } from "@/shared/context/AuthContext";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Target,
  Percent,
  Calendar,
  Building2,
  RefreshCw,
  CreditCard,
  UtensilsCrossed,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PieChart,
  ShoppingBag,
} from "lucide-react";

export default function RevenueReportsPage() {
  const { user, token, isLoading: authLoading, canManageUsers } = useAuth();

  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [preset, setPreset] = useState<string>("Today");
  const [customFrom, setCustomFrom] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [customTo, setCustomTo] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [report, setReport] = useState<RevenueReportResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token && !authLoading) return;
    loadBranches();
  }, [token, authLoading]);

  useEffect(() => {
    loadReport();
  }, [selectedBranchId, preset, customFrom, customTo]);

  const loadBranches = async () => {
    try {
      const list = await api.getBranches();
      setBranches(list);
    } catch {
      // ignore
    }
  };

  const loadReport = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getRevenueReport({
        branchId: selectedBranchId === "ALL" ? undefined : selectedBranchId,
        preset: preset,
        fromDate: preset === "Custom" ? customFrom : undefined,
        toDate: preset === "Custom" ? customTo : undefined,
      });
      setReport(res);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Lỗi tải dữ liệu báo cáo.");
    } finally {
      setLoading(false);
    }
  };

  const maxTimelineRevenue = Math.max(
    ...(report?.timeline.map((t) => t.revenue) || [1]),
    1
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                BÁO CÁO DOANH THU & HIỆU SUẤT
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                  STT 83-87
                </span>
              </h1>
              <p className="text-xs text-stone-400">
                Thống kê doanh thu theo thời gian, tỷ trọng thanh toán, top món bán chạy và so sánh chi nhánh
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {branches.length > 0 && (
            <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-stone-200 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-stone-900 text-white">
                  Toàn chuỗi nhà hàng
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-stone-900 text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={loadReport}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Preset Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap border-b border-stone-800 pb-3 text-xs">
        {[
          { id: "Today", label: "Hôm nay" },
          { id: "Yesterday", label: "Hôm qua" },
          { id: "ThisWeek", label: "7 ngày qua (Tuần này)" },
          { id: "ThisMonth", label: "Tháng này" },
          { id: "LastMonth", label: "Tháng trước" },
          { id: "Custom", label: "Tùy chọn ngày" },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
              preset === p.id
                ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                : "bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200"
            }`}
          >
            {p.label}
          </button>
        ))}

        {preset === "Custom" && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-stone-900 border border-stone-800 text-stone-200 rounded-xl px-2.5 py-1 text-xs font-mono"
            />
            <span className="text-stone-500">đến</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-stone-900 border border-stone-800 text-stone-200 rounded-xl px-2.5 py-1 text-xs font-mono"
            />
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
          {errorMsg}
        </div>
      )}

      {/* 4 Golden KPI Metric Cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Revenue */}
          <div className="bg-stone-900 border border-amber-500/30 rounded-3xl p-5 shadow-xl space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Tổng Doanh Thu Thuần
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
              {report.summary.totalRevenue.toLocaleString("vi-VN")}đ
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
              {report.summary.growthRate >= 0 ? (
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{report.summary.growthRate}%
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {report.summary.growthRate}%
                </span>
              )}
              <span className="text-stone-500">so với kỳ trước ({report.summary.previousPeriodRevenue.toLocaleString("vi-VN")}đ)</span>
            </div>
          </div>

          {/* Card 2: Total Invoices */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Tổng Hóa Đơn Đã Thu
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
                <Receipt className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-black font-mono text-white">
              {report.summary.totalInvoicesCount}{" "}
              <span className="text-sm font-normal text-stone-400">đơn</span>
            </div>

            <div className="text-[11px] text-stone-400 flex justify-between">
              <span>Tạm tính món:</span>
              <span className="font-mono text-stone-200">{report.summary.totalGrossSales.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>

          {/* Card 3: Average Order Value (AOV) */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Giá Trị TB / Đơn (AOV)
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Target className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-black font-mono text-purple-300">
              {report.summary.averageOrderValue.toLocaleString("vi-VN")}đ
            </div>

            <div className="text-[11px] text-stone-400">
              Trung bình mỗi bàn thanh toán
            </div>
          </div>

          {/* Card 4: Discounts & Fees */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Khuyến Mãi & Thuế Phí
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                <Percent className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-black font-mono text-rose-400">
              -{report.summary.totalDiscount.toLocaleString("vi-VN")}đ
            </div>

            <div className="text-[11px] text-stone-400 flex justify-between">
              <span>VAT: {report.summary.totalTax.toLocaleString("vi-VN")}đ</span>
              <span>Phí DV: {report.summary.totalServiceCharge.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Revenue Bar Chart */}
      {report && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Biểu Đồ Doanh Thu Theo Mốc Thời Gian (STT 83)</span>
              </h3>
              <span className="text-xs text-stone-400">
                {preset === "Today" || preset === "Yesterday"
                  ? "Phân bổ theo từng khung giờ trong ngày"
                  : "Phân bổ theo từng ngày trong giai đoạn"}
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="pt-4 overflow-x-auto">
            <div className="min-w-[600px] h-56 flex items-end gap-2 sm:gap-3 border-b border-stone-800 pb-2 px-2">
              {report.timeline.map((point, idx) => {
                const heightPercent = maxTimelineRevenue > 0 ? (point.revenue / maxTimelineRevenue) * 100 : 0;
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1.5 group relative"
                  >
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-14 opacity-0 group-hover:opacity-100 bg-stone-950 border border-stone-700 text-stone-200 text-[10px] p-1.5 rounded-xl shadow-2xl transition pointer-events-none z-20 whitespace-nowrap">
                      <div className="font-bold text-white">{point.label}</div>
                      <div className="font-mono text-amber-400">
                        {point.revenue.toLocaleString("vi-VN")}đ ({point.invoiceCount} đơn)
                      </div>
                    </div>

                    {/* Bar */}
                    <div className="w-full flex items-end justify-center h-44">
                      <div
                        className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-amber-600 to-amber-400 group-hover:from-amber-500 group-hover:to-yellow-300 transition-all duration-300 shadow-md shadow-amber-500/10"
                        style={{ height: `${Math.max(heightPercent, point.revenue > 0 ? 8 : 2)}%` }}
                      />
                    </div>

                    {/* Label */}
                    <span className="text-[10px] font-mono text-stone-400 truncate w-full text-center">
                      {point.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Grid 2 Columns: Payment Methods & Top Selling Items */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Payment Methods Breakdown (STT 87) */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-400" />
                <span>Phương Thức Thanh Toán (STT 87)</span>
              </h3>
              <span className="text-xs text-stone-400 font-mono">
                {report.paymentMethods.length} kênh
              </span>
            </div>

            <div className="space-y-3.5">
              {report.paymentMethods.map((pm) => (
                <div key={pm.paymentMethod} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pm.colorHex }} />
                      <strong className="text-stone-200">{pm.displayName}</strong>
                      <span className="text-stone-500 text-[11px]">({pm.transactionCount} GD)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-white">
                        {pm.totalAmount.toLocaleString("vi-VN")}đ
                      </span>
                      <span className="font-mono text-stone-400 text-[11px] w-12 text-right">
                        {pm.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-stone-950 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pm.percentage}%`,
                        backgroundColor: pm.colorHex,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Top Selling Items (STT 86) */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                <span>Top Món Bán Chạy Nhất (STT 86)</span>
              </h3>
              <span className="text-xs text-stone-400 font-mono">
                Xếp theo doanh thu
              </span>
            </div>

            <div className="space-y-2.5">
              {report.topSellingItems.length > 0 ? (
                report.topSellingItems.map((item, idx) => (
                  <div
                    key={item.productId}
                    className="p-2.5 rounded-2xl bg-stone-950 border border-stone-800/80 flex items-center justify-between text-xs hover:border-stone-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-xl flex items-center justify-center font-mono font-bold text-[11px] ${
                          idx === 0
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : idx === 1
                            ? "bg-stone-300/20 text-stone-200 border border-stone-300/30"
                            : idx === 2
                            ? "bg-amber-700/20 text-amber-600 border border-amber-700/30"
                            : "bg-stone-800 text-stone-400"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-white">{item.productName}</div>
                        <span className="text-[10px] text-stone-400 font-semibold">{item.categoryName}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-emerald-400">
                        {item.totalRevenue.toLocaleString("vi-VN")}đ
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {item.quantitySold} phần ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-stone-500">
                  Chưa có số liệu món bán trong giai đoạn này.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Branch Comparison Table (STT 84) */}
      {report && report.branchRevenues.length > 1 && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-stone-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>So Sánh Hiệu Quả Giữa Các Chi Nhánh (STT 84)</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-950/60 text-stone-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Chi nhánh</th>
                  <th className="p-3.5">Mã CN</th>
                  <th className="p-3.5 text-right">Doanh thu</th>
                  <th className="p-3.5 text-center">Số hóa đơn</th>
                  <th className="p-3.5 text-right">AOV (TB/Đơn)</th>
                  <th className="p-3.5 text-right pr-5">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-xs">
                {report.branchRevenues.map((b) => (
                  <tr key={b.branchId} className="hover:bg-stone-800/30 transition">
                    <td className="p-3.5 pl-5 font-bold text-white">{b.branchName}</td>
                    <td className="p-3.5 font-mono text-stone-400">{b.branchCode}</td>
                    <td className="p-3.5 text-right font-mono font-black text-amber-400">
                      {b.revenue.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="p-3.5 text-center font-mono text-stone-300">{b.invoiceCount}</td>
                    <td className="p-3.5 text-right font-mono text-purple-300">
                      {b.averageOrderValue.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="p-3.5 text-right pr-5 font-mono font-bold text-emerald-400">
                      {b.revenuePercentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
