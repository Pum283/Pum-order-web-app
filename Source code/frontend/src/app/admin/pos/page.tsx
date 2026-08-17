"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/shared/context/AuthContext";
import {
  api,
  TableDto,
  AreaDto,
  MenuCategoryDto,
  MenuItemDto,
  MenuItemDetailDto,
  TableSessionDetailDto,
  StaffOrderLineRequest,
  StaffOrderSelectedOption,
  TableNotificationDto,
  InvoiceDto,
  VietQrInfoDto,
  PromotionDto,
} from "@/shared/api/client";
import { useOrderSignalR } from "@/shared/api/signalr";
import {
  ShoppingCart,
  UtensilsCrossed,
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  Clock,
  Flame,
  Wine,
  Cake,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  RefreshCw,
  X,
  History,
  Layers,
  Sparkles,
  ArrowRightLeft,
  Check,
  Bell,
  CheckCheck,
  XCircle,
  Receipt,
  DollarSign,
  QrCode,
  Printer,
  CreditCard,
  Smartphone,
  Split,
  Merge,
  CheckSquare,
  Square,
  Tag,
  Zap,
  Gift,
  Percent,
} from "lucide-react";

interface CartItem {
  id: string; // unique local ID
  menuItemId: string;
  code: string;
  name: string;
  imageUrl?: string;
  kitchenStation: string;
  basePrice: number;
  unitPrice: number;
  quantity: number;
  note?: string;
  selectedOptions: StaffOrderSelectedOption[];
}

function PosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTableId = searchParams.get("tableId");

  const { user } = useAuth();
  const activeBranchId = user?.branchId || "";

  // Data state
  const [tables, setTables] = useState<TableDto[]>([]);
  const [areas, setAreas] = useState<AreaDto[]>([]);
  const [categories, setCategories] = useState<MenuCategoryDto[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>(initialTableId || "");
  const [currentSession, setCurrentSession] = useState<TableSessionDetailDto | null>(null);

  // Notifications (STT 27, 28, 95)
  const [notifications, setNotifications] = useState<TableNotificationDto[]>([]);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  // Reject QR Ticket Modal (STT 24)
  const [rejectingTicketId, setRejectingTicketId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("Bếp hết nguyên liệu");

  // Filter & Search state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Cart & Order state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ticketNote, setTicketNote] = useState<string>("");
  const [activeCartTab, setActiveCartTab] = useState<"current" | "history">("current");
  const [mobilePosView, setMobilePosView] = useState<"menu" | "cart">("menu");

  // Option Customization Modal state
  const [customizingItem, setCustomizingItem] = useState<MenuItemDetailDto | null>(null);
  const [optionSelections, setOptionSelections] = useState<Record<string, string[]>>({});
  const [customizingNote, setCustomizingNote] = useState<string>("");
  const [customizingQuantity, setCustomizingQuantity] = useState<number>(1);

  // UI state
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [closingSession, setClosingSession] = useState(false);
  const [confirmingTicketId, setConfirmingTicketId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ==========================================
  // CHECKOUT & PAYMENT STATE (STT 57, 58, 59, 61)
  // ==========================================
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceDto | null>(null);
  const [vietQrInfo, setVietQrInfo] = useState<VietQrInfoDto | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isSettlingPayment, setIsSettlingPayment] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<"full" | "split" | "merge">("full");
  const [splitSelectedLineIds, setSplitSelectedLineIds] = useState<string[]>([]);
  const [mergeSelectedSessionIds, setMergeSelectedSessionIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "BankTransfer" | "VNPay" | "MoMo" | "CardPos" | "EWallet">("Cash");
  const [receivedCash, setReceivedCash] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Gateway state (STT 102)
  const [vnpayUrl, setVnpayUrl] = useState<string | null>(null);
  const [momoQrUrl, setMomoQrUrl] = useState<string | null>(null);
  const [isGeneratingGatewayUrl, setIsGeneratingGatewayUrl] = useState(false);

  // Promotion / Voucher state (STT 60, 71)
  const [voucherInput, setVoucherInput] = useState<string>("");
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherMsg, setVoucherMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activePromosList, setActivePromosList] = useState<PromotionDto[]>([]);

  // Load initial data on branch change
  useEffect(() => {
    if (!activeBranchId) return;
    loadAllData();
    loadNotifications();
  }, [activeBranchId]);

  // Real-time SignalR Event Handlers for POS
  useOrderSignalR({
    onOrderPendingConfirm: () => {
      loadNotifications();
      if (selectedTableId) loadTableSession(selectedTableId, true);
      if (activeBranchId) api.getTables(activeBranchId).then(setTables).catch(() => {});
    },
    onOrderConfirmed: () => {
      loadNotifications();
      if (selectedTableId) loadTableSession(selectedTableId, true);
      if (activeBranchId) api.getTables(activeBranchId).then(setTables).catch(() => {});
    },
    onOrderRejected: () => {
      loadNotifications();
      if (selectedTableId) loadTableSession(selectedTableId, true);
    },
    onOrderCreated: () => {
      if (selectedTableId) loadTableSession(selectedTableId, true);
      if (activeBranchId) api.getTables(activeBranchId).then(setTables).catch(() => {});
    },
    onStaffCalled: () => {
      loadNotifications();
    },
    onBillRequested: () => {
      loadNotifications();
    },
    onNotificationDismissed: () => {
      loadNotifications();
    },
    onSessionClosed: () => {
      loadNotifications();
      if (selectedTableId) loadTableSession(selectedTableId, true);
      if (activeBranchId) api.getTables(activeBranchId).then(setTables).catch(() => {});
    },
  });

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [tableList, areaList, catList, itemList] = await Promise.all([
        api.getTables(activeBranchId),
        api.getAreas(activeBranchId),
        api.getCategories(activeBranchId, true),
        api.getMenuItems(activeBranchId, undefined, undefined, true),
      ]);
      setTables(tableList);
      setAreas(areaList);
      setCategories(catList);
      setMenuItems(itemList);

      // Auto select table
      if (initialTableId && tableList.some((t) => t.id === initialTableId)) {
        setSelectedTableId(initialTableId);
      } else if (!selectedTableId && tableList.length > 0) {
        setSelectedTableId(tableList[0].id);
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Không thể tải dữ liệu POS." });
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!activeBranchId) return;
    try {
      const list = await api.getNotifications(activeBranchId);
      setNotifications(list);
    } catch (err) {
      console.error(err);
    }
  };

  // When selectedTableId changes, load or open session
  useEffect(() => {
    if (!selectedTableId) {
      setCurrentSession(null);
      return;
    }
    loadTableSession(selectedTableId);
  }, [selectedTableId]);

  const loadTableSession = async (tableId: string, isSilent = false) => {
    try {
      if (!isSilent) setSessionLoading(true);
      try {
        const session = await api.getActiveSessionByTable(tableId);
        setCurrentSession(session);
        if (!isSilent && session.tickets.length > 0) {
          setActiveCartTab("current");
        }
      } catch {
        setCurrentSession(null);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      if (!isSilent) setSessionLoading(false);
    }
  };

  const handleOpenNewSession = async (guestCount = 2) => {
    if (!selectedTableId) return;
    try {
      setSessionLoading(true);
      const newSession = await api.openSession(selectedTableId, guestCount);
      setCurrentSession(newSession);
      setTables((prev) =>
        prev.map((t) => (t.id === selectedTableId ? { ...t, status: "Occupied" } : t))
      );
      setNotification({
        type: "success",
        message: `Đã mở phiên phục vụ mới cho bàn ${newSession.tableName} (${newSession.sessionCode})`,
      });
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Lỗi mở phiên bàn." });
    } finally {
      setSessionLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!currentSession) return;
    if (!confirm(`Bạn có chắc muốn kết thúc phiên và dọn bàn ${currentSession.tableName}?`)) return;

    try {
      setClosingSession(true);
      await api.closeSession(currentSession.id);
      setTables((prev) =>
        prev.map((t) => (t.id === selectedTableId ? { ...t, status: "NeedsCleaning" } : t))
      );
      setCurrentSession(null);
      setCart([]);
      setNotification({
        type: "success",
        message: `Đã kết thúc phiên bàn ${currentSession.tableName}. Bàn chuyển sang trạng thái Cần dọn.`,
      });
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Lỗi đóng phiên bàn." });
    } finally {
      setClosingSession(false);
    }
  };

  // STT 24: Confirm QR Ticket to Kitchen
  const handleConfirmQrTicket = async (ticketId: string) => {
    try {
      setConfirmingTicketId(ticketId);
      await api.confirmQrTicket(ticketId);
      if (currentSession) {
        const updated = await api.getSessionById(currentSession.id);
        setCurrentSession(updated);
      }
      setNotification({
        type: "success",
        message: "Đã duyệt và chuyển các món từ khách QR vào Bếp/Bar chế biến!",
      });
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Lỗi khi duyệt order." });
    } finally {
      setConfirmingTicketId(null);
    }
  };

  // STT 24: Reject QR Ticket
  const handleRejectQrTicket = async () => {
    if (!rejectingTicketId) return;
    try {
      await api.rejectQrTicket(rejectingTicketId, rejectReason);
      setRejectingTicketId(null);
      if (currentSession) {
        const updated = await api.getSessionById(currentSession.id);
        setCurrentSession(updated);
      }
      setNotification({
        type: "success",
        message: `Đã từ chối đợt gọi món QR với lý do: "${rejectReason}"`,
      });
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Lỗi khi từ chối order." });
    }
  };

  // STT 95: Dismiss Notification
  const handleDismissNotification = async (notifId: string) => {
    try {
      await api.dismissNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    } catch (err: any) {
      console.error(err);
    }
  };

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = selectedCategoryId === "ALL" || item.categoryId === selectedCategoryId;
      const matchSearch =
        !searchKeyword ||
        item.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.code.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchCat && matchSearch && item.isAvailable && !item.is86ed;
    });
  }, [menuItems, selectedCategoryId, searchKeyword]);

  // Click menu item -> Luôn mở popup xem chi tiết món
  const handleItemClick = async (item: MenuItemDto) => {
    try {
      const fullItem = await api.getMenuItem(item.id);
      openCustomizationModal(fullItem);
    } catch (err: any) {
      openCustomizationModal({
        ...item,
        options: [],
      } as MenuItemDetailDto);
    }
  };

  const addDirectToCart = (item: MenuItemDto) => {
    const existingIndex = cart.findIndex(
      (c) => c.menuItemId === item.id && (!c.selectedOptions || c.selectedOptions.length === 0)
    );

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      const newCartItem: CartItem = {
        id: `${item.id}-${Date.now()}`,
        menuItemId: item.id,
        code: item.code,
        name: item.name,
        imageUrl: item.imageUrl,
        kitchenStation: item.kitchenStation,
        basePrice: item.price,
        unitPrice: item.price,
        quantity: 1,
        selectedOptions: [],
      };
      setCart([...cart, newCartItem]);
    }
  };

  const openCustomizationModal = (item: MenuItemDetailDto) => {
    setCustomizingItem(item);
    setCustomizingQuantity(1);
    setCustomizingNote("");

    const defaults: Record<string, string[]> = {};
    item.options.forEach((opt) => {
      if (opt.optionType === "Single") {
        const defaultVal = opt.values.find((v) => v.isDefault) || opt.values[0];
        if (defaultVal) defaults[opt.id] = [defaultVal.id];
      } else {
        const defaultVals = opt.values.filter((v) => v.isDefault).map((v) => v.id);
        defaults[opt.id] = defaultVals;
      }
    });
    setOptionSelections(defaults);
  };

  const handleOptionToggle = (optionId: string, valueId: string, optionType: string) => {
    setOptionSelections((prev) => {
      const current = prev[optionId] || [];
      if (optionType === "Single") {
        return { ...prev, [optionId]: [valueId] };
      } else {
        if (current.includes(valueId)) {
          return { ...prev, [optionId]: current.filter((id) => id !== valueId) };
        } else {
          return { ...prev, [optionId]: [...current, valueId] };
        }
      }
    });
  };

  const customizedUnitPrice = useMemo(() => {
    if (!customizingItem) return 0;
    let extra = 0;
    customizingItem.options.forEach((opt) => {
      const selectedValIds = optionSelections[opt.id] || [];
      opt.values.forEach((val) => {
        if (selectedValIds.includes(val.id)) {
          extra += val.extraPrice;
        }
      });
    });
    return customizingItem.price + extra;
  }, [customizingItem, optionSelections]);

  const confirmCustomization = () => {
    if (!customizingItem) return;

    const selectedList: StaffOrderSelectedOption[] = [];
    customizingItem.options.forEach((opt) => {
      const selectedValIds = optionSelections[opt.id] || [];
      opt.values.forEach((val) => {
        if (selectedValIds.includes(val.id)) {
          selectedList.push({
            optionId: opt.id,
            optionName: opt.name,
            valueId: val.id,
            valueName: val.name,
            extraPrice: val.extraPrice,
          });
        }
      });
    });

    const newCartItem: CartItem = {
      id: `${customizingItem.id}-${Date.now()}`,
      menuItemId: customizingItem.id,
      code: customizingItem.code,
      name: customizingItem.name,
      imageUrl: customizingItem.imageUrl,
      kitchenStation: customizingItem.kitchenStation,
      basePrice: customizingItem.price,
      unitPrice: customizedUnitPrice,
      quantity: customizingQuantity,
      note: customizingNote.trim() || undefined,
      selectedOptions: selectedList,
    };

    setCart([...cart, newCartItem]);
    setCustomizingItem(null);
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setTicketNote("");
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Submit Order to KDS
  const handleSubmitOrderToKitchen = async () => {
    if (!selectedTableId) {
      setNotification({ type: "error", message: "Vui lòng chọn bàn phục vụ." });
      return;
    }

    if (cart.length === 0) {
      setNotification({ type: "error", message: "Đơn hàng đang trống." });
      return;
    }

    try {
      setSubmittingOrder(true);

      let targetSession = currentSession;
      if (!targetSession) {
        targetSession = await api.openSession(selectedTableId, 2);
        setCurrentSession(targetSession);
      }

      const lines: StaffOrderLineRequest[] = cart.map((c) => ({
        menuItemId: c.menuItemId,
        quantity: c.quantity,
        note: c.note,
        selectedOptions: c.selectedOptions,
      }));

      await api.placeStaffOrder({
        sessionId: targetSession.id,
        note: ticketNote.trim() || undefined,
        lines,
      });

      setCart([]);
      setTicketNote("");

      const updatedSession = await api.getSessionById(targetSession.id);
      setCurrentSession(updatedSession);
      setActiveCartTab("history");

      setTables((prev) =>
        prev.map((t) => (t.id === selectedTableId ? { ...t, status: "Occupied" } : t))
      );

      setNotification({
        type: "success",
        message: `Đã gửi ${lines.length} món xuống Bếp/Bar cho bàn ${updatedSession.tableName}!`,
      });
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: "error", message: error.message || "Lỗi gửi đơn đến bếp." });
    } finally {
      setSubmittingOrder(false);
    }
  };

  // List of all valid lines in active session
  const allSessionLines = useMemo(() => {
    if (!currentSession) return [];
    return currentSession.tickets.flatMap((t) =>
      t.lines.filter((l) => l.status !== "Cancelled" && l.status !== "PendingConfirm")
    );
  }, [currentSession]);

  // List of occupied tables that can be merged
  const occupiedTablesForMerge = useMemo(() => {
    return tables.filter((t) => t.id !== selectedTableId && t.status === "Occupied");
  }, [tables, selectedTableId]);

  // Open Checkout Modal (STT 57, 61)
  const handleOpenCheckout = async () => {
    if (!currentSession) return;
    setIsCheckoutModalOpen(true);
    setCheckoutMode("full");
    setCheckoutSuccess(false);
    setSplitSelectedLineIds([]);
    setMergeSelectedSessionIds([]);
    setPaymentMethod("Cash");
    setReceivedCash(0);
    setCustomerName("");
    setCustomerPhone("");
    setVietQrInfo(null);
    setVoucherInput("");
    setVoucherMsg(null);

    try {
      setIsCreatingInvoice(true);
      const inv = await api.createInvoiceFromSession({
        sessionId: currentSession.id,
      });
      setActiveInvoice(inv);
      setReceivedCash(inv.finalAmount);

      // Load active promotions for quick apply (STT 60, 71)
      try {
        const promos = await api.getPromotions(activeBranchId, true);
        setActivePromosList(promos);
      } catch {
        // ignore
      }

      try {
        const qr = await api.getVietQr(inv.id);
        setVietQrInfo(qr);
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: "error", message: "Lỗi lập hóa đơn: " + error.message });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  // Apply Voucher / Promo Handler (STT 60, 71)
  const handleApplyVoucher = async (codeToUse?: string) => {
    if (!activeInvoice) return;
    const code = (codeToUse ?? voucherInput).trim().toUpperCase();
    if (!code) {
      setVoucherMsg({ type: "error", text: "Vui lòng nhập mã voucher." });
      return;
    }

    try {
      setIsApplyingVoucher(true);
      setVoucherMsg(null);
      const updatedInv = await api.applyPromoToInvoice(activeInvoice.id, {
        voucherCode: code,
      });
      setActiveInvoice(updatedInv);
      setReceivedCash(updatedInv.finalAmount);
      setVoucherInput(code);
      setVoucherMsg({
        type: "success",
        text: `Đã áp dụng mã ${code} (-${updatedInv.discountAmount.toLocaleString("vi-VN")}đ)`,
      });

      // Refresh VietQR
      try {
        const qr = await api.getVietQr(updatedInv.id);
        setVietQrInfo(qr);
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      const error = err as Error;
      setVoucherMsg({ type: "error", text: error.message || "Mã không hợp lệ hoặc không đủ điều kiện." });
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  // Split Bill Handler (STT 58)
  const handleGenerateSplitInvoice = async () => {
    if (!currentSession || splitSelectedLineIds.length === 0) return;
    try {
      setIsCreatingInvoice(true);
      const inv = await api.createInvoiceFromSession({
        sessionId: currentSession.id,
        selectedLineIds: splitSelectedLineIds,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
      });
      setActiveInvoice(inv);
      setReceivedCash(inv.finalAmount);
      try {
        const qr = await api.getVietQr(inv.id);
        setVietQrInfo(qr);
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: "error", message: "Lỗi tách hóa đơn: " + error.message });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  // Merge Tables Bill Handler (STT 58)
  const handleGenerateMergeInvoice = async () => {
    if (!currentSession || mergeSelectedSessionIds.length === 0) return;
    try {
      setIsCreatingInvoice(true);
      const allSessionIds = [currentSession.id, ...mergeSelectedSessionIds];
      const inv = await api.mergeTablesInvoice({
        branchId: activeBranchId,
        sessionIds: allSessionIds,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
      });
      setActiveInvoice(inv);
      setReceivedCash(inv.finalAmount);
      try {
        const qr = await api.getVietQr(inv.id);
        setVietQrInfo(qr);
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: "error", message: "Lỗi gộp hóa đơn: " + error.message });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  // Settle Payment Handler (STT 59, 61)
  const handleConfirmPayment = async () => {
    if (!activeInvoice) return;
    try {
      setIsSettlingPayment(true);
      const settled = await api.settlePayment({
        invoiceId: activeInvoice.id,
        payments: [
          {
            paymentMethod,
            amount: activeInvoice.finalAmount,
          },
        ],
        receivedCashAmount: paymentMethod === "Cash" ? receivedCash : activeInvoice.finalAmount,
        closeSessionAfterPayment: true,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
      });

      setActiveInvoice(settled);
      setCheckoutSuccess(true);
      setNotification({
        type: "success",
        message: `Thanh toán thành công hóa đơn ${settled.invoiceNumber} (${settled.finalAmount.toLocaleString("vi-VN")}đ)!`,
      });

      // Reload tables and clear current table session
      loadAllData();
      if (checkoutMode !== "split") {
        setCurrentSession(null);
      } else {
        // Reload current session after split payment
        if (currentSession) {
          api.getSessionById(currentSession.id).then(setCurrentSession).catch(() => setCurrentSession(null));
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: "error", message: "Lỗi thanh toán: " + error.message });
    } finally {
      setIsSettlingPayment(false);
    }
  };

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  // Check if current session has any pending QR tickets
  const pendingQrTickets = useMemo(() => {
    if (!currentSession) return [];
    return currentSession.tickets.filter(
      (t) => t.source === "CustomerQr" && t.lines.some((l) => l.status === "PendingConfirm")
    );
  }, [currentSession]);

  const getStationIcon = (station: string) => {
    switch (station) {
      case "Bar":
        return <Wine className="w-3.5 h-3.5 text-purple-400" />;
      case "Pastry":
        return <Cake className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PendingConfirm":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" /> Chờ xác nhận
          </span>
        );
      case "SentToKitchen":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" /> Đã gửi bếp
          </span>
        );
      case "Preparing":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <Flame className="w-3 h-3" /> Đang nấu
          </span>
        );
      case "Ready":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Sẵn sàng
          </span>
        );
      case "Served":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-700 text-stone-300 border border-stone-600 flex items-center gap-1">
            <Check className="w-3 h-3" /> Đã phục vụ
          </span>
        );
      case "Cancelled":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <X className="w-3 h-3" /> Đã từ chối
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-800 text-stone-400">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center text-stone-400">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <p className="text-sm font-medium">Đang tải hệ thống POS Order...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-stone-950 text-stone-100 overflow-hidden">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 ${
            notification.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/30"
              : "bg-rose-950/90 text-rose-200 border-rose-500/30"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header: Table Selector & Session Info Bar */}
      <header className="bg-stone-900/90 border-b border-stone-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-400">BÀN ORDER:</span>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="bg-stone-950 border border-amber-500/40 text-amber-300 font-bold text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer shadow-sm"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || t.code} ({t.areaName || "Khu vực"}) -{" "}
                  {t.status === "Occupied" ? "🔴 Đang có khách" : "🟢 Bàn trống"}
                </option>
              ))}
            </select>
          </div>

          {selectedTable && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400 bg-stone-950/60 px-3 py-1.5 rounded-lg border border-stone-800">
              <Users className="w-3.5 h-3.5 text-amber-500" />
              <span>Sức chứa: {selectedTable.capacity} người</span>
              <span className="text-stone-600">|</span>
              <span>{selectedTable.areaName}</span>
            </div>
          )}
        </div>

        {/* Notifications & Session Status */}
        <div className="flex items-center gap-3">
          {/* Realtime Notification Bell (STT 95) */}
          <button
            onClick={() => setIsNotifDrawerOpen(!isNotifDrawerOpen)}
            className="relative p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition shadow-sm flex items-center gap-1.5 text-xs font-bold"
            title="Thông báo phục vụ & thanh toán từ bàn"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Thông báo</span>
            {notifications.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {sessionLoading ? (
            <div className="flex items-center gap-2 text-xs text-amber-400 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang cập nhật phiên...
            </div>
          ) : currentSession ? (
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {currentSession.sessionCode}
                </div>
                <div className="text-[11px] text-stone-400">
                  {currentSession.guestCount} khách • Mở lúc:{" "}
                  {new Date(currentSession.openedAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <button
                onClick={handleCloseSession}
                disabled={closingSession}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-rose-900/60 text-stone-300 hover:text-rose-200 border border-stone-700 hover:border-rose-500/40 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
                title="Đóng phiên phục vụ & dọn bàn"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Kết thúc bàn</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 hidden sm:inline">Bàn chưa mở phiên:</span>
              <button
                onClick={() => handleOpenNewSession(2)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Mở bàn phục vụ</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Realtime Notification Ticker across All Tables */}
      {notifications.length > 0 && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-amber-300 font-bold shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Có {notifications.length} yêu cầu mới từ bàn:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setSelectedTableId(n.tableId);
                  handleDismissNotification(n.id);
                  setActiveCartTab("history");
                }}
                className="px-3 py-1 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-stone-200 text-xs flex items-center gap-1.5 shrink-0 transition"
              >
                <span className="font-bold text-amber-400">[{n.tableName || n.tableCode}]</span>
                <span className="text-stone-300 max-w-xs truncate">{n.message}</span>
                <span className="text-[10px] bg-amber-500 text-stone-950 font-bold px-1.5 py-0.5 rounded">
                  Xử lý →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STT 24 Alert: Pending Confirm QR Orders on Current Table */}
      {pendingQrTickets.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-3 text-amber-300 text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>
              Bàn này có {pendingQrTickets.length} đợt đặt món từ khách quét QR đang chờ xác nhận!
            </span>
          </div>
          <button
            onClick={() => setActiveCartTab("history")}
            className="px-3 py-1 rounded-lg bg-amber-500 text-stone-950 text-xs font-black shadow-sm"
          >
            Xem & Duyệt ngay
          </button>
        </div>
      )}

      {/* Mobile Switcher Toolbar (lg:hidden) */}
      <div className="lg:hidden bg-stone-900 border-b border-stone-800 p-2 flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setMobilePosView("menu")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobilePosView === "menu"
              ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
              : "bg-stone-950 text-stone-400 border border-stone-800"
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Thực đơn ({filteredMenuItems.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobilePosView("cart")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 relative ${
            mobilePosView === "cart"
              ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
              : "bg-stone-950 text-stone-400 border border-stone-800"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Giỏ & Bàn ({cartItemsCount + (currentSession?.totalItemsCount || 0)})</span>
          {cartItemsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1.5 right-2" />
          )}
        </button>
      </div>

      {/* Main Dual View Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* ============================================================== */}
        {/* LEFT COLUMN: Food Menu Grid & Search (65% width)               */}
        {/* ============================================================== */}
        <section className={`flex-1 flex flex-col border-r border-stone-800 bg-stone-950 overflow-hidden ${
          mobilePosView === "cart" ? "hidden lg:flex" : "flex"
        }`}>
          {/* Categories & Search Bar */}
          <div className="p-3 border-b border-stone-800/80 bg-stone-900/40 flex flex-col sm:flex-row items-center gap-3">
            {/* Search Box */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder="Tìm món, mã món..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-8 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Chips Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategoryId("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategoryId === "ALL"
                    ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-bold"
                    : "bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800"
                }`}
              >
                Tất cả ({menuItems.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategoryId === cat.id
                      ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-bold"
                      : "bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Food Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredMenuItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="group bg-stone-900/90 hover:bg-stone-850 rounded-2xl border border-stone-800/80 hover:border-amber-500/50 p-2.5 flex flex-col justify-between transition-all duration-150 cursor-pointer hover:shadow-xl hover:shadow-amber-500/5 select-none relative overflow-hidden"
              >
                {/* Food Image */}
                <div className="aspect-[4/3] w-full rounded-xl bg-stone-950 overflow-hidden relative mb-2">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-700">
                      <UtensilsCrossed className="w-8 h-8" />
                    </div>
                  )}

                  {/* Kitchen Station Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-stone-950/80 backdrop-blur-sm border border-stone-700/50 flex items-center gap-1 text-[10px] font-semibold text-stone-300">
                    {getStationIcon(item.kitchenStation)}
                    <span>{item.kitchenStation === "Bar" ? "Bar" : item.kitchenStation === "Pastry" ? "Bánh" : "Bếp"}</span>
                  </div>

                  {/* Options indicator */}
                  {item.optionCount > 0 && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-amber-500/90 text-stone-950 text-[10px] font-bold shadow-sm">
                      +{item.optionCount} tùy chọn
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono text-amber-500/80">{item.code}</span>
                    <span className="text-[10px] text-stone-500">{item.unit || "Phần"}</span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-100 group-hover:text-amber-400 line-clamp-1 transition-colors">
                    {item.name}
                  </h4>
                </div>

                {/* Price & Add button */}
                <div className="mt-2.5 pt-2 border-t border-stone-800/80 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-400 font-mono">
                    {item.price.toLocaleString("vi-VN")}đ
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addDirectToCart(item);
                    }}
                    className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-amber-500 text-stone-400 hover:text-stone-950 flex items-center justify-center transition-colors shadow-sm"
                    title="Thêm nhanh 1 phần"
                  >
                    <Plus className="w-3.5 h-3.5 font-bold" />
                  </button>
                </div>
              </div>
            ))}

            {filteredMenuItems.length === 0 && (
              <div className="col-span-full h-48 flex flex-col items-center justify-center text-stone-500">
                <UtensilsCrossed className="w-8 h-8 mb-2 stroke-[1.5]" />
                <p className="text-xs">Không tìm thấy món ăn nào phù hợp.</p>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: Live Cart & Session Tickets (35% width)         */}
        {/* ============================================================== */}
        <aside className={`w-full lg:w-[400px] xl:w-[440px] flex flex-col bg-stone-900/70 border-t lg:border-t-0 lg:border-l border-stone-800 shrink-0 overflow-hidden ${
          mobilePosView === "menu" ? "hidden lg:flex" : "flex flex-1"
        }`}>
          {/* Cart Header Tabs */}
          <div className="p-2 border-b border-stone-800 bg-stone-900/90 flex items-center gap-2">
            <button
              onClick={() => setActiveCartTab("current")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeCartTab === "current"
                  ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                  : "text-stone-400 hover:text-stone-200 bg-stone-950/40"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Món đang chọn</span>
              {cartItemsCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeCartTab === "current" ? "bg-stone-950 text-amber-400" : "bg-amber-500 text-stone-950"
                  }`}
                >
                  {cartItemsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveCartTab("history")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 relative ${
                activeCartTab === "history"
                  ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                  : "text-stone-400 hover:text-stone-200 bg-stone-950/40"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Đã gọi bàn ({currentSession?.totalItemsCount || 0})</span>
              {pendingQrTickets.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>
          </div>

          {/* TAB 1: CURRENT LIVE CART */}
          {activeCartTab === "current" && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Cart List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 flex flex-col gap-1.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-amber-500">{item.code}</span>
                          <h5 className="text-xs font-bold text-stone-100 truncate">{item.name}</h5>
                        </div>

                        {/* Options badge list */}
                        {item.selectedOptions.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.selectedOptions.map((opt, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-stone-800 text-amber-300 text-[10px]"
                              >
                                {opt.optionName}: {opt.valueName}
                                {opt.extraPrice > 0 && ` (+${opt.extraPrice.toLocaleString("vi-VN")}đ)`}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.note && (
                          <p className="text-[11px] text-amber-400/90 italic mt-0.5">
                            *Ghi chú: {item.note}
                          </p>
                        )}
                      </div>

                      {/* Line Total */}
                      <span className="text-xs font-bold text-amber-400 font-mono shrink-0">
                        {(item.unitPrice * item.quantity).toLocaleString("vi-VN")}đ
                      </span>
                    </div>

                    {/* Stepper & Delete */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-stone-800/60">
                      <span className="text-[11px] text-stone-500 font-mono">
                        {item.unitPrice.toLocaleString("vi-VN")}đ / món
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-400 flex items-center justify-center text-xs ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="h-48 flex flex-col items-center justify-center text-stone-500">
                    <ShoppingCart className="w-8 h-8 mb-2 stroke-[1.5] text-stone-600" />
                    <p className="text-xs">Chưa có món nào được chọn.</p>
                    <p className="text-[11px] text-stone-600 mt-1">
                      Chạm vào món ăn ở thực đơn bên trái để chọn.
                    </p>
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              <div className="p-3 border-t border-stone-800 bg-stone-900/90 space-y-2.5">
                {/* Order Ticket Note */}
                <input
                  type="text"
                  placeholder="Ghi chú đợt gọi (VD: Khách ăn vội, làm trước canh...)"
                  value={ticketNote}
                  onChange={(e) => setTicketNote(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />

                {/* Total Summary */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Tạm tính đợt này ({cartItemsCount} món):</span>
                  <span className="text-base font-extrabold text-amber-400 font-mono">
                    {cartTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-300 text-xs font-semibold transition-colors"
                  >
                    Xóa
                  </button>

                  <button
                    onClick={handleSubmitOrderToKitchen}
                    disabled={cart.length === 0 || submittingOrder}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-stone-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {submittingOrder ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang gửi sang Bếp...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>GỬI BẾP (Gửi KDS)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SESSION TICKETS HISTORY & STT 24 CONFIRMATION */}
          {activeCartTab === "history" && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {currentSession && currentSession.tickets.length > 0 ? (
                  currentSession.tickets.map((ticket) => {
                    const isPendingQr =
                      ticket.source === "CustomerQr" &&
                      ticket.lines.some((l) => l.status === "PendingConfirm");

                    return (
                      <div
                        key={ticket.id}
                        className={`rounded-xl border p-3 flex flex-col gap-2 ${
                          isPendingQr
                            ? "bg-amber-950/40 border-amber-500/50 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30"
                            : "bg-stone-950 border-stone-800"
                        }`}
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-stone-800/80">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                              Đợt #{ticket.ticketNumber}
                            </span>
                            <span className="text-[11px] text-stone-400">
                              {new Date(ticket.orderedAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-stone-400">
                            {ticket.source === "StaffAssisted" ? "👨‍💼 NV ghi món" : "📱 Khách quét QR"}
                          </span>
                        </div>

                        {/* Ticket Lines */}
                        <div className="space-y-1.5">
                          {ticket.lines.map((line) => (
                            <div key={line.id} className="flex items-start justify-between gap-2 text-xs">
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-stone-200">
                                    {line.quantity}x {line.itemName}
                                  </span>
                                </div>
                                {line.selectedOptionsText && (
                                  <p className="text-[10px] text-stone-400 mt-0.5">
                                    {line.selectedOptionsText}
                                  </p>
                                )}
                                {line.note && (
                                  <p className="text-[10px] text-amber-400/90 italic">* {line.note}</p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="font-mono text-stone-300">
                                  {line.totalPrice.toLocaleString("vi-VN")}đ
                                </span>
                                {getStatusBadge(line.status)}
                              </div>
                            </div>
                          ))}
                        </div>

                        {ticket.note && (
                          <p className="text-[11px] text-amber-400 italic bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                            Ghi chú: {ticket.note}
                          </p>
                        )}

                        {/* STT 24: Action bar for PendingConfirm QR orders */}
                        {isPendingQr && (
                          <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center gap-2">
                            <button
                              onClick={() => setRejectingTicketId(ticket.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Từ chối</span>
                            </button>

                            <button
                              onClick={() => handleConfirmQrTicket(ticket.id)}
                              disabled={confirmingTicketId === ticket.id}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-stone-950 text-[11px] font-black shadow-md transition flex items-center justify-center gap-1"
                            >
                              {confirmingTicketId === ticket.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCheck className="w-3.5 h-3.5" />
                              )}
                              <span>Xác nhận & Gửi Bếp</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-stone-500">
                    <History className="w-8 h-8 mb-2 stroke-[1.5] text-stone-600" />
                    <p className="text-xs">Bàn này chưa gửi đợt món nào.</p>
                  </div>
                )}
              </div>

              {/* Total Session Bill Footer */}
              {currentSession && (
                <div className="p-3 border-t border-stone-800 bg-stone-900/95 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-stone-400 block">
                        Tổng tiền bàn ({currentSession.totalItemsCount} món):
                      </span>
                      <span className="text-lg font-extrabold text-emerald-400 font-mono">
                        {currentSession.totalAmount.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveCartTab("current")}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700 transition"
                    >
                      + Gọi thêm
                    </button>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={handleOpenCheckout}
                    disabled={currentSession.totalItemsCount === 0}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-stone-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>THANH TOÁN HÓA ĐƠN (STT 57-61)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Floating Bottom Bar on Mobile when items are in cart */}
      {mobilePosView === "menu" && cartItemsCount > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-4">
          <button
            type="button"
            onClick={() => setMobilePosView("cart")}
            className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm flex items-center justify-between shadow-2xl shadow-amber-500/40 border border-amber-400/50 active:scale-[0.98] transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-stone-950 text-amber-400 text-xs flex items-center justify-center font-bold">
                {cartItemsCount}
              </div>
              <span>Xem giỏ & Gửi Bếp</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-sm">
              <span>{cartTotal.toLocaleString("vi-VN")}đ</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* DRAWER: REALTIME NOTIFICATIONS (STT 95, 27, 28)                */}
      {/* ============================================================== */}
      {isNotifDrawerOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-end backdrop-blur-sm">
          <div className="bg-stone-900 border-l border-stone-800 w-full max-w-sm h-full flex flex-col p-4 space-y-4 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Yêu cầu từ bàn phục vụ</h3>
              </div>
              <button onClick={() => setIsNotifDrawerOpen(false)} className="text-stone-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border flex flex-col gap-2 ${
                    n.type === "RequestBill"
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                      : "bg-stone-950 border-stone-800 text-stone-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-400">
                      {n.tableName || n.tableCode} ({n.areaName})
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(n.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-xs font-semibold leading-snug">{n.message}</p>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleDismissNotification(n.id)}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold transition flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Đã xử lý xong</span>
                    </button>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="h-48 flex flex-col items-center justify-center text-stone-500 text-center">
                  <Bell className="w-8 h-8 mb-2 text-stone-600 stroke-[1.5]" />
                  <p className="text-xs">Không có yêu cầu phục vụ nào đang chờ.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REJECT QR TICKET (STT 24)                               */}
      {/* ============================================================== */}
      {rejectingTicketId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-white">Từ chối đợt đặt món của khách QR</h3>
            <p className="text-xs text-stone-400">Vui lòng chọn hoặc nhập lý do từ chối:</p>

            <div className="space-y-2">
              {[
                "Bếp hết nguyên liệu",
                "Món tạm ngưng phục vụ",
                "Khách gọi nhầm bàn",
                "Khách yêu cầu hủy",
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className={`w-full p-2 rounded-xl text-xs text-left border transition ${
                    rejectReason === reason
                      ? "bg-rose-500/20 text-rose-300 border-rose-500 font-bold"
                      : "bg-stone-950 border-stone-800 text-stone-300"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRejectingTicketId(null)}
                className="flex-1 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectQrTicket}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CHECKOUT, SPLIT, MERGE & SETTLEMENT (STT 57, 58, 59, 61) */}
      {/* ============================================================== */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-emerald-500/20">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    THANH TOÁN HÓA ĐƠN
                    {activeInvoice && (
                      <span className="font-mono text-amber-400">#{activeInvoice.invoiceNumber}</span>
                    )}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Bàn: <strong className="text-stone-200">{activeInvoice?.tableCodeSnapshot || currentSession?.tableName}</strong> • {currentSession?.areaName || "Sảnh"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {checkoutSuccess && (
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In Phiếu (80mm)</span>
                  </button>
                )}

                <button
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subheader Modes Switcher (Toàn bộ / Tách bill / Gộp bàn) */}
            {!checkoutSuccess && (
              <div className="bg-stone-950/70 border-b border-stone-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs">
                  <button
                    onClick={() => {
                      setCheckoutMode("full");
                      handleOpenCheckout();
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      checkoutMode === "full"
                        ? "bg-amber-500 text-stone-950 shadow-sm"
                        : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    Thanh toán cả bàn
                  </button>
                  <button
                    onClick={() => setCheckoutMode("split")}
                    className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                      checkoutMode === "split"
                        ? "bg-amber-500 text-stone-950 shadow-sm"
                        : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    <Split className="w-3 h-3" />
                    <span>Tách hóa đơn (STT 58)</span>
                  </button>
                  <button
                    onClick={() => setCheckoutMode("merge")}
                    className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                      checkoutMode === "merge"
                        ? "bg-amber-500 text-stone-950 shadow-sm"
                        : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    <Merge className="w-3 h-3" />
                    <span>Gộp bàn (STT 58)</span>
                  </button>
                </div>

                <span className="text-[11px] text-stone-400 font-mono">
                  Thu ngân: <strong className="text-amber-400">{user?.displayName || "Nhân viên"}</strong>
                </span>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-stone-950/40">
              {isCreatingInvoice ? (
                <div className="col-span-12 h-64 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                  <p className="text-xs text-stone-400">Đang tổng hợp món và tính thuế/phí...</p>
                </div>
              ) : checkoutSuccess && activeInvoice ? (
                /* ============================================== */
                /* PAYMENT SUCCESS SCREEN & RECEIPT PREVIEW       */
                /* ============================================== */
                <div className="col-span-12 flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">THANH TOÁN THÀNH CÔNG!</h3>
                    <p className="text-xs text-stone-400 mt-1">
                      Hóa đơn <strong className="text-amber-400 font-mono">#{activeInvoice.invoiceNumber}</strong> đã được thu đủ tiền ({activeInvoice.finalAmount.toLocaleString("vi-VN")}đ).
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Bàn <strong className="text-stone-300">{activeInvoice.tableCodeSnapshot}</strong> đã chuyển sang trạng thái chờ dọn dẹp.
                    </p>
                  </div>

                  {activeInvoice.changeAmount > 0 && (
                    <div className="bg-emerald-950/60 border border-emerald-500/30 p-3 rounded-2xl w-full text-center">
                      <span className="text-xs text-emerald-300 uppercase tracking-wider block font-semibold">
                        Tiền thừa trả khách:
                      </span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {activeInvoice.changeAmount.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2 w-full">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>In Hóa đơn</span>
                    </button>
                    <button
                      onClick={() => setIsCheckoutModalOpen(false)}
                      className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold shadow-lg transition"
                    >
                      Hoàn tất & Tiếp tục
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Left Column: Order Items & Mode Selection */}
                  <div className="md:col-span-7 space-y-4">
                    {/* MODE 1: SPLIT BILL (STT 58) */}
                    {checkoutMode === "split" && (
                      <div className="bg-stone-900 border border-amber-500/30 p-3.5 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <Split className="w-4 h-4" />
                            <span>Tách bill: Chọn món cần thanh toán riêng đợt này</span>
                          </h4>
                          <span className="text-[11px] text-stone-400 font-mono">
                            Đã chọn: {splitSelectedLineIds.length}/{allSessionLines.length} món
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {allSessionLines.map((line) => {
                            const isSelected = splitSelectedLineIds.includes(line.id);
                            return (
                              <button
                                key={line.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSplitSelectedLineIds((prev) => prev.filter((id) => id !== line.id));
                                  } else {
                                    setSplitSelectedLineIds((prev) => [...prev, line.id]);
                                  }
                                }}
                                className={`w-full p-2 rounded-xl text-xs border text-left flex items-center justify-between transition ${
                                  isSelected
                                    ? "bg-amber-500/15 border-amber-500 text-amber-300"
                                    : "bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-stone-600 flex-shrink-0" />
                                  )}
                                  <div>
                                    <span className="font-bold text-white">
                                      x{line.quantity} {line.itemName}
                                    </span>
                                    {line.selectedOptionsText && (
                                      <p className="text-[10px] text-stone-500">{line.selectedOptionsText}</p>
                                    )}
                                  </div>
                                </div>
                                <span className="font-mono font-bold text-stone-200">
                                  {(line.unitPrice * line.quantity).toLocaleString("vi-VN")}đ
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={handleGenerateSplitInvoice}
                          disabled={splitSelectedLineIds.length === 0}
                          className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 text-xs font-bold transition shadow"
                        >
                          Tạo hóa đơn cho các món đã chọn ({splitSelectedLineIds.length} món)
                        </button>
                      </div>
                    )}

                    {/* MODE 2: MERGE TABLES (STT 58) */}
                    {checkoutMode === "merge" && (
                      <div className="bg-stone-900 border border-purple-500/30 p-3.5 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                            <Merge className="w-4 h-4" />
                            <span>Gộp bàn: Chọn các bàn khác để gộp chung hóa đơn</span>
                          </h4>
                          <span className="text-[11px] text-stone-400">
                            Bàn gốc: <strong className="text-white">{selectedTable?.code}</strong>
                          </span>
                        </div>

                        {occupiedTablesForMerge.length === 0 ? (
                          <p className="text-xs text-stone-500 py-3 text-center">
                            Không có bàn nào khác đang có khách trong chi nhánh.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {occupiedTablesForMerge.map((tbl) => {
                              // We find the session id for this table from table session detail or tables
                              const isSelected = mergeSelectedSessionIds.includes(tbl.id);
                              return (
                                <button
                                  key={tbl.id}
                                  type="button"
                                  onClick={async () => {
                                    if (isSelected) {
                                      setMergeSelectedSessionIds((prev) => prev.filter((id) => id !== tbl.id));
                                    } else {
                                      // Get active session id of this table
                                      try {
                                        const tblSess = await api.getSessionByTable(tbl.id);
                                        if (tblSess) {
                                          setMergeSelectedSessionIds((prev) => [...prev, tblSess.id]);
                                        }
                                      } catch {
                                        // ignore
                                      }
                                    }
                                  }}
                                  className={`p-2.5 rounded-xl text-xs border text-left flex items-center justify-between transition ${
                                    isSelected
                                      ? "bg-purple-500/20 border-purple-500 text-purple-300 font-bold"
                                      : "bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700"
                                  }`}
                                >
                                  <div>
                                    <span className="font-bold text-white block">{tbl.code}</span>
                                    <span className="text-[10px] text-stone-500">{tbl.name}</span>
                                  </div>
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-purple-400" />
                                  ) : (
                                    <Square className="w-4 h-4 text-stone-600" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleGenerateMergeInvoice}
                          disabled={mergeSelectedSessionIds.length === 0}
                          className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold transition shadow"
                        >
                          Gộp các bàn đã chọn thành 1 hóa đơn ({mergeSelectedSessionIds.length + 1} bàn)
                        </button>
                      </div>
                    )}

                    {/* Invoice Lines Table */}
                    {activeInvoice && (
                      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                          <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                            Danh sách món trong hóa đơn ({activeInvoice.lines.length})
                          </span>
                          <span className="text-xs font-mono text-stone-400">
                            Bàn: <strong className="text-white">{activeInvoice.tableCodeSnapshot}</strong>
                          </span>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {activeInvoice.lines.map((line) => (
                            <div
                              key={line.id}
                              className="flex items-start justify-between text-xs py-1 border-b border-stone-800/40 last:border-0"
                            >
                              <div className="flex-1">
                                <div className="font-bold text-stone-200">
                                  {line.quantity}x {line.itemName}
                                </div>
                                {line.selectedOptionsText && (
                                  <p className="text-[10px] text-stone-500">{line.selectedOptionsText}</p>
                                )}
                                {line.note && (
                                  <p className="text-[10px] text-amber-400/90 italic">* {line.note}</p>
                                )}
                              </div>
                              <div className="text-right font-mono">
                                <span className="font-bold text-stone-100">
                                  {line.totalPrice.toLocaleString("vi-VN")}đ
                                </span>
                                <span className="block text-[10px] text-stone-500">
                                  ({line.unitPrice.toLocaleString("vi-VN")}đ/món)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customer info (Optional) */}
                    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 space-y-2">
                      <span className="text-xs font-bold text-stone-300 block">Thông tin khách hàng (Tùy chọn)</span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Tên khách hàng"
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
                        />
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Số điện thoại"
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* VOUCHER & KHUYẾN MÃI (STT 60, 65, 66, 71) */}
                    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <Tag className="w-4 h-4" />
                          <span>Mã giảm giá & Khuyến mãi (STT 60, 71)</span>
                        </span>
                        {activeInvoice?.voucherCode && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold border border-amber-500/30">
                            Đã áp dụng: {activeInvoice.voucherCode}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={voucherInput}
                          onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                          placeholder="Nhập mã voucher (VD: PUMOPEN, GIAM50K)..."
                          className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-amber-400 placeholder-stone-600 focus:outline-none focus:border-amber-500 uppercase"
                        />
                        <button
                          type="button"
                          disabled={isApplyingVoucher || !voucherInput.trim()}
                          onClick={() => handleApplyVoucher()}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 text-xs font-bold transition shadow"
                        >
                          {isApplyingVoucher ? "..." : "Áp dụng"}
                        </button>
                      </div>

                      {/* Voucher Message Feedback */}
                      {voucherMsg && (
                        <div
                          className={`p-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5 ${
                            voucherMsg.type === "success"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {voucherMsg.type === "success" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                          <span>{voucherMsg.text}</span>
                        </div>
                      )}

                      {/* Suggestions: Quick Apply Active Promotions */}
                      {activePromosList.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] text-stone-400 block font-semibold">
                            Gợi ý chương trình đang diễn ra:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {activePromosList.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleApplyVoucher(p.code || p.name)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border text-left flex items-center gap-1 transition ${
                                  activeInvoice?.voucherCode === p.code
                                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                                    : "bg-stone-950 border-stone-800 text-stone-300 hover:border-amber-500/40"
                                }`}
                              >
                                {p.isAutoApply ? <Zap className="w-3 h-3 text-emerald-400" /> : <Gift className="w-3 h-3 text-amber-400" />}
                                <span>{p.code ? p.code : p.name}</span>
                                <span className="font-mono text-stone-400">
                                  ({p.discountType === "Percent" ? `-${p.discountValue}%` : `-${p.discountValue.toLocaleString("vi-VN")}đ`})
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Calculations & Payment Tender */}
                  {activeInvoice && (
                    <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
                      {/* Financial Breakdown (STT 61) */}
                      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2.5 text-xs">
                        <div className="flex justify-between text-stone-400">
                          <span>Tạm tính (Tiền món):</span>
                          <span className="font-mono text-stone-200 font-bold">
                            {activeInvoice.subTotalAmount.toLocaleString("vi-VN")}đ
                          </span>
                        </div>

                        {activeInvoice.discountAmount > 0 && (
                          <div className="flex justify-between text-rose-400 font-semibold">
                            <span>Giảm giá / Chiết khấu:</span>
                            <span className="font-mono">
                              -{activeInvoice.discountAmount.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        )}

                        {activeInvoice.serviceChargeAmount > 0 && (
                          <div className="flex justify-between text-stone-400">
                            <span>Phí dịch vụ ({activeInvoice.serviceChargePercent}%):</span>
                            <span className="font-mono text-stone-200">
                              +{activeInvoice.serviceChargeAmount.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        )}

                        {activeInvoice.taxAmount > 0 && (
                          <div className="flex justify-between text-stone-400">
                            <span>Thuế VAT ({activeInvoice.taxRatePercent}%):</span>
                            <span className="font-mono text-stone-200">
                              +{activeInvoice.taxAmount.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-stone-800 flex items-baseline justify-between">
                          <span className="text-sm font-extrabold text-white uppercase">TỔNG CỘNG:</span>
                          <span className="text-xl font-black text-emerald-400 font-mono">
                            {activeInvoice.finalAmount.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      </div>

                      {/* Payment Methods Selection (STT 59) */}
                      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3">
                        <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                          Phương thức thanh toán (STT 59)
                        </span>

                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "Cash", label: "Tiền mặt", icon: DollarSign, color: "text-emerald-400" },
                            { id: "BankTransfer", label: "VietQR / CK", icon: QrCode, color: "text-sky-400" },
                            { id: "VNPay", label: "Cổng VNPay", icon: CreditCard, color: "text-sky-300" },
                            { id: "MoMo", label: "Ví MoMo", icon: Smartphone, color: "text-pink-400" },
                            { id: "CardPos", label: "Thẻ POS", icon: CreditCard, color: "text-purple-400" },
                            { id: "EWallet", label: "Ví ZaloPay", icon: Smartphone, color: "text-blue-400" },
                          ].map((pm) => {
                            const Icon = pm.icon;
                            const isSelected = paymentMethod === pm.id;
                            return (
                              <button
                                key={pm.id}
                                type="button"
                                onClick={async () => {
                                  setPaymentMethod(pm.id as any);
                                  if (pm.id === "VNPay" && activeInvoice) {
                                    try {
                                      setIsGeneratingGatewayUrl(true);
                                      const res = await api.createVNPayUrl({ invoiceId: activeInvoice.id });
                                      setVnpayUrl(res.paymentUrl);
                                    } catch {
                                      // ignore
                                    } finally {
                                      setIsGeneratingGatewayUrl(false);
                                    }
                                  } else if (pm.id === "MoMo" && activeInvoice) {
                                    try {
                                      setIsGeneratingGatewayUrl(true);
                                      const res = await api.createMoMoUrl({ invoiceId: activeInvoice.id });
                                      setMomoQrUrl(res.qrCodeUrl || null);
                                    } catch {
                                      // ignore
                                    } finally {
                                      setIsGeneratingGatewayUrl(false);
                                    }
                                  }
                                }}
                                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                                  isSelected
                                    ? "bg-amber-500 text-stone-950 border-amber-500 shadow-md"
                                    : "bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700"
                                }`}
                              >
                                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-stone-950" : pm.color}`} />
                                <span className="truncate">{pm.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Method Specific UI */}
                        {paymentMethod === "Cash" && (
                          <div className="space-y-2 pt-2 border-t border-stone-800">
                            <label className="text-[11px] text-stone-400 block font-semibold">
                              Tiền mặt khách đưa:
                            </label>
                            <input
                              type="number"
                              value={receivedCash || ""}
                              onChange={(e) => setReceivedCash(Number(e.target.value))}
                              placeholder="Nhập số tiền..."
                              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                            />

                            {/* Quick cash denomination buttons */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {[
                                { label: "Đủ tiền", val: activeInvoice.finalAmount },
                                { label: "100k", val: 100000 },
                                { label: "200k", val: 200000 },
                                { label: "500k", val: 500000 },
                                { label: "1 triệu", val: 1000000 },
                              ].map((btn) => (
                                <button
                                  key={btn.label}
                                  type="button"
                                  onClick={() => setReceivedCash(btn.val)}
                                  className="px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-800 hover:border-stone-700 text-stone-300 text-[11px] font-mono font-semibold"
                                >
                                  {btn.label}
                                </button>
                              ))}
                            </div>

                            {/* Change amount calculation */}
                            <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 flex items-center justify-between">
                              <span className="text-xs text-stone-400">Tiền thừa trả khách:</span>
                              <span className="text-base font-black text-amber-400 font-mono">
                                {Math.max(0, receivedCash - activeInvoice.finalAmount).toLocaleString("vi-VN")}đ
                              </span>
                            </div>
                          </div>
                        )}

                        {paymentMethod === "BankTransfer" && vietQrInfo && (
                          <div className="space-y-2 pt-2 border-t border-stone-800 text-center">
                            <p className="text-[11px] text-stone-300 font-semibold">
                              Quét mã VietQR chuyển khoản chính xác số tiền:
                            </p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={vietQrInfo.qrUrl}
                              alt="VietQR"
                              className="w-36 h-36 mx-auto rounded-xl border border-stone-700 shadow-lg"
                            />
                            <div className="text-[10px] text-stone-400 font-mono">
                              <div>{vietQrInfo.bankCode} • STK: {vietQrInfo.accountNo}</div>
                              <div>Nội dung: <strong className="text-amber-400">{vietQrInfo.description}</strong></div>
                            </div>
                          </div>
                        )}

                        {/* VNPay Gateway UI (STT 102) */}
                        {paymentMethod === "VNPay" && (
                          <div className="space-y-3 pt-2 border-t border-stone-800 text-center">
                            <p className="text-[11px] text-stone-300 font-semibold">
                              Cổng thanh toán điện tử VNPay (VNPAY-QR / Thẻ ATM / Visa):
                            </p>
                            {isGeneratingGatewayUrl ? (
                              <div className="py-4">
                                <RefreshCw className="w-6 h-6 animate-spin text-sky-400 mx-auto mb-1" />
                                <span className="text-[11px] text-stone-400">Đang khởi tạo cổng VNPay...</span>
                              </div>
                            ) : vnpayUrl ? (
                              <div className="space-y-2">
                                <a
                                  href={vnpayUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-stone-950 font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
                                >
                                  <CreditCard className="w-4 h-4" />
                                  <span>Mở Cổng Thanh Toán VNPay ↗</span>
                                </a>
                                <p className="text-[10px] text-stone-500">
                                  Hệ thống sẽ tự động đóng bàn khi nhận được phản hồi IPN từ VNPay.
                                </p>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!activeInvoice) return;
                                  setIsGeneratingGatewayUrl(true);
                                  try {
                                    const res = await api.createVNPayUrl({ invoiceId: activeInvoice.id });
                                    setVnpayUrl(res.paymentUrl);
                                  } catch {
                                    // ignore
                                  } finally {
                                    setIsGeneratingGatewayUrl(false);
                                  }
                                }}
                                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
                              >
                                Tạo liên kết VNPay
                              </button>
                            )}
                          </div>
                        )}

                        {/* MoMo Gateway UI (STT 102) */}
                        {paymentMethod === "MoMo" && (
                          <div className="space-y-2 pt-2 border-t border-stone-800 text-center">
                            <p className="text-[11px] text-stone-300 font-semibold">
                              Quét mã Ví MoMo để thanh toán:
                            </p>
                            {momoQrUrl && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={momoQrUrl}
                                alt="MoMo QR"
                                className="w-36 h-36 mx-auto rounded-xl border border-pink-500/40 shadow-lg"
                              />
                            )}
                            <p className="text-[10px] text-stone-400">
                              Mở App MoMo quét mã QR trên hoặc bấm Xác nhận thu tiền bên dưới.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Settle Action Button */}
                      <button
                        type="button"
                        disabled={isSettlingPayment}
                        onClick={handleConfirmPayment}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-stone-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        {isSettlingPayment ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Đang xử lý thanh toán...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>XÁC NHẬN THU TIỀN & ĐÓNG BÀN</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/* MODAL: CUSTOMIZE ITEM OPTIONS & TOPPINGS                       */}
      {/* ============================================================== */}
      {customizingItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-800 flex items-start justify-between gap-3 bg-stone-950/60">
              <div className="flex items-center gap-3">
                {customizingItem.imageUrl && (
                  <img
                    src={customizingItem.imageUrl}
                    alt={customizingItem.name}
                    className="w-12 h-12 rounded-xl object-cover border border-stone-800"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-amber-500">{customizingItem.code}</span>
                    <h3 className="text-sm font-bold text-stone-100">{customizingItem.name}</h3>
                  </div>
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    Giá gốc: {customizingItem.price.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Option Groups & Details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Detailed Description */}
              {customizingItem.description && (
                <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/80 text-xs text-stone-300 leading-relaxed">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1">Mô tả & Thành phần:</div>
                  {customizingItem.description}
                </div>
              )}

              {customizingItem.options.map((opt) => {
                const selectedValIds = optionSelections[opt.id] || [];
                return (
                  <div
                    key={opt.id}
                    className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                        <span>{opt.name}</span>
                        {opt.isRequired && (
                          <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded font-medium">
                            Bắt buộc
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] text-stone-500">
                        {opt.optionType === "Single" ? "Chọn 1" : "Chọn nhiều"}
                      </span>
                    </div>

                    {/* Values Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {opt.values.map((val) => {
                        const isSelected = selectedValIds.includes(val.id);
                        return (
                          <button
                            key={val.id}
                            type="button"
                            onClick={() => handleOptionToggle(opt.id, val.id, opt.optionType)}
                            className={`p-2 rounded-xl text-xs font-medium border flex items-center justify-between transition-all ${
                              isSelected
                                ? "bg-amber-500/10 border-amber-500 text-amber-300 font-bold"
                                : "bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200"
                            }`}
                          >
                            <span>{val.name}</span>
                            {val.extraPrice > 0 && (
                              <span className="text-[11px] font-mono text-amber-400">
                                +{val.extraPrice.toLocaleString("vi-VN")}đ
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Kitchen Note */}
              <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/80 space-y-1.5">
                <label className="text-xs font-bold text-stone-300">Ghi chú riêng cho món</label>
                <input
                  type="text"
                  placeholder="VD: Không cay, ít ngọt, cho nhiều đá..."
                  value={customizingNote}
                  onChange={(e) => setCustomizingNote(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Modal Footer: Stepper & Add Button */}
            <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomizingQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold font-mono">
                  {customizingQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomizingQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={confirmCustomization}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Thêm vào đơn</span>
                <span className="font-mono text-stone-950">
                  • {(customizedUnitPrice * customizingQuantity).toLocaleString("vi-VN")}đ
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffPosPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-80px)] flex items-center justify-center text-stone-400">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mr-2" /> Đang tải POS...
        </div>
      }
    >
      <PosContent />
    </Suspense>
  );
}
