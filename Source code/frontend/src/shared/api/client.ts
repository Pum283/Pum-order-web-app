export function getApiBase(): string {
  if (typeof window !== "undefined") {
    if (window.location.hostname.includes("runasp.net")) {
      return `${window.location.protocol}//pumorderapi.runasp.net`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:2121";
}

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
  assignedAreaIds?: string[];
  assignedAreaNames?: string[];
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
  assignedAreaIds: string[];
  assignedAreaNames: string[];
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
  assignedAreaIds?: string[];
};

export type UpdateUserRequest = {
  phoneOrEmail: string;
  password?: string;
  pin?: string;
  displayName: string;
  roleId?: string | null;
  roleCode?: string | null;
  branchId?: string | null;
  assignedAreaIds?: string[];
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

export type TableDto = DiningTableDto;

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

// ==========================================
// ORDER & POS TYPES (STT 21, 22, 23, 24)
// ==========================================

export type OpenSessionRequest = {
  tableId: string;
  guestCount?: number;
};

export type StaffOrderSelectedOption = {
  optionId?: string;
  optionName: string;
  valueId?: string;
  valueName: string;
  extraPrice: number;
};

export type StaffOrderLineRequest = {
  menuItemId: string;
  quantity: number;
  note?: string;
  selectedOptions?: StaffOrderSelectedOption[];
};

export type StaffPlaceOrderRequest = {
  sessionId: string;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  lines: StaffOrderLineRequest[];
};

export type QrPlaceOrderRequest = {
  tableQrToken: string;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  lines: StaffOrderLineRequest[];
};

export type OrderLineDto = {
  id: string;
  ticketId: string;
  menuItemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedOptionsText?: string;
  note?: string;
  kitchenStation: string;
  status: "PendingConfirm" | "SentToKitchen" | "Preparing" | "Ready" | "Served" | "Cancelled";
};

export type OrderTicketDto = {
  id: string;
  sessionId: string;
  ticketNumber: number;
  source: "StaffAssisted" | "CustomerQr";
  customerName?: string;
  customerPhone?: string;
  createdByUserName?: string;
  note?: string;
  orderedAt: string;
  lines: OrderLineDto[];
  ticketTotal: number;
};

export type TableSessionDetailDto = {
  id: string;
  branchId: string;
  branchName: string;
  tableId: string;
  tableCode: string;
  tableName: string;
  areaName: string;
  sessionCode: string;
  customerName?: string;
  customerPhone?: string;
  guestCount: number;
  status: "Open" | "Paying" | "Closed";
  openedAt: string;
  closedAt?: string;
  tickets: OrderTicketDto[];
  totalAmount: number;
  totalItemsCount: number;
};

export type QrTableInfoDto = {
  tableId: string;
  tableCode: string;
  tableName: string;
  areaName: string;
  capacity: number;
  qrToken: string;
  branchId: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  currency: string;
  taxRatePercent: number;
  serviceChargePercent: number;
  isTaxIncludedInPrice: boolean;
  currentSession: TableSessionDetailDto | null;
  categories: MenuCategoryDto[];
  menuItems: MenuItemDetailDto[];
};

export type TableNotificationDto = {
  id: string;
  branchId: string;
  tableId: string;
  tableCode: string;
  tableName: string;
  areaName: string;
  type: "CallStaff" | "RequestBill" | "NewQrOrder" | "ItemReady";
  message: string;
  isHandled: boolean;
  createdAt: string;
};

// ==========================================
// KDS TYPES (STT 51, 53)
// ==========================================

export type KitchenOrderLineDto = {
  id: string;
  ticketId: string;
  sessionId: string;
  menuItemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  selectedOptionsText?: string;
  note?: string;
  kitchenStation: string;
  status: "SentToKitchen" | "Preparing" | "Ready" | "Served" | "Cancelled";
  preparationMinutes: number;
  readyAt?: string;
  servedAt?: string;
  createdAt: string;
  elapsedMinutes: number;
};

export type KitchenOrderTicketDto = {
  id: string;
  sessionId: string;
  sessionCode: string;
  branchId: string;
  tableId: string;
  tableCode: string;
  tableName: string;
  areaName: string;
  guestCount: number;
  ticketNumber: number;
  source: "StaffAssisted" | "CustomerQr";
  createdByUserName?: string;
  note?: string;
  orderedAt: string;
  elapsedMinutes: number;
  urgencyLevel: "Normal" | "Warning" | "Critical";
  lines: KitchenOrderLineDto[];
};

export type KitchenStatsDto = {
  pendingCount: number;
  preparingCount: number;
  readyCount: number;
  servedTodayCount: number;
  avgPreparationMinutes: number;
};

export type KitchenAggregateTableDetailDto = {
  lineId: string;
  tableCode: string;
  tableName: string;
  quantity: number;
  selectedOptionsText?: string;
  note?: string;
  status: string;
  elapsedMinutes: number;
};

export type KitchenAggregateItemDto = {
  menuItemId: string;
  itemCode: string;
  itemName: string;
  kitchenStation: string;
  totalQuantity: number;
  pendingQuantity: number;
  preparingQuantity: number;
  tableDetails: KitchenAggregateTableDetailDto[];
};

// ==========================================
// PAYMENT & INVOICE TYPES (STT 57, 58, 59, 61)
// ==========================================

export type InvoiceLineDto = {
  id: string;
  invoiceId: string;
  orderLineId?: string;
  menuItemId: string;
  itemCode: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  selectedOptionsText?: string;
  note?: string;
};

export type PaymentTransactionDto = {
  id: string;
  invoiceId: string;
  paymentMethod: "Cash" | "BankTransfer" | "CardPos" | "EWallet";
  amount: number;
  transactionCode?: string;
  note?: string;
  status: string;
  paidAt: string;
};

export type InvoiceDto = {
  id: string;
  branchId: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  receiptHeaderNote?: string;
  receiptFooterNote?: string;
  sessionId?: string;
  invoiceNumber: string;
  tableCodeSnapshot: string;
  tableNameSnapshot: string;
  subTotalAmount: number;
  discountAmount: number;
  voucherCode?: string;
  taxRatePercent: number;
  taxAmount: number;
  isTaxIncludedInPrice: boolean;
  serviceChargePercent: number;
  serviceChargeAmount: number;
  isServiceChargeIncluded: boolean;
  finalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentStatus: "Unpaid" | "PartiallyPaid" | "Paid" | "Refunded" | "Cancelled";
  cashierUserId?: string;
  cashierNameSnapshot: string;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  createdAt: string;
  paidAt?: string;
  lines: InvoiceLineDto[];
  payments: PaymentTransactionDto[];
};

export type CreateInvoiceRequest = {
  sessionId: string;
  selectedLineIds?: string[];
  customerName?: string;
  customerPhone?: string;
  note?: string;
};

export type MergeTablesInvoiceRequest = {
  branchId: string;
  sessionIds: string[];
  customerName?: string;
  customerPhone?: string;
  note?: string;
};

export type PaymentItemRequest = {
  paymentMethod: "Cash" | "BankTransfer" | "CardPos" | "EWallet";
  amount: number;
  transactionCode?: string;
  note?: string;
};

export type SettlePaymentRequest = {
  invoiceId: string;
  payments: PaymentItemRequest[];
  receivedCashAmount?: number;
  closeSessionAfterPayment?: boolean;
  customerName?: string;
  customerPhone?: string;
};

export type VietQrInfoDto = {
  bankCode: string;
  accountNo: string;
  accountName: string;
  amount: number;
  description: string;
  qrUrl: string;
};

// ==========================================
// PROMOTION & VOUCHER TYPES (STT 60, 64, 65, 66, 71)
// ==========================================

export type PromotionDto = {
  id: string;
  branchId?: string;
  branchName: string;
  code: string;
  name: string;
  description?: string;
  discountType: "Percent" | "FixedAmount" | "ItemDiscount";
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  targetType: "Invoice" | "Category" | "MenuItem";
  targetId?: string;
  targetName?: string;
  isAutoApply: boolean;
  startAt?: string;
  endAt?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
};

export type CreatePromotionRequest = {
  branchId?: string;
  code?: string;
  name: string;
  description?: string;
  discountType: "Percent" | "FixedAmount" | "ItemDiscount";
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  targetType: "Invoice" | "Category" | "MenuItem";
  targetId?: string;
  isAutoApply: boolean;
  startAt?: string;
  endAt?: string;
  usageLimit?: number;
  isActive: boolean;
};

export type UpdatePromotionRequest = {
  branchId?: string;
  code?: string;
  name: string;
  description?: string;
  discountType: "Percent" | "FixedAmount" | "ItemDiscount";
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  targetType: "Invoice" | "Category" | "MenuItem";
  targetId?: string;
  isAutoApply: boolean;
  startAt?: string;
  endAt?: string;
  usageLimit?: number;
  isActive: boolean;
};

export type PromoLineItemDto = {
  menuItemId: string;
  categoryId?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
};

export type ValidatePromoRequest = {
  branchId: string;
  subTotal: number;
  items: PromoLineItemDto[];
  voucherCode?: string;
};

export type PromoCalculationResultDto = {
  isValid: boolean;
  message?: string;
  promotionId?: string;
  promotionCode?: string;
  promotionName?: string;
  discountAmount: number;
};

export type ApplyPromoToInvoiceRequest = {
  voucherCode?: string;
  promotionId?: string;
};

// ==========================================
// PAYMENT GATEWAY TYPES (STT 102 - VNPay, MoMo)
// ==========================================

export type PaymentGatewayConfigDto = {
  id: string;
  branchId?: string;
  branchName: string;
  provider: "VNPay" | "MoMo" | "ZaloPay" | "VietQR";
  isActive: boolean;
  isSandbox: boolean;
  merchantId: string;
  secretKey: string;
  accessKey?: string;
  endpointUrl?: string;
  returnUrl?: string;
  ipnUrl?: string;
  createdAt: string;
};

export type SavePaymentGatewayConfigRequest = {
  branchId?: string;
  provider: string;
  isActive: boolean;
  isSandbox: boolean;
  merchantId: string;
  secretKey: string;
  accessKey?: string;
  endpointUrl?: string;
  returnUrl?: string;
  ipnUrl?: string;
};

export type CreateGatewayPaymentUrlRequest = {
  invoiceId: string;
  provider?: string;
  returnUrl?: string;
  bankCode?: string;
};

export type GatewayPaymentUrlResultDto = {
  success: boolean;
  paymentUrl: string;
  qrCodeUrl?: string;
  transactionReference?: string;
  message?: string;
};

export type GatewayCallbackResultDto = {
  isSuccess: boolean;
  rspCode: string;
  message: string;
  invoiceId?: string;
  invoiceNumber?: string;
  amount: number;
  transactionNo?: string;
  bankCode?: string;
  payDate?: string;
};

// ==========================================
// WORK SHIFT & ROSTER TYPES (STT 74, 75, 79, 80)
// ==========================================

export type ShiftTemplateDto = {
  id: string;
  branchId?: string;
  branchName?: string;
  code: string;
  name: string;
  description?: string;
  startTime: string; // "06:30"
  endTime: string; // "14:30"
  breakMinutes: number;
  hourlyRateMultiplier: number;
  colorHex: string;
  isActive: boolean;
  createdAt?: string;
};

export type CreateShiftTemplateRequest = {
  branchId?: string;
  code: string;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hourlyRateMultiplier: number;
  colorHex: string;
  isActive: boolean;
};

export type UpdateShiftTemplateRequest = {
  branchId?: string;
  code: string;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hourlyRateMultiplier: number;
  colorHex: string;
  isActive: boolean;
};

export type StaffShiftScheduleDto = {
  id: string;
  branchId: string;
  branchName: string;
  userId: string;
  userName: string;
  userDisplayName: string;
  userRole: string;
  shiftTemplateId: string;
  shiftCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  colorHex: string;
  areaId?: string;
  areaName?: string;
  workDate: string;
  status: "Scheduled" | "CheckedIn" | "Completed" | "Absent" | "Cancelled";
  note?: string;
  createdAt: string;
};

export type CreateStaffScheduleRequest = {
  branchId: string;
  userId: string;
  shiftTemplateId: string;
  areaId?: string;
  workDate: string; // YYYY-MM-DD
  note?: string;
};

export type BatchCreateStaffScheduleRequest = {
  branchId: string;
  userIds: string[];
  shiftTemplateId: string;
  areaId?: string;
  workDates: string[]; // List of YYYY-MM-DD
  note?: string;
};

export type UpdateStaffScheduleRequest = {
  shiftTemplateId: string;
  areaId?: string;
  workDate: string;
  status: string;
  note?: string;
};

export type DayScheduleCellDto = {
  date: string;
  dayOfWeekName: string;
  shifts: StaffShiftScheduleDto[];
};

export type StaffWeeklyRosterRowDto = {
  userId: string;
  userName: string;
  userDisplayName: string;
  userRole: string;
  phone?: string;
  days: DayScheduleCellDto[];
  totalShiftsCount: number;
};

export type WeeklyRosterDto = {
  branchId: string;
  branchName: string;
  startOfWeek: string;
  endOfWeek: string;
  staffRows: StaffWeeklyRosterRowDto[];
  availableShifts: ShiftTemplateDto[];
};

// ==========================================
// ATTENDANCE TYPES (STT 77)
// ==========================================

export type AttendanceRecordDto = {
  id: string;
  branchId: string;
  branchName: string;
  userId: string;
  userName: string;
  userDisplayName: string;
  userRole: string;
  shiftScheduleId?: string;
  shiftTemplateId?: string;
  shiftCode: string;
  shiftName: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  shiftColorHex: string;
  workDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInTimeFormatted?: string;
  checkOutTimeFormatted?: string;
  checkInMethod: "QuickPin" | "QRCode" | "WebSelf" | "ManagerManual" | string;
  checkOutMethod?: string;
  locationNote?: string;
  status: "Present" | "Late" | "EarlyLeave" | "Late_EarlyLeave" | "OnTime" | "Overtime" | "InProgress";
  lateMinutes: number;
  earlyLeaveMinutes: number;
  actualWorkHours: number;
  note?: string;
  createdAt: string;
};

export type CheckInRequest = {
  branchId?: string;
  shiftTemplateId?: string;
  method?: string;
  locationNote?: string;
  note?: string;
};

export type CheckOutRequest = {
  attendanceId?: string;
  method?: string;
  note?: string;
};

export type QuickPinAttendanceRequest = {
  branchId: string;
  pinCode: string;
  action?: "Auto" | "CheckIn" | "CheckOut";
  shiftTemplateId?: string;
  locationNote?: string;
};

export type ManualAttendanceRequest = {
  id?: string;
  branchId: string;
  userId: string;
  shiftTemplateId?: string;
  workDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  status?: string;
  note?: string;
};

export type MyAttendanceStatusDto = {
  isCheckedIn: boolean;
  activeRecord?: AttendanceRecordDto;
  todayScheduledShift?: StaffShiftScheduleDto;
  availableShifts: ShiftTemplateDto[];
};

export type DailyAttendanceSummaryDto = {
  branchId: string;
  date: string;
  totalStaffCount: number;
  scheduledStaffCount: number;
  checkedInCount: number;
  completedCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  totalWorkHours: number;
  records: AttendanceRecordDto[];
};

// ==========================================
// REPORT & REVENUE TYPES (STT 83, 84, 85, 86, 87)
// ==========================================

export type TimeRevenuePointDto = {
  label: string;
  date: string;
  revenue: number;
  grossSales: number;
  discount: number;
  invoiceCount: number;
};

export type BranchRevenueDto = {
  branchId: string;
  branchName: string;
  branchCode: string;
  revenue: number;
  invoiceCount: number;
  averageOrderValue: number;
  revenuePercentage: number;
};

export type PaymentMethodRevenueDto = {
  paymentMethod: string;
  displayName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  colorHex: string;
};

export type TopSellingItemDto = {
  productId: string;
  productName: string;
  categoryName: string;
  quantitySold: number;
  totalRevenue: number;
  percentage: number;
};

export type RevenueOverviewSummaryDto = {
  totalRevenue: number;
  totalGrossSales: number;
  totalDiscount: number;
  totalTax: number;
  totalServiceCharge: number;
  totalInvoicesCount: number;
  averageOrderValue: number;
  previousPeriodRevenue: number;
  growthRate: number;
};

export type RevenueReportResponseDto = {
  branchId?: string;
  branchName: string;
  fromDate: string;
  toDate: string;
  preset: string;
  summary: RevenueOverviewSummaryDto;
  timeline: TimeRevenuePointDto[];
  paymentMethods: PaymentMethodRevenueDto[];
  topSellingItems: TopSellingItemDto[];
  branchRevenues: BranchRevenueDto[];
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

  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          if (data?.message) errorMsg = data.message;
          else if (typeof data === "string") errorMsg = data;
        } catch {
          errorMsg = text;
        }
      }
    } catch {
      // fallback to statusText
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

  assignStaffAreas: (userId: string, areaIds: string[]) =>
    request<UserDto>(`/api/users/${userId}/assigned-areas`, {
      method: "PUT",
      body: JSON.stringify({ areaIds }),
    }),

  getStaffAssignedAreas: (userId: string) =>
    request<string[]>(`/api/users/${userId}/assigned-areas`),

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

  // ==========================================
  // ORDER & POS (STT 21, 22, 23, 24)
  // ==========================================
  openSession: (tableId: string, guestCount = 1) =>
    request<TableSessionDetailDto>("/api/orders/sessions/open", {
      method: "POST",
      body: JSON.stringify({ tableId, guestCount }),
    }),

  getActiveSessionByTable: (tableId: string) =>
    request<TableSessionDetailDto>(`/api/orders/sessions/by-table/${tableId}`),

  getSessionById: (sessionId: string) =>
    request<TableSessionDetailDto>(`/api/orders/sessions/${sessionId}`),

  closeSession: (sessionId: string) =>
    request<{ success: boolean; message: string }>(`/api/orders/sessions/${sessionId}/close`, {
      method: "POST",
    }),

  placeStaffOrder: (data: StaffPlaceOrderRequest) =>
    request<OrderTicketDto>("/api/orders/staff", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  placeQrOrder: (data: QrPlaceOrderRequest) =>
    request<OrderTicketDto>("/api/orders/qr", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  confirmQrTicket: (ticketId: string) =>
    request<void>(`/api/orders/qr/${ticketId}/confirm`, {
      method: "POST",
    }),

  rejectQrTicket: (ticketId: string, reason: string) =>
    request<void>(`/api/orders/qr/${ticketId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  // QR Guest Methods (STT 22, 23, 25, 27, 28)
  getQrTableInfo: (token: string) =>
    request<QrTableInfoDto>(`/api/orders/qr/info?token=${encodeURIComponent(token)}`),

  getQrSessionStatus: (token: string) =>
    request<TableSessionDetailDto | null>(`/api/orders/qr/session?token=${encodeURIComponent(token)}`),

  callStaff: (tableQrToken: string, reason?: string) =>
    request<TableNotificationDto>("/api/orders/qr/call-staff", {
      method: "POST",
      body: JSON.stringify({ tableQrToken, reason }),
    }),

  requestBill: (tableQrToken: string, paymentMethod = "Cash", note?: string) =>
    request<TableNotificationDto>("/api/orders/qr/request-bill", {
      method: "POST",
      body: JSON.stringify({ tableQrToken, paymentMethod, note }),
    }),

  // Realtime Notifications (STT 95)
  getNotifications: (branchId: string) =>
    request<TableNotificationDto[]>(`/api/orders/notifications?branchId=${branchId}`),

  dismissNotification: (notificationId: string) =>
    request<void>(`/api/orders/notifications/${notificationId}/dismiss`, {
      method: "POST",
    }),

  getPendingQrTickets: (branchId: string) =>
    request<OrderTicketDto[]>(`/api/orders/pending-qr?branchId=${branchId}`),

  getActiveSessions: (branchId: string) =>
    request<TableSessionDetailDto[]>(`/api/orders/sessions/active?branchId=${branchId}`),

  // ==========================================
  // KDS APIS (STT 51, 53)
  // ==========================================
  getKitchenOrders: (branchId: string, station?: string, status?: string) => {
    const params = new URLSearchParams({ branchId });
    if (station && station !== "ALL") params.append("station", station);
    if (status && status !== "ALL") params.append("status", status);
    return request<KitchenOrderTicketDto[]>(`/api/kitchen/orders?${params.toString()}`);
  },

  getKitchenAggregate: (branchId: string, station?: string) => {
    const params = new URLSearchParams({ branchId });
    if (station && station !== "ALL") params.append("station", station);
    return request<KitchenAggregateItemDto[]>(`/api/kitchen/aggregate?${params.toString()}`);
  },

  getKitchenStats: (branchId: string) =>
    request<KitchenStatsDto>(`/api/kitchen/stats?branchId=${branchId}`),

  updateKitchenLineStatus: (lineId: string, data: { newStatus: string; cancelReason?: string }) =>
    request<KitchenOrderLineDto>(`/api/kitchen/lines/${lineId}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateKitchenTicketStatus: (ticketId: string, newStatus: string) =>
    request<{ success: boolean; message: string }>(`/api/kitchen/tickets/${ticketId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ newStatus }),
    }),

  // ==========================================
  // PAYMENT & INVOICE APIS (STT 57, 58, 59, 61)
  // ==========================================
  createInvoiceFromSession: (data: CreateInvoiceRequest) =>
    request<InvoiceDto>("/api/payment/invoices/session", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  mergeTablesInvoice: (data: MergeTablesInvoiceRequest) =>
    request<InvoiceDto>("/api/payment/invoices/merge", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getInvoice: (invoiceId: string) =>
    request<InvoiceDto>(`/api/payment/invoices/${invoiceId}`),

  getInvoices: (branchId: string, status?: string, date?: string) => {
    const params = new URLSearchParams({ branchId });
    if (status && status !== "ALL") params.append("status", status);
    if (date) params.append("date", date);
    return request<InvoiceDto[]>(`/api/payment/invoices?${params.toString()}`);
  },

  settlePayment: (data: SettlePaymentRequest) =>
    request<InvoiceDto>("/api/payment/invoices/settle", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getVietQr: (invoiceId: string) =>
    request<VietQrInfoDto>(`/api/payment/invoices/${invoiceId}/vietqr`),

  // ==========================================
  // PROMOTION APIS (STT 60, 64, 65, 66, 71)
  // ==========================================
  getPromotions: (branchId?: string, activeOnly = false) => {
    const params = new URLSearchParams();
    if (branchId && branchId !== "ALL") params.append("branchId", branchId);
    if (activeOnly) params.append("activeOnly", "true");
    return request<PromotionDto[]>(`/api/promotions?${params.toString()}`);
  },

  getPromotion: (id: string) =>
    request<PromotionDto>(`/api/promotions/${id}`),

  createPromotion: (data: CreatePromotionRequest) =>
    request<PromotionDto>("/api/promotions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updatePromotion: (id: string, data: UpdatePromotionRequest) =>
    request<PromotionDto>(`/api/promotions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deletePromotion: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/promotions/${id}`, {
      method: "DELETE",
    }),

  togglePromotion: (id: string) =>
    request<{ isActive: boolean; message: string }>(`/api/promotions/${id}/toggle`, {
      method: "PATCH",
    }),

  validatePromo: (data: ValidatePromoRequest) =>
    request<PromoCalculationResultDto>("/api/promotions/validate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  applyPromoToInvoice: (invoiceId: string, data: ApplyPromoToInvoiceRequest) =>
    request<InvoiceDto>(`/api/promotions/invoices/${invoiceId}/apply`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ==========================================
  // PAYMENT GATEWAY APIS (STT 102)
  // ==========================================
  getPaymentGatewayConfigs: (branchId?: string) => {
    const params = new URLSearchParams();
    if (branchId && branchId !== "ALL") params.append("branchId", branchId);
    return request<PaymentGatewayConfigDto[]>(`/api/payment-gateways/configs?${params.toString()}`);
  },

  savePaymentGatewayConfig: (data: SavePaymentGatewayConfigRequest) =>
    request<PaymentGatewayConfigDto>("/api/payment-gateways/configs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createVNPayUrl: (data: CreateGatewayPaymentUrlRequest) =>
    request<GatewayPaymentUrlResultDto>("/api/payment-gateways/vnpay/create-payment-url", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  processVNPayCallback: (queryString: string) =>
    request<GatewayCallbackResultDto>(`/api/payment-gateways/vnpay/callback?${queryString}`),

  createMoMoUrl: (data: CreateGatewayPaymentUrlRequest) =>
    request<GatewayPaymentUrlResultDto>("/api/payment-gateways/momo/create-payment-url", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  processMoMoCallback: (queryString: string) =>
    request<GatewayCallbackResultDto>(`/api/payment-gateways/momo/callback?${queryString}`),

  // ==========================================
  // WORK SHIFT & ROSTER APIS (STT 74, 75, 79, 80)
  // ==========================================
  getShiftTemplates: (branchId?: string) => {
    const params = new URLSearchParams();
    if (branchId && branchId !== "ALL") params.append("branchId", branchId);
    return request<ShiftTemplateDto[]>(`/api/shifts/templates?${params.toString()}`);
  },

  getShiftTemplate: (id: string) =>
    request<ShiftTemplateDto>(`/api/shifts/templates/${id}`),

  createShiftTemplate: (data: CreateShiftTemplateRequest) =>
    request<ShiftTemplateDto>("/api/shifts/templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateShiftTemplate: (id: string, data: UpdateShiftTemplateRequest) =>
    request<ShiftTemplateDto>(`/api/shifts/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteShiftTemplate: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/shifts/templates/${id}`, {
      method: "DELETE",
    }),

  getWeeklyRoster: (branchId: string, startOfWeek?: string) => {
    const params = new URLSearchParams();
    params.append("branchId", branchId);
    if (startOfWeek) params.append("startOfWeek", startOfWeek);
    return request<WeeklyRosterDto>(`/api/shifts/roster/weekly?${params.toString()}`);
  },

  getStaffSchedules: (paramsObj?: { branchId?: string; userId?: string; fromDate?: string; toDate?: string }) => {
    const params = new URLSearchParams();
    if (paramsObj?.branchId && paramsObj.branchId !== "ALL") params.append("branchId", paramsObj.branchId);
    if (paramsObj?.userId) params.append("userId", paramsObj.userId);
    if (paramsObj?.fromDate) params.append("fromDate", paramsObj.fromDate);
    if (paramsObj?.toDate) params.append("toDate", paramsObj.toDate);
    return request<StaffShiftScheduleDto[]>(`/api/shifts/schedules?${params.toString()}`);
  },

  createStaffSchedule: (data: CreateStaffScheduleRequest) =>
    request<StaffShiftScheduleDto>("/api/shifts/schedules", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  batchCreateStaffSchedule: (data: BatchCreateStaffScheduleRequest) =>
    request<StaffShiftScheduleDto[]>("/api/shifts/schedules/batch", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStaffSchedule: (id: string, data: UpdateStaffScheduleRequest) =>
    request<StaffShiftScheduleDto>(`/api/shifts/schedules/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteStaffSchedule: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/shifts/schedules/${id}`, {
      method: "DELETE",
    }),

  // ==========================================
  // ATTENDANCE APIS (STT 77)
  // ==========================================
  getAttendanceRecords: (paramsObj?: { branchId?: string; userId?: string; fromDate?: string; toDate?: string }) => {
    const params = new URLSearchParams();
    if (paramsObj?.branchId && paramsObj.branchId !== "ALL") params.append("branchId", paramsObj.branchId);
    if (paramsObj?.userId) params.append("userId", paramsObj.userId);
    if (paramsObj?.fromDate) params.append("fromDate", paramsObj.fromDate);
    if (paramsObj?.toDate) params.append("toDate", paramsObj.toDate);
    return request<AttendanceRecordDto[]>(`/api/attendance?${params.toString()}`);
  },

  getDailyAttendanceSummary: (branchId: string, date?: string) => {
    const params = new URLSearchParams();
    params.append("branchId", branchId);
    if (date) params.append("date", date);
    return request<DailyAttendanceSummaryDto>(`/api/attendance/summary/daily?${params.toString()}`);
  },

  getMyAttendanceStatus: () =>
    request<MyAttendanceStatusDto>("/api/attendance/my-status"),

  checkIn: (data: CheckInRequest) =>
    request<AttendanceRecordDto>("/api/attendance/check-in", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  checkOut: (data: CheckOutRequest) =>
    request<AttendanceRecordDto>("/api/attendance/check-out", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  quickPinAttendance: (data: QuickPinAttendanceRequest) =>
    request<AttendanceRecordDto>("/api/attendance/quick-pin", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  manualUpsertAttendance: (data: ManualAttendanceRequest) =>
    request<AttendanceRecordDto>("/api/attendance/manual", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteAttendance: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/attendance/${id}`, {
      method: "DELETE",
    }),

  // ==========================================
  // REPORT APIS (STT 83, 84, 85, 86, 87)
  // ==========================================
  getRevenueReport: (paramsObj?: { branchId?: string; preset?: string; fromDate?: string; toDate?: string }) => {
    const params = new URLSearchParams();
    if (paramsObj?.branchId && paramsObj.branchId !== "ALL") params.append("branchId", paramsObj.branchId);
    if (paramsObj?.preset) params.append("preset", paramsObj.preset);
    if (paramsObj?.fromDate) params.append("fromDate", paramsObj.fromDate);
    if (paramsObj?.toDate) params.append("toDate", paramsObj.toDate);
    return request<RevenueReportResponseDto>(`/api/reports/revenue?${params.toString()}`);
  },

  getTopSellingItems: (paramsObj?: { branchId?: string; fromDate?: string; toDate?: string; top?: number }) => {
    const params = new URLSearchParams();
    if (paramsObj?.branchId && paramsObj.branchId !== "ALL") params.append("branchId", paramsObj.branchId);
    if (paramsObj?.fromDate) params.append("fromDate", paramsObj.fromDate);
    if (paramsObj?.toDate) params.append("toDate", paramsObj.toDate);
    if (paramsObj?.top) params.append("top", paramsObj.top.toString());
    return request<TopSellingItemDto[]>(`/api/reports/top-items?${params.toString()}`);
  },

  getPaymentMethodRevenueReport: (paramsObj?: { branchId?: string; fromDate?: string; toDate?: string }) => {
    const params = new URLSearchParams();
    if (paramsObj?.branchId && paramsObj.branchId !== "ALL") params.append("branchId", paramsObj.branchId);
    if (paramsObj?.fromDate) params.append("fromDate", paramsObj.fromDate);
    if (paramsObj?.toDate) params.append("toDate", paramsObj.toDate);
    return request<PaymentMethodRevenueDto[]>(`/api/reports/payment-methods?${params.toString()}`);
  },

  getBranchRevenueComparison: (fromDate?: string, toDate?: string) => {
    const params = new URLSearchParams();
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
    return request<BranchRevenueDto[]>(`/api/reports/branch-comparison?${params.toString()}`);
  },

  // ==========================================
  // CLOUDINARY MEDIA UPLOAD
  // ==========================================
  uploadImage: async (file: File, folder?: string): Promise<{ url: string; fileName: string; size: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    const query = folder ? `?folder=${encodeURIComponent(folder)}` : "";
    const token = typeof window !== "undefined" ? localStorage.getItem("orderpum_token") : null;
    const res = await fetch(`${API_BASE_URL}/api/media/upload${query}`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Tải ảnh lên Cloudinary thất bại.");
    }
    return res.json();
  },
};
