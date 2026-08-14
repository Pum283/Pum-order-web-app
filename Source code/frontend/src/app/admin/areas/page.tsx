"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  api,
  BranchDto,
  AreaDto,
  CreateAreaRequest,
  UpdateAreaRequest,
} from "@/shared/api/client";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Building2,
  LayoutGrid,
  Search,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function AreasManagementPage() {
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [userRoleLevel, setUserRoleLevel] = useState<number>(5);

  const [areas, setAreas] = useState<AreaDto[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaDto | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sortOrder: 0,
    isActive: true,
  });

  const [deleteTarget, setDeleteTarget] = useState<AreaDto | null>(null);

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
        if (parsed.branchId) {
          defaultBranchId = parsed.branchId;
        }
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

  const fetchAreas = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getAreas(selectedBranchId);
      setAreas(res);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Không thể tải danh sách khu vực.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (selectedBranchId) {
      fetchAreas();
    }
  }, [selectedBranchId, fetchAreas]);

  const filteredAreas = useMemo(() => {
    return areas.filter((a) => {
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        return a.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [areas, searchKeyword]);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const canManage = userRoleLevel <= 3;

  const stats = useMemo(() => {
    const total = areas.length;
    const active = areas.filter((a) => a.isActive).length;
    const totalTables = areas.reduce((sum, a) => sum + a.tableCount, 0);
    return { total, active, totalTables };
  }, [areas]);

  const handleOpenCreate = () => {
    setEditingArea(null);
    setFormData({
      name: "",
      sortOrder: areas.length + 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (area: AreaDto) => {
    setEditingArea(area);
    setFormData({
      name: area.name,
      sortOrder: area.sortOrder,
      isActive: area.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("Tên khu vực không được để trống.");
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    try {
      if (editingArea) {
        const req: UpdateAreaRequest = {
          name: formData.name.trim(),
          sortOrder: Number(formData.sortOrder),
          isActive: formData.isActive,
        };
        await api.updateArea(editingArea.id, req);
        setSuccessMsg(`Đã cập nhật khu vực '${req.name}'`);
      } else {
        const req: CreateAreaRequest = {
          branchId: selectedBranchId,
          name: formData.name.trim(),
          sortOrder: Number(formData.sortOrder),
        };
        await api.createArea(req);
        setSuccessMsg(`Đã tạo khu vực '${req.name}' thành công.`);
      }
      setIsModalOpen(false);
      await fetchAreas();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Thao tác khu vực thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (areaId: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.deleteArea(areaId);
      setSuccessMsg("Đã xóa khu vực thành công.");
      setDeleteTarget(null);
      await fetchAreas();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Không thể xóa khu vực.");
    } finally {
      setActionLoading(false);
    }
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
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-stone-100">Quản lý Khu vực & Tầng</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                  STT 13 (Master Data)
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Thiết lập không gian mặt bằng: Tầng lầu, phòng VIP, sảnh chính, sân vườn theo từng chi nhánh
              </p>
            </div>
          </div>
        </div>

        {/* Actions & Branch Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {userRoleLevel <= 2 && branches.length > 1 && (
            <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-300">
              <Building2 className="w-4 h-4 text-amber-500" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
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

          <Link
            href="/admin/tables"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
          >
            <LayoutGrid className="w-4 h-4 text-amber-400" />
            <span>Sơ đồ bàn & QR</span>
          </Link>

          {canManage && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Khu vực mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-stone-900/60 border border-stone-800/80 p-4 rounded-xl">
          <div className="text-xs font-medium text-stone-400 uppercase tracking-wider">Tổng số khu vực / tầng</div>
          <div className="text-2xl font-black text-stone-100 mt-1">{stats.total}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">{selectedBranch?.name}</div>
        </div>
        <div className="bg-stone-900/60 border border-purple-500/20 p-4 rounded-xl">
          <div className="text-xs font-medium text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span> Đang hoạt động
          </div>
          <div className="text-2xl font-black text-purple-300 mt-1">{stats.active}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Sẵn sàng phục vụ khách</div>
        </div>
        <div className="bg-stone-900/60 border border-amber-500/20 p-4 rounded-xl">
          <div className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Tổng số bàn phân bổ
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">{stats.totalTables}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Bàn ăn thuộc các tầng</div>
        </div>
      </div>

      {/* Search & Refresh */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm kiếm khu vực / tầng..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-purple-500 w-64"
          />
        </div>

        <button
          onClick={fetchAreas}
          disabled={loading}
          className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 transition"
          title="Làm mới"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Areas List Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-stone-900/30 border border-stone-800/80 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-3" />
          <p className="text-sm text-stone-400">Đang tải danh sách khu vực...</p>
        </div>
      ) : filteredAreas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-stone-900/30 border border-stone-800/80 rounded-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-stone-200">Chưa có khu vực nào</h3>
          <p className="text-xs text-stone-400 max-w-md mt-1 mb-5">
            Chi nhánh này chưa có khu vực nào. Hãy tạo khu vực mới để gán bàn và quản lý sơ đồ tầng.
          </p>
          {canManage && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold"
            >
              Thêm Khu vực đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAreas.map((area, idx) => (
            <div
              key={area.id}
              className="group relative bg-stone-900/70 hover:bg-stone-900 border border-stone-800 hover:border-purple-500/40 p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between shadow-lg"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-black text-sm">
                      #{area.sortOrder || idx + 1}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-stone-100 group-hover:text-purple-300 transition-colors">
                        {area.name}
                      </h4>
                      <div className="text-[11px] text-stone-400 mt-0.5">{area.branchName}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      area.isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-stone-800 text-stone-500 border-stone-700"
                    }`}
                  >
                    {area.isActive ? "Hoạt động" : "Tạm khóa"}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/80 my-3 flex items-center justify-between text-xs">
                  <div className="text-stone-400">Số lượng bàn trực thuộc:</div>
                  <div className="font-black text-amber-400 text-sm">{area.tableCount} bàn</div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                <Link
                  href={`/admin/tables`}
                  className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <span>Xem bàn & sơ đồ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(area)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-purple-300 transition-colors"
                      title="Sửa khu vực"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(area)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 transition-colors"
                      title="Xóa khu vực"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT AREA (STT 13) */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-100">
                    {editingArea ? "Chỉnh sửa Khu vực" : "Thêm Khu vực mới"}
                  </h3>
                  <p className="text-xs text-stone-400">VD: Tầng 1 - Sảnh chính, Tầng 2, Phòng VIP</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Tên khu vực / tầng <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tầng 1 - Sảnh chính"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-purple-500"
                />
                <p className="text-[11px] text-stone-500 mt-1">Số nhỏ hơn sẽ hiển thị trước trên sơ đồ</p>
              </div>

              {editingArea && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-xs font-medium text-stone-300 cursor-pointer">
                    Khu vực đang hoạt động
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  {actionLoading ? "Đang lưu..." : editingArea ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRM DELETE MODAL */}
      {/* ======================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-100">Xác nhận xóa Khu vực</h3>
                <p className="text-xs text-stone-400">Đối tượng: {deleteTarget.name}</p>
              </div>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa khu vực <strong className="text-white">{deleteTarget.name}</strong>?
              <br />
              <span className="text-rose-400 text-[11px] font-semibold mt-1 block">
                * Lưu ý: Không thể xóa khu vực nếu đang có {deleteTarget.tableCount} bàn bên trong.
              </span>
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
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
