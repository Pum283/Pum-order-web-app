"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth, getRoleBadgeStyle } from "@/shared/context/AuthContext";
import {
  api,
  RoleDto,
  CreateRoleRequest,
  UpdateRoleRequest,
} from "@/shared/api/client";
import {
  Shield,
  ShieldPlus,
  ShieldCheck,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Users,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";

export default function RolesManagementPage() {
  const { isDirectorOrOwner } = useAuth();

  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    level: 5,
    description: "",
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Modal Confirm Delete
  const [confirmDeleteRole, setConfirmDeleteRole] = useState<RoleDto | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getRoles(true);
      setRoles(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải danh sách vai trò.";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({
      code: "",
      name: "",
      level: 5,
      description: "",
      isActive: true,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (role: RoleDto) => {
    setEditingRole(role);
    setFormData({
      code: role.code,
      name: role.name,
      level: role.level,
      description: role.description || "",
      isActive: role.isActive,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    try {
      if (editingRole) {
        const payload: UpdateRoleRequest = {
          name: formData.name.trim(),
          level: Number(formData.level),
          description: formData.description.trim(),
          isActive: formData.isActive,
        };
        await api.updateRole(editingRole.id, payload);
        showToast("success", `Cập nhật vai trò "${formData.name}" thành công.`);
      } else {
        const payload: CreateRoleRequest = {
          code: formData.code.trim(),
          name: formData.name.trim(),
          level: Number(formData.level),
          description: formData.description.trim(),
          isActive: formData.isActive,
        };
        await api.createRole(payload);
        showToast("success", `Tạo vai trò "${formData.name}" thành công.`);
      }

      setModalOpen(false);
      loadRoles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu vai trò.";
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!confirmDeleteRole) return;
    setActionLoading(true);
    try {
      const res = await api.deleteRole(confirmDeleteRole.id);
      showToast("success", res.message);
      setConfirmDeleteRole(null);
      loadRoles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể xóa vai trò.";
      showToast("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  const systemCount = roles.filter((r) => r.isSystem).length;
  const customCount = roles.filter((r) => !r.isSystem).length;
  const activeCount = roles.filter((r) => r.isActive).length;

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
              CSDL Động · Bảng Roles
            </span>
            <span className="text-xs text-stone-500">Thay thế Enum cứng</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1.5 flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-amber-500" />
            Cấu hình Vai trò & Cấp bậc Nhân sự
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Quản lý linh hoạt danh mục chức danh, phân cấp bậc thẩm quyền từ Cấp 1 (cao nhất) đến Cấp 10.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadRoles()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 transition"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {isDirectorOrOwner && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-xs transition-all active:scale-[0.99]"
            >
              <ShieldPlus className="w-4 h-4" />
              <span>Thêm vai trò mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Tổng số vai trò</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{roles.length}</div>
          <div className="mt-1 text-[11px] text-stone-500">Trong bảng CSDL Roles</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Vai trò hệ thống</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-400">{systemCount}</div>
          <div className="mt-1 text-[11px] text-stone-500">Mặc định của hệ thống</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Vai trò tùy chỉnh</span>
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-400">{customCount}</div>
          <div className="mt-1 text-[11px] text-stone-500">Do quản trị viên tự thêm</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Đang kích hoạt</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{activeCount}</div>
          <div className="mt-1 text-[11px] text-stone-500">Khả dụng khi gán tài khoản</div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-950/80 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Mã & Tên vai trò</th>
                <th className="px-4 py-3.5 text-center">Cấp bậc thẩm quyền</th>
                <th className="px-4 py-3.5">Mô tả nhiệm vụ</th>
                <th className="px-4 py-3.5 text-center">Nhân sự gán</th>
                <th className="px-4 py-3.5 text-center">Loại vai trò</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-stone-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-stone-500">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Đang tải danh sách vai trò...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-stone-500">
                    Chưa có vai trò nào trong cơ sở dữ liệu.
                  </td>
                </tr>
              ) : (
                roles.map((r) => {
                  const style = getRoleBadgeStyle(r.level);

                  return (
                    <tr key={r.id} className="hover:bg-stone-800/40 transition">
                      {/* Name & Code */}
                      <td className="px-5 py-4">
                        <div>
                          <div className="font-bold text-white text-xs">{r.name}</div>
                          <div className="text-[11px] font-mono text-stone-400 mt-0.5">
                            {r.code}
                          </div>
                        </div>
                      </td>

                      {/* Level */}
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}
                        >
                          Cấp {r.level}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-4 text-stone-400 max-w-xs truncate text-[11px]">
                        {r.description || "—"}
                      </td>

                      {/* User count */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-xs text-stone-300">
                          <Users className="w-3.5 h-3.5 text-stone-500" />
                          <span>{r.userCount}</span>
                        </span>
                      </td>

                      {/* System / Custom */}
                      <td className="px-4 py-4 text-center">
                        {r.isSystem ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Lock className="w-3 h-3" />
                            Hệ thống
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Tùy chỉnh
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        {r.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Khả dụng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-500 border border-stone-700">
                            Tạm ẩn
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDirectorOrOwner && (
                            <button
                              onClick={() => handleOpenEdit(r)}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                              title="Chỉnh sửa vai trò"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isDirectorOrOwner && !r.isSystem && (
                            <button
                              onClick={() => setConfirmDeleteRole(r)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                              title="Xóa vai trò"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit Role */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  {editingRole ? <Edit className="w-4 h-4" /> : <ShieldPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingRole ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Cấu hình tên gọi và cấp bậc thẩm quyền
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
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

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              {/* Code */}
              <div>
                <label className="block font-semibold uppercase text-stone-300 mb-1">
                  Mã vai trò (Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={editingRole !== null}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\s+/g, "") })}
                  placeholder="VD: FloorSupervisor, HeadCashier..."
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block font-semibold uppercase text-stone-300 mb-1">
                  Tên hiển thị tiếng Việt <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Giám sát sảnh, Thu ngân trưởng..."
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Level */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold uppercase text-stone-300">
                    Cấp bậc thẩm quyền (1 - 10) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-amber-400/80">Cấp 1 là cao nhất</span>
                </div>
                <select
                  value={formData.level}
                  disabled={editingRole?.isSystem}
                  onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                >
                  <option value={1}>Cấp 1 · Giám đốc chuỗi (Toàn quyền cao nhất)</option>
                  <option value={2}>Cấp 2 · Chủ nhà hàng / Khối kinh doanh</option>
                  <option value={3}>Cấp 3 · Quản lý chi nhánh</option>
                  <option value={4}>Cấp 4 · Trưởng bộ phận / Giám sát</option>
                  <option value={5}>Cấp 5 · Nhân viên chính thức (Phục vụ / Thu ngân / Bếp)</option>
                  <option value={6}>Cấp 6 · Nhân viên thử việc / Part-time</option>
                  <option value={7}>Cấp 7 · Nhân viên thực tập</option>
                  <option value={8}>Cấp 8 · Nhân viên hợp đồng ngoài</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold uppercase text-stone-300 mb-1">
                  Mô tả nhiệm vụ
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả phạm vi quyền hạn và nhiệm vụ..."
                  className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* IsActive */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveRole"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-stone-800 bg-stone-950 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isActiveRole" className="text-xs text-stone-300">
                  Kích hoạt vai trò này trong danh mục chọn
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {formSubmitting ? "Đang lưu..." : editingRole ? "Lưu thay đổi" : "Tạo vai trò"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {confirmDeleteRole && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Xóa vai trò?</h4>
                <p className="text-xs text-stone-400">{confirmDeleteRole.name}</p>
              </div>
            </div>

            <p className="text-xs text-stone-400 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa vai trò này khỏi hệ thống CSDL?
            </p>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConfirmDeleteRole(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteRole}
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
