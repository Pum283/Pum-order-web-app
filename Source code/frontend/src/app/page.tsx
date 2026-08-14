"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/shared/context/AuthContext";
import {
  UtensilsCrossed,
  Users,
  QrCode,
  ChefHat,
  ArrowRight,
  Sparkles,
  LogIn,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-stone-950 flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-stone-800/80 bg-stone-900/40 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-stone-950 font-bold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent">
                OrderPum
              </span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 hidden sm:inline-block">
                Hệ thống Order tại bàn
              </span>
            </div>
          </div>

          <div>
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-xs font-semibold text-white transition"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{user.displayName}</span>
                  <span className="text-stone-500">·</span>
                  <span className="text-amber-400">{user.roleDisplayName}</span>
                </Link>
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl shadow-md transition"
                >
                  Vào Quản trị
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.99]"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập hệ thống</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 py-16 text-center my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Giai đoạn 1 (MVP) · Bước 1.1 Hoàn tất</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Nền tảng Order tại bàn <br />
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
            Chuỗi Nhà Hàng Hiện Đại
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-stone-400 max-w-2xl mx-auto leading-relaxed">
          Đồng bộ realtime giữa Nhân viên order hộ tại bàn, Khách tự quét mã QR,
          Màn hình chế biến KDS bếp/bar và Trung tâm Quản trị phân quyền linh hoạt theo Bảng CSDL Roles.
        </p>

        {/* Action Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mt-12 text-left">
          {/* Admin */}
          <Link
            href="/admin"
            className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 hover:bg-stone-900 transition-all shadow-xl group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 group-hover:scale-105 transition">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Web Quản trị</h3>
              <ArrowRight className="w-4 h-4 text-stone-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
            </div>
            <p className="mt-2 text-xs text-stone-400 leading-relaxed">
              Bảng CSDL Roles động, quản lý nhân viên, chi nhánh, menu và báo cáo tài chính.
            </p>
          </Link>

          {/* QR Order */}
          <Link
            href="/order"
            className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 hover:bg-stone-900 transition-all shadow-xl group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Order QR Khách</h3>
              <ArrowRight className="w-4 h-4 text-stone-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
            </div>
            <p className="mt-2 text-xs text-stone-400 leading-relaxed">
              Khách quét mã QR tại bàn xem thực đơn, gọi món và gửi đơn trực tiếp.
            </p>
          </Link>

          {/* KDS */}
          <Link
            href="/kds"
            className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 hover:bg-stone-900 transition-all shadow-xl group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition">
              <ChefHat className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Màn hình Bếp (KDS)</h3>
              <ArrowRight className="w-4 h-4 text-stone-500 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
            </div>
            <p className="mt-2 text-xs text-stone-400 leading-relaxed">
              Tiếp nhận món realtime từ nhân viên và khách, cập nhật trạng thái chế biến.
            </p>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-800/80 py-6 px-6 text-center text-xs text-stone-500">
        OrderPum — Hệ thống Order tại bàn (QR + NV order hộ). Thiết kế theo chuẩn SRS & Checklist Roadmap Giai đoạn 1.
      </footer>
    </main>
  );
}
