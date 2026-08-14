"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth, getRoleBadgeStyle } from "@/shared/context/AuthContext";
import { api } from "@/shared/api/client";
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
        className={`fixed md:sticky top-0 h-screen w-72 bg-stone-900 border-r border-stone-800 flex flex-col justify-between z-50 transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Logo */}
        <div>
          <div className="p-5 border-b border-stone-800 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-stone-950 font-bold">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  OrderPum
                </span>
                <span className="text-[11px] text-amber-400 font-medium block">Web Quản Trị</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-stone-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Quản trị hệ thống
            </div>
            {navItems.filter((item) => item.allowed).map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    item.active
                      ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-bold"
                      : "text-stone-300 hover:bg-stone-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${
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
        </div>

        {/* User Card at bottom of Sidebar */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/50">
          <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800">
            <div className="flex items-start justify-between gap-2">
              <div className="truncate">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleStyle.badgeBg} ${roleStyle.badgeText} ${roleStyle.badgeBorder}`}
                  >
                    Cấp {user.roleLevel} · {user.roleDisplayName}
                  </span>
                </div>
                <h4 className="font-bold text-white text-xs truncate">{user.displayName}</h4>
                <p className="text-[11px] text-stone-400 truncate">{user.phoneOrEmail}</p>
                <p className="text-[10px] text-amber-400/80 truncate mt-0.5 flex items-center gap-1">
                  <Store className="w-3 h-3 shrink-0" />
                  <span>{user.branchName || "Toàn chuỗi"}</span>
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-stone-800/80 grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-medium transition"
              >
                <KeyRound className="w-3 h-3" />
                Đổi MK
              </button>
              <button
                type="button"
                onClick={logout}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[11px] font-medium transition"
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

          <div className="flex items-center gap-3">
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
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
