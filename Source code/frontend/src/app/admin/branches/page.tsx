"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/shared/context/AuthContext";
import {
  api,
  BranchDto,
  CreateBranchRequest,
  UpdateBranchRequest,
  UpdateFinancialConfigRequest,
} from "@/shared/api/client";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Users,
  Percent,
  Clock,
  Phone,
  MapPin,
  Coins,
  Receipt,
  Sliders,
  ExternalLink,
  Power,
} from "lucide-react";

export default function BranchesManagementPage() {
  const { user: currentUser, isDirectorOrOwner, isManager } = useAuth();

  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal 1: Create / Edit Basic Info
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchDto | null>(null);
  const [infoFormData, setInfoFormData] = useState({
    code: "",
    name: "",
    address: "",
    phone: "",
    openHours: "08:00 - 22:30",
    imageUrl: "",
    isActive: true,
  });

  // Modal 2: Financial & Tax Configuration (STT 99)
  const [financialModalOpen, setFinancialModalOpen] = useState(false);
  const [financialBranch, setFinancialBranch] = useState<BranchDto | null>(null);
  const [financialFormData, setFinancialFormData] = useState({
    taxRatePercent: 8,
    serviceChargePercent: 0,
    currency: "VND",
    isTaxIncludedInPrice: false,
    isServiceChargeIncluded: false,
    receiptHeaderNote: "",
    receiptFooterNote: "Cảm ơn quý khách và hẹn gặp lại!",
  });

  // Modal 3: Confirm Toggle / Delete
  const [confirmToggleBranch, setConfirmToggleBranch] = useState<BranchDto | null>(null);
  const [confirmDeleteBranch, setConfirmDeleteBranch] = useState<BranchDto | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadBranches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBranches(true);
      setBranches(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải danh sách chi nhánh.";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  // Open Create Info Modal
  const handleOpenCreate = () => {
    setEditingBranch(null);
    setInfoFormData({
      code: "",
      name: "",
      address: "",
      phone: "",
      openHours: "08:00 - 22:30",
      imageUrl: "",
      isActive: true,
    });
    setFormError(null);
    setInfoModalOpen(true);
  };

  // Open Edit Info Modal
  const handleOpenEdit = (branch: BranchDto) => {
    setEditingBranch(branch);
    setInfoFormData({
      code: branch.code,
      name: branch.name,
      address: branch.address || "",
      phone: branch.phone || "",
      openHours: branch.openHours || "08:00 - 22:30",
      imageUrl: branch.imageUrl || "",
      isActive: branch.isActive,
    });
    setFormError(null);
    setInfoModalOpen(true);
  };

  // Open Financial Config Modal (STT 99)
  const handleOpenFinancial = (branch: BranchDto) => {
    setFinancialBranch(branch);
    setFinancialFormData({
      taxRatePercent: branch.taxRatePercent,
      serviceChargePercent: branch.serviceChargePercent,
      currency: branch.currency || "VND",
      isTaxIncludedInPrice: branch.isTaxIncludedInPrice,
      isServiceChargeIncluded: branch.isServiceChargeIncluded,
      receiptHeaderNote: branch.receiptHeaderNote || "",
      receiptFooterNote: branch.receiptFooterNote || "",
    });
    setFormError(null);
    setFinancialModalOpen(true);
  };

  // Submit Info Form
  const handleSubmitInfoForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    try {
      if (editingBranch) {
        const payload: UpdateBranchRequest = {
          name: infoFormData.name.trim(),
          address: infoFormData.address.trim(),
          phone: infoFormData.phone.trim(),
          openHours: infoFormData.openHours.trim(),
          imageUrl: infoFormData.imageUrl.trim() || undefined,
          isActive: infoFormData.isActive,
        };
        await api.updateBranch(editingBranch.id, payload);
        showToast("success", `Cập nhật chi nhánh "${infoFormData.name}" thành công.`);
      } else {
        const payload: CreateBranchRequest = {
          code: infoFormData.code.trim().toUpperCase(),
          name: infoFormData.name.trim(),
          address: infoFormData.address.trim(),
          phone: infoFormData.phone.trim(),
          openHours: infoFormData.openHours.trim(),
          imageUrl: infoFormData.imageUrl.trim() || undefined,
          isActive: infoFormData.isActive,
        };
        await api.createBranch(payload);
        showToast("success", `Tạo chi nhánh "${infoFormData.name}" thành công.`);
      }

      setInfoModalOpen(false);
      loadBranches();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu thông tin chi nhánh.";
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Financial Form
  const handleSubmitFinancialForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!financialBranch) return;
    setFormError(null);
    setFormSubmitting(true);

    try {
      const payload: UpdateFinancialConfigRequest = {
        taxRatePercent: Number(financialFormData.taxRatePercent),
        serviceChargePercent: Number(financialFormData.serviceChargePercent),
        currency: financialFormData.currency.trim().toUpperCase() || "VND",
        isTaxIncludedInPrice: financialFormData.isTaxIncludedInPrice,
        isServiceChargeIncluded: financialFormData.isServiceChargeIncluded,
        receiptHeaderNote: financialFormData.receiptHeaderNote.trim() || undefined,
        receiptFooterNote: financialFormData.receiptFooterNote.trim() || undefined,
      };

      await api.updateBranchFinancialConfig(financialBranch.id, payload);
      showToast("success", `Cập nhật cấu hình tài chính cho "${financialBranch.name}" thành công.`);
      setFinancialModalOpen(false);
      loadBranches();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi khi lưu cấu hình tài chính.";
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Active
  const handleToggleActive = async () => {
    if (!confirmToggleBranch) return;
    setActionLoading(true);
    try {
      const res = await api.toggleBranchActive(confirmToggleBranch.id);
      showToast("success", res.message);
      setConfirmToggleBranch(null);
      loadBranches();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể thay đổi trạng thái chi nhánh.";
      showToast("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Branch
  const handleDeleteBranch = async () => {
    if (!confirmDeleteBranch) return;
    setActionLoading(true);
    try {
      const res = await api.deleteBranch(confirmDeleteBranch.id);
      showToast("success", res.message);
      setConfirmDeleteBranch(null);
      loadBranches();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể xóa chi nhánh.";
      showToast("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  const activeCount = branches.filter((b) => b.isActive).length;
  const inactiveCount = branches.filter((b) => !b.isActive).length;
  const totalStaffCount = branches.reduce((sum, b) => sum + b.staffCount, 0);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md animate-slideIn ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/90 border-rose-500/40 text-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Module 2 & 14 · STT 8, 99, 105
            </span>
            <span className="text-xs text-stone-500">Phân quyền Dữ liệu Nội bộ</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1.5 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-amber-500" />
            Chi nhánh & Cấu hình Tài chính
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Quản lý mạng lưới chi nhánh, cấu hình thuế suất VAT, phí dịch vụ và tiền tệ hóa đơn.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadBranches()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 transition"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {isDirectorOrOwner && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-xs transition-all active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm chi nhánh mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Tổng chi nhánh</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{branches.length}</div>
          <div className="mt-1 text-[11px] text-stone-500">Mạng lưới nhà hàng</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Đang mở cửa</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{activeCount}</div>
          <div className="mt-1 text-[11px] text-stone-500">Sẵn sàng phục vụ khách</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Tạm đóng cửa</span>
            <Power className="w-4 h-4 text-stone-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-400">{inactiveCount}</div>
          <div className="mt-1 text-[11px] text-stone-500">Đang bảo trì / ngưng nhận khách</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Tổng nhân sự gán</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-400">{totalStaffCount}</div>
          <div className="mt-1 text-[11px] text-stone-500">Được phân công chi nhánh</div>
        </div>
      </div>

      {/* Branches List */}
      <div className="grid lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-stone-500 bg-stone-900 border border-stone-800 rounded-3xl">
            <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Đang tải dữ liệu chi nhánh...
          </div>
        ) : branches.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-stone-500 bg-stone-900 border border-stone-800 rounded-3xl">
            Chưa có chi nhánh nào được cấu hình trong hệ thống.
          </div>
        ) : (
          branches.map((b) => {
            const isAssigned = currentUser?.branchId === b.id;

            return (
              <div
                key={b.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between shadow-xl ${
                  b.isActive
                    ? "bg-stone-900/90 border-stone-800 hover:border-stone-700"
                    : "bg-stone-950/80 border-stone-800/60 opacity-70"
                }`}
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm shadow-inner shrink-0">
                        {b.code}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                            {b.name}
                          </h3>
                          {isAssigned && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              CN của bạn
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {b.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Đang hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-500 border border-stone-700">
                              Tạm đóng
                            </span>
                          )}
                          <span className="text-[11px] text-stone-500 font-mono">ID: {b.code}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Staff Badge Link */}
                    <Link
                      href={`/admin/users?branchId=${b.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-[11px] text-stone-300 font-semibold transition"
                      title="Xem danh sách nhân viên chi nhánh này"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>{b.staffCount} NV</span>
                      <ExternalLink className="w-2.5 h-2.5 text-stone-500" />
                    </Link>
                  </div>

                  {/* Info details */}
                  <div className="mt-4 space-y-2 text-xs text-stone-300">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                      <span className="text-stone-300">{b.address || "Chưa cập nhật địa chỉ"}</span>
                    </div>
                    <div className="flex items-center gap-4 text-stone-400">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        <span>{b.phone || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        <span>{b.openHours || "08:00 - 22:30"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Tax Config Card Section (STT 99) */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800/80">
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1.5 text-amber-400/90">
                        <Coins className="w-3.5 h-3.5" />
                        Cấu hình Tài chính & Thuế (STT 99)
                      </span>
                      <span className="text-stone-500 font-mono font-normal">Tiền tệ: {b.currency}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-stone-900/80 border border-stone-800/50">
                        <div className="text-[10px] text-stone-500">Thuế VAT</div>
                        <div className="text-sm font-bold text-white flex items-center gap-1 mt-0.5">
                          <Percent className="w-3.5 h-3.5 text-amber-400" />
                          <span>{b.taxRatePercent}%</span>
                          <span className="text-[10px] font-normal text-stone-500 ml-1">
                            {b.isTaxIncludedInPrice ? "(Đã gồm)" : "(Cộng thêm)"}
                          </span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-stone-900/80 border border-stone-800/50">
                        <div className="text-[10px] text-stone-500">Phí dịch vụ</div>
                        <div className="text-sm font-bold text-white flex items-center gap-1 mt-0.5">
                          <Percent className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{b.serviceChargePercent}%</span>
                          <span className="text-[10px] font-normal text-stone-500 ml-1">
                            {b.isServiceChargeIncluded ? "(Đã gồm)" : "(Cộng thêm)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {(b.receiptHeaderNote || b.receiptFooterNote) && (
                      <div className="mt-2 text-[11px] text-stone-400 truncate flex items-center gap-1">
                        <Receipt className="w-3 h-3 text-stone-500 shrink-0" />
                        <span className="truncate italic">
                          &ldquo;{b.receiptFooterNote || b.receiptHeaderNote}&rdquo;
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-3.5 border-t border-stone-800 flex items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-stone-500">
                    Tạo: {new Date(b.createdAt).toLocaleDateString("vi-VN")}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Financial Config button (STT 99) */}
                    {isDirectorOrOwner && (
                      <button
                        onClick={() => handleOpenFinancial(b)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 font-medium transition"
                        title="Cấu hình thuế, phí dịch vụ, hóa đơn"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Thuế / Phí</span>
                      </button>
                    )}

                    {/* Edit Info */}
                    {(isDirectorOrOwner || (isManager && isAssigned)) && (
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-medium transition"
                        title="Sửa thông tin chi nhánh"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                    )}

                    {/* Toggle Active */}
                    {isDirectorOrOwner && (
                      <button
                        onClick={() => setConfirmToggleBranch(b)}
                        className={`p-1.5 rounded-xl border transition ${
                          b.isActive
                            ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                        }`}
                        title={b.isActive ? "Tạm đóng chi nhánh" : "Mở hoạt động chi nhánh"}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete */}
                    {currentUser?.roleLevel === 1 && (
                      <button
                        onClick={() => setConfirmDeleteBranch(b)}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                        title="Xóa chi nhánh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal 1: Create / Edit Branch Info */}
      {infoModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  {editingBranch ? <Edit className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingBranch ? "Chỉnh sửa chi nhánh" : "Thêm chi nhánh mới"}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Cập nhật thông tin nhận diện và địa chỉ vận hành
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInfoModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitInfoForm} className="space-y-4 text-xs">
              {/* Code */}
              <div>
                <label className="block font-semibold uppercase text-stone-300 mb-1">
                  Mã chi nhánh (Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={editingBranch !== null}
                  value={infoFormData.code}
                  onChange={(e) =>
                    setInfoFormData({
                      ...infoFormData,
                      code: e.target.value.replace(/\s+/g, "").toUpperCase(),
                    })
                  }
                  placeholder="VD: CN01, CN-Q1, CN-CG..."
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block font-semibold uppercase text-stone-300 mb-1">
                  Tên chi nhánh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={infoFormData.name}
                  onChange={(e) => setInfoFormData({ ...infoFormData, name: e.target.value })}
                  placeholder="VD: Chi nhánh 1 - Bến Nghé, Quận 1"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block font-semibold uppercase text-stone-300 mb-1">
                  Địa chỉ chi nhánh
                </label>
                <input
                  type="text"
                  value={infoFormData.address}
                  onChange={(e) => setInfoFormData({ ...infoFormData, address: e.target.value })}
                  placeholder="VD: Số 12 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Phone & OpenHours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-stone-300 mb-1">
                    Hotline liên hệ
                  </label>
                  <input
                    type="text"
                    value={infoFormData.phone}
                    onChange={(e) => setInfoFormData({ ...infoFormData, phone: e.target.value })}
                    placeholder="VD: 028 3822 1234"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-stone-300 mb-1">
                    Giờ hoạt động
                  </label>
                  <input
                    type="text"
                    value={infoFormData.openHours}
                    onChange={(e) =>
                      setInfoFormData({ ...infoFormData, openHours: e.target.value })
                    }
                    placeholder="VD: 08:00 - 22:30"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* IsActive */}
              {isDirectorOrOwner && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveBranch"
                    checked={infoFormData.isActive}
                    onChange={(e) =>
                      setInfoFormData({ ...infoFormData, isActive: e.target.checked })
                    }
                    className="rounded border-stone-800 bg-stone-950 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="isActiveBranch" className="text-xs text-stone-300">
                    Chi nhánh đang mở cửa hoạt động
                  </label>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setInfoModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {formSubmitting ? "Đang lưu..." : editingBranch ? "Lưu thay đổi" : "Tạo chi nhánh"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Financial & Tax Configuration (STT 99) */}
      {financialModalOpen && financialBranch && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Cấu hình Tài chính & Thuế (STT 99)
                  </h3>
                  <p className="text-xs text-stone-400">{financialBranch.name}</p>
                </div>
              </div>
              <button
                onClick={() => setFinancialModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitFinancialForm} className="space-y-4 text-xs">
              {/* VAT & Service Charge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-stone-300 mb-1">
                    Thuế suất VAT (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    required
                    value={financialFormData.taxRatePercent}
                    onChange={(e) =>
                      setFinancialFormData({
                        ...financialFormData,
                        taxRatePercent: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">VD: 8% hoặc 10%</p>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-stone-300 mb-1">
                    Phí dịch vụ (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    required
                    value={financialFormData.serviceChargePercent}
                    onChange={(e) =>
                      setFinancialFormData({
                        ...financialFormData,
                        serviceChargePercent: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">VD: 0% hoặc 5%</p>
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block font-semibold uppercase text-stone-300 mb-1">
                  Đơn vị tiền tệ hiển thị <span className="text-rose-500">*</span>
                </label>
                <select
                  value={financialFormData.currency}
                  onChange={(e) =>
                    setFinancialFormData({ ...financialFormData, currency: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="VND">VND (Việt Nam Đồng)</option>
                  <option value="USD">USD (Đô la Mỹ)</option>
                </select>
              </div>

              {/* Toggles Included */}
              <div className="space-y-2 pt-1 bg-stone-950/60 p-3.5 rounded-2xl border border-stone-800">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isTaxIncluded"
                    checked={financialFormData.isTaxIncludedInPrice}
                    onChange={(e) =>
                      setFinancialFormData({
                        ...financialFormData,
                        isTaxIncludedInPrice: e.target.checked,
                      })
                    }
                    className="rounded border-stone-800 bg-stone-950 text-purple-500 focus:ring-purple-500"
                  />
                  <label htmlFor="isTaxIncluded" className="text-xs text-stone-300">
                    Giá trên thực đơn <strong>đã bao gồm thuế VAT</strong> (không cộng thêm khi thanh toán)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isServiceIncluded"
                    checked={financialFormData.isServiceChargeIncluded}
                    onChange={(e) =>
                      setFinancialFormData({
                        ...financialFormData,
                        isServiceChargeIncluded: e.target.checked,
                      })
                    }
                    className="rounded border-stone-800 bg-stone-950 text-purple-500 focus:ring-purple-500"
                  />
                  <label htmlFor="isServiceIncluded" className="text-xs text-stone-300">
                    Giá trên thực đơn <strong>đã bao gồm phí dịch vụ</strong>
                  </label>
                </div>
              </div>

              {/* Receipt Notes */}
              <div>
                <label className="block font-semibold uppercase text-stone-300 mb-1">
                  Tiêu đề ghi chú trên hóa đơn
                </label>
                <input
                  type="text"
                  value={financialFormData.receiptHeaderNote}
                  onChange={(e) =>
                    setFinancialFormData({
                      ...financialFormData,
                      receiptHeaderNote: e.target.value,
                    })
                  }
                  placeholder="VD: OrderPum - Hân hạnh phục vụ quý khách!"
                  className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-stone-300 mb-1">
                  Lời cảm ơn / ghi chú chân hóa đơn (Footer)
                </label>
                <input
                  type="text"
                  value={financialFormData.receiptFooterNote}
                  onChange={(e) =>
                    setFinancialFormData({
                      ...financialFormData,
                      receiptFooterNote: e.target.value,
                    })
                  }
                  placeholder="VD: Cảm ơn quý khách và hẹn gặp lại!"
                  className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setFinancialModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-stone-950 font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  {formSubmitting ? "Đang lưu..." : "Lưu cấu hình tài chính"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Confirm Toggle Active */}
      {confirmToggleBranch && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  confirmToggleBranch.isActive
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  {confirmToggleBranch.isActive ? "Tạm đóng chi nhánh?" : "Mở hoạt động chi nhánh?"}
                </h4>
                <p className="text-xs text-stone-400">{confirmToggleBranch.name}</p>
              </div>
            </div>

            <p className="text-xs text-stone-400 mb-5 leading-relaxed">
              {confirmToggleBranch.isActive
                ? "Chi nhánh sẽ tạm dừng nhận order và phục vụ bàn trên toàn hệ thống."
                : "Chi nhánh sẽ mở cửa hoạt động và sẵn sàng nhận khách gọi món."}
            </p>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConfirmToggleBranch(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleToggleActive}
                className={`px-4 py-2 rounded-xl font-bold text-stone-950 shadow-md ${
                  confirmToggleBranch.isActive
                    ? "bg-amber-500 hover:bg-amber-400"
                    : "bg-emerald-400 hover:bg-emerald-300"
                }`}
              >
                {actionLoading
                  ? "Đang xử lý..."
                  : confirmToggleBranch.isActive
                  ? "Xác nhận Tạm đóng"
                  : "Xác nhận Mở hoạt động"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Confirm Soft Delete */}
      {confirmDeleteBranch && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Xóa chi nhánh?</h4>
                <p className="text-xs text-stone-400">{confirmDeleteBranch.name}</p>
              </div>
            </div>

            <p className="text-xs text-stone-400 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa chi nhánh này? Thao tác chỉ thực hiện được khi chi nhánh không còn nhân sự trực thuộc.
            </p>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConfirmDeleteBranch(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteBranch}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold shadow-md"
              >
                {actionLoading ? "Đang xóa..." : "Xác nhận Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
