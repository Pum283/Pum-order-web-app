"use client";

import React from "react";
import Link from "next/link";
import { useAuth, getRoleBadgeStyle } from "@/shared/context/AuthContext";
import {
  Users,
  Shield,
  Building2,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Layers,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const roleStyle = user ? getRoleBadgeStyle(user.roleLevel) : null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/30 border border-stone-800 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
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
              {user?.branchName ? `Chi nhánh: ${user.branchName}` : "Hệ thống Toàn chuỗi"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Xin chào, {user?.displayName}!
          </h1>
          <p className="mt-2 text-stone-300 text-xs sm:text-sm leading-relaxed">
            Hệ thống quản trị và vận hành Order tại bàn — Chuỗi nhà hàng OrderPum.
            Đã hoàn thiện <strong className="text-amber-400">Bước 1.1: Đăng nhập, Bảng CSDL Roles & CRUD Nhân sự</strong>.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-[0.99]"
            >
              <Users className="w-4 h-4" />
              <span>Quản lý Tài khoản & Nhân sự</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/admin/roles"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 border border-stone-800 hover:bg-stone-800 text-white font-semibold rounded-xl text-xs transition"
            >
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Cấu hình Bảng Vai trò</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Module Overview Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>Tiến độ triển khai — Giai đoạn 1 (MVP)</span>
          </h2>
          <span className="text-xs text-stone-400">Roadmap 17 bước</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Bước 1.1 - Đã xong */}
          <div className="p-5 rounded-2xl bg-stone-900/90 border border-emerald-500/30 relative overflow-hidden group shadow-lg">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Hoàn thành
              </span>
            </div>

            <h3 className="mt-4 font-bold text-white text-sm group-hover:text-emerald-400 transition">
              Bước 1.1 — Đăng nhập & Bảng Vai trò Động
            </h3>
            <p className="mt-1 text-xs text-stone-400 leading-relaxed">
              STT 1, 2, 4: Đăng nhập SĐT/Email + Mật khẩu/PIN, Bảng CSDL Roles kèm CRUD và gán quyền linh hoạt.
            </p>

            <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-500">BE + FE + Seed Data</span>
              <Link
                href="/admin/users"
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <span>Xem nhân sự</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 2: Bước 1.2 */}
          <div className="p-5 rounded-2xl bg-stone-900/50 border border-stone-800 relative group">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-stone-400">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
                Bước tiếp theo
              </span>
            </div>

            <h3 className="mt-4 font-bold text-stone-200 text-sm">
              Bước 1.2 — Chi nhánh & Cấu hình tài chính
            </h3>
            <p className="mt-1 text-xs text-stone-500 leading-relaxed">
              STT 8, 99, 105: CRUD chi nhánh, thuế VAT, phí dịch vụ, đơn vị tiền tệ.
            </p>

            <div className="mt-4 pt-3 border-t border-stone-800/80 text-xs text-stone-500">
              Kế hoạch Giai đoạn 1
            </div>
          </div>

          {/* Card 3: Bước 1.3 */}
          <div className="p-5 rounded-2xl bg-stone-900/50 border border-stone-800 relative group">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-stone-400">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
                Chờ triển khai
              </span>
            </div>

            <h3 className="mt-4 font-bold text-stone-200 text-sm">
              Bước 1.3 — Khu vực, Bàn & Mã QR
            </h3>
            <p className="mt-1 text-xs text-stone-500 leading-relaxed">
              STT 13, 14, 15: CRUD khu vực/tầng, CRUD bàn, gen mã QR tải về PDF/PNG.
            </p>

            <div className="mt-4 pt-3 border-t border-stone-800/80 text-xs text-stone-500">
              Kế hoạch Giai đoạn 1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
