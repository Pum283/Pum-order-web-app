"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  api,
  BranchDto,
  MenuCategoryDto,
  MenuItemDto,
  PromotionDto,
  CreatePromotionRequest,
  UpdatePromotionRequest,
} from "@/shared/api/client";
import { useAuth } from "@/shared/context/AuthContext";
import {
  Tag,
  Plus,
  Search,
  Percent,
  DollarSign,
  Gift,
  Sparkles,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  Power,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Building2,
  Zap,
} from "lucide-react";

export default function PromotionsPage() {
  const { user, token, isLoading: authLoading } = useAuth();

  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [categories, setCategories] = useState<MenuCategoryDto[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [promotions, setPromotions] = useState<PromotionDto[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // ALL, Active, Inactive

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPromo, setEditingPromo] = useState<PromotionDto | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form State
  const [formBranchId, setFormBranchId] = useState<string>("");
  const [formCode, setFormCode] = useState<string>("");
  const [formName, setFormName] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formDiscountType, setFormDiscountType] = useState<"Percent" | "FixedAmount">("Percent");
  const [formDiscountValue, setFormDiscountValue] = useState<number>(10);
  const [formMaxDiscountAmount, setFormMaxDiscountAmount] = useState<number | "">("");
  const [formMinOrderAmount, setFormMinOrderAmount] = useState<number>(0);
  const [formTargetType, setFormTargetType] = useState<"Invoice" | "Category" | "MenuItem">("Invoice");
  const [formTargetId, setFormTargetId] = useState<string>("");
  const [formIsAutoApply, setFormIsAutoApply] = useState<boolean>(false);
  const [formStartAt, setFormStartAt] = useState<string>("");
  const [formEndAt, setFormEndAt] = useState<string>("");
  const [formUsageLimit, setFormUsageLimit] = useState<number | "">("");
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Delete confirmation modal
  const [deletingPromo, setDeletingPromo] = useState<PromotionDto | null>(null);

  // Load initial branch and master data
  useEffect(() => {
    if (!token && !authLoading) return;

    const loadMasterData = async () => {
      try {
        const [branchList, catList, itemList] = await Promise.all([
          api.getBranches(),
          api.getCategories(undefined, true),
          api.getMenuItems(undefined, undefined, undefined, true),
        ]);
        setBranches(branchList);
        setCategories(catList);
        setMenuItems(itemList);
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg("Lỗi tải dữ liệu: " + error.message);
      }
    };

    if (token) {
      loadMasterData();
    }
  }, [token, authLoading]);

  // Fetch Promotions
  const fetchPromotions = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await api.getPromotions(selectedBranchId === "ALL" ? undefined : selectedBranchId);
      setPromotions(data);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Lỗi tải danh sách khuyến mãi.");
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchPromotions(true);
  }, [selectedBranchId, fetchPromotions]);

  // Open Modal Create
  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormBranchId("");
    setFormCode("");
    setFormName("");
    setFormDescription("");
    setFormDiscountType("Percent");
    setFormDiscountValue(10);
    setFormMaxDiscountAmount("");
    setFormMinOrderAmount(0);
    setFormTargetType("Invoice");
    setFormTargetId("");
    setFormIsAutoApply(false);
    setFormStartAt(new Date().toISOString().split("T")[0]);
    setFormEndAt("");
    setFormUsageLimit("");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (promo: PromotionDto) => {
    setEditingPromo(promo);
    setFormBranchId(promo.branchId || "");
    setFormCode(promo.code || "");
    setFormName(promo.name);
    setFormDescription(promo.description || "");
    setFormDiscountType(promo.discountType === "FixedAmount" ? "FixedAmount" : "Percent");
    setFormDiscountValue(promo.discountValue);
    setFormMaxDiscountAmount(promo.maxDiscountAmount || "");
    setFormMinOrderAmount(promo.minOrderAmount);
    setFormTargetType(promo.targetType);
    setFormTargetId(promo.targetId || "");
    setFormIsAutoApply(promo.isAutoApply);
    setFormStartAt(promo.startAt ? promo.startAt.split("T")[0] : "");
    setFormEndAt(promo.endAt ? promo.endAt.split("T")[0] : "");
    setFormUsageLimit(promo.usageLimit || "");
    setFormIsActive(promo.isActive);
    setIsModalOpen(true);
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Vui lòng nhập tên chương trình khuyến mãi.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingPromo) {
        const updateData: UpdatePromotionRequest = {
          branchId: formBranchId ? formBranchId : undefined,
          code: formCode.trim() ? formCode.trim() : undefined,
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          discountType: formDiscountType,
          discountValue: Number(formDiscountValue),
          maxDiscountAmount: formMaxDiscountAmount !== "" ? Number(formMaxDiscountAmount) : undefined,
          minOrderAmount: Number(formMinOrderAmount),
          targetType: formTargetType,
          targetId: formTargetId ? formTargetId : undefined,
          isAutoApply: formIsAutoApply,
          startAt: formStartAt ? new Date(formStartAt).toISOString() : undefined,
          endAt: formEndAt ? new Date(formEndAt).toISOString() : undefined,
          usageLimit: formUsageLimit !== "" ? Number(formUsageLimit) : undefined,
          isActive: formIsActive,
        };
        await api.updatePromotion(editingPromo.id, updateData);
      } else {
        const createData: CreatePromotionRequest = {
          branchId: formBranchId ? formBranchId : undefined,
          code: formCode.trim() ? formCode.trim() : undefined,
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          discountType: formDiscountType,
          discountValue: Number(formDiscountValue),
          maxDiscountAmount: formMaxDiscountAmount !== "" ? Number(formMaxDiscountAmount) : undefined,
          minOrderAmount: Number(formMinOrderAmount),
          targetType: formTargetType,
          targetId: formTargetId ? formTargetId : undefined,
          isAutoApply: formIsAutoApply,
          startAt: formStartAt ? new Date(formStartAt).toISOString() : undefined,
          endAt: formEndAt ? new Date(formEndAt).toISOString() : undefined,
          usageLimit: formUsageLimit !== "" ? Number(formUsageLimit) : undefined,
          isActive: formIsActive,
        };
        await api.createPromotion(createData);
      }

      setIsModalOpen(false);
      fetchPromotions(false);
    } catch (err: unknown) {
      const error = err as Error;
      alert("Lỗi lưu khuyến mãi: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (promo: PromotionDto) => {
    try {
      const res = await api.togglePromotion(promo.id);
      setPromotions((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, isActive: res.isActive } : p))
      );
    } catch (err: unknown) {
      const error = err as Error;
      alert("Lỗi đổi trạng thái: " + error.message);
    }
  };

  // Delete Promo
  const handleConfirmDelete = async () => {
    if (!deletingPromo) return;
    try {
      await api.deletePromotion(deletingPromo.id);
      setPromotions((prev) => prev.filter((p) => p.id !== deletingPromo.id));
      setDeletingPromo(null);
    } catch (err: unknown) {
      const error = err as Error;
      alert("Lỗi xóa khuyến mãi: " + error.message);
    }
  };

  // Filtered List
  const filteredPromotions = promotions.filter((p) => {
    const kw = searchKeyword.toLowerCase().trim();
    const matchKw =
      !kw ||
      p.name.toLowerCase().includes(kw) ||
      p.code.toLowerCase().includes(kw) ||
      (p.description && p.description.toLowerCase().includes(kw));

    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "Active" && p.isActive) ||
      (statusFilter === "Inactive" && !p.isActive);

    return matchKw && matchStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Tag className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                KHUYẾN MÃI & MÃ GIẢM GIÁ
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                  STT 60, 64, 65, 66, 71
                </span>
              </h1>
              <p className="text-xs text-stone-400">
                Tạo mã voucher, giảm giá tự động không cần mã, chiết khấu theo món & hóa đơn
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-stone-900 border border-stone-800 text-stone-200 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Khuyến Mãi Mới</span>
          </button>

          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchPromotions(false);
            }}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-stone-900/60 border border-stone-800/80 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "Active", label: "Đang chạy" },
            { id: "Inactive", label: "Tạm ngưng" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === tab.id
                  ? "bg-stone-800 text-amber-400 font-semibold shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo tên CTKM, mã voucher..."
            className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Promotions Grid */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-400">Đang tải danh sách khuyến mãi...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center max-w-md mx-auto">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
          <p className="font-semibold">{errorMsg}</p>
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="py-20 text-center text-stone-500 bg-stone-900/30 rounded-3xl border border-stone-800/60 border-dashed">
          <Tag className="w-12 h-12 text-stone-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-stone-300">Không có chương trình khuyến mãi nào</p>
          <p className="text-xs text-stone-500 mt-1">Bấm nút "Tạo Khuyến Mãi Mới" để thiết lập mã voucher hoặc ưu đãi tự động.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPromotions.map((promo) => (
            <div
              key={promo.id}
              className={`bg-stone-900 rounded-2xl border p-4 flex flex-col justify-between shadow-lg transition-all ${
                promo.isActive
                  ? "border-stone-800 hover:border-amber-500/40"
                  : "border-stone-800/50 opacity-60 bg-stone-950/40"
              }`}
            >
              <div>
                {/* Header: Code badge & Target */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    {promo.code ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-black text-xs border border-amber-500/30">
                        {promo.code}
                      </span>
                    ) : promo.isAutoApply ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>Tự động áp dụng</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-400 text-xs font-semibold">
                        Không mã
                      </span>
                    )}

                    {promo.isAutoApply && promo.code && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                        Auto
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-stone-500" />
                    <span>{promo.branchName}</span>
                  </span>
                </div>

                {/* Promo Title & Description */}
                <h3 className="text-base font-bold text-white mb-1.5 leading-snug">
                  {promo.name}
                </h3>
                {promo.description && (
                  <p className="text-xs text-stone-400 mb-3 line-clamp-2 leading-relaxed">
                    {promo.description}
                  </p>
                )}

                {/* Discount highlight badge */}
                <div className="bg-stone-950/80 rounded-xl p-3 border border-stone-800/80 mb-3 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-stone-400">Mức giảm:</span>
                    <span className="text-lg font-black text-amber-400 font-mono">
                      {promo.discountType === "Percent"
                        ? `Giảm ${promo.discountValue}%`
                        : `Giảm ${promo.discountValue.toLocaleString("vi-VN")}đ`}
                    </span>
                  </div>

                  {promo.maxDiscountAmount && promo.discountType === "Percent" && (
                    <div className="flex justify-between text-[11px] text-stone-400">
                      <span>Giảm tối đa:</span>
                      <span className="font-mono text-stone-300">
                        {promo.maxDiscountAmount.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  )}

                  {promo.minOrderAmount > 0 && (
                    <div className="flex justify-between text-[11px] text-stone-400">
                      <span>Đơn tối thiểu:</span>
                      <span className="font-mono text-stone-300">
                        {promo.minOrderAmount.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  )}

                  {promo.targetType !== "Invoice" && (
                    <div className="flex justify-between text-[11px] text-stone-400">
                      <span>Áp dụng cho:</span>
                      <span className="text-amber-300 font-semibold">
                        {promo.targetType === "Category" ? "Danh mục: " : "Món: "}
                        {promo.targetName || "Đã chọn"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Meta details (Usage count & validity dates) */}
                <div className="space-y-1 text-[11px] text-stone-400 mb-2">
                  <div className="flex items-center justify-between">
                    <span>Lượt sử dụng:</span>
                    <span className="font-mono font-bold text-stone-300">
                      {promo.usedCount}
                      {promo.usageLimit ? ` / ${promo.usageLimit}` : " (Không giới hạn)"}
                    </span>
                  </div>

                  {(promo.startAt || promo.endAt) && (
                    <div className="flex items-center justify-between">
                      <span>Hiệu lực:</span>
                      <span className="font-mono text-stone-300">
                        {promo.startAt ? new Date(promo.startAt).toLocaleDateString("vi-VN") : "Bắt đầu"} →{" "}
                        {promo.endAt ? new Date(promo.endAt).toLocaleDateString("vi-VN") : "Vô thời hạn"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2 mt-2">
                <button
                  onClick={() => handleToggleStatus(promo)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    promo.isActive
                      ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                      : "bg-stone-800 hover:bg-stone-700 text-stone-400"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{promo.isActive ? "Đang bật" : "Đã tắt"}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(promo)}
                    className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingPromo(promo)}
                    className="p-2 rounded-xl bg-stone-800 hover:bg-rose-950/60 text-stone-400 hover:text-rose-400 transition"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CREATE / EDIT PROMOTION (STT 64, 65, 66, 71) */}
      {/* ==================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingPromo ? "Chỉnh sửa Chương trình Khuyến mãi" : "Tạo mới Chương trình Khuyến mãi"}
                  </h3>
                  <span className="text-[11px] text-stone-400">
                    Thiết lập mã giảm giá, voucher hoặc chiết khấu tự động
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Branch & Auto-apply row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">Áp dụng cho Chi nhánh:</label>
                  <select
                    value={formBranchId}
                    onChange={(e) => setFormBranchId(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Tất cả chi nhánh (Toàn chuỗi)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">Mã Voucher (Nhập tay):</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="VD: PUMOPEN, GIAM50K..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>
              </div>

              {/* Auto Apply Toggle (STT 71) */}
              <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Tự động áp dụng khuyến mãi (STT 71)</span>
                  </span>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Hệ thống sẽ tự động áp dụng khi đơn hàng thỏa điều kiện mà không cần khách/NV nhập mã.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formIsAutoApply}
                  onChange={(e) => setFormIsAutoApply(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Promo Name & Description */}
              <div>
                <label className="block text-stone-300 font-bold mb-1">
                  Tên chương trình khuyến mãi <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Giảm 10% Mừng Khai Trương"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold mb-1">Mô tả chi tiết:</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mô tả điều kiện và quyền lợi áp dụng..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Discount Type & Value (STT 65, 66) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">Hình thức giảm giá:</label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Percent">Giảm theo %</option>
                    <option value="FixedAmount">Giảm tiền mặt (đ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">
                    Giá trị giảm ({formDiscountType === "Percent" ? "%" : "đ"}):
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">Giảm tối đa (đ):</label>
                  <input
                    type="number"
                    min={0}
                    value={formMaxDiscountAmount}
                    onChange={(e) => setFormMaxDiscountAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Không giới hạn"
                    disabled={formDiscountType === "FixedAmount"}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500 disabled:opacity-30"
                  />
                </div>
              </div>

              {/* Scope & Target Type (STT 65, 66) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">Phạm vi áp dụng:</label>
                  <select
                    value={formTargetType}
                    onChange={(e) => {
                      setFormTargetType(e.target.value as any);
                      setFormTargetId("");
                    }}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Invoice">Toàn bộ hóa đơn (STT 66)</option>
                    <option value="Category">Theo Danh mục món (STT 65)</option>
                    <option value="MenuItem">Theo Từng món cụ thể (STT 65)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">
                    {formTargetType === "Category"
                      ? "Chọn Danh mục món:"
                      : formTargetType === "MenuItem"
                      ? "Chọn Món ăn áp dụng:"
                      : "Áp dụng toàn bộ"}
                  </label>

                  {formTargetType === "Category" ? (
                    <select
                      value={formTargetId}
                      onChange={(e) => setFormTargetId(e.target.value)}
                      required
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Chọn Danh mục --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : formTargetType === "MenuItem" ? (
                    <select
                      value={formTargetId}
                      onChange={(e) => setFormTargetId(e.target.value)}
                      required
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Chọn Món ăn --</option>
                      {menuItems.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.code} - {m.name} ({m.price.toLocaleString("vi-VN")}đ)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value="Áp dụng trên tổng tiền tất cả món"
                      className="w-full bg-stone-950 border border-stone-800/60 rounded-xl px-3 py-2 text-xs text-stone-500"
                    />
                  )}
                </div>
              </div>

              {/* Conditions: Min Order Amount & Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">Giá trị đơn hàng tối thiểu (đ):</label>
                  <input
                    type="number"
                    min={0}
                    value={formMinOrderAmount}
                    onChange={(e) => setFormMinOrderAmount(Number(e.target.value))}
                    placeholder="0 = Không yêu cầu"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">Giới hạn tổng số lượt dùng:</label>
                  <input
                    type="number"
                    min={1}
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Để trống = Không giới hạn"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">Ngày bắt đầu hiệu lực:</label>
                  <input
                    type="date"
                    value={formStartAt}
                    onChange={(e) => setFormStartAt(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">Ngày kết thúc hiệu lực:</label>
                  <input
                    type="date"
                    value={formEndAt}
                    onChange={(e) => setFormEndAt(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="promoActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <label htmlFor="promoActive" className="text-stone-300 font-bold cursor-pointer">
                  Kích hoạt chương trình ngay
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 text-xs font-black shadow-lg shadow-amber-500/20"
                >
                  {isSaving ? "Đang lưu..." : editingPromo ? "Lưu thay đổi" : "Tạo chương trình"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPromo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-white">Xác nhận xóa chương trình khuyến mãi</h3>
            <p className="text-xs text-stone-400">
              Bạn có chắc chắn muốn xóa chương trình <strong className="text-white">"{deletingPromo.name}"</strong> không?
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeletingPromo(null)}
                className="flex-1 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
