"use client";

import React, { useState, useEffect } from "react";
import {
  api,
  BranchDto,
  UserDto,
  ShiftTemplateDto,
  AttendanceRecordDto,
  DailyAttendanceSummaryDto,
  ManualAttendanceRequest,
} from "@/shared/api/client";
import { useAuth } from "@/shared/context/AuthContext";
import {
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
  Calendar,
  LogIn,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  X,
  MapPin,
  Timer,
} from "lucide-react";
import Link from "next/link";

export default function AdminAttendancePage() {
  const { user, token, isLoading: authLoading, canManageUsers } = useAuth();

  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [summary, setSummary] = useState<DailyAttendanceSummaryDto | null>(null);
  const [staffUsers, setStaffUsers] = useState<UserDto[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Manual Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState<ManualAttendanceRequest>({
    branchId: "",
    userId: "",
    shiftTemplateId: "",
    workDate: selectedDate,
    checkInTime: undefined,
    checkOutTime: undefined,
    status: "Present",
    note: "",
  });

  useEffect(() => {
    if (!token && !authLoading) return;
    loadInitialData();
  }, [token, authLoading]);

  useEffect(() => {
    if (!selectedBranchId) return;
    loadAttendanceData();
  }, [selectedBranchId, selectedDate]);

  const loadInitialData = async () => {
    try {
      const [branchList, userList] = await Promise.all([
        api.getBranches(),
        api.getUsers(),
      ]);
      setBranches(branchList);
      setStaffUsers(userList);
      if (branchList.length > 0) {
        setSelectedBranchId(branchList[0].id);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setMsg({ type: "error", text: "Lỗi tải dữ liệu: " + error.message });
    }
  };

  const loadAttendanceData = async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    setMsg(null);
    try {
      const [sum, tmplList] = await Promise.all([
        api.getDailyAttendanceSummary(selectedBranchId, selectedDate),
        api.getShiftTemplates(selectedBranchId),
      ]);
      setSummary(sum);
      setTemplates(tmplList);
    } catch (err: unknown) {
      const error = err as Error;
      setMsg({ type: "error", text: "Lỗi tải bảng chấm công: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenManualModal = (record?: AttendanceRecordDto) => {
    if (record) {
      setManualForm({
        id: record.id,
        branchId: record.branchId,
        userId: record.userId,
        shiftTemplateId: record.shiftTemplateId || "",
        workDate: record.workDate.split("T")[0],
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        status: record.status,
        note: record.note || "",
      });
    } else {
      setManualForm({
        branchId: selectedBranchId,
        userId: staffUsers[0]?.id || "",
        shiftTemplateId: templates[0]?.id || "",
        workDate: selectedDate,
        checkInTime: new Date().toISOString(),
        checkOutTime: undefined,
        status: "Present",
        note: "Quản lý chấm công bù",
      });
    }
    setShowManualModal(true);
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.manualUpsertAttendance({
        ...manualForm,
        branchId: selectedBranchId,
        shiftTemplateId: manualForm.shiftTemplateId ? manualForm.shiftTemplateId : undefined,
      });
      setMsg({ type: "success", text: "Đã lưu bản ghi chấm công thành công!" });
      setShowManualModal(false);
      loadAttendanceData();
    } catch (err: unknown) {
      const error = err as Error;
      setMsg({ type: "error", text: error.message });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bản ghi chấm công của ${name}?`)) return;
    try {
      await api.deleteAttendance(id);
      setMsg({ type: "success", text: "Đã xóa bản ghi chấm công." });
      loadAttendanceData();
    } catch (err: unknown) {
      const error = err as Error;
      setMsg({ type: "error", text: error.message });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                BẢNG CHẤM CÔNG NHÂN VIÊN
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                  STT 77, 78
                </span>
              </h1>
              <p className="text-xs text-stone-400">
                Theo dõi giờ vào/ra ca, tính số phút đi trễ, về sớm và tổng giờ công thực tế
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {branches.length > 0 && (
            <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-stone-200 text-xs font-bold focus:outline-none cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-stone-900 text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-stone-200 text-xs font-bold font-mono focus:outline-none cursor-pointer"
            />
          </div>

          <Link
            href="/attendance"
            target="_blank"
            className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-bold transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mở Kiosk Chấm Công</span>
          </Link>

          <button
            onClick={() => handleOpenManualModal()}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Chấm công bù</span>
          </button>

          <button
            onClick={loadAttendanceData}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 font-medium ${
            msg.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-stone-400 font-semibold block">Nhân sự có lịch ca:</span>
            <div className="text-2xl font-black font-mono text-white">
              {summary.scheduledStaffCount} / {summary.totalStaffCount}
            </div>
            <span className="text-[10px] text-stone-500">nhân viên được xếp lịch</span>
          </div>

          <div className="bg-stone-900 border border-emerald-500/30 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <LogIn className="w-3 h-3" /> Đang trong ca:
            </span>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {summary.checkedInCount}
            </div>
            <span className="text-[10px] text-stone-500">đã check-in vào ca</span>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-sky-400 font-semibold flex items-center gap-1">
              <LogOut className="w-3 h-3" /> Đã hoàn thành ca:
            </span>
            <div className="text-2xl font-black font-mono text-sky-400">
              {summary.completedCount}
            </div>
            <span className="text-[10px] text-stone-500">đã check-out ra ca</span>
          </div>

          <div className="bg-stone-900 border border-amber-500/30 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Đi trễ / Về sớm:
            </span>
            <div className="text-2xl font-black font-mono text-amber-400">
              {summary.lateCount} / {summary.earlyLeaveCount}
            </div>
            <span className="text-[10px] text-stone-500">lượt vi phạm giờ ca</span>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-purple-400 font-semibold flex items-center gap-1">
              <Timer className="w-3 h-3" /> Tổng giờ công:
            </span>
            <div className="text-2xl font-black font-mono text-purple-300">
              {summary.totalWorkHours}h
            </div>
            <span className="text-[10px] text-stone-500">giờ công thực tế trong ngày</span>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <span className="text-xs font-extrabold text-white uppercase tracking-wider">
            DANH SÁCH CHẤM CÔNG NGÀY {selectedDate} ({summary?.records.length || 0} LƯỢT)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-950/60 text-stone-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3.5 pl-5">Nhân viên</th>
                <th className="p-3.5">Ca làm việc</th>
                <th className="p-3.5">Giờ Vào (Check-In)</th>
                <th className="p-3.5">Giờ Ra (Check-Out)</th>
                <th className="p-3.5 text-center">Giờ công</th>
                <th className="p-3.5">Phương thức</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-right pr-5">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-800/60 text-xs">
              {summary && summary.records.length > 0 ? (
                summary.records.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-800/30 transition">
                    {/* Staff info */}
                    <td className="p-3.5 pl-5">
                      <div className="font-bold text-white">{r.userDisplayName}</div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-stone-800 text-[10px] font-mono text-stone-300">
                          {r.userRole}
                        </span>
                        <span className="text-stone-500">{r.userName}</span>
                      </div>
                    </td>

                    {/* Shift info */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.shiftColorHex }} />
                        <span className="font-bold text-white">{r.shiftName}</span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-500">
                        {r.scheduledStartTime} – {r.scheduledEndTime}
                      </span>
                    </td>

                    {/* Check In */}
                    <td className="p-3.5">
                      {r.checkInTimeFormatted ? (
                        <div>
                          <span className="font-mono font-bold text-emerald-400">
                            {r.checkInTimeFormatted.split(" ")[0]}
                          </span>
                          {r.lateMinutes > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold">
                              Trễ {r.lateMinutes}p
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-stone-500">--</span>
                      )}
                    </td>

                    {/* Check Out */}
                    <td className="p-3.5">
                      {r.checkOutTimeFormatted ? (
                        <div>
                          <span className="font-mono font-bold text-sky-400">
                            {r.checkOutTimeFormatted.split(" ")[0]}
                          </span>
                          {r.earlyLeaveMinutes > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                              Sớm {r.earlyLeaveMinutes}p
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-amber-400 font-semibold animate-pulse">Đang làm việc...</span>
                      )}
                    </td>

                    {/* Hours */}
                    <td className="p-3.5 text-center font-mono font-black text-purple-300">
                      {r.actualWorkHours > 0 ? `${r.actualWorkHours}h` : "--"}
                    </td>

                    {/* Method */}
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-stone-950 border border-stone-800 text-[11px] text-stone-300 font-medium">
                        {r.checkInMethod === "QuickPin" ? "PIN Kiosk" : r.checkInMethod === "ManagerManual" ? "Sửa tay" : "Web NV"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      {r.status === "InProgress" ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          Đang trong ca
                        </span>
                      ) : r.status === "Completed" ? (
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">
                          Hoàn thành
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          {r.status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right pr-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenManualModal(r)}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                          title="Sửa bản ghi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.userDisplayName)}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-900/40 text-stone-400 hover:text-rose-400 transition"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-500 text-xs">
                    Chưa có lượt chấm công nào trong ngày {selectedDate}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{manualForm.id ? "Chỉnh sửa công nhân viên" : "Chấm công bổ sung (Quản lý)"}</span>
              </h2>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-bold mb-1">Nhân viên:</label>
                <select
                  required
                  value={manualForm.userId}
                  onChange={(e) => setManualForm({ ...manualForm, userId: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {staffUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">Ngày làm việc:</label>
                  <input
                    type="date"
                    required
                    value={manualForm.workDate}
                    onChange={(e) => setManualForm({ ...manualForm, workDate: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">Mẫu ca:</label>
                  <select
                    value={manualForm.shiftTemplateId || ""}
                    onChange={(e) => setManualForm({ ...manualForm, shiftTemplateId: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Ca linh hoạt</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">Ghi chú quản lý:</label>
                <input
                  type="text"
                  value={manualForm.note || ""}
                  onChange={(e) => setManualForm({ ...manualForm, note: e.target.value })}
                  placeholder="Lý do chỉnh sửa hoặc chấm công bù..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black shadow-lg shadow-emerald-500/20"
                >
                  Lưu bản ghi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
