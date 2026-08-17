"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth, getRoleBadgeStyle } from "@/shared/context/AuthContext";
import { api } from "@/shared/api/client";
import { useOrderSignalR } from "@/shared/api/signalr";
import {
  Users,
  Shield,
  Building2,
  QrCode,
  UtensilsCrossed,
  BarChart3,
  LogOut,
  ChevronRight,
  Menu,
  X,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Store,
  Layers,
  ShoppingCart,
  Flame,
  Receipt,
  Tag,
  CreditCard,
  Calendar,
  Clock,
  Bell,
  Check,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isLoading, logout, canManageUsers, isDirectorOrOwner } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Global Realtime Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // Initial fetch for notifications
  const fetchNotifs = useCallback(async () => {
    if (!user?.branchId || !token) return;
    try {
      const list = await api.getNotifications(user.branchId);
      setNotifications(Array.isArray(list) ? list : []);
    } catch {
      setNotifications([]);
    }
  }, [user?.branchId, token]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  // SignalR real-time event subscriptions
  const { isConnected: isSignalRConnected } = useOrderSignalR({
    onStaffCalled: (notif) => {
      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
    },
    onBillRequested: (notif) => {
      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
    },
    onOrderPendingConfirm: () => {
      fetchNotifs();
    },
    onNotificationDismissed: (notificationId) => {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    },
  });

  useEffect(() => {
    if (!isLoading && (!token || !user)) {
      router.replace("/login");
    }
  }, [isLoading, token, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-300 p-6 text-center">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-stone-200">Đang kết nối hệ thống OrderPum...</p>
        {!isLoading && !token && (
          <div className="mt-4">
            <p className="text-xs text-stone-400 mb-3">Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.</p>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold text-xs transition-colors shadow-md"
            >
              Đến trang Đăng nhập
            </Link>
          </div>
        )}
      </div>
    );
  }

  const roleStyle = getRoleBadgeStyle(user.roleLevel);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword.length < 6) {
      setPwdMsg({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "error", text: "Xác nhận mật khẩu mới không khớp." });
      return;
    }

    setPwdLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      setPwdMsg({ type: "success", text: "Đổi mật khẩu thành công!" });
      setTimeout(() => {
        setShowPasswordModal(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPwdMsg(null);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể đổi mật khẩu.";
      setPwdMsg({ type: "error", text: msg });
    } finally {
      setPwdLoading(false);
    }
  };

  const navItems = [
    {
      name: "Tổng quan",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
      allowed: true,
    },
    {
      name: "Tài khoản & Nhân sự",
      href: "/admin/users",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
      allowed: canManageUsers,
      badge: canManageUsers ? "STT 1, 2, 4" : "Cần cấp QL trở lên",
      badgeColor: canManageUsers ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-stone-800 text-stone-500",
    },
    {
      name: "Vai trò & Cấp bậc",
      href: "/admin/roles",
      icon: Shield,
      active: pathname.startsWith("/admin/roles"),
      allowed: isDirectorOrOwner,
      badge: isDirectorOrOwner ? "Bảng CSDL" : "Chỉ GĐ/CNH",
      badgeColor: isDirectorOrOwner ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-stone-800 text-stone-500",
    },
    {
      name: "Chi nhánh & Cấu hình",
      href: "/admin/branches",
      icon: Building2,
      active: pathname.startsWith("/admin/branches"),
      allowed: canManageUsers,
      badge: "STT 8, 99",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      name: "Khu vực & Tầng",
      href: "/admin/areas",
      icon: Layers,
      active: pathname.startsWith("/admin/areas"),
      allowed: canManageUsers,
      badge: "STT 13",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      name: "Bàn, QR & Sơ đồ",
      href: "/admin/tables",
      icon: QrCode,
      active: pathname.startsWith("/admin/tables"),
      allowed: true,
      badge: "STT 14-17",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      name: "POS & Order tại bàn",
      href: "/admin/pos",
      icon: ShoppingCart,
      active: pathname.startsWith("/admin/pos"),
      allowed: true,
      badge: "STT 21 (1.6)",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      name: "Màn hình Bếp (KDS)",
      href: "/kds",
      icon: Flame,
      active: pathname.startsWith("/kds"),
      allowed: true,
      badge: "STT 51, 53",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
    {
      name: "Hóa đơn & Thu ngân",
      href: "/admin/invoices",
      icon: Receipt,
      active: pathname.startsWith("/admin/invoices"),
      allowed: true,
      badge: "STT 57-61",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      name: "Khuyến mãi & Voucher",
      href: "/admin/promotions",
      icon: Tag,
      active: pathname.startsWith("/admin/promotions"),
      allowed: true,
      badge: "STT 60, 64-71",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      name: "Cổng Thanh toán",
      href: "/admin/payment-gateways",
      icon: CreditCard,
      active: pathname.startsWith("/admin/payment-gateways"),
      allowed: canManageUsers,
      badge: "STT 102",
      badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    },
    {
      name: "Ca làm & Xếp lịch",
      href: "/admin/shifts",
      icon: Calendar,
      active: pathname.startsWith("/admin/shifts"),
      allowed: canManageUsers,
      badge: "STT 74-80",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      name: "Bảng Chấm Công",
      href: "/admin/attendance",
      icon: Clock,
      active: pathname.startsWith("/admin/attendance"),
      allowed: canManageUsers,
      badge: "STT 77-78",
      badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    },
    {
      name: "Thực đơn & Giá",
      href: "/admin/menu",
      icon: UtensilsCrossed,
      active: pathname.startsWith("/admin/menu"),
      allowed: true,
      badge: "Giai đoạn 1",
    },
    {
      name: "Báo cáo Doanh thu",
      href: "/admin/reports",
      icon: BarChart3,
      active: pathname.startsWith("/admin/reports"),
      allowed: canManageUsers,
      badge: "Giai đoạn 1",
    },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col md:flex-row">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 lg:w-72 bg-stone-900 border-r border-stone-800 flex flex-col z-50 transition-transform duration-200 overflow-hidden shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Logo */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between shrink-0 bg-stone-900">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-stone-950 font-bold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                OrderPum
              </span>
              <span className="text-[10px] text-amber-400 font-medium block mt-0.5">Web Quản Trị</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-stone-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links - Scrollable */}
        <nav className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-0.5">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Quản trị hệ thống
          </div>
          {navItems.filter((item) => item.allowed).map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  item.active
                    ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-bold"
                    : "text-stone-300 hover:bg-stone-800/80 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded border font-mono shrink-0 ml-1 ${
                      item.active
                        ? "bg-stone-950/20 text-stone-950 border-stone-950/30"
                        : item.badgeColor || "bg-stone-800 text-stone-400 border-stone-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card at bottom of Sidebar - Fixed */}
        <div className="p-3 border-t border-stone-800 bg-stone-950/80 shrink-0">
          <div className="p-2.5 rounded-2xl bg-stone-900 border border-stone-800">
            <div className="flex items-start justify-between gap-2">
              <div className="truncate">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${roleStyle.badgeBg} ${roleStyle.badgeText} ${roleStyle.badgeBorder}`}
                  >
                    Cấp {user.roleLevel} · {user.roleDisplayName}
                  </span>
                </div>
                <h4 className="font-bold text-white text-xs truncate">{user.displayName}</h4>
                <p className="text-[10px] text-stone-400 truncate">{user.phoneOrEmail}</p>
                <p className="text-[10px] text-amber-400/80 truncate mt-0.5 flex items-center gap-1">
                  <Store className="w-3 h-3 shrink-0" />
                  <span>{user.branchName || "Toàn chuỗi"}</span>
                </p>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-stone-800/80 grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-medium transition"
              >
                <KeyRound className="w-3 h-3" />
                Đổi MK
              </button>
              <button
                type="button"
                onClick={logout}
                className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[10px] font-medium transition"
              >
                <LogOut className="w-3 h-3" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-stone-800/80 bg-stone-900/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-stone-400 hover:text-white p-2 rounded-lg bg-stone-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs sm:text-sm text-stone-400 flex items-center gap-1.5">
              <span>Hệ thống Order</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-600" />
              <span className="text-white font-medium">
                {pathname === "/admin"
                  ? "Tổng quan"
                  : pathname.startsWith("/admin/users")
                  ? "Quản lý Tài khoản & Nhân sự"
                  : pathname.startsWith("/admin/roles")
                  ? "Cấu hình Vai trò & Cấp bậc"
                  : "Quản trị"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Realtime Connection Status */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                isSignalRConnected
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
              title={isSignalRConnected ? "SignalR Realtime đang kết nối trực tiếp" : "Đang kết nối lại SignalR..."}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSignalRConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span>{isSignalRConnected ? "SignalR Trực tiếp" : "Đang nối..."}</span>
            </div>

            {/* Realtime Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800 transition flex items-center gap-1.5 text-xs font-bold"
                title="Thông báo bàn phục vụ & gọi món"
              >
                <Bell className={`w-4 h-4 ${notifications.length > 0 ? "text-amber-400 animate-bounce" : "text-stone-400"}`} />
                {notifications.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotifDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl z-50 p-3 space-y-2 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span>Thông báo từ bàn ({notifications.length})</span>
                      </div>
                      <Link
                        href="/admin/pos"
                        onClick={() => setNotifDropdownOpen(false)}
                        className="text-[11px] font-semibold text-amber-400 hover:text-amber-300"
                      >
                        Đến màn hình POS →
                      </Link>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {Array.isArray(notifications) && notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 hover:border-amber-500/40 text-xs flex flex-col gap-1 transition"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-400">
                                {n.tableName || n.tableCode} ({n.areaName || "Khu vực"})
                              </span>
                              <span className="text-[10px] text-stone-500 font-mono">
                                {formatTime(n.createdAt)}
                              </span>
                            </div>
                            <p className="text-stone-200 text-xs leading-relaxed">{n.message}</p>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Link
                                href={`/admin/pos?tableId=${n.tableId}`}
                                onClick={() => setNotifDropdownOpen(false)}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] transition shadow-sm"
                              >
                                Xem bàn & Xử lý
                              </Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-stone-500 text-xs">
                          Không có yêu cầu nào đang chờ.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-stone-300 font-medium">{user.branchName || "Hệ thống Chuỗi"}</span>
            </div>
            <Link
              href="/login"
              onClick={logout}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Link>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto pb-safe">{children}</main>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-white">Đổi mật khẩu tài khoản</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pwdMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  pwdMsg.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                    : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                }`}
              >
                {pwdMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-400 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-400 mb-1">
                  Mật khẩu mới (tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-400 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {pwdLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
