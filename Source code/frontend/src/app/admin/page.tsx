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
  const [activeTab, setActiveTab] = useState<"pendingQr" | "notifications" | "sessions">("pendingQr");

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

    // Live polling every 3.5 seconds
    const timer = setInterval(() => {
      loadBranchData(true);
    }, 3500);

    return () => clearInterval(timer);
  }, [selectedBranchId, loadBranchData]);

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

  // Calculated KPIs
  const occupiedTables = useMemo(() => tables.filter((t) => t.status === "Occupied"), [tables]);
  const currentBranch = useMemo(() => branches.find((b) => b.id === selectedBranchId), [branches, selectedBranchId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Branch Scope Selector */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 border border-stone-800 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  roleStyle?.badgeBg || "bg-stone-800"
                } ${roleStyle?.badgeText || "text-stone-300"} ${
                  roleStyle?.badgeBorder || "border-stone-700"
                }`}
              >
                Cấp {user?.roleLevel} · {user?.roleDisplayName}
              </span>
              <span className="text-xs text-stone-400">
                Phạm vi: <strong className="text-amber-400">{currentBranch?.name || "Toàn chuỗi"}</strong>
              </span>
              {user?.assignedAreaNames && user.assignedAreaNames.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-stone-400">Vùng của bạn:</span>
                  {user.assignedAreaNames.map((aName, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black"
                    >
                      {aName}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Trung tâm Điều hành & Giám sát Bàn ăn
            </h1>
            <p className="mt-1 text-stone-300 text-xs sm:text-sm">
              Theo dõi trực tiếp toàn bộ đơn đặt món từ khách QR, yêu cầu hỗ trợ và trạng thái phục vụ tại chi nhánh.
            </p>
          </div>

          {/* Branch Selector (if multi-branch access) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {branches.length > 1 && user && user.roleLevel <= 2 && (
              <div className="flex items-center gap-2 bg-stone-950/80 p-2 rounded-2xl border border-stone-800">
                <Store className="w-4 h-4 text-amber-400" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
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
              className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 transition"
              title="Làm mới dữ liệu realtime"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <Link
              href="/admin/pos"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-xs transition active:scale-[0.99]"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Mở Màn hình POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Realtime Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Pending QR Orders */}
        <div
          onClick={() => setActiveTab("pendingQr")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
            pendingQrTickets.length > 0
              ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10"
              : "bg-stone-900/70 border-stone-800"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-semibold">Đơn QR chờ duyệt</span>
            <span className="relative flex h-2.5 w-2.5">
              {pendingQrTickets.length > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  pendingQrTickets.length > 0 ? "bg-amber-400" : "bg-stone-600"
                }`}
              ></span>
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-white flex items-baseline gap-2">
            <span>{pendingQrTickets.length}</span>
            <span className="text-xs font-normal text-stone-400">đợt gọi món</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-400 font-medium">
            {pendingQrTickets.length > 0 ? "⚡ Cần xác nhận gửi bếp ngay" : "Không có đơn chờ"}
          </div>
        </div>

        {/* Card 2: Table Notifications */}
        <div
          onClick={() => setActiveTab("notifications")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
            notifications.length > 0
              ? "bg-rose-500/10 border-rose-500/50 shadow-lg shadow-rose-500/10"
              : "bg-stone-900/70 border-stone-800"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-semibold">Yêu cầu từ bàn</span>
            <Bell className={`w-4 h-4 ${notifications.length > 0 ? "text-rose-400 animate-bounce" : "text-stone-500"}`} />
          </div>
          <div className="mt-2 text-2xl font-black text-white flex items-baseline gap-2">
            <span>{notifications.length}</span>
            <span className="text-xs font-normal text-stone-400">yêu cầu</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-400 font-medium">
            {notifications.length > 0 ? "Gọi nhân viên / Xin bill" : "Mọi bàn đã phục vụ tốt"}
          </div>
        </div>

        {/* Card 3: Occupied Tables */}
        <div
          onClick={() => setActiveTab("sessions")}
          className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 transition cursor-pointer select-none"
        >
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-semibold">Bàn đang phục vụ</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white flex items-baseline gap-2">
            <span>{occupiedTables.length}</span>
            <span className="text-xs font-normal text-stone-400">/ {tables.length} bàn</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-medium">
            {activeSessions.length} phiên bàn đang mở
          </div>
        </div>

        {/* Card 4: Quick KDS Link */}
        <Link
          href="/kds"
          className="p-4 rounded-2xl bg-stone-900/70 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/40 transition group"
        >
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-semibold">Màn hình Bếp KDS</span>
            <Flame className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-base font-bold text-white flex items-center justify-between">
            <span>Bếp & Quầy Bar</span>
            <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-1 text-[11px] text-stone-400">Điều phối chế biến trực tiếp</div>
        </Link>
      </div>

      {/* Main Live Operations Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Live Requests & Orders Center */}
        <div className="lg:col-span-2 space-y-4">
          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("pendingQr")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "pendingQr"
                    ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                    : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
                }`}
              >
                <span>⚡ Đơn QR Chờ Duyệt</span>
                {pendingQrTickets.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-stone-950 text-amber-400 text-[10px] font-black">
                    {pendingQrTickets.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("notifications")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "notifications"
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                    : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
                }`}
              >
                <span>🛎️ Yêu Cầu Từ Bàn</span>
                {notifications.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-stone-950 text-rose-300 text-[10px] font-black">
                    {notifications.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("sessions")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "sessions"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
                }`}
              >
                <span>📋 Bàn Đang Phục Vụ ({activeSessions.length})</span>
              </button>
            </div>
          </div>

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

          {/* TAB 2: TABLE NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((n) => (
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
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold transition shadow-sm"
                      >
                        ✓ Đã xử lý xong
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-2xl bg-stone-900/40 border border-stone-800/80 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto stroke-[1.5]" />
                  <h3 className="text-sm font-bold text-stone-200">Không có yêu cầu phục vụ nào đang chờ</h3>
                  <p className="text-xs text-stone-400">
                    Khi khách gọi nhân viên (lấy đá, khăn lạnh...) hoặc xin hóa đơn, thông báo sẽ lập tức đổ về đây.
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
