const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5006";

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
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
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

  // Branches
  getBranches: () => request<BranchDto[]>("/api/branches"),

  // Existing order helpers
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
