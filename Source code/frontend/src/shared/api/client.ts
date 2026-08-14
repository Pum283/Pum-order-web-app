const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:2121";

export type RoleDto = {
  id: string;
  code: string;
  name: string;
  level: number;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string | null;
};

export type CreateRoleRequest = {
  code: string;
  name: string;
  level: number;
  description?: string;
  isActive?: boolean;
};

export type UpdateRoleRequest = {
  name: string;
  level: number;
  description?: string;
  isActive: boolean;
};

export type LoginResponse = {
  accessToken: string;
  userId: string;
  displayName: string;
  phoneOrEmail: string;
  roleId: string | null;
  role: string;
  roleCode: string;
  roleLevel: number;
  roleDisplayName: string;
  branchId: string | null;
  branchName: string | null;
};

export type UserDto = {
  id: string;
  phoneOrEmail: string;
  displayName: string;
  roleId: string | null;
  roleCode: string;
  role: string;
  roleLevel: number;
  roleDisplayName: string;
  branchId: string | null;
  branchName: string | null;
  hasPin: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type CreateUserRequest = {
  phoneOrEmail: string;
  password: string;
  pin?: string;
  displayName: string;
  roleId?: string | null;
  roleCode?: string | null;
  branchId?: string | null;
};

export type UpdateUserRequest = {
  phoneOrEmail: string;
  password?: string;
  pin?: string;
  displayName: string;
  roleId?: string | null;
  roleCode?: string | null;
  branchId?: string | null;
};

export type UserFilterParams = {
  keyword?: string;
  roleId?: string;
  roleCode?: string;
  role?: string;
  branchId?: string;
  isLocked?: boolean;
  page?: number;
  pageSize?: number;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type BranchDto = {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  openHours?: string;
  imageUrl?: string;
  taxRatePercent: number;
  serviceChargePercent: number;
  currency: string;
  isTaxIncludedInPrice: boolean;
  isServiceChargeIncluded: boolean;
  receiptHeaderNote?: string;
  receiptFooterNote?: string;
  isActive: boolean;
  staffCount: number;
  tableCount: number;
  createdAt: string;
  updatedAt: string | null;
};

export type CreateBranchRequest = {
  code: string;
  name: string;
  address?: string;
  phone?: string;
  openHours?: string;
  imageUrl?: string;
  taxRatePercent?: number;
  serviceChargePercent?: number;
  currency?: string;
  isTaxIncludedInPrice?: boolean;
  isServiceChargeIncluded?: boolean;
  receiptHeaderNote?: string;
  receiptFooterNote?: string;
  isActive?: boolean;
};

export type UpdateBranchRequest = {
  name: string;
  address?: string;
  phone?: string;
  openHours?: string;
  imageUrl?: string;
  isActive: boolean;
};

export type UpdateFinancialConfigRequest = {
  taxRatePercent: number;
  serviceChargePercent: number;
  currency: string;
  isTaxIncludedInPrice: boolean;
  isServiceChargeIncluded: boolean;
  receiptHeaderNote?: string;
  receiptFooterNote?: string;
};

export type AreaDto = {
  id: string;
  branchId: string;
  branchName: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  tableCount: number;
  createdAt: string;
};

export type CreateAreaRequest = {
  branchId: string;
  name: string;
  sortOrder?: number;
};

export type UpdateAreaRequest = {
  name: string;
  sortOrder?: number;
  isActive: boolean;
};

export type DiningTableDto = {
  id: string;
  branchId: string;
  branchName: string;
  areaId: string;
  areaName: string;
  code: string;
  name?: string;
  capacity: number;
  qrToken: string;
  qrUrl: string;
  status: "Available" | "Occupied" | "Reserved" | "NeedsCleaning";
  posX: number;
  posY: number;
  isActive: boolean;
  createdAt: string;
};

export type CreateTableRequest = {
  branchId: string;
  areaId: string;
  code: string;
  name?: string;
  capacity: number;
  posX?: number;
  posY?: number;
};

export type UpdateTableRequest = {
  areaId: string;
  code: string;
  name?: string;
  capacity: number;
  status?: string;
  posX?: number;
  posY?: number;
  isActive: boolean;
};

// ==========================================
// MENU TYPES (STT 34, 35, 36)
// ==========================================

export type MenuCategoryDto = {
  id: string;
  branchId: string;
  branchName: string;
  code: string;
  name: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
  createdAt: string;
};

export type CreateCategoryRequest = {
  branchId: string;
  code?: string;
  name: string;
  imageUrl?: string;
  sortOrder?: number;
};

export type UpdateCategoryRequest = {
  code?: string;
  name: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive: boolean;
};

export type MenuItemOptionValueDto = {
  id: string;
  optionId: string;
  name: string;
  extraPrice: number;
  isDefault: boolean;
  isAvailable: boolean;
  sortOrder: number;
};

export type CreateOptionValueRequest = {
  id?: string;
  name: string;
  extraPrice: number;
  isDefault?: boolean;
  isAvailable?: boolean;
  sortOrder?: number;
};

export type MenuItemOptionDto = {
  id: string;
  menuItemId: string;
  name: string;
  optionType: "Single" | "Multiple";
  isRequired: boolean;
  sortOrder: number;
  values: MenuItemOptionValueDto[];
};

export type CreateOptionRequest = {
  id?: string;
  name: string;
  optionType: "Single" | "Multiple";
  isRequired?: boolean;
  sortOrder?: number;
  values: CreateOptionValueRequest[];
};

export type MenuItemDto = {
  id: string;
  branchId: string;
  branchName: string;
  categoryId: string;
  categoryName: string;
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  unit: string;
  kitchenStation: string;
  preparationMinutes: number;
  isAvailable: boolean;
  is86ed: boolean;
  isActive: boolean;
  optionCount: number;
  createdAt: string;
};

export type MenuItemDetailDto = MenuItemDto & {
  options: MenuItemOptionDto[];
};

export type CreateMenuItemRequest = {
  branchId: string;
  categoryId: string;
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  unit?: string;
  kitchenStation?: string;
  preparationMinutes?: number;
  isAvailable?: boolean;
  options?: CreateOptionRequest[];
};

export type UpdateMenuItemRequest = {
  categoryId: string;
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  unit?: string;
  kitchenStation?: string;
  preparationMinutes?: number;
  isAvailable?: boolean;
  is86ed?: boolean;
  isActive?: boolean;
  options?: CreateOptionRequest[];
};

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("orderpum_token");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (data?.message) errorMsg = data.message;
    } catch {
      const text = await res.text();
      if (text) errorMsg = text;
    }
    throw new Error(errorMsg);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (phoneOrEmail: string, password: string) =>
    request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ phoneOrEmail, password }),
    }),

  loginPin: (phoneOrEmail: string, pin: string) =>
    request<LoginResponse>("/api/auth/login-pin", {
      method: "POST",
      body: JSON.stringify({ phoneOrEmail, pin }),
    }),

  getMe: () => request<UserDto>("/api/auth/me"),

  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ message: string }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  setPin: (pin: string) =>
    request<{ message: string }>("/api/auth/set-pin", {
      method: "POST",
      body: JSON.stringify({ pin }),
    }),

  // Roles CRUD
  getRoles: (includeInactive = false) =>
    request<RoleDto[]>(`/api/roles?includeInactive=${includeInactive}`),

  getRoleById: (id: string) => request<RoleDto>(`/api/roles/${id}`),

  createRole: (data: CreateRoleRequest) =>
    request<RoleDto>("/api/roles", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateRole: (id: string, data: UpdateRoleRequest) =>
    request<RoleDto>(`/api/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteRole: (id: string) =>
    request<{ message: string }>(`/api/roles/${id}`, {
      method: "DELETE",
    }),

  // Staff / Users CRUD
  getUsers: (params?: UserFilterParams) => {
    const query = new URLSearchParams();
    if (params?.keyword) query.append("keyword", params.keyword);
    if (params?.roleId) query.append("roleId", params.roleId);
    if (params?.roleCode) query.append("roleCode", params.roleCode);
    if (params?.role) query.append("role", params.role);
    if (params?.branchId) query.append("branchId", params.branchId);
    if (params?.isLocked !== undefined) query.append("isLocked", String(params.isLocked));
    if (params?.page) query.append("page", String(params.page));
    if (params?.pageSize) query.append("pageSize", String(params.pageSize));

    const qs = query.toString();
    return request<PagedResult<UserDto>>(`/api/users${qs ? `?${qs}` : ""}`);
  },

  getUserById: (id: string) => request<UserDto>(`/api/users/${id}`),

  createUser: (data: CreateUserRequest) =>
    request<UserDto>("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateUser: (id: string, data: UpdateUserRequest) =>
    request<UserDto>(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  toggleLockUser: (id: string) =>
    request<{ isLocked: boolean; message: string }>(`/api/users/${id}/toggle-lock`, {
      method: "PATCH",
    }),

  deleteUser: (id: string) =>
    request<{ message: string }>(`/api/users/${id}`, {
      method: "DELETE",
    }),

  // Branches CRUD & Financial Configuration (STT 8, 99, 105)
  getBranches: (includeInactive = false) =>
    request<BranchDto[]>(`/api/branches?includeInactive=${includeInactive}`),

  getBranchById: (id: string) => request<BranchDto>(`/api/branches/${id}`),

  createBranch: (data: CreateBranchRequest) =>
    request<BranchDto>("/api/branches", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateBranch: (id: string, data: UpdateBranchRequest) =>
    request<BranchDto>(`/api/branches/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateBranchFinancialConfig: (id: string, data: UpdateFinancialConfigRequest) =>
    request<BranchDto>(`/api/branches/${id}/financial-config`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  toggleBranchActive: (id: string) =>
    request<{ isActive: boolean; message: string }>(`/api/branches/${id}/toggle-active`, {
      method: "PATCH",
    }),

  deleteBranch: (id: string) =>
    request<{ message: string }>(`/api/branches/${id}`, {
      method: "DELETE",
    }),

  // Area APIs (STT 13)
  getAreas: (branchId: string) => request<AreaDto[]>(`/api/areas?branchId=${branchId}`),
  getAreaById: (id: string) => request<AreaDto>(`/api/areas/${id}`),
  createArea: (data: CreateAreaRequest) =>
    request<AreaDto>("/api/areas", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateArea: (id: string, data: UpdateAreaRequest) =>
    request<AreaDto>(`/api/areas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteArea: (id: string) =>
    request<{ message: string }>(`/api/areas/${id}`, {
      method: "DELETE",
    }),

  // Table & QR APIs (STT 14, 15)
  getTables: (branchId: string, areaId?: string) => {
    const url = areaId ? `/api/tables?branchId=${branchId}&areaId=${areaId}` : `/api/tables?branchId=${branchId}`;
    return request<DiningTableDto[]>(url);
  },
  getTableById: (id: string) => request<DiningTableDto>(`/api/tables/${id}`),
  getTableByQrToken: (qrToken: string) => request<DiningTableDto>(`/api/tables/qr/${qrToken}`),
  createTable: (data: CreateTableRequest) =>
    request<DiningTableDto>("/api/tables", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTable: (id: string, data: UpdateTableRequest) =>
    request<DiningTableDto>(`/api/tables/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateTableStatus: (id: string, status: string) =>
    request<DiningTableDto>(`/api/tables/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  regenerateTableQr: (id: string) =>
    request<DiningTableDto>(`/api/tables/${id}/regenerate-qr`, {
      method: "POST",
    }),
  transferTable: (data: { fromTableId: string; toTableId: string; reason?: string }) =>
    request<{ fromTableId: string; fromTableCode: string; toTableId: string; toTableCode: string; sessionId: string; message: string }>("/api/tables/transfer", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTablePositions: (positions: { tableId: string; areaId?: string; posX: number; posY: number }[]) =>
    request<{ success: boolean; message: string }>("/api/tables/positions", {
      method: "POST",
      body: JSON.stringify({ positions }),
    }),
  deleteTable: (id: string) =>
    request<{ message: string }>(`/api/tables/${id}`, {
      method: "DELETE",
    }),

  // ==========================================
  // CATEGORIES (STT 34)
  // ==========================================
  getCategories: (branchId: string, onlyActive = false) =>
    request<MenuCategoryDto[]>(`/api/categories?branchId=${branchId}&onlyActive=${onlyActive}`),
  getCategoryById: (id: string) =>
    request<MenuCategoryDto>(`/api/categories/${id}`),
  createCategory: (data: CreateCategoryRequest) =>
    request<MenuCategoryDto>("/api/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: UpdateCategoryRequest) =>
    request<MenuCategoryDto>(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) =>
    request<{ message: string }>(`/api/categories/${id}`, {
      method: "DELETE",
    }),

  // ==========================================
  // MENU ITEMS (STT 35, 36)
  // ==========================================
  getMenuItems: (branchId: string, categoryId?: string, search?: string, onlyAvailable = false) => {
    const params = new URLSearchParams({ branchId });
    if (categoryId && categoryId !== "ALL") params.append("categoryId", categoryId);
    if (search) params.append("search", search);
    if (onlyAvailable) params.append("onlyAvailable", "true");
    return request<MenuItemDto[]>(`/api/menuitems?${params.toString()}`);
  },
  getMenuItemById: (id: string) =>
    request<MenuItemDetailDto>(`/api/menuitems/${id}`),
  createMenuItem: (data: CreateMenuItemRequest) =>
    request<MenuItemDetailDto>("/api/menuitems", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMenuItem: (id: string, data: UpdateMenuItemRequest) =>
    request<MenuItemDetailDto>(`/api/menuitems/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  toggleMenuItemAvailability: (id: string, isAvailable: boolean) =>
    request<{ success: boolean; isAvailable: boolean; message: string }>(`/api/menuitems/${id}/availability`, {
      method: "PATCH",
      body: JSON.stringify({ isAvailable }),
    }),
  toggleMenuItem86: (id: string, is86ed: boolean) =>
    request<{ success: boolean; is86ed: boolean; message: string }>(`/api/menuitems/${id}/86`, {
      method: "PATCH",
      body: JSON.stringify({ is86ed }),
    }),
  deleteMenuItem: (id: string) =>
    request<{ message: string }>(`/api/menuitems/${id}`, {
      method: "DELETE",
    }),

  // Order helpers
  staffOrder: (token: string, sessionId: string, lines: { menuItemId: string; quantity: number; note?: string }[]) =>
    request("/api/orders/staff", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sessionId, lines }),
    }),

  qrOrder: (tableQrToken: string, lines: { menuItemId: string; quantity: number; note?: string }[]) =>
    request("/api/orders/qr", {
      method: "POST",
      body: JSON.stringify({ tableQrToken, lines }),
    }),
};
