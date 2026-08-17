"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth, getRoleBadgeStyle } from "@/shared/context/AuthContext";
import {
  api,
  BranchDto,
  TableDto,
  TableSessionDetailDto,
  OrderTicketDto,
  TableNotificationDto,
} from "@/shared/api/client";
import { useOrderSignalR } from "@/shared/api/signalr";
import {
  Users,
  Building2,
  QrCode,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Bell,
  Clock,
  UtensilsCrossed,
  Receipt,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Flame,
  CheckCheck,
  X,
  Phone,
  Store,
  Layers,
  Send,
  CreditCard,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const roleStyle = user ? getRoleBadgeStyle(user.roleLevel) : null;

  // Branches state
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  // Live Operations data
  const [tables, setTables] = useState<TableDto[]>([]);
  const [activeSessions, setActiveSessions] = useState<TableSessionDetailDto[]>([]);
  const [pendingQrTickets, setPendingQrTickets] = useState<OrderTicketDto[]>([]);
  const [notifications, setNotifications] = useState<TableNotificationDto[]>([]);
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Active Tab for Live Center
  const [activeTab, setActiveTab] = useState<"pendingQr" | "billRequests" | "otherRequests" | "sessions">("pendingQr");

  const formatTime = (dateStr?: string, includeSeconds = false) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: includeSeconds ? "2-digit" : undefined,
      });
    } catch {
      return "";
    }
  };

  // Load branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchList = await api.getBranches(true);
        setBranches(branchList);
        if (user?.branchId) {
          setSelectedBranchId(user.branchId);
        } else if (branchList.length > 0) {
          setSelectedBranchId(branchList[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBranches();
  }, [user]);

  // Load operations data for current branch
  const loadBranchData = useCallback(async (isSilent = false) => {
    if (!selectedBranchId) return;
    try {
      if (!isSilent) setLoading(true);
      const [tableList, sessionList, qrTickets, notifList] = await Promise.all([
        api.getTables(selectedBranchId),
        api.getActiveSessions(selectedBranchId).catch(() => []),
        api.getPendingQrTickets(selectedBranchId).catch(() => []),
        api.getNotifications(selectedBranchId).catch(() => []),
      ]);

      setTables(tableList);
      setActiveSessions(sessionList);
      setPendingQrTickets(qrTickets);
      setNotifications(notifList);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (!selectedBranchId) return;
    loadBranchData();
  }, [selectedBranchId, loadBranchData]);

  // Real-time SignalR subscriptions
  const { isConnected: isSignalRConnected } = useOrderSignalR({
    onOrderPendingConfirm: () => loadBranchData(true),
    onOrderConfirmed: () => loadBranchData(true),
    onOrderRejected: () => loadBranchData(true),
    onOrderCreated: () => loadBranchData(true),
    onStaffCalled: () => loadBranchData(true),
    onBillRequested: () => loadBranchData(true),
    onNotificationDismissed: () => loadBranchData(true),
    onSessionClosed: () => loadBranchData(true),
  });

  // Confirm QR Ticket directly
  const handleConfirmQr = async (ticketId: string) => {
    try {
      setActionLoadingId(ticketId);
      await api.confirmQrTicket(ticketId);
      await loadBranchData(true);
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(error.message || "Không thể xác nhận đơn gọi món.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject QR Ticket directly
  const handleRejectQr = async (ticketId: string) => {
    const reason = prompt("Nhập lý do từ chối đợt gọi món (VD: Hết món, khách đổi ý...):", "Bếp tạm hết món");
    if (reason === null) return;
    try {
      setActionLoadingId(ticketId);
      await api.rejectQrTicket(ticketId, reason);
      await loadBranchData(true);
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(error.message || "Không thể từ chối đơn gọi món.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Dismiss notification
  const handleDismissNotif = async (notifId: string) => {
    try {
      setActionLoadingId(notifId);
      await api.dismissNotification(notifId);
      await loadBranchData(true);
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error(error);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Calculated KPIs & Request Categorization
  const occupiedTables = useMemo(() => tables.filter((t) => t.status === "Occupied"), [tables]);
  const currentBranch = useMemo(() => branches.find((b) => b.id === selectedBranchId), [branches, selectedBranchId]);

  const billNotifications = useMemo(() => {
    return notifications.filter(
      (n) =>
        n.type === "RequestBill" ||
        n.type === "BillRequested" ||
        n.message?.toLowerCase().includes("thanh toán") ||
        n.message?.toLowerCase().includes("bill") ||
        n.message?.toLowerCase().includes("hóa đơn") ||
        n.message?.toLowerCase().includes("tính tiền")
    );
  }, [notifications]);

  const otherNotifications = useMemo(() => {
    return notifications.filter(
      (n) =>
        !(
          n.type === "RequestBill" ||
          n.type === "BillRequested" ||
          n.message?.toLowerCase().includes("thanh toán") ||
          n.message?.toLowerCase().includes("bill") ||
          n.message?.toLowerCase().includes("hóa đơn") ||
          n.message?.toLowerCase().includes("tính tiền")
        )
    );
  }, [notifications]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Compact Top Header & Actions */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-800/80 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-stone-300 font-bold truncate">
            {currentBranch?.name || "Toàn chuỗi"}
          </span>
          {user?.assignedAreaNames && user.assignedAreaNames.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <span className="text-[11px] text-stone-500">• Vùng:</span>
              {user.assignedAreaNames.map((aName, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold"
                >
                  {aName}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {branches.length > 1 && user && user.roleLevel <= 2 && (
            <div className="flex items-center gap-1.5 bg-stone-900 px-2.5 py-1.5 rounded-xl border border-stone-800 text-xs">
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs font-bold text-stone-200 focus:outline-none cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-stone-950 text-stone-200">
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => loadBranchData()}
            disabled={loading}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 transition"
            title="Làm mới dữ liệu realtime"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/admin/pos"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl shadow-md text-xs transition active:scale-[0.98]"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Màn hình POS</span>
            <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
          </Link>
        </div>
      </div>

      {/* Unified Live Operational Segmented Tabs */}
      <div className="bg-stone-900/90 border border-stone-800 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-lg">
        {/* Tab 1: Đơn gọi món */}
        <button
          type="button"
          onClick={() => setActiveTab("pendingQr")}
          className={`flex-1 min-w-[135px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "pendingQr"
              ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
              : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span>⚡</span>
            <span>Đơn Gọi Món</span>
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeTab === "pendingQr"
                ? "bg-stone-950 text-amber-400"
                : pendingQrTickets.length > 0
                ? "bg-amber-500 text-stone-950 animate-pulse"
                : "bg-stone-800 text-stone-400"
            }`}
          >
            {pendingQrTickets.length}
          </span>
        </button>

        {/* Tab 2: Gọi thanh toán */}
        <button
          type="button"
          onClick={() => setActiveTab("billRequests")}
          className={`flex-1 min-w-[135px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "billRequests"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Gọi Thanh Toán</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeTab === "billRequests"
                ? "bg-white text-purple-700"
                : billNotifications.length > 0
                ? "bg-purple-500 text-white animate-pulse"
                : "bg-stone-800 text-stone-400"
            }`}
          >
            {billNotifications.length}
          </span>
        </button>

        {/* Tab 3: Yêu cầu khác */}
        <button
          type="button"
          onClick={() => setActiveTab("otherRequests")}
          className={`flex-1 min-w-[135px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "otherRequests"
              ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
              : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Yêu Cầu Khác</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeTab === "otherRequests"
                ? "bg-white text-rose-700"
                : otherNotifications.length > 0
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-stone-800 text-stone-400"
            }`}
          >
            {otherNotifications.length}
          </span>
        </button>

        {/* Tab 4: Bàn phục vụ */}
        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          className={`flex-1 min-w-[135px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "sessions"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Bàn Phục Vụ</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeTab === "sessions"
                ? "bg-white text-emerald-700"
                : "bg-stone-800 text-stone-400"
            }`}
          >
            {occupiedTables.length}/{tables.length}
          </span>
        </button>
      </div>

      {/* Main Live Operations Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Live Requests & Orders Center */}
        <div className="lg:col-span-2 space-y-4">

          {/* TAB 1: PENDING QR ORDERS */}
          {activeTab === "pendingQr" && (
            <div className="space-y-3.5">
              {pendingQrTickets.length > 0 ? (
                pendingQrTickets.map((ticket) => {
                  const session = activeSessions.find((s) => s.id === ticket.sessionId);
                  const table = tables.find((t) => t.id === session?.tableId);
                  const tableName = session?.tableName || table?.name || table?.code || "Bàn gọi món";

                  return (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-2xl bg-stone-900/90 border border-amber-500/40 shadow-xl space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-stone-950 text-xs font-black">
                              {tableName}
                            </span>
                            <span className="text-xs font-bold text-stone-200">
                              Đợt #{ticket.ticketNumber} · {ticket.customerName || "Khách tại bàn"}
                            </span>
                            {ticket.customerPhone && (
                              <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {ticket.customerPhone}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-stone-500" />
                            <span>
                              Đặt lúc: {formatTime(ticket.orderedAt, true)}
                            </span>
                            {ticket.note && (
                              <span className="text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded">
                                Ghi chú: {ticket.note}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-sm font-extrabold text-amber-400 font-mono shrink-0">
                          {ticket.ticketTotal.toLocaleString("vi-VN")}đ
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="space-y-1.5 pt-2 border-t border-stone-800">
                        {ticket.lines.map((line) => (
                          <div
                            key={line.id}
                            className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-stone-950/60 border border-stone-800/60"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-amber-400 font-mono shrink-0">{line.quantity}x</span>
                              <span className="font-semibold text-stone-200 truncate">{line.itemName}</span>
                              {line.selectedOptionsText && (
                                <span className="text-[11px] text-stone-400 truncate">({line.selectedOptionsText})</span>
                              )}
                              {line.note && (
                                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded shrink-0">
                                  {line.note}
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-stone-300 font-semibold shrink-0 ml-2">
                              {line.totalPrice.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-800">
                        <Link
                          href={`/admin/pos?tableId=${session?.tableId || ""}`}
                          className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition"
                        >
                          Mở POS Bàn này
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRejectQr(ticket.id)}
                          disabled={actionLoadingId === ticket.id}
                          className="px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold border border-rose-500/30 transition"
                        >
                          ✕ Từ chối
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmQr(ticket.id)}
                          disabled={actionLoadingId === ticket.id}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
                        >
                          {actionLoadingId === ticket.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCheck className="w-3.5 h-3.5" />
                          )}
                          <span>✓ Xác nhận & Gửi Bếp</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 rounded-2xl bg-stone-900/40 border border-stone-800/80 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto stroke-[1.5]" />
                  <h3 className="text-sm font-bold text-stone-200">Không có đơn gọi món nào đang chờ duyệt</h3>
                  <p className="text-xs text-stone-400">
                    Khi khách hàng quét mã QR tại bàn và gửi đợt món, đơn sẽ hiển thị ngay tại đây.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BILL REQUESTS (GỌI THANH TOÁN) */}
          {activeTab === "billRequests" && (
            <div className="space-y-3">
              {billNotifications.length > 0 ? (
                billNotifications.map((n) => {
                  const session = activeSessions.find((s) => s.tableId === n.tableId);
                  return (
                    <div
                      key={n.id}
                      className="p-4 rounded-2xl bg-stone-900/90 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                          <CreditCard className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {n.tableName || n.tableCode} ({n.areaName || "Khu vực"})
                            </span>
                            <span className="text-[10px] font-mono text-stone-400">
                              {formatTime(n.createdAt, true)}
                            </span>
                          </div>
                          <p className="text-purple-300 text-xs mt-0.5 font-medium">{n.message}</p>
                          {session && (
                            <p className="text-[11px] text-stone-400 mt-1 font-mono">
                              Tạm tính: <strong className="text-emerald-400 font-bold">{session.totalAmount.toLocaleString("vi-VN")}đ</strong> ({session.totalItemsCount || 0} món)
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/admin/pos?tableId=${n.tableId}`}
                          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Thu Ngân POS & In Bill</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDismissNotif(n.id)}
                          disabled={actionLoadingId === n.id}
                          className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition"
                        >
                          ✓ Đã hoàn tất
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 rounded-2xl bg-stone-900/40 border border-stone-800/80 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-purple-400 mx-auto stroke-[1.5]" />
                  <h3 className="text-sm font-bold text-stone-200">Không có yêu cầu thanh toán nào</h3>
                  <p className="text-xs text-stone-400">
                    Khi khách bấm "Yêu cầu thanh toán / Xin hóa đơn" tại bàn, thông báo sẽ đổ về đây để thu ngân xử lý.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OTHER CUSTOMER REQUESTS (YÊU CẦU KHÁC TỪ KHÁCH HÀNG) */}
          {activeTab === "otherRequests" && (
            <div className="space-y-3">
              {otherNotifications.length > 0 ? (
                otherNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl bg-stone-900/90 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                        <Bell className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {n.tableName || n.tableCode} ({n.areaName || "Khu vực"})
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            {formatTime(n.createdAt, true)}
                          </span>
                        </div>
                        <p className="text-stone-300 text-xs mt-0.5 font-medium">{n.message}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/admin/pos?tableId=${n.tableId}`}
                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition"
                      >
                        Đến Bàn POS
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDismissNotif(n.id)}
                        disabled={actionLoadingId === n.id}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold transition shadow-sm"
                      >
                        ✓ Đã xử lý xong
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-2xl bg-stone-900/40 border border-stone-800/80 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto stroke-[1.5]" />
                  <h3 className="text-sm font-bold text-stone-200">Không có yêu cầu hỗ trợ nào đang chờ</h3>
                  <p className="text-xs text-stone-400">
                    Khi khách gọi nhân viên (lấy thêm đá, khăn lạnh, chén dĩa...), yêu cầu sẽ lập tức đổ về đây.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACTIVE SESSIONS */}
          {activeTab === "sessions" && (
            <div className="space-y-3">
              {activeSessions.length > 0 ? (
                activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {session.tableName || session.tableCode} ({session.areaName || "Khu vực"})
                        </span>
                        <span className="text-xs text-stone-400">
                          {session.guestCount} khách · {session.customerName || "Khách tại bàn"}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-3 font-mono">
                        <span>Mở lúc: {formatTime(session.openedAt)}</span>
                        <span>• {(session.tickets || []).length} đợt gọi ({session.totalItemsCount || 0} món)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs text-stone-400 block">Tạm tính:</span>
                        <span className="text-base font-extrabold text-emerald-400 font-mono">
                          {session.totalAmount.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      <Link
                        href={`/admin/pos?tableId=${session.tableId}`}
                        className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-sm"
                      >
                        Xem chi tiết & Tính tiền →
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-2xl bg-stone-900/40 border border-stone-800/80 text-center space-y-2">
                  <UtensilsCrossed className="w-10 h-10 text-stone-500 mx-auto stroke-[1.5]" />
                  <h3 className="text-sm font-bold text-stone-200">Hiện tại chưa có bàn nào đang mở phiên</h3>
                  <p className="text-xs text-stone-400">Mở bàn mới trên POS hoặc khi khách quét mã QR để bắt đầu.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Live Floor Status Quick Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Sơ đồ Bàn ăn ({tables.length})</span>
            </h2>
            <Link href="/admin/tables" className="text-xs text-amber-400 hover:text-amber-300 font-semibold">
              Quản lý Bàn →
            </Link>
          </div>

          {/* Area Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedAreaFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                selectedAreaFilter === "ALL"
                  ? "bg-amber-500 text-stone-950"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              Tất cả
            </button>
            {user?.assignedAreaIds && user.assignedAreaIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedAreaFilter("MY_AREAS")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                  selectedAreaFilter === "MY_AREAS"
                    ? "bg-amber-500 text-stone-950"
                    : "bg-stone-900 text-amber-400 hover:text-amber-300 border border-amber-500/30"
                }`}
              >
                ★ Vùng của tôi
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {tables
              .filter((t) => {
                if (selectedAreaFilter === "ALL") return true;
                if (selectedAreaFilter === "MY_AREAS" && user?.assignedAreaIds?.length) {
                  return user.assignedAreaIds.includes(t.areaId);
                }
                return t.areaId === selectedAreaFilter;
              })
              .map((table) => {
              const isOccupied = table.status === "Occupied";
              const hasNotif = notifications.some((n) => n.tableId === table.id);
              const session = activeSessions.find((s) => s.tableId === table.id);

              return (
                <Link
                  key={table.id}
                  href={`/admin/pos?tableId=${table.id}`}
                  className={`p-3 rounded-2xl border flex flex-col justify-between transition-all group ${
                    hasNotif
                      ? "bg-rose-500/10 border-rose-500/60 animate-pulse"
                      : isOccupied
                      ? "bg-amber-500/10 border-amber-500/40 hover:border-amber-400"
                      : "bg-stone-900/70 border-stone-800 hover:border-stone-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-white group-hover:text-amber-400 transition">
                      {table.name || table.code}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        hasNotif
                          ? "bg-rose-500 animate-ping"
                          : isOccupied
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                      }`}
                    />
                  </div>

                  <div className="mt-2 text-[11px] text-stone-400 truncate">
                    {table.areaName || "Khu vực"}
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-stone-500">{table.capacity} chỗ</span>
                    {session ? (
                      <span className="font-mono text-emerald-400 font-bold">
                        {session.totalAmount.toLocaleString("vi-VN")}đ
                      </span>
                    ) : (
                      <span className="text-emerald-500 font-semibold">Trống</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
