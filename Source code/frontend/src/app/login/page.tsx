"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, getRoleBadgeStyle } from "@/shared/context/AuthContext";
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Hash,
  Users,
  UtensilsCrossed,
} from "lucide-react";

type DemoAccount = {
  level: number;
  roleTitle: string;
  name: string;
  phoneOrEmail: string;
  password: string;
  pin: string;
  branch: string;
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    level: 1,
    roleTitle: "Giám đốc chuỗi",
    name: "Nguyễn Văn Giám Đốc",
    phoneOrEmail: "director@orderpum.vn",
    password: "Pass@123",
    pin: "1111",
    branch: "Toàn chuỗi hệ thống",
  },
  {
    level: 2,
    roleTitle: "Chủ nhà hàng",
    name: "Trần Thị Chủ Quán",
    phoneOrEmail: "owner@orderpum.vn",
    password: "Pass@123",
    pin: "2222",
    branch: "Chi nhánh 1 (Quận 1)",
  },
  {
    level: 3,
    roleTitle: "Quản lý chi nhánh",
    name: "Lê Văn Quản Lý Q1",
    phoneOrEmail: "manager.q1@orderpum.vn",
    password: "Pass@123",
    pin: "3333",
    branch: "Chi nhánh 1 (Quận 1)",
  },
  {
    level: 4,
    roleTitle: "Trưởng bộ phận",
    name: "Võ Quốc Bếp Trưởng",
    phoneOrEmail: "lead.kitchen@orderpum.vn",
    password: "Pass@123",
    pin: "4444",
    branch: "Bếp CN1 (Quận 1)",
  },
  {
    level: 5,
    roleTitle: "NV chính thức",
    name: "Đỗ Mai Phục Vụ",
    phoneOrEmail: "staff.service1@orderpum.vn",
    password: "Pass@123",
    pin: "5555",
    branch: "Phục vụ CN1",
  },
  {
    level: 6,
    roleTitle: "NV thử việc",
    name: "Ngô Tuấn Thử Việc",
    phoneOrEmail: "probation.waiter@orderpum.vn",
    password: "Pass@123",
    pin: "6666",
    branch: "Tập sự CN1",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loginPin } = useAuth();

  const [tab, setTab] = useState<"password" | "pin">("password");
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/admin");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === "password") {
        if (!phoneOrEmail || !password) {
          throw new Error("Vui lòng nhập đầy đủ Email/SĐT và mật khẩu.");
        }
        await login(phoneOrEmail, password);
      } else {
        if (!phoneOrEmail || !pin) {
          throw new Error("Vui lòng nhập Email/SĐT và mã PIN.");
        }
        await loginPin(phoneOrEmail, pin);
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (acc: DemoAccount) => {
    setPhoneOrEmail(acc.phoneOrEmail);
    setPassword(acc.password);
    setPin(acc.pin);
    setError(null);
  };

  const handlePinKeypad = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
    }
  };

  const handlePinClear = () => {
    setPin("");
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-amber-500 selection:text-stone-950">
      {/* Header */}
      <header className="border-b border-stone-800/80 bg-stone-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-stone-950 font-bold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent">
                OrderPum
              </span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Hệ thống nội bộ
              </span>
            </div>
          </div>
          <div className="text-xs text-stone-400 hidden sm:block">
            Bước 1.1 — Xác thực & Bảng Vai trò CSDL Động
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full grid lg:grid-cols-12 gap-8 items-start my-auto">
        {/* Left Column: Form Login */}
        <div className="lg:col-span-6 xl:col-span-5 bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">Đăng nhập tài khoản</h2>
              <p className="mt-1 text-sm text-stone-400">
                Truy cập hệ thống quản trị, phục vụ bàn và màn hình bếp
              </p>
            </div>

            {/* Tab switch */}
            <div className="grid grid-cols-2 gap-1 bg-stone-950/80 p-1 rounded-xl border border-stone-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setTab("password");
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                  tab === "password"
                    ? "bg-amber-500 text-stone-950 shadow-md font-semibold"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <KeyRound className="w-4 h-4" />
                Mật khẩu chuẩn
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("pin");
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                  tab === "pin"
                    ? "bg-amber-500 text-stone-950 shadow-md font-semibold"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <Hash className="w-4 h-4" />
                Mã PIN nhanh
              </button>
            </div>

            {/* Alert Error */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Alert Success */}
            {success && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Đăng nhập thành công! Đang chuyển hướng...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Phone / Email input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                  Email hoặc Số điện thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    placeholder="VD: director@orderpum.vn hoặc 0901234567"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-950/70 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm transition"
                  />
                </div>
              </div>

              {/* Password Tab */}
              {tab === "password" && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                      Mật khẩu
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-950/70 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm transition"
                    />
                  </div>
                </div>
              )}

              {/* PIN Tab */}
              {tab === "pin" && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                      Mã PIN nhanh (4 - 6 số)
                    </label>
                  </div>
                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                      <Hash className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="Nhập mã PIN hoặc bấm bàn phím số bên dưới"
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-950/70 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm tracking-widest text-center font-mono transition"
                    />
                  </div>

                  {/* Virtual Keypad for Counter Staff */}
                  <div className="grid grid-cols-3 gap-2 bg-stone-950/50 p-2.5 rounded-2xl border border-stone-800/80">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "Xóa", "0", "OK"].map((key) => {
                      if (key === "Xóa") {
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={handlePinClear}
                            className="py-2.5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-stone-400 rounded-xl font-medium text-xs border border-stone-800 transition"
                          >
                            Xóa
                          </button>
                        );
                      }
                      if (key === "OK") {
                        return (
                          <button
                            key={key}
                            type="submit"
                            disabled={loading}
                            className="py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 rounded-xl font-bold text-xs shadow-md transition"
                          >
                            Vào
                          </button>
                        );
                      }
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handlePinKeypad(key)}
                          className="py-2.5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white rounded-xl font-semibold text-base border border-stone-800 transition"
                        >
                          {key}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {tab === "password" && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Đăng nhập hệ thống</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </form>

            <div className="mt-6 pt-5 border-t border-stone-800/80 text-center">
              <span className="text-xs text-stone-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                Bảo mật nội bộ khép kín · Mã hóa JWT & SHA256
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Demo Accounts Picker */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-4">
          <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Tài khoản mẫu các cấp bậc (Đã Seed CSDL)</h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                Bấm để tự điền & test
              </span>
            </div>
            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
              Hệ thống đã tự động seed 8 tài khoản mẫu chuẩn theo các vai trò trong bảng CSDL `Roles`.
              Mật khẩu chung: <code className="text-amber-300 font-mono bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">Pass@123</code>.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((acc) => {
                const style = getRoleBadgeStyle(acc.level);
                const isCurrent = phoneOrEmail === acc.phoneOrEmail;
                return (
                  <div
                    key={acc.phoneOrEmail}
                    onClick={() => handleSelectDemo(acc)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all text-left group ${
                      isCurrent
                        ? "bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10"
                        : "bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md mb-1.5 border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}
                        >
                          Cấp {acc.level} · {acc.roleTitle}
                        </span>
                        <h4 className="font-semibold text-white text-sm group-hover:text-amber-300 transition">
                          {acc.name}
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono bg-stone-900 text-stone-400 px-1.5 py-0.5 rounded border border-stone-800">
                        PIN: {acc.pin}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-stone-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <span className="truncate">{acc.phoneOrEmail}</span>
                    </div>

                    <div className="mt-1 text-[11px] text-stone-500 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <span className="truncate">{acc.branch}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="p-4 rounded-2xl bg-stone-900/40 border border-stone-800/80 text-xs text-stone-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Phân quyền động: Cấp trên quản lý cấp dưới · Thêm/sửa vai trò tùy ý trong bảng CSDL Roles</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800/80 py-4 px-6 text-center text-xs text-stone-500">
        OrderPum — Hệ thống Order tại bàn & Quản trị Nhà hàng © 2026.
      </footer>
    </div>
  );
}
