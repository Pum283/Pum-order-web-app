"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  api,
  BranchDto,
  MenuCategoryDto,
  MenuItemDto,
  MenuItemDetailDto,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateOptionRequest,
  CreateOptionValueRequest,
} from "@/shared/api/client";
import {
  UtensilsCrossed,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Building2,
  Layers,
  Search,
  LayoutGrid,
  List,
  Clock,
  Flame,
  Coffee,
  IceCream,
  Sparkles,
  DollarSign,
  Check,
  Ban,
  Sliders,
  Image as ImageIcon,
  Upload,
  Loader2,
} from "lucide-react";

export default function MenuManagementPage() {
  // Global states
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [userRoleLevel, setUserRoleLevel] = useState<number>(5);

  // Data states
  const [categories, setCategories] = useState<MenuCategoryDto[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [stationFilter, setStationFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Category Management Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategoryDto | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    code: "",
    name: "",
    imageUrl: "",
    sortOrder: 1,
    isActive: true,
  });

  // Menu Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemActiveTab, setItemActiveTab] = useState<"general" | "options">("general");

  const [itemFormData, setItemFormData] = useState<{
    categoryId: string;
    code: string;
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    unit: string;
    kitchenStation: string;
    preparationMinutes: number;
    isAvailable: boolean;
    is86ed: boolean;
    isActive: boolean;
    options: CreateOptionRequest[];
  }>({
    categoryId: "",
    code: "",
    name: "",
    description: "",
    imageUrl: "",
    price: 0,
    unit: "Phần",
    kitchenStation: "Kitchen",
    preparationMinutes: 15,
    isAvailable: true,
    is86ed: false,
    isActive: true,
    options: [],
  });

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "item" | "category";
    id: string;
    name: string;
  } | null>(null);

  // Suggested Food Images
  const SUGGESTED_FOOD_IMAGES = [
    { name: "Bò Nướng BBQ", url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80" },
    { name: "Lẩu Hải Sản", url: "https://images.unsplash.com/photo-1547928576-a4a33237cbc3?w=800&q=80" },
    { name: "Salad Tươi", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80" },
    { name: "Gà Nướng", url: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80" },
    { name: "Trà Đào Cam Sả", url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80" },
    { name: "Trà Sữa Oolong", url: "https://images.unsplash.com/photo-1558857563-b371033873b8?w=800&q=80" },
    { name: "Panna Cotta", url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80" },
    { name: "Sushi Cá Hồi", url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80" },
  ];

  // Load User profile & branches on init
  useEffect(() => {
    const rawUser = localStorage.getItem("orderpum_user");
    let currentLevel = 5;
    let defaultBranchId = "";
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        currentLevel = parsed.roleLevel ?? 5;
        setUserRoleLevel(currentLevel);
        if (parsed.branchId) defaultBranchId = parsed.branchId;
      } catch (e) {
        console.error(e);
      }
    }

    api.getBranches(true)
      .then((data) => {
        setBranches(data);
        if (data.length > 0) {
          if (defaultBranchId && data.some((b) => b.id === defaultBranchId)) {
            setSelectedBranchId(defaultBranchId);
          } else {
            setSelectedBranchId(data[0].id);
          }
        }
      })
      .catch((err) => setErrorMsg(err.message || "Không thể tải danh sách chi nhánh"));
  }, []);

  // Fetch Categories & Menu Items
  const fetchData = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [catsRes, itemsRes] = await Promise.all([
        api.getCategories(selectedBranchId),
        api.getMenuItems(selectedBranchId),
      ]);
      setCategories(catsRes);
      setMenuItems(itemsRes);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Không thể tải thực đơn món ăn.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (selectedBranchId) {
      fetchData();
    }
  }, [selectedBranchId, fetchData]);

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((i) => {
      if (selectedCategoryId !== "ALL" && i.categoryId !== selectedCategoryId) return false;
      if (stationFilter !== "ALL" && i.kitchenStation !== stationFilter) return false;

      if (statusFilter === "Available" && (!i.isAvailable || i.is86ed || !i.isActive)) return false;
      if (statusFilter === "86ed" && !i.is86ed) return false;
      if (statusFilter === "Disabled" && i.isActive && i.isAvailable) return false;

      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchCode = i.code.toLowerCase().includes(q);
        const matchName = i.name.toLowerCase().includes(q);
        const matchCat = i.categoryName.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchCat) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategoryId, stationFilter, statusFilter, searchKeyword]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = menuItems.length;
    const available = menuItems.filter((i) => i.isAvailable && !i.is86ed && i.isActive).length;
    const is86ed = menuItems.filter((i) => i.is86ed).length;
    const totalCats = categories.length;
    return { total, available, is86ed, totalCats };
  }, [menuItems, categories]);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const canManageMenu = userRoleLevel <= 3; // Quản lý trở lên

  // Image Upload states (Cloudinary)
  const [uploadingItemImage, setUploadingItemImage] = useState(false);
  const [uploadingCatImage, setUploadingCatImage] = useState(false);

  const handleUploadItemImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingItemImage(true);
    setErrorMsg(null);
    try {
      const res = await api.uploadImage(file, "Web Order");
      setItemFormData((prev) => ({ ...prev, imageUrl: res.url }));
      setSuccessMsg(`Tải ảnh lên Cloudinary thành công: ${res.fileName}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Tải ảnh lên Cloudinary thất bại.");
    } finally {
      setUploadingItemImage(false);
      e.target.value = "";
    }
  };

  const handleUploadCatImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCatImage(true);
    setErrorMsg(null);
    try {
      const res = await api.uploadImage(file, "Web Order");
      setCategoryFormData((prev) => ({ ...prev, imageUrl: res.url }));
      setSuccessMsg(`Tải ảnh danh mục lên Cloudinary thành công: ${res.fileName}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Tải ảnh lên Cloudinary thất bại.");
    } finally {
      setUploadingCatImage(false);
      e.target.value = "";
    }
  };

  // --- CATEGORY ACTIONS ---
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({
      code: `CAT0${categories.length + 1}`,
      name: "",
      imageUrl: "",
      sortOrder: categories.length + 1,
      isActive: true,
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: MenuCategoryDto) => {
    setEditingCategory(cat);
    setCategoryFormData({
      code: cat.code || "",
      name: cat.name || "",
      imageUrl: cat.imageUrl || "",
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      setErrorMsg("Tên danh mục không được để trống.");
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    try {
      if (editingCategory) {
        const req: UpdateCategoryRequest = {
          code: categoryFormData.code.trim().toUpperCase(),
          name: categoryFormData.name.trim(),
          imageUrl: categoryFormData.imageUrl.trim() || undefined,
          sortOrder: Number(categoryFormData.sortOrder),
          isActive: categoryFormData.isActive,
        };
        await api.updateCategory(editingCategory.id, req);
        setSuccessMsg(`Đã cập nhật danh mục '${req.name}'`);
      } else {
        const req: CreateCategoryRequest = {
          branchId: selectedBranchId,
          code: categoryFormData.code.trim().toUpperCase(),
          name: categoryFormData.name.trim(),
          imageUrl: categoryFormData.imageUrl.trim() || undefined,
          sortOrder: Number(categoryFormData.sortOrder),
        };
        await api.createCategory(req);
        setSuccessMsg(`Đã tạo danh mục '${req.name}' thành công.`);
      }
      setIsCategoryModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Thao tác danh mục thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.deleteCategory(catId);
      setSuccessMsg("Đã xóa danh mục thành công.");
      setDeleteTarget(null);
      if (selectedCategoryId === catId) setSelectedCategoryId("ALL");
      await fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Không thể xóa danh mục.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- MENU ITEM ACTIONS ---
  const handleOpenCreateItem = () => {
    setEditingItemId(null);
    setItemActiveTab("general");
    setItemFormData({
      categoryId: selectedCategoryId !== "ALL" ? selectedCategoryId : categories[0]?.id || "",
      code: `M0${menuItems.length + 1}`,
      name: "",
      description: "",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
      price: 99000,
      unit: "Phần",
      kitchenStation: "Kitchen",
      preparationMinutes: 15,
      isAvailable: true,
      is86ed: false,
      isActive: true,
      options: [],
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = async (itemId: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const detail = await api.getMenuItemById(itemId);
      if (!detail) return;

      setEditingItemId(detail.id);
      setItemActiveTab("general");
      setItemFormData({
        categoryId: detail.categoryId,
        code: detail.code,
        name: detail.name,
        description: detail.description || "",
        imageUrl: detail.imageUrl || "",
        price: detail.price,
        unit: detail.unit || "Phần",
        kitchenStation: detail.kitchenStation || "Kitchen",
        preparationMinutes: detail.preparationMinutes || 15,
        isAvailable: detail.isAvailable,
        is86ed: detail.is86ed,
        isActive: detail.isActive,
        options: (detail.options || []).map((o) => ({
          id: o.id,
          name: o.name,
          optionType: o.optionType,
          isRequired: o.isRequired,
          sortOrder: o.sortOrder,
          values: (o.values || []).map((v) => ({
            id: v.id,
            name: v.name,
            extraPrice: v.extraPrice,
            isDefault: v.isDefault,
            isAvailable: v.isAvailable,
            sortOrder: v.sortOrder,
          })),
        })),
      });
      setIsItemModalOpen(true);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Không thể tải chi tiết món ăn.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormData.name.trim()) {
      setErrorMsg("Tên món ăn không được để trống.");
      return;
    }
    if (!itemFormData.code.trim()) {
      setErrorMsg("Mã món không được để trống.");
      return;
    }
    if (!itemFormData.categoryId) {
      setErrorMsg("Vui lòng chọn danh mục món ăn.");
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    try {
      if (editingItemId) {
        const req: UpdateMenuItemRequest = {
          categoryId: itemFormData.categoryId,
          code: itemFormData.code.trim().toUpperCase(),
          name: itemFormData.name.trim(),
          description: itemFormData.description.trim() || undefined,
          imageUrl: itemFormData.imageUrl.trim() || undefined,
          price: Number(itemFormData.price),
          unit: itemFormData.unit.trim() || "Phần",
          kitchenStation: itemFormData.kitchenStation,
          preparationMinutes: Number(itemFormData.preparationMinutes),
          isAvailable: itemFormData.isAvailable,
          is86ed: itemFormData.is86ed,
          isActive: itemFormData.isActive,
          options: itemFormData.options,
        };
        await api.updateMenuItem(editingItemId, req);
        setSuccessMsg(`Đã cập nhật món '${req.name}'`);
      } else {
        const req: CreateMenuItemRequest = {
          branchId: selectedBranchId,
          categoryId: itemFormData.categoryId,
          code: itemFormData.code.trim().toUpperCase(),
          name: itemFormData.name.trim(),
          description: itemFormData.description.trim() || undefined,
          imageUrl: itemFormData.imageUrl.trim() || undefined,
          price: Number(itemFormData.price),
          unit: itemFormData.unit.trim() || "Phần",
          kitchenStation: itemFormData.kitchenStation,
          preparationMinutes: Number(itemFormData.preparationMinutes),
          isAvailable: itemFormData.isAvailable,
          options: itemFormData.options,
        };
        await api.createMenuItem(req);
        setSuccessMsg(`Đã tạo món '${req.name}' thành công.`);
      }
      setIsItemModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Thao tác món ăn thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle86 = async (itemId: string, current86: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.toggleMenuItem86(itemId, !current86);
      setMenuItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, is86ed: !current86 } : i))
      );
      setSuccessMsg(!current86 ? "Đã đánh dấu món TẠM HẾT (86'ed)" : "Đã MỞ LẠI món phục vụ");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Không thể đổi trạng thái 86.");
    }
  };

  const handleToggleAvailability = async (itemId: string, currentAvail: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.toggleMenuItemAvailability(itemId, !currentAvail);
      setMenuItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, isAvailable: !currentAvail } : i))
      );
      setSuccessMsg(!currentAvail ? "Đã MỞ BÁN món ăn" : "Đã TẠM NGƯNG bán món ăn");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Không thể đổi trạng thái bán.");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.deleteMenuItem(itemId);
      setSuccessMsg("Đã xóa món ăn khỏi thực đơn thành công.");
      setDeleteTarget(null);
      await fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Không thể xóa món ăn.");
    } finally {
      setActionLoading(false);
    }
  };

  // Option helper handlers
  const handleAddOptionGroup = () => {
    const newOption: CreateOptionRequest = {
      name: `Nhóm tùy chọn ${itemFormData.options.length + 1}`,
      optionType: "Single",
      isRequired: false,
      sortOrder: itemFormData.options.length + 1,
      values: [
        { name: "Tiêu chuẩn", extraPrice: 0, isDefault: true, isAvailable: true, sortOrder: 1 },
      ],
    };
    setItemFormData({
      ...itemFormData,
      options: [...itemFormData.options, newOption],
    });
  };

  const handleRemoveOptionGroup = (optIdx: number) => {
    const updated = [...itemFormData.options];
    updated.splice(optIdx, 1);
    setItemFormData({ ...itemFormData, options: updated });
  };

  const handleAddOptionValue = (optIdx: number) => {
    const updated = [...itemFormData.options];
    updated[optIdx].values.push({
      name: "",
      extraPrice: 10000,
      isDefault: false,
      isAvailable: true,
      sortOrder: updated[optIdx].values.length + 1,
    });
    setItemFormData({ ...itemFormData, options: updated });
  };

  const handleRemoveOptionValue = (optIdx: number, valIdx: number) => {
    const updated = [...itemFormData.options];
    updated[optIdx].values.splice(valIdx, 1);
    setItemFormData({ ...itemFormData, options: updated });
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-sm shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="p-1 hover:bg-emerald-900/50 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 flex items-center justify-between text-sm shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-rose-900/50 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-stone-900/50 border border-stone-800 p-5 rounded-2xl backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-stone-100">Quản lý Thực đơn, Món ăn & Topping</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  STT 34, 35, 36 (Bước 1.5)
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Danh mục món ăn, giá bán, thời gian chế biến, trạm bếp/bar, biến thể Size và Topping cộng thêm
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Branch Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {userRoleLevel <= 2 && branches.length > 1 && (
            <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-300">
              <Building2 className="w-4 h-4 text-amber-500" />
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  setSelectedCategoryId("ALL");
                }}
                className="bg-transparent border-none text-stone-200 text-xs focus:outline-none cursor-pointer pr-2"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-stone-900 text-stone-200">
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {canManageMenu && (
            <>
              <button
                onClick={handleOpenCreateCategory}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
              >
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Quản lý Danh mục</span>
              </button>

              <button
                onClick={handleOpenCreateItem}
                disabled={categories.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-semibold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Món ăn mới</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-stone-900/60 border border-stone-800/80 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">Tổng số món ăn</div>
          <div className="text-xl font-bold text-stone-100 mt-1">{stats.total}</div>
        </div>
        <div className="bg-stone-900/60 border border-emerald-500/20 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đang mở bán
          </div>
          <div className="text-xl font-bold text-emerald-300 mt-1">{stats.available}</div>
        </div>
        <div className="bg-stone-900/60 border border-rose-500/20 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Tạm hết (86&apos;ed)
          </div>
          <div className="text-xl font-bold text-rose-300 mt-1">{stats.is86ed}</div>
        </div>
        <div className="bg-stone-900/60 border border-purple-500/20 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span> Danh mục thực đơn
          </div>
          <div className="text-xl font-bold text-purple-300 mt-1">{stats.totalCats}</div>
        </div>
      </div>

      {/* Category Tabs & Quick Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategoryId("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedCategoryId === "ALL"
                  ? "bg-amber-500 text-stone-950 font-semibold shadow-md shadow-amber-500/20"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              Tất cả món ({menuItems.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectedCategoryId === cat.id
                    ? "bg-amber-500 text-stone-950 font-semibold shadow-md shadow-amber-500/20"
                    : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategoryId === cat.id
                      ? "bg-amber-600/40 text-stone-950"
                      : "bg-stone-800 text-stone-400"
                  }`}
                >
                  {menuItems.filter((i) => i.categoryId === cat.id).length}
                </span>
              </button>
            ))}
          </div>

          {/* Search, Stations, Status, View mode */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm mã món, tên món..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="bg-stone-900 border border-stone-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 w-44 sm:w-48"
              />
            </div>

            {/* Station Filter */}
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Mọi trạm bếp</option>
              <option value="Kitchen">🔥 Bếp nóng (Kitchen)</option>
              <option value="Bar">🍸 Quầy Bar / Pha chế</option>
              <option value="Pastry">🍰 Tráng miệng (Pastry)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="Available">🟢 Đang bán</option>
              <option value="86ed">🔴 Tạm hết (86&apos;ed)</option>
              <option value="Disabled">🔒 Tạm khóa</option>
            </select>

            {/* View Mode */}
            <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "grid" ? "bg-amber-500 text-stone-950" : "text-stone-400 hover:text-stone-200"
                }`}
                title="Dạng lưới ảnh"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "table" ? "bg-amber-500 text-stone-950" : "text-stone-400 hover:text-stone-200"
                }`}
                title="Dạng bảng chi tiết"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Food Cards or Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-stone-900/30 border border-stone-800/80 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
          <p className="text-sm text-stone-400">Đang tải thực đơn món ăn...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-stone-900/30 border border-stone-800/80 rounded-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-stone-200">Chưa có danh mục món ăn nào</h3>
          <p className="text-xs text-stone-400 max-w-md mt-1 mb-5">
            Vui lòng tạo danh mục món (Món nướng, Khai vị, Đồ uống...) trước khi thêm món ăn vào thực đơn.
          </p>
          {canManageMenu && (
            <button
              onClick={handleOpenCreateCategory}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-semibold"
            >
              Tạo Danh mục đầu tiên
            </button>
          )}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-stone-900/30 border border-stone-800/80 rounded-2xl text-center">
          <UtensilsCrossed className="w-10 h-10 text-stone-600 mb-3" />
          <h4 className="text-sm font-semibold text-stone-300">Không tìm thấy món ăn phù hợp</h4>
          <p className="text-xs text-stone-500 mt-1">Thử thay đổi bộ lọc danh mục hoặc từ khóa tìm kiếm</p>
        </div>
      ) : viewMode === "grid" ? (
        /* ======================================================== */
        /* FOOD CARDS GRID VIEW */
        /* ======================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const stationBadge = {
              Kitchen: { label: "Bếp Nóng", icon: Flame, color: "text-amber-400 bg-amber-950/80 border-amber-500/30" },
              Bar: { label: "Quầy Bar", icon: Coffee, color: "text-cyan-400 bg-cyan-950/80 border-cyan-500/30" },
              Pastry: { label: "Tráng Miệng", icon: IceCream, color: "text-purple-400 bg-purple-950/80 border-purple-500/30" },
            }[item.kitchenStation] || { label: item.kitchenStation, icon: UtensilsCrossed, color: "text-stone-400 bg-stone-900 border-stone-700" };

            const StationIcon = stationBadge.icon;

            return (
              <div
                key={item.id}
                className="group relative bg-stone-900/70 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                {/* Food Image & Badges */}
                <div className="relative h-44 w-full bg-stone-950 overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-600 bg-stone-950">
                      <UtensilsCrossed className="w-10 h-10 mb-1" />
                      <span className="text-[10px]">Chưa có ảnh</span>
                    </div>
                  )}

                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-black/40" />

                  {/* Top Station & 86 Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 backdrop-blur-md ${stationBadge.color}`}>
                      <StationIcon className="w-3 h-3" />
                      {stationBadge.label}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    {item.is86ed ? (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-rose-600 text-white shadow-lg animate-pulse">
                        TẠM HẾT (86)
                      </span>
                    ) : !item.isAvailable || !item.isActive ? (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-stone-800 text-stone-400 border border-stone-700">
                        TẠM KHÓA
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                        Đang bán
                      </span>
                    )}
                  </div>

                  {/* Code & Prep Time at bottom of image */}
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-stone-300">
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-stone-950/80 border border-stone-800 text-amber-400">
                      {item.code}
                    </span>
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-950/80 text-stone-300">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {item.preparationMinutes}p
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-[11px] font-semibold text-amber-500/90 truncate">
                      {item.categoryName}
                    </div>
                    <h3 className="text-sm font-bold text-stone-100 group-hover:text-amber-400 transition-colors line-clamp-1 mt-0.5">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-[11px] text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price & Options count */}
                  <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-base font-black text-amber-400 tracking-tight">
                        {new Intl.NumberFormat("vi-VN").format(item.price)} đ
                      </div>
                      <div className="text-[10px] text-stone-500">Đơn vị: {item.unit}</div>
                    </div>

                    {item.optionCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold flex items-center gap-1">
                        <Sliders className="w-3 h-3" />
                        {item.optionCount} tùy chọn
                      </span>
                    )}
                  </div>

                  {/* Quick Action Footer */}
                  <div className="pt-2 flex items-center justify-between gap-1.5 border-t border-stone-800/60 text-xs">
                    {/* Toggle 86 button */}
                    <button
                      onClick={(e) => handleToggle86(item.id, item.is86ed, e)}
                      title={item.is86ed ? "Mở lại món" : "Báo tạm hết món (86)"}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-sm ${
                        item.is86ed
                          ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                      }`}
                    >
                      {item.is86ed ? <Check className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                      <span>{item.is86ed ? "Mở lại" : "Báo hết (86)"}</span>
                    </button>

                    {canManageMenu && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditItem(item.id)}
                          title="Chỉnh sửa món & topping"
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-400 transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: "item", id: item.id, name: item.name })}
                          title="Xóa món khỏi menu"
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ======================================================== */
        /* TABLE LIST VIEW */
        /* ======================================================== */
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950/80 text-stone-400 border-b border-stone-800 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="p-3.5">Món ăn</th>
                  <th className="p-3.5">Danh mục</th>
                  <th className="p-3.5">Giá bán</th>
                  <th className="p-3.5">Trạm chế biến</th>
                  <th className="p-3.5">Thời gian</th>
                  <th className="p-3.5">Biến thể / Topping</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-900/50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-stone-950 overflow-hidden shrink-0 border border-stone-800">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-600">
                              <UtensilsCrossed className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-mono font-bold text-amber-400 text-[11px]">{item.code}</div>
                          <div className="font-bold text-stone-100 text-sm">{item.name}</div>
                          <div className="text-[10px] text-stone-500">{item.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-stone-300 font-medium">{item.categoryName}</td>
                    <td className="p-3.5 font-bold text-amber-400 text-sm">
                      {new Intl.NumberFormat("vi-VN").format(item.price)} đ
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-lg bg-stone-950 text-stone-300 border border-stone-800 text-[11px] font-mono">
                        {item.kitchenStation === "Kitchen" ? "🔥 Bếp Nóng" : item.kitchenStation === "Bar" ? "🍸 Quầy Bar" : "🍰 Tráng Miệng"}
                      </span>
                    </td>
                    <td className="p-3.5 text-stone-400 font-mono">{item.preparationMinutes} phút</td>
                    <td className="p-3.5">
                      {item.optionCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold text-[10px]">
                          {item.optionCount} nhóm
                        </span>
                      ) : (
                        <span className="text-stone-500 text-[11px]">Không</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {item.is86ed ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-500/30">
                          Tạm hết (86)
                        </span>
                      ) : item.isAvailable ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          Đang bán
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-800 text-stone-400">
                          Tạm khóa
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleToggle86(item.id, item.is86ed, e)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-stone-800 hover:bg-stone-700 text-stone-300"
                        >
                          {item.is86ed ? "Mở lại" : "86'ed"}
                        </button>
                        {canManageMenu && (
                          <>
                            <button
                              onClick={() => handleOpenEditItem(item.id)}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-400"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: "item", id: item.id, name: item.name })}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT MENU ITEM (STT 35, 36) */}
      {/* ======================================================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-100">
                    {editingItemId ? "Chỉnh sửa Món ăn & Topping" : "Thêm Món ăn mới"}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Cấu hình món, giá bán, trạm nhận bếp/bar và nhóm tùy chọn Size/Topping (STT 35, 36)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-4 px-6 border-b border-stone-800 bg-stone-950/40 text-xs">
              <button
                onClick={() => setItemActiveTab("general")}
                className={`py-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  itemActiveTab === "general"
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-stone-400 hover:text-stone-200"
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>1. Thông tin món ăn & Giá</span>
              </button>
              <button
                onClick={() => setItemActiveTab("options")}
                className={`py-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  itemActiveTab === "options"
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-stone-400 hover:text-stone-200"
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>2. Biến thể Size & Topping (+Giá) ({itemFormData.options.length})</span>
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveMenuItem} className="flex-1 overflow-y-auto p-6 space-y-5">
              {itemActiveTab === "general" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                        Danh mục món <span className="text-rose-400">*</span>
                      </label>
                      <select
                        required
                        value={itemFormData.categoryId}
                        onChange={(e) => setItemFormData({ ...itemFormData, categoryId: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                        Mã món ăn <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: BBQ01, DU02, LAU01"
                        value={itemFormData.code}
                        onChange={(e) => setItemFormData({ ...itemFormData, code: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500 font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                      Tên món ăn <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Bò Fuji Nướng Đá Sốt Tiêu Đen"
                      value={itemFormData.name}
                      onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                        Giá bán cơ sở (VNĐ) <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          required
                          value={itemFormData.price}
                          onChange={(e) => setItemFormData({ ...itemFormData, price: Number(e.target.value) })}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                        Đơn vị tính
                      </label>
                      <input
                        type="text"
                        placeholder="Phần, Đĩa, Tô, Ly, Hũ..."
                        value={itemFormData.unit}
                        onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                        Thời gian chế biến (Phút)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={itemFormData.preparationMinutes}
                        onChange={(e) => setItemFormData({ ...itemFormData, preparationMinutes: Number(e.target.value) })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Kitchen Station & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                        Trạm chế biến KDS
                      </label>
                      <select
                        value={itemFormData.kitchenStation}
                        onChange={(e) => setItemFormData({ ...itemFormData, kitchenStation: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Kitchen">🔥 Bếp Nóng (Kitchen)</option>
                        <option value="Bar">🍸 Quầy Bar / Pha chế</option>
                        <option value="Pastry">🍰 Quầy Bánh / Tráng Miệng</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-4 pt-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={itemFormData.isAvailable}
                          onChange={(e) => setItemFormData({ ...itemFormData, isAvailable: e.target.checked })}
                          className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                        />
                        <span className="text-xs font-medium text-stone-300">Đang mở bán</span>
                      </label>

                      {editingItemId && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={itemFormData.is86ed}
                            onChange={(e) => setItemFormData({ ...itemFormData, is86ed: e.target.checked })}
                            className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                          />
                          <span className="text-xs font-medium text-rose-400">Tạm hết món (86)</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                      Mô tả món ăn & Thành phần nguyên liệu
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Mô tả hương vị đậm đà, thành phần nguyên liệu tươi ngon..."
                      value={itemFormData.description}
                      onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Image Upload to Cloudinary & URL */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-stone-300">
                        Ảnh món ăn (Cloudinary)
                      </label>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-[11px] shadow-sm transition">
                        {uploadingItemImage ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang tải lên Cloudinary...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Tải ảnh từ máy</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingItemImage}
                          onChange={handleUploadItemImage}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="https://res.cloudinary.com/... hoặc dán link ảnh"
                        value={itemFormData.imageUrl}
                        onChange={(e) => setItemFormData({ ...itemFormData, imageUrl: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                      />
                      {itemFormData.imageUrl && (
                        <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden border border-amber-500/40 bg-stone-900">
                          <img src={itemFormData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Quick suggested food photos */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-stone-500 flex items-center gap-1 mr-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Gợi ý ảnh đẹp:
                      </span>
                      {SUGGESTED_FOOD_IMAGES.map((img) => (
                        <button
                          key={img.name}
                          type="button"
                          onClick={() => setItemFormData({ ...itemFormData, imageUrl: img.url })}
                          className="px-2 py-0.5 rounded-lg bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-amber-300 border border-stone-800 text-[10px] transition"
                        >
                          {img.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* ======================================================== */
                /* TAB 2: OPTIONS & MODIFIERS (STT 36) */
                /* ======================================================== */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-stone-200">
                        Cấu hình Nhóm Tùy Chọn & Topping (+Giá)
                      </h4>
                      <p className="text-xs text-stone-400 mt-0.5">
                        VD: Size (S, M, L), Độ cay (Ít cay, Cay nồng), Topping thêm (+10k, +15k)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddOptionGroup}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Nhóm Tùy Chọn</span>
                    </button>
                  </div>

                  {itemFormData.options.length === 0 ? (
                    <div className="p-8 rounded-2xl border-2 border-dashed border-stone-800 text-center bg-stone-950/40">
                      <Sliders className="w-8 h-8 text-stone-600 mx-auto mb-2" />
                      <p className="text-xs text-stone-400 font-medium">Món ăn này chưa có nhóm tùy chọn nào.</p>
                      <p className="text-[11px] text-stone-500 mt-1">
                        Bấm nút &quot;Thêm Nhóm Tùy Chọn&quot; để thiết lập kích cỡ Size hoặc Topping gọi thêm.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {itemFormData.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className="p-4 rounded-2xl bg-stone-950 border border-stone-800/90 space-y-3"
                        >
                          {/* Option Group Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-800">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="font-mono font-bold text-xs text-purple-400">#{optIdx + 1}</span>
                              <input
                                type="text"
                                required
                                placeholder="Tên nhóm (VD: Kích cỡ Size, Độ cay...)"
                                value={opt.name}
                                onChange={(e) => {
                                  const updated = [...itemFormData.options];
                                  updated[optIdx].name = e.target.value;
                                  setItemFormData({ ...itemFormData, options: updated });
                                }}
                                className="bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1 text-xs text-stone-100 font-bold focus:outline-none focus:border-purple-500 flex-1"
                              />
                            </div>

                            <div className="flex items-center gap-3 text-xs">
                              <select
                                value={opt.optionType}
                                onChange={(e) => {
                                  const updated = [...itemFormData.options];
                                  updated[optIdx].optionType = e.target.value as "Single" | "Multiple";
                                  setItemFormData({ ...itemFormData, options: updated });
                                }}
                                className="bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-[11px] text-stone-300 focus:outline-none"
                              >
                                <option value="Single">Chọn 1 (Radio)</option>
                                <option value="Multiple">Chọn nhiều (Topping)</option>
                              </select>

                              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-300">
                                <input
                                  type="checkbox"
                                  checked={opt.isRequired}
                                  onChange={(e) => {
                                    const updated = [...itemFormData.options];
                                    updated[optIdx].isRequired = e.target.checked;
                                    setItemFormData({ ...itemFormData, options: updated });
                                  }}
                                  className="w-3.5 h-3.5 accent-purple-500 rounded"
                                />
                                <span>Bắt buộc</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleRemoveOptionGroup(optIdx)}
                                className="p-1 rounded text-stone-400 hover:text-rose-400"
                                title="Xóa nhóm này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Option Values List */}
                          <div className="space-y-2">
                            <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                              Các lựa chọn & Giá cộng thêm:
                            </div>

                            {opt.values.map((val, valIdx) => (
                              <div key={valIdx} className="flex items-center gap-2 text-xs">
                                <input
                                  type="text"
                                  required
                                  placeholder="VD: Size L, Thêm trân châu..."
                                  value={val.name}
                                  onChange={(e) => {
                                    const updated = [...itemFormData.options];
                                    updated[optIdx].values[valIdx].name = e.target.value;
                                    setItemFormData({ ...itemFormData, options: updated });
                                  }}
                                  className="bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1 text-xs text-stone-200 flex-1 focus:outline-none focus:border-purple-500"
                                />

                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] text-stone-500">+</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    placeholder="0"
                                    value={val.extraPrice}
                                    onChange={(e) => {
                                      const updated = [...itemFormData.options];
                                      updated[optIdx].values[valIdx].extraPrice = Number(e.target.value);
                                      setItemFormData({ ...itemFormData, options: updated });
                                    }}
                                    className="w-24 bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-amber-400 font-bold text-right focus:outline-none focus:border-amber-500"
                                  />
                                  <span className="text-[11px] text-stone-400">đ</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveOptionValue(optIdx, valIdx)}
                                  disabled={opt.values.length <= 1}
                                  className="p-1 text-stone-500 hover:text-rose-400 disabled:opacity-30"
                                  title="Xóa lựa chọn này"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => handleAddOptionValue(optIdx)}
                              className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 pt-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Thêm lựa chọn trong nhóm này</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800 bg-stone-900">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {actionLoading ? "Đang lưu..." : editingItemId ? "Lưu Thay Đổi" : "Tạo Món Ăn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CATEGORIES MANAGEMENT MODAL (STT 34) */}
      {/* ======================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-100">
                    {editingCategory ? "Chỉnh sửa Danh mục" : "Thêm Danh mục Món ăn"}
                  </h3>
                  <p className="text-xs text-stone-400">VD: Món Khai Vị, Món Nướng BBQ, Đồ Uống...</p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Mã danh mục <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: KHAI_VI, BBQ, DO_UONG"
                  value={categoryFormData.code}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, code: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 font-mono uppercase focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Tên danh mục món <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Món Khai Vị & Salad"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Thứ tự sắp xếp (Sort Order)
                </label>
                <input
                  type="number"
                  min="0"
                  value={categoryFormData.sortOrder}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, sortOrder: Number(e.target.value) })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-stone-300">
                    Ảnh danh mục (Cloudinary)
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-bold text-[11px] shadow-sm transition">
                    {uploadingCatImage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang tải lên...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải ảnh từ máy</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingCatImage}
                      onChange={handleUploadCatImage}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://res.cloudinary.com/... hoặc dán link ảnh"
                    value={categoryFormData.imageUrl}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, imageUrl: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-purple-500"
                  />
                  {categoryFormData.imageUrl && (
                    <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden border border-purple-500/40 bg-stone-900">
                      <img src={categoryFormData.imageUrl} alt="Category Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  {actionLoading ? "Đang lưu..." : editingCategory ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRM DELETE */}
      {/* ======================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-100">
                  Xác nhận xóa {deleteTarget.type === "item" ? "Món ăn" : "Danh mục"}
                </h3>
                <p className="text-xs text-stone-400">Đối tượng: {deleteTarget.name}</p>
              </div>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa {deleteTarget.type === "item" ? "món ăn" : "danh mục"} này khỏi thực đơn?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (deleteTarget.type === "item") {
                    handleDeleteItem(deleteTarget.id);
                  } else {
                    handleDeleteCategory(deleteTarget.id);
                  }
                }}
                disabled={actionLoading}
                className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold disabled:opacity-50"
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
