"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth, getRoleBadgeStyle } from "@/shared/context/AuthContext";
import {
  api,
  UserDto,
  BranchDto,
  RoleDto,
  AreaDto,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilterParams,
} from "@/shared/api/client";
import {
  Users,
  UserPlus,
  Search,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Building2,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Shield,
  ExternalLink,
  Layers,
  Check,
} from "lucide-react";

export default function UsersManagementPage() {
  const { user: currentUser, isDirectorOrOwner, isManager } = useAuth();

  const [users, setUsers] = useState<UserDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Modal Create/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [branchAreas, setBranchAreas] = useState<AreaDto[]>([]);
  const [formData, setFormData] = useState({
    displayName: "",
    phoneOrEmail: "",
    password: "",
    pin: "",
    roleId: "" as string,
    branchId: "" as string,
    assignedAreaIds: [] as string[],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Modal Quick Assign Areas
  const [quickAssignUser, setQuickAssignUser] = useState<UserDto | null>(null);
  const [quickAssignAreaIds, setQuickAssignAreaIds] = useState<string[]>([]);
  const [quickAssignSubmitting, setQuickAssignSubmitting] = useState(false);

  // Modal Confirm Lock / Delete
  const [confirmLockUser, setConfirmLockUser] = useState<UserDto | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserDto | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Load Data
  const loadUsers = useCallback(async (page = currentPage) => {
    setLoading(true);
    try {
      const params: UserFilterParams = {
        page,
        pageSize: 15,
      };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (selectedRoleId) params.roleId = selectedRoleId;
      if (selectedBranch) params.branchId = selectedBranch;
      if (selectedStatus === "active") params.isLocked = false;
      if (selectedStatus === "locked") params.isLocked = true;

      const data = await api.getUsers(params);
      setUsers(data.items);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải danh sách nhân sự.";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, keyword, selectedRoleId, selectedBranch, selectedStatus, showToast]);

  const loadMasterData = async () => {
    try {
      const [branchList, roleList] = await Promise.all([
        api.getBranches(),
        api.getRoles(false),
      ]);
      setBranches(branchList);
      setRoles(roleList);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadUsers(1);
  }, [keyword, selectedRoleId, selectedBranch, selectedStatus, loadUsers]);

  // Load Areas when branch changes
  const loadBranchAreas = useCallback(async (branchId?: string) => {
    if (!branchId) {
      setBranchAreas([]);
      return;
    }
    try {
      const areaList = await api.getAreas(branchId);
      setBranchAreas(Array.isArray(areaList) ? areaList : []);
    } catch {
      setBranchAreas([]);
    }
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    const defaultRole = roles.find((r) => r.level >= 5) || roles[0];
    const targetBranchId = isManager && currentUser?.branchId ? currentUser.branchId : (branches[0]?.id ?? "");
    setFormData({
      displayName: "",
      phoneOrEmail: "",
      password: "",
      pin: "",
      roleId: defaultRole?.id || "",
      branchId: targetBranchId,
      assignedAreaIds: [],
    });
    setFormError(null);
    setModalOpen(true);
    if (targetBranchId) loadBranchAreas(targetBranchId);
  };

  // Open Edit Modal
  const handleOpenEdit = (u: UserDto) => {
    setEditingUser(u);
    setFormData({
      displayName: u.displayName,
      phoneOrEmail: u.phoneOrEmail,
      password: "",
      pin: "",
      roleId: u.roleId || (roles.find((r) => r.code === u.roleCode)?.id ?? ""),
      branchId: u.branchId || "",
      assignedAreaIds: u.assignedAreaIds || [],
    });
    setFormError(null);
    setModalOpen(true);
    if (u.branchId) loadBranchAreas(u.branchId);
  };

  // Open Quick Assign Areas Modal
  const handleOpenQuickAssign = async (u: UserDto) => {
    setQuickAssignUser(u);
    setQuickAssignAreaIds(u.assignedAreaIds || []);
    if (u.branchId) {
      await loadBranchAreas(u.branchId);
    }
  };

  // Save Quick Assign Areas
  const handleSaveQuickAssign = async () => {
    if (!quickAssignUser) return;
    setQuickAssignSubmitting(true);
    try {
      await api.assignStaffAreas(quickAssignUser.id, quickAssignAreaIds);
      showToast("success", `Đã phân công khu vực cho nhân viên "${quickAssignUser.displayName}".`);
      setQuickAssignUser(null);
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể phân công khu vực.";
      showToast("error", msg);
    } finally {
      setQuickAssignSubmitting(false);
    }
  };

  // Submit Create / Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    try {
      if (!formData.roleId) {
        throw new Error("Vui lòng chọn vai trò cho nhân viên.");
      }

      if (editingUser) {
        // Update
        const payload: UpdateUserRequest = {
          displayName: formData.displayName.trim(),
          phoneOrEmail: formData.phoneOrEmail.trim(),
          roleId: formData.roleId,
          branchId: formData.branchId || null,
          assignedAreaIds: formData.assignedAreaIds,
        };
        if (formData.password) payload.password = formData.password;
        if (formData.pin) payload.pin = formData.pin;

        await api.updateUser(editingUser.id, payload);
        showToast("success", `Cập nhật tài khoản "${formData.displayName}" thành công.`);
      } else {
        // Create
        if (!formData.password) {
          throw new Error("Mật khẩu khởi tạo không được để trống.");
        }
        const payload: CreateUserRequest = {
          displayName: formData.displayName.trim(),
          phoneOrEmail: formData.phoneOrEmail.trim(),
          password: formData.password,
          pin: formData.pin || undefined,
          roleId: formData.roleId,
          branchId: formData.branchId || null,
          assignedAreaIds: formData.assignedAreaIds,
        };

        await api.createUser(payload);
        showToast("success", `Tạo tài khoản "${formData.displayName}" thành công.`);
      }

      setModalOpen(false);
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu thông tin.";
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Lock
  const handleToggleLock = async () => {
    if (!confirmLockUser) return;
    setActionLoading(true);
    try {
      const res = await api.toggleLockUser(confirmLockUser.id);
      showToast("success", res.message);
      setConfirmLockUser(null);
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể thay đổi trạng thái tài khoản.";
      showToast("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    setActionLoading(true);
    try {
      const res = await api.deleteUser(confirmDeleteUser.id);
      showToast("success", res.message);
      setConfirmDeleteUser(null);
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể xóa tài khoản.";
      showToast("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Roles that current user has authority to assign (Level >= current user's level)
  const assignableRoles = roles.filter((r) => {
    if (isDirectorOrOwner) return true;
    if (isManager) return r.level >= 3;
    return false;
  });

  const activeCount = users.filter((u) => !u.isLocked).length;
  const lockedCount = users.filter((u) => u.isLocked).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Module 1 · STT 1, 2, 4
            </span>
            <span className="text-xs text-stone-500">CSDL Roles Table Động</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1.5 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-amber-500" />
            Quản lý Tài khoản & Nhân viên
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Gán vai trò linh hoạt từ bảng CSDL, tạo/sửa/khóa tài khoản và phân bổ chi nhánh.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/roles"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 text-xs font-medium transition"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Quản lý Bảng Vai trò</span>
            <ExternalLink className="w-3 h-3 text-stone-500" />
          </Link>

          <button
            onClick={() => loadUsers()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 transition"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-xs transition-all active:scale-[0.99]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm nhân viên mới</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Tổng nhân sự</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{totalCount}</div>
          <div className="mt-1 text-[11px] text-stone-500">Trong phạm vi phân quyền</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Đang hoạt động</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{activeCount}</div>
          <div className="mt-1 text-[11px] text-stone-500">Tài khoản bình thường</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Đang bị khóa</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400">{lockedCount}</div>
          <div className="mt-1 text-[11px] text-stone-500">Bị chặn đăng nhập</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Danh mục vai trò</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-400">{roles.length}</div>
          <div className="mt-1 text-[11px] text-stone-500">Bảng CSDL Roles</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên, email, SĐT..."
              className="w-full pl-9 pr-3.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 placeholder-stone-600 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Dynamic Role Filter */}
          <div className="relative">
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="">Tất cả các vai trò</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  Cấp {r.level} · {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          {isDirectorOrOwner && (
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="">Tất cả chi nhánh</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Đang bị khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-950/80 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Nhân viên</th>
                <th className="px-4 py-3.5">Cấp bậc & Vai trò</th>
                <th className="px-4 py-3.5">Chi nhánh làm việc</th>
                <th className="px-4 py-3.5">Khu vực phục vụ</th>
                <th className="px-4 py-3.5 text-center">Mã PIN nhanh</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5">Ngày tạo</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-stone-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-stone-500">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Đang tải danh sách nhân viên...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-stone-500">
                    Không tìm thấy nhân viên nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const style = getRoleBadgeStyle(u.roleLevel);
                  const isSelf = u.id === currentUser?.userId;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-stone-800/40 transition ${
                        u.isLocked ? "bg-rose-950/10 opacity-70" : ""
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-stone-800 to-stone-700 border border-stone-700 flex items-center justify-center font-bold text-amber-400 text-xs shadow-inner">
                            {u.displayName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{u.displayName}</span>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-stone-500" />
                              <span>{u.phoneOrEmail}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}
                        >
                          Cấp {u.roleLevel} · {u.roleDisplayName}
                        </span>
                      </td>

                      {/* Branch */}
                      <td className="px-4 py-4 text-stone-300">
                        {u.branchName ? (
                          <div className="flex items-center gap-1.5 text-xs text-stone-300">
                            <Building2 className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                            <span className="truncate max-w-[180px]">{u.branchName}</span>
                          </div>
                        ) : (
                          <span className="text-amber-400/80 font-medium text-[11px]">
                            Toàn chuỗi hệ thống
                          </span>
                        )}
                      </td>

                      {/* Assigned Areas */}
                      <td className="px-4 py-4">
                        {u.assignedAreaNames && u.assignedAreaNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {u.assignedAreaNames.map((areaName, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold"
                              >
                                {areaName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-500 italic">Toàn chi nhánh</span>
                        )}
                      </td>

                      {/* PIN */}
                      <td className="px-4 py-4 text-center">
                        {u.hasPin ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-stone-950 text-emerald-400 border border-stone-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Đã kích hoạt
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-500">Chưa đặt</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        {u.isLocked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <Lock className="w-3 h-3" />
                            Bị khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Hoạt động
                          </span>
                        )}
                      </td>

                      {/* Created date */}
                      <td className="px-4 py-4 text-[11px] text-stone-500">
                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Assign Areas */}
                          {u.branchId && (
                            <button
                              onClick={() => handleOpenQuickAssign(u)}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-500/20 text-stone-300 hover:text-amber-400 border border-transparent hover:border-amber-500/30 transition"
                              title="Phân công khu vực phục vụ"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Lock/Unlock */}
                          {!isSelf && (
                            <button
                              onClick={() => setConfirmLockUser(u)}
                              className={`p-1.5 rounded-lg transition ${
                                u.isLocked
                                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                                  : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20"
                              }`}
                              title={u.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                            >
                              {u.isLocked ? (
                                <Unlock className="w-3.5 h-3.5" />
                              ) : (
                                <Lock className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Delete */}
                          {!isSelf && (
                            <button
                              onClick={() => setConfirmDeleteUser(u)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                              title="Xóa tài khoản"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-800 bg-stone-950/60 flex items-center justify-between text-xs text-stone-400">
            <div>
              Trang <span className="font-bold text-white">{currentPage}</span> /{" "}
              <span>{totalPages}</span> ({totalCount} nhân viên)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1 || loading}
                onClick={() => loadUsers(currentPage - 1)}
                className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:bg-stone-800 disabled:opacity-40 text-stone-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages || loading}
                onClick={() => loadUsers(currentPage + 1)}
                className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:bg-stone-800 disabled:opacity-40 text-stone-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create / Edit User */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  {editingUser ? <Edit className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingUser ? "Chỉnh sửa thông tin nhân viên" : "Thêm mới nhân viên"}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Phân vai trò từ Bảng CSDL và phân công chi nhánh
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

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Display Name */}
              <div>
                <label className="block font-semibold uppercase text-stone-300 mb-1">
                  Tên hiển thị nhân viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="VD: Nguyễn Văn Phục Vụ"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Phone / Email */}
              <div>
                <label className="block font-semibold uppercase text-stone-300 mb-1">
                  Email hoặc Số điện thoại đăng nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phoneOrEmail}
                  onChange={(e) => setFormData({ ...formData, phoneOrEmail: e.target.value })}
                  placeholder="VD: staff.q1@orderpum.vn hoặc 0908889999"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block font-semibold uppercase text-stone-300 mb-1">
                  {editingUser
                    ? "Mật khẩu mới (để trống nếu không đổi)"
                    : "Mật khẩu khởi tạo (tối thiểu 6 ký tự) *"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? "•••••••• (Giữ nguyên mật khẩu cũ)" : "••••••••"}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* PIN Code */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold uppercase text-stone-300">
                    Mã PIN nhanh (4 - 6 số)
                  </label>
                  <span className="text-[10px] text-amber-400/80">Cho NV quầy / POS / Tablet</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  value={formData.pin}
                  onChange={(e) =>
                    setFormData({ ...formData, pin: e.target.value.replace(/\D/g, "") })
                  }
                  placeholder={
                    editingUser && editingUser.hasPin
                      ? "Đã có PIN (nhập lại nếu muốn đổi)"
                      : "VD: 1234 (4 - 6 chữ số)"
                  }
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono tracking-widest focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Dynamic Role Selection */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold uppercase text-stone-300">
                    Vai trò & Cấp bậc (Bảng CSDL) <span className="text-rose-500">*</span>
                  </label>
                  <Link
                    href="/admin/roles"
                    target="_blank"
                    className="text-[10px] text-amber-400/90 hover:underline flex items-center gap-1"
                  >
                    <span>Quản lý vai trò</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  {assignableRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      Cấp {r.level} · {r.name} ({r.description || r.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Selection */}
              <div>
                <label className="block font-semibold uppercase text-stone-300 mb-1">
                  Chi nhánh phân công
                </label>
                <select
                  value={formData.branchId}
                  disabled={isManager}
                  onChange={(e) => {
                    const bId = e.target.value;
                    setFormData({ ...formData, branchId: bId, assignedAreaIds: [] });
                    loadBranchAreas(bId);
                  }}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                >
                  {isDirectorOrOwner && (
                    <option value="">Toàn chuỗi hệ thống (Không giới hạn CN)</option>
                  )}
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {isManager && (
                  <p className="mt-1 text-[11px] text-stone-500">
                    * Tài khoản Quản lý chỉ được tạo nhân viên trong chi nhánh hiện tại của mình.
                  </p>
                )}
              </div>

              {/* Multi-Area Assignment in Branch */}
              {formData.branchId && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold uppercase text-stone-300">
                      Phân công khu vực phục vụ
                    </label>
                    <span className="text-[10px] text-amber-400 font-medium">
                      {formData.assignedAreaIds.length === 0
                        ? "Mặc định: Toàn chi nhánh"
                        : `Đã chọn: ${formData.assignedAreaIds.length} vùng`}
                    </span>
                  </div>

                  {branchAreas.length > 0 ? (
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                      <p className="text-[11px] text-stone-400">
                        Chọn một hoặc nhiều khu vực mà nhân viên này phụ trách phục vụ:
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {branchAreas.map((area) => {
                          const isSelected = formData.assignedAreaIds.includes(area.id);
                          return (
                            <button
                              key={area.id}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  assignedAreaIds: isSelected
                                    ? prev.assignedAreaIds.filter((id) => id !== area.id)
                                    : [...prev.assignedAreaIds, area.id],
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                isSelected
                                  ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                                  : "bg-stone-900 text-stone-300 hover:text-white border border-stone-800"
                              }`}
                            >
                              <span>{isSelected ? "✓" : "+"}</span>
                              <span>{area.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-stone-500 italic">
                      Chi nhánh này chưa có khu vực nào.
                    </div>
                  )}
                </div>
              )}

              {/* Submit / Cancel Buttons */}
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
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {formSubmitting ? (
                    <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  ) : editingUser ? (
                    "Lưu thay đổi"
                  ) : (
                    "Tạo nhân viên"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Lock/Unlock */}
      {confirmLockUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  confirmLockUser.isLocked
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {confirmLockUser.isLocked ? (
                  <Unlock className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  {confirmLockUser.isLocked ? "Mở khóa tài khoản?" : "Khóa tài khoản nhân viên?"}
                </h4>
                <p className="text-xs text-stone-400">{confirmLockUser.displayName}</p>
              </div>
            </div>

            <p className="text-xs text-stone-400 mb-5 leading-relaxed">
              {confirmLockUser.isLocked
                ? `Nhân viên sẽ có thể đăng nhập lại vào hệ thống bằng mật khẩu hoặc PIN.`
                : `Nhân viên này sẽ ngay lập tức bị chặn đăng nhập trên tất cả ứng dụng và web.`}
            </p>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConfirmLockUser(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleToggleLock}
                className={`px-4 py-2 rounded-xl font-bold text-stone-950 shadow-md ${
                  confirmLockUser.isLocked
                    ? "bg-emerald-400 hover:bg-emerald-300"
                    : "bg-amber-500 hover:bg-amber-400"
                }`}
              >
                {actionLoading
                  ? "Đang xử lý..."
                  : confirmLockUser.isLocked
                  ? "Xác nhận Mở khóa"
                  : "Xác nhận Khóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Soft Delete */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Xóa tài khoản nhân viên?</h4>
                <p className="text-xs text-stone-400">{confirmDeleteUser.displayName}</p>
              </div>
            </div>

            <p className="text-xs text-stone-400 mb-5 leading-relaxed">
              Tài khoản sẽ được chuyển sang trạng thái đã xóa (soft-delete). Dữ liệu lịch sử giao dịch và order vẫn được lưu vết an toàn theo nghiệp vụ STT 4.
            </p>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold shadow-md"
              >
                {actionLoading ? "Đang xóa..." : "Xác nhận Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Assign Areas */}
      {quickAssignUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Phân công khu vực phục vụ</h4>
                  <p className="text-xs text-stone-400">{quickAssignUser.displayName} ({quickAssignUser.branchName || "Chi nhánh"})</p>
                </div>
              </div>
              <button
                onClick={() => setQuickAssignUser(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-300">
              Nhân viên có thể được phân công phục vụ đồng thời <strong>nhiều khu vực</strong>. Nếu bỏ chọn tất cả, nhân viên sẽ phục vụ toàn bộ chi nhánh.
            </p>

            <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 max-h-60 overflow-y-auto space-y-2">
              {branchAreas.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {branchAreas.map((area) => {
                    const isSelected = quickAssignAreaIds.includes(area.id);
                    return (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => {
                          setQuickAssignAreaIds((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== area.id)
                              : [...prev, area.id]
                          );
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                            : "bg-stone-900 text-stone-300 hover:text-white border border-stone-800"
                        }`}
                      >
                        <span>{isSelected ? "✓" : "+"}</span>
                        <span>{area.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-stone-500 italic text-center py-4">
                  Chi nhánh này chưa có khu vực nào được tạo.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setQuickAssignUser(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={quickAssignSubmitting}
                onClick={handleSaveQuickAssign}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-md flex items-center gap-1.5"
              >
                {quickAssignSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Lưu phân công</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
