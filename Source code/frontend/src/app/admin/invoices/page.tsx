"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  api,
  BranchDto,
  InvoiceDto,
  VietQrInfoDto,
} from "@/shared/api/client";
import { useAuth } from "@/shared/context/AuthContext";
import {
  Receipt,
  Search,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  QrCode,
  DollarSign,
  CreditCard,
  Smartphone,
  RefreshCw,
  Eye,
  X,
  FileText,
  Building2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function InvoicesPage() {
  const { user, token, isLoading: authLoading } = useAuth();

  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected Invoice for Receipt Modal
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceDto | null>(null);
  const [vietQrInfo, setVietQrInfo] = useState<VietQrInfoDto | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Load branches
  useEffect(() => {
    if (!token && !authLoading) return;

    const loadBranches = async () => {
      try {
        const branchList = await api.getBranches();
        setBranches(branchList);
        if (branchList.length > 0) {
          if (user?.branchId) {
            const found = branchList.find((b) => b.id === user.branchId);
            setSelectedBranchId(found ? found.id : branchList[0].id);
          } else {
            setSelectedBranchId(branchList[0].id);
          }
        }
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg("Lỗi tải chi nhánh: " + error.message);
      }
    };

    if (token) {
      loadBranches();
    }
  }, [token, authLoading, user]);

  // Fetch Invoices
  const fetchInvoices = useCallback(async (showLoading = false) => {
    if (!selectedBranchId) return;
    if (showLoading) setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await api.getInvoices(selectedBranchId, statusFilter, selectedDate);
      setInvoices(data);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Lỗi tải danh sách hóa đơn.");
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedBranchId, statusFilter, selectedDate]);

  useEffect(() => {
    if (selectedBranchId) {
      fetchInvoices(true);
    }
  }, [selectedBranchId, statusFilter, selectedDate, fetchInvoices]);

  // Open Invoice Detail
  const handleViewInvoice = async (inv: InvoiceDto) => {
    setViewingInvoice(inv);
    setVietQrInfo(null);
    try {
      const qr = await api.getVietQr(inv.id);
      setVietQrInfo(qr);
    } catch {
      // ignore
    }
  };

  // Print Receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Filtered invoices by search keyword
  const filteredInvoices = invoices.filter((inv) => {
    const kw = searchKeyword.toLowerCase().trim();
    if (!kw) return true;
    return (
      inv.invoiceNumber.toLowerCase().includes(kw) ||
      inv.tableCodeSnapshot.toLowerCase().includes(kw) ||
      inv.tableNameSnapshot.toLowerCase().includes(kw) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(kw)) ||
      (inv.customerPhone && inv.customerPhone.includes(kw))
    );
  });

  // Calculate statistics
  const totalRevenue = filteredInvoices
    .filter((i) => i.paymentStatus === "Paid")
    .reduce((sum, i) => sum + i.finalAmount, 0);

  const totalPaidCount = filteredInvoices.filter((i) => i.paymentStatus === "Paid").length;
  const totalUnpaidCount = filteredInvoices.filter((i) => i.paymentStatus !== "Paid").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã thanh toán
          </span>
        );
      case "PartiallyPaid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-3.5 h-3.5" />
            Đã trả một phần
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Chờ thanh toán
          </span>
        );
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "BankTransfer":
        return <QrCode className="w-3.5 h-3.5 text-sky-400" />;
      case "CardPos":
        return <CreditCard className="w-3.5 h-3.5 text-purple-400" />;
      case "EWallet":
        return <Smartphone className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "BankTransfer":
        return "Chuyển khoản VietQR";
      case "CardPos":
        return "Thẻ POS";
      case "EWallet":
        return "Ví điện tử";
      default:
        return "Tiền mặt";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Receipt className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                HÓA ĐƠN & THANH TOÁN
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                  STT 57, 58, 59, 61
                </span>
              </h1>
              <p className="text-xs text-stone-400">
                Quản lý hóa đơn bán hàng, tách/gộp bàn, in hóa đơn nhiệt 80mm & đối soát doanh thu
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5">
          {branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-stone-900 border border-stone-800 text-stone-200 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <Link
            href="/admin/pos"
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <span>Mở POS Bán Hàng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchInvoices(false);
            }}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-900/80 border border-stone-800/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-400 font-medium">Doanh thu ngày ({selectedDate})</span>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {totalRevenue.toLocaleString("vi-VN")}đ
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-stone-900/80 border border-stone-800/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-400 font-medium">Hóa đơn đã thanh toán</span>
            <p className="text-2xl font-black text-white font-mono mt-1">
              {totalPaidCount} <span className="text-xs text-stone-400 font-normal">HĐ</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-stone-900/80 border border-stone-800/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-400 font-medium">Chờ thu tiền</span>
            <p className="text-2xl font-black text-amber-400 font-mono mt-1">
              {totalUnpaidCount} <span className="text-xs text-stone-400 font-normal">HĐ</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-stone-900/60 border border-stone-800/80 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-stone-200 text-xs font-semibold focus:outline-none"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "Paid", label: "Đã thu tiền" },
              { id: "Unpaid", label: "Chưa thu" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === tab.id
                    ? "bg-stone-800 text-amber-400 font-semibold shadow-sm"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo số HĐ, tên bàn, SĐT..."
            className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Invoices List Table */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-400">Đang tải danh sách hóa đơn...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="py-20 text-center text-stone-500 bg-stone-900/30 rounded-3xl border border-stone-800/60 border-dashed">
          <FileText className="w-12 h-12 text-stone-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-stone-300">Không tìm thấy hóa đơn nào</p>
          <p className="text-xs text-stone-500 mt-1">
            Không có hóa đơn nào phù hợp với bộ lọc ngày hoặc từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-950/80 border-b border-stone-800 text-stone-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Số Hóa Đơn</th>
                  <th className="py-3 px-4">Bàn / Khách</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4 text-right">Tạm tính</th>
                  <th className="py-3 px-4 text-right">VAT / Phí DV</th>
                  <th className="py-3 px-4 text-right">Tổng thanh toán</th>
                  <th className="py-3 px-4">Phương thức</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-stone-800/40 transition-colors cursor-pointer group"
                    onClick={() => handleViewInvoice(inv)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{inv.tableCodeSnapshot}</div>
                      <div className="text-[11px] text-stone-400">
                        {inv.customerName ? `${inv.customerName} - ${inv.customerPhone || ""}` : inv.tableNameSnapshot}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-400 font-mono">
                      <div>
                        {new Date(inv.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {new Date(inv.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-stone-300">
                      {inv.subTotalAmount.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-stone-400 text-[11px]">
                      <div>VAT: {inv.taxAmount.toLocaleString("vi-VN")}đ</div>
                      {inv.serviceChargeAmount > 0 && (
                        <div>DV: {inv.serviceChargeAmount.toLocaleString("vi-VN")}đ</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                      {inv.finalAmount.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.payments.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {inv.payments.map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1 text-[11px] text-stone-300"
                            >
                              {getPaymentMethodIcon(p.paymentMethod)}
                              <span>{getPaymentMethodLabel(p.paymentMethod)}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-stone-500 italic">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(inv.paymentStatus)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewInvoice(inv);
                        }}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                        title="Xem & In hóa đơn"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* INVOICE DETAIL & THERMAL RECEIPT 80mm MODAL          */}
      {/* ==================================================== */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Chi tiết Hóa đơn #{viewingInvoice.invoiceNumber}
                  </h3>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Bàn: {viewingInvoice.tableCodeSnapshot} • {new Date(viewingInvoice.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Hóa đơn (80mm)</span>
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Thermal Paper Receipt Preview */}
            <div className="flex-1 overflow-y-auto p-6 bg-stone-950 flex justify-center">
              <div
                ref={printRef}
                className="w-full max-w-md bg-white text-black p-6 rounded-xl shadow-xl font-mono text-xs space-y-4 print:p-0 print:shadow-none"
              >
                {/* Header Restaurant Info */}
                <div className="text-center space-y-1 border-b border-dashed border-stone-400 pb-3">
                  <h2 className="text-base font-black tracking-wide uppercase">
                    {viewingInvoice.branchName || "NHÀ HÀNG ORDERPUM"}
                  </h2>
                  <p className="text-[10px] text-stone-600">
                    {viewingInvoice.branchAddress || "TP. Hồ Chí Minh / Hà Nội"}
                  </p>
                  <p className="text-[10px] text-stone-600">
                    Hotline: {viewingInvoice.branchPhone || "1900 xxxx"}
                  </p>
                  {viewingInvoice.receiptHeaderNote && (
                    <p className="text-[10px] text-stone-500 italic mt-1">
                      {viewingInvoice.receiptHeaderNote}
                    </p>
                  )}
                  <div className="pt-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      PHIẾU THANH TOÁN
                    </h3>
                    <p className="text-[11px] font-bold text-stone-800">
                      Số: {viewingInvoice.invoiceNumber}
                    </p>
                  </div>
                </div>

                {/* Meta info */}
                <div className="text-[11px] space-y-1 border-b border-dashed border-stone-400 pb-2">
                  <div className="flex justify-between">
                    <span>Bàn:</span>
                    <strong className="text-sm">{viewingInvoice.tableCodeSnapshot}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian vào:</span>
                    <span>{new Date(viewingInvoice.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                  {viewingInvoice.paidAt && (
                    <div className="flex justify-between">
                      <span>Thời gian thanh toán:</span>
                      <span>{new Date(viewingInvoice.paidAt).toLocaleString("vi-VN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Thu ngân:</span>
                    <span>{viewingInvoice.cashierNameSnapshot || "Thu ngân"}</span>
                  </div>
                  {viewingInvoice.customerName && (
                    <div className="flex justify-between">
                      <span>Khách hàng:</span>
                      <span>
                        {viewingInvoice.customerName} ({viewingInvoice.customerPhone || ""})
                      </span>
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div className="space-y-2 border-b border-dashed border-stone-400 pb-3">
                  <div className="flex justify-between font-bold text-[11px] border-b border-stone-300 pb-1">
                    <span className="w-1/2">Tên món</span>
                    <span className="w-12 text-center">SL</span>
                    <span className="w-16 text-right">Đ.Giá</span>
                    <span className="w-20 text-right">T.Tiền</span>
                  </div>

                  {viewingInvoice.lines.map((line) => (
                    <div key={line.id} className="text-[11px]">
                      <div className="flex justify-between font-medium">
                        <span className="w-1/2 leading-tight">{line.itemName}</span>
                        <span className="w-12 text-center font-bold">x{line.quantity}</span>
                        <span className="w-16 text-right">
                          {line.unitPrice.toLocaleString("vi-VN")}
                        </span>
                        <span className="w-20 text-right font-bold">
                          {line.totalPrice.toLocaleString("vi-VN")}
                        </span>
                      </div>
                      {line.selectedOptionsText && (
                        <p className="text-[9px] text-stone-500 italic pl-1">
                          + {line.selectedOptionsText}
                        </p>
                      )}
                      {line.note && (
                        <p className="text-[9px] text-stone-600 pl-1">
                          * {line.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Calculation breakdown (STT 61) */}
                <div className="space-y-1.5 text-[11px] border-b border-dashed border-stone-400 pb-3">
                  <div className="flex justify-between">
                    <span>Tiền món (Tạm tính):</span>
                    <span className="font-bold">
                      {viewingInvoice.subTotalAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>

                  {viewingInvoice.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Giảm giá / Chiết khấu:</span>
                      <span>-{viewingInvoice.discountAmount.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}

                  {viewingInvoice.serviceChargeAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Phí dịch vụ ({viewingInvoice.serviceChargePercent}%):</span>
                      <span>+{viewingInvoice.serviceChargeAmount.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}

                  {viewingInvoice.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Thuế VAT ({viewingInvoice.taxRatePercent}%):</span>
                      <span>+{viewingInvoice.taxAmount.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-black pt-1 border-t border-stone-800">
                    <span>TỔNG THANH TOÁN:</span>
                    <span className="text-emerald-700">
                      {viewingInvoice.finalAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>

                  {viewingInvoice.paidAmount > 0 && (
                    <div className="flex justify-between text-[10px] text-stone-600 pt-1">
                      <span>Đã thanh toán:</span>
                      <span>{viewingInvoice.paidAmount.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}

                  {viewingInvoice.changeAmount > 0 && (
                    <div className="flex justify-between text-[11px] font-bold text-blue-700">
                      <span>Tiền thừa trả khách:</span>
                      <span>{viewingInvoice.changeAmount.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                </div>

                {/* Payment transactions */}
                {viewingInvoice.payments.length > 0 && (
                  <div className="text-[10px] space-y-1 border-b border-dashed border-stone-400 pb-2">
                    <span className="font-bold block text-stone-700">Hình thức thanh toán:</span>
                    {viewingInvoice.payments.map((p) => (
                      <div key={p.id} className="flex justify-between">
                        <span>• {getPaymentMethodLabel(p.paymentMethod)}:</span>
                        <span className="font-bold">{p.amount.toLocaleString("vi-VN")}đ</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dynamic VietQR Code if unpaid or for transfer */}
                {vietQrInfo && viewingInvoice.paymentStatus !== "Paid" && (
                  <div className="text-center py-2 border-b border-dashed border-stone-400">
                    <p className="text-[10px] font-bold uppercase mb-1">
                      Quét mã VietQR chuyển khoản chính xác:
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={vietQrInfo.qrUrl}
                      alt="VietQR Payment"
                      className="w-44 h-44 mx-auto rounded-lg border border-stone-300"
                    />
                    <p className="text-[9px] text-stone-500 mt-1">
                      {vietQrInfo.bankCode} • {vietQrInfo.accountNo} • {vietQrInfo.accountName}
                    </p>
                  </div>
                )}

                {/* Footer notes */}
                <div className="text-center text-[10px] text-stone-600 pt-2 space-y-1">
                  <p className="font-bold">
                    {viewingInvoice.receiptFooterNote || "Cảm ơn Quý khách & Hẹn gặp lại!"}
                  </p>
                  <p className="text-[9px] text-stone-400">
                    Phần mềm Web Order Pum — Hóa đơn bán lẻ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
