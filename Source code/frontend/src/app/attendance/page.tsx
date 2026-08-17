"use client";

import React, { useState, useEffect } from "react";
import {
  api,
  BranchDto,
  AttendanceRecordDto,
  ShiftTemplateDto,
} from "@/shared/api/client";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  UserCheck,
  UserX,
  LogIn,
  LogOut,
  Delete,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default function AttendanceKioskPage() {
  const [time, setTime] = useState<Date | null>(null);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [action, setAction] = useState<"Auto" | "CheckIn" | "CheckOut">("Auto");
  const [loading, setLoading] = useState(false);
  const [resultRecord, setResultRecord] = useState<AttendanceRecordDto | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    loadBranches();
    return () => clearInterval(timer);
  }, []);

  const loadBranches = async () => {
    try {
      const list = await api.getBranches();
      setBranches(list);
      if (list.length > 0) setSelectedBranchId(list[0].id);
    } catch {
      // ignore
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
      setErrorMsg(null);
      setResultRecord(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPin("");
    setErrorMsg(null);
    setResultRecord(null);
  };

  const handleSubmitAttendance = async () => {
    if (!pin) {
      setErrorMsg("Vui lòng nhập mã PIN hoặc 4 số cuối điện thoại của bạn.");
      return;
    }
    if (!selectedBranchId) {
      setErrorMsg("Vui lòng chọn chi nhánh làm việc.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResultRecord(null);

    try {
      const res = await api.quickPinAttendance({
        branchId: selectedBranchId,
        pinCode: pin,
        action: action,
        locationNote: "Kiosk Quầy Thu Ngân",
      });

      setResultRecord(res);
      setPin("");
      setTimeout(() => {
        setResultRecord(null);
      }, 5000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Lỗi xác thực chấm công.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="p-4 border-b border-stone-800/80 bg-stone-900/50 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
            title="Về Trang Quản Trị"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-emerald-500/20">
              P
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white leading-none">KIOSK CHẤM CÔNG NHÂN VIÊN</h1>
              <span className="text-[11px] text-stone-400 font-semibold">OrderPum Smart Attendance • STT 77</span>
            </div>
          </div>
        </div>

        {/* Branch Selector */}
        {branches.length > 0 && (
          <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-2xl px-3 py-1.5">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-stone-900 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Main Kiosk Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md w-full mx-auto space-y-6">
        {/* Real-time Clock */}
        <div className="text-center space-y-1">
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-wider text-white drop-shadow-md">
            {time ? time.toLocaleTimeString("vi-VN") : "--:--:--"}
          </div>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            {time
              ? time.toLocaleDateString("vi-VN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : ""}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {[
            { id: "Auto", label: "Tự động Nhận", icon: Sparkles },
            { id: "CheckIn", label: "Vào ca", icon: LogIn },
            { id: "CheckOut", label: "Ra ca", icon: LogOut },
          ].map((m) => {
            const Icon = m.icon;
            const isSelected = action === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setAction(m.id as any)}
                className={`py-2.5 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                  isSelected
                    ? "bg-emerald-500 text-stone-950 border-emerald-500 shadow-lg shadow-emerald-500/20"
                    : "bg-stone-900 border-stone-800 text-stone-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* PIN Input Display */}
        <div className="w-full bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="text-center space-y-2">
            <span className="text-xs text-stone-400 font-semibold block">
              Nhập mã PIN (4-6 số) hoặc số đuôi điện thoại:
            </span>
            <div className="h-12 flex items-center justify-center gap-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    i < pin.length
                      ? "bg-emerald-400 border-emerald-400 scale-110 shadow-md shadow-emerald-500/40"
                      : "bg-stone-950 border-stone-700"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultRecord && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs space-y-1.5 animate-in zoom-in-95">
              <div className="flex items-center gap-2 font-black text-sm text-white">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>
                  {resultRecord.checkOutTime ? "CHECK-OUT RA CA THÀNH CÔNG!" : "CHECK-IN VÀO CA THÀNH CÔNG!"}
                </span>
              </div>
              <p className="text-stone-300">
                Nhân viên: <strong className="text-white">{resultRecord.userDisplayName}</strong> ({resultRecord.userRole})
              </p>
              <div className="text-stone-400 text-[11px] font-mono">
                {resultRecord.checkOutTime ? (
                  <div>
                    Giờ ra: {resultRecord.checkOutTimeFormatted} • Công: <strong className="text-emerald-400">{resultRecord.actualWorkHours}h</strong>
                  </div>
                ) : (
                  <div>
                    Giờ vào: {resultRecord.checkInTimeFormatted} • Ca: <strong className="text-emerald-400">{resultRecord.shiftName}</strong>
                    {resultRecord.lateMinutes > 0 && (
                      <span className="text-rose-400 ml-1">(Trễ {resultRecord.lateMinutes}p)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PIN Pad 3x4 Grid */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleKeyPress(n)}
                className="h-14 rounded-2xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-xl font-bold font-mono text-white active:scale-95 transition flex items-center justify-center shadow"
              >
                {n}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-14 rounded-2xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-xs font-bold text-stone-400 active:scale-95 transition flex items-center justify-center"
            >
              XÓA
            </button>

            <button
              type="button"
              onClick={() => handleKeyPress("0")}
              className="h-14 rounded-2xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-xl font-bold font-mono text-white active:scale-95 transition flex items-center justify-center shadow"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="h-14 rounded-2xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-400 active:scale-95 transition flex items-center justify-center"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Submit Action Button */}
          <button
            type="button"
            disabled={loading || pin.length === 0}
            onClick={handleSubmitAttendance}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 font-black text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <UserCheck className="w-5 h-5" />
            <span>{loading ? "Đang xử lý..." : "XÁC NHẬN CHẤM CÔNG"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
