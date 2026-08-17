"use client";

import React, { useState, useEffect } from "react";
import {
  api,
  BranchDto,
  AreaDto,
  UserDto,
  ShiftTemplateDto,
  WeeklyRosterDto,
  StaffShiftScheduleDto,
  CreateShiftTemplateRequest,
  CreateStaffScheduleRequest,
} from "@/shared/api/client";
import { useAuth } from "@/shared/context/AuthContext";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Building2,
  CalendarDays,
  ShieldAlert,
  X,
  MapPin,
} from "lucide-react";

export default function ShiftsPage() {
  const { user, token, isLoading: authLoading, isDirectorOrOwner, isManager } = useAuth();

  const [activeTab, setActiveTab] = useState<"roster" | "templates">("roster");
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [areas, setAreas] = useState<AreaDto[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplateDto[]>([]);
  const [roster, setRoster] = useState<WeeklyRosterDto | null>(null);

  // Week navigation: start of week (Monday)
  const [currentStartOfWeek, setCurrentStartOfWeek] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal states
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplateDto | null>(null);
  const [shiftForm, setShiftForm] = useState<CreateShiftTemplateRequest>({
    code: "",
    name: "",
    description: "",
    startTime: "06:30",
    endTime: "14:30",
    breakMinutes: 30,
    hourlyRateMultiplier: 1.0,
    colorHex: "#10b981",
    isActive: true,
  });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState<CreateStaffScheduleRequest>({
    branchId: "",
    userId: "",
    shiftTemplateId: "",
    areaId: "",
    workDate: "",
    note: "",
  });

  useEffect(() => {
    if (!token && !authLoading) return;
    loadInitialData();
  }, [token, authLoading]);

  useEffect(() => {
    if (!selectedBranchId) return;
    loadBranchData();
  }, [selectedBranchId, currentStartOfWeek, activeTab]);

  const loadInitialData = async () => {
    try {
      const branchList = await api.getBranches();
      setBranches(branchList);
      if (branchList.length > 0) {
        setSelectedBranchId(branchList[0].id);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setMsg({ type: "error", text: "Lỗi tải chi nhánh: " + error.message });
    }
  };

  const loadBranchData = async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    setMsg(null);
    try {
      const [areaList, templateList] = await Promise.all([
        api.getAreas(selectedBranchId),
        api.getShiftTemplates(selectedBranchId),
      ]);
      setAreas(areaList);
      setTemplates(templateList);

      if (activeTab === "roster") {
        const startIso = currentStartOfWeek.toISOString().split("T")[0];
        const rosterData = await api.getWeeklyRoster(selectedBranchId, startIso);
        setRoster(rosterData);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setMsg({ type: "error", text: "Lỗi tải dữ liệu ca làm: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  // Week navigation handlers
  const handlePrevWeek = () => {
    const prev = new Date(currentStartOfWeek);
    prev.setDate(prev.getDate() - 7);
    setCurrentStartOfWeek(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentStartOfWeek);
    next.setDate(next.getDate() + 7);
    setCurrentStartOfWeek(next);
  };

  const handleCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    setCurrentStartOfWeek(d);
  };

  // Template CRUD
  const handleOpenCreateTemplate = () => {
    setEditingTemplate(null);
    setShiftForm({
      branchId: selectedBranchId || undefined,
      code: "",
      name: "",
      description: "",
      startTime: "06:30",
      endTime: "14:30",
      breakMinutes: 30,
      hourlyRateMultiplier: 1.0,
      colorHex: "#10b981",
      isActive: true,
    });
    setShowShiftModal(true);
  };

  const handleOpenEditTemplate = (tmpl: ShiftTemplateDto) => {
    setEditingTemplate(tmpl);
    setShiftForm({
      branchId: tmpl.branchId,
      code: tmpl.code,
      name: tmpl.name,
      description: tmpl.description || "",
      startTime: tmpl.startTime,
      endTime: tmpl.endTime,
      breakMinutes: tmpl.breakMinutes,
      hourlyRateMultiplier: tmpl.hourlyRateMultiplier,
      colorHex: tmpl.colorHex,
      isActive: tmpl.isActive,
    });
    setShowShiftModal(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await api.updateShiftTemplate(editingTemplate.id, shiftForm);
        setMsg({ type: "success", text: "Đã cập nhật mẫu ca làm việc thành công!" });
      } else {
        await api.createShiftTemplate(shiftForm);
        setMsg({ type: "success", text: "Đã tạo mẫu ca làm việc mới thành công!" });
      }
      setShowShiftModal(false);
      loadBranchData();
    } catch (err: unknown) {
      const error = err as Error;
      setMsg({ type: "error", text: error.message });
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mẫu ca "${name}" không?`)) return;
    try {
      await api.deleteShiftTemplate(id);
      setMsg({ type: "success", text: "Đã xóa mẫu ca thành công." });
      loadBranchData();
    } catch (err: unknown) {
      const error = err as Error;
      setMsg({ type: "error", text: error.message });
    }
  };

  // Schedule Assignment
  const handleOpenAssignModal = (userId?: string, dateStr?: string) => {
    setAssignForm({
      branchId: selectedBranchId,
      userId: userId || (roster?.staffRows[0]?.userId ?? ""),
      shiftTemplateId: templates[0]?.id ?? "",
      areaId: "",
      workDate: dateStr || currentStartOfWeek.toISOString().split("T")[0],
      note: "",
    });
    setShowAssignModal(true);
  };

  const handleSaveAssignSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStaffSchedule({
        ...assignForm,
        areaId: assignForm.areaId ? assignForm.areaId : undefined,
      });
      setMsg({ type: "success", text: "Đã xếp ca làm việc thành công!" });
      setShowAssignModal(false);
      loadBranchData();
    } catch (err: unknown) {
      const error = err as Error;
      setMsg({ type: "error", text: error.message });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Bạn có muốn hủy lịch ca làm việc này?")) return;
    try {
      await api.deleteStaffSchedule(scheduleId);
      setMsg({ type: "success", text: "Đã hủy ca làm việc." });
      loadBranchData();
    } catch (err: unknown) {
      const error = err as Error;
      setMsg({ type: "error", text: error.message });
    }
  };

  const formatWeekRange = () => {
    const endOfWeek = new Date(currentStartOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const startStr = currentStartOfWeek.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    const endStr = endOfWeek.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${startStr} – ${endStr}`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                CA LÀM & XẾP LỊCH NHÂN VIÊN
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                  STT 74, 75, 79, 80
                </span>
              </h1>
              <p className="text-xs text-stone-400">
                Quản lý mẫu ca, xếp lịch làm việc theo tuần và phân công nhân viên theo khu vực / tầng
              </p>
            </div>
          </div>
        </div>

        {/* Branch Switcher & Actions */}
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

          {activeTab === "roster" ? (
            <button
              onClick={() => handleOpenAssignModal()}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Phân ca mới (STT 75)</span>
            </button>
          ) : (
            <button
              onClick={handleOpenCreateTemplate}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo mẫu ca (STT 74)</span>
            </button>
          )}

          <button
            onClick={loadBranchData}
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

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("roster")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === "roster"
              ? "bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/20"
              : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Bảng Xếp Lịch Theo Tuần (STT 75, 79, 80)</span>
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === "templates"
              ? "bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/20"
              : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Mẫu Ca Làm Việc ({templates.length}) (STT 74)</span>
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: WEEKLY ROSTER MATRIX (STT 75)       */}
      {/* ========================================== */}
      {activeTab === "roster" && (
        <div className="space-y-4">
          {/* Week Navigation Controls */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevWeek}
                className="p-2 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-800 text-stone-300 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleCurrentWeek}
                className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-800 text-stone-200 text-xs font-bold transition"
              >
                Tuần hiện tại
              </button>

              <button
                onClick={handleNextWeek}
                className="p-2 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-800 text-stone-300 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="text-sm font-extrabold text-white ml-2">Tuần: {formatWeekRange()}</span>
            </div>

            {/* Quick Shift Legend */}
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-stone-500 font-semibold">Mẫu ca:</span>
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-950 border border-stone-800"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.colorHex }} />
                  <span className="font-bold text-stone-300">{t.name}</span>
                  <span className="text-stone-500 font-mono text-[10px]">
                    ({t.startTime}-{t.endTime})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Roster Table Matrix */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-950/60 text-stone-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-3.5 pl-5 w-48">Nhân viên</th>
                    {roster?.staffRows[0]?.days.map((d, i) => {
                      const dateObj = new Date(d.date);
                      const isToday = new Date().toDateString() === dateObj.toDateString();
                      return (
                        <th
                          key={d.date}
                          className={`p-3 text-center border-l border-stone-800/80 ${
                            isToday ? "bg-emerald-500/10 text-emerald-400 font-black" : ""
                          }`}
                        >
                          <div>{d.dayOfWeekName}</div>
                          <div className="text-[10px] font-mono text-stone-500 font-normal">
                            {dateObj.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                          </div>
                        </th>
                      );
                    })}
                    <th className="p-3 text-center w-20 border-l border-stone-800">Tổng ca</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-800/60 text-xs">
                  {roster && roster.staffRows.length > 0 ? (
                    roster.staffRows.map((staff) => (
                      <tr key={staff.userId} className="hover:bg-stone-800/30 transition">
                        {/* Staff Profile Column */}
                        <td className="p-3.5 pl-5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{staff.userDisplayName}</span>
                          </div>
                          <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-stone-800 text-[10px] font-mono text-stone-300">
                              {staff.userRole}
                            </span>
                            <span className="text-stone-500">{staff.userName}</span>
                          </div>
                        </td>

                        {/* 7 Days Matrix Cells */}
                        {staff.days.map((day) => {
                          const dateObj = new Date(day.date);
                          const isToday = new Date().toDateString() === dateObj.toDateString();
                          const dateIso = day.date.split("T")[0];

                          return (
                            <td
                              key={day.date}
                              className={`p-2 border-l border-stone-800/80 align-top relative group ${
                                isToday ? "bg-emerald-500/5" : ""
                              }`}
                            >
                              <div className="space-y-1.5 min-h-[48px]">
                                {day.shifts.map((s) => (
                                  <div
                                    key={s.id}
                                    className="p-1.5 rounded-xl border text-[11px] space-y-0.5 shadow-sm transition hover:scale-[1.02]"
                                    style={{
                                      backgroundColor: `${s.colorHex}15`,
                                      borderColor: `${s.colorHex}40`,
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-white truncate">{s.shiftName}</span>
                                      <button
                                        onClick={() => handleDeleteSchedule(s.id)}
                                        className="text-stone-500 hover:text-rose-400 p-0.5 transition"
                                        title="Hủy ca"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <div className="text-[10px] font-mono text-stone-300 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>
                                        {s.startTime} - {s.endTime}
                                      </span>
                                    </div>

                                    {/* Assigned Area / Floor (STT 80) */}
                                    <div className="text-[10px] flex items-center gap-1 font-semibold text-emerald-400">
                                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                      <span className="truncate">{s.areaName || "Toàn quán"}</span>
                                    </div>
                                  </div>
                                ))}

                                {/* Quick Add Button in cell */}
                                <button
                                  onClick={() => handleOpenAssignModal(staff.userId, dateIso)}
                                  className="w-full py-1 rounded-lg border border-dashed border-stone-800 hover:border-emerald-500/60 hover:bg-emerald-500/10 text-stone-500 hover:text-emerald-400 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Thêm ca</span>
                                </button>
                              </div>
                            </td>
                          );
                        })}

                        {/* Total Shifts Count */}
                        <td className="p-3 text-center border-l border-stone-800 font-mono font-bold text-emerald-400">
                          {staff.totalShiftsCount} ca
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-stone-500 text-xs">
                        Chưa có dữ liệu nhân viên hoặc lịch làm việc cho tuần này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: SHIFT TEMPLATES (STT 74)            */}
      {/* ========================================== */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden group hover:border-stone-700 transition"
            >
              {/* Top Accent Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: tmpl.colorHex }}
              />

              <div className="flex items-start justify-between gap-2 pt-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded font-mono text-[11px] font-black border"
                      style={{
                        backgroundColor: `${tmpl.colorHex}20`,
                        color: tmpl.colorHex,
                        borderColor: `${tmpl.colorHex}40`,
                      }}
                    >
                      {tmpl.code}
                    </span>
                    <h3 className="text-base font-bold text-white">{tmpl.name}</h3>
                  </div>
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    {tmpl.description || "Không có mô tả thêm"}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleOpenEditTemplate(tmpl)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                    title="Sửa mẫu ca"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(tmpl.id, tmpl.name)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-900/40 text-stone-400 hover:text-rose-400 transition"
                    title="Xóa mẫu ca"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Shift Timing Details */}
              <div className="bg-stone-950 rounded-2xl p-3 border border-stone-800/80 text-xs space-y-1.5">
                <div className="flex justify-between text-stone-400">
                  <span>Khung giờ làm việc:</span>
                  <span className="font-mono font-bold text-white">
                    {tmpl.startTime} – {tmpl.endTime}
                  </span>
                </div>

                <div className="flex justify-between text-stone-400">
                  <span>Nghỉ giữa ca:</span>
                  <span className="font-mono text-stone-300">{tmpl.breakMinutes} phút</span>
                </div>

                <div className="flex justify-between text-stone-400">
                  <span>Hệ số lương:</span>
                  <span className="font-mono font-bold text-amber-400">x{tmpl.hourlyRateMultiplier}</span>
                </div>

                <div className="flex justify-between text-stone-400">
                  <span>Phạm vi áp dụng:</span>
                  <span className="font-medium text-stone-300">{tmpl.branchName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CREATE / EDIT SHIFT TEMPLATE (STT 74)*/}
      {/* ========================================== */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{editingTemplate ? "Chỉnh sửa mẫu ca" : "Tạo mẫu ca làm việc mới"}</span>
              </h2>
              <button
                onClick={() => setShowShiftModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-stone-300 font-bold mb-1">Mã ca:</label>
                  <input
                    type="text"
                    required
                    value={shiftForm.code}
                    onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value })}
                    placeholder="CA-SANG"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-stone-300 font-bold mb-1">Tên ca làm việc:</label>
                  <input
                    type="text"
                    required
                    value={shiftForm.name}
                    onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                    placeholder="VD: Ca Sáng (06:30 - 14:30)"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">Giờ bắt đầu:</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-bold mb-1">Giờ kết thúc:</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">Nghỉ (phút):</label>
                  <input
                    type="number"
                    value={shiftForm.breakMinutes}
                    onChange={(e) => setShiftForm({ ...shiftForm, breakMinutes: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-bold mb-1">Hệ số lương:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={shiftForm.hourlyRateMultiplier}
                    onChange={(e) => setShiftForm({ ...shiftForm, hourlyRateMultiplier: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-bold mb-1">Màu sắc:</label>
                  <input
                    type="color"
                    value={shiftForm.colorHex}
                    onChange={(e) => setShiftForm({ ...shiftForm, colorHex: e.target.value })}
                    className="w-full h-8 bg-stone-950 border border-stone-800 rounded-xl p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">Mô tả thêm:</label>
                <input
                  type="text"
                  value={shiftForm.description}
                  onChange={(e) => setShiftForm({ ...shiftForm, description: e.target.value })}
                  placeholder="Ghi chú chi tiết ca..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black shadow-lg shadow-emerald-500/20"
                >
                  {editingTemplate ? "Lưu thay đổi" : "Tạo mẫu ca"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ASSIGN STAFF SCHEDULE (STT 75, 80)   */}
      {/* ========================================== */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-400" />
                <span>Phân ca làm việc cho Nhân viên</span>
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignSchedule} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-bold mb-1">Nhân viên:</label>
                <select
                  required
                  value={assignForm.userId}
                  onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {roster?.staffRows.map((s) => (
                    <option key={s.userId} value={s.userId}>
                      {s.userDisplayName} ({s.userRole})
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
                    value={assignForm.workDate}
                    onChange={(e) => setAssignForm({ ...assignForm, workDate: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">Mẫu ca:</label>
                  <select
                    required
                    value={assignForm.shiftTemplateId}
                    onChange={(e) => setAssignForm({ ...assignForm, shiftTemplateId: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Area / Floor Assignment (STT 80) */}
              <div>
                <label className="block text-stone-300 font-bold mb-1">
                  Phân công Khu vực / Tầng phụ trách (STT 80):
                </label>
                <select
                  value={assignForm.areaId || ""}
                  onChange={(e) => setAssignForm({ ...assignForm, areaId: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Toàn quán (Không giới hạn khu)</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.tableCount} bàn)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-stone-500 mt-1">
                  Nhân viên chỉ nhận thông báo và phụ trách các bàn trong khu vực này trong ca làm.
                </p>
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">Ghi chú ca:</label>
                <input
                  type="text"
                  value={assignForm.note || ""}
                  onChange={(e) => setAssignForm({ ...assignForm, note: e.target.value })}
                  placeholder="VD: Trưởng ca sảnh, hỗ trợ quầy bar..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black shadow-lg shadow-emerald-500/20"
                >
                  Xác nhận xếp ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
