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
} from "@/shared/api/client";
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

  // Load initial data
  useEffect(() => {
    if (!activeBranchId) return;
    loadAllData();
    loadNotifications();

    // Polling notifications every 10 seconds
    const timer = setInterval(() => {
      loadNotifications();
    }, 10000);
    return () => clearInterval(timer);
  }, [activeBranchId]);

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

  const loadTableSession = async (tableId: string) => {
    try {
      setSessionLoading(true);
      try {
        const session = await api.getActiveSessionByTable(tableId);
        setCurrentSession(session);
        if (session.tickets.length > 0) {
          setActiveCartTab("current");
        }
      } catch {
        setCurrentSession(null);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSessionLoading(false);
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

  // Click menu item -> Check if has options
  const handleItemClick = async (item: MenuItemDto) => {
    if (item.optionsCount && item.optionsCount > 0) {
      try {
        const fullItem = await api.getMenuItemById(item.id);
        openCustomizationModal(fullItem);
      } catch (err: any) {
        setNotification({ type: "error", message: "Lỗi tải tùy chọn món." });
      }
    } else {
      addDirectToCart(item);
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
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Lỗi gửi đơn đến bếp." });
    } finally {
      setSubmittingOrder(false);
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

      {/* Main Dual View Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ============================================================== */}
        {/* LEFT COLUMN: Food Menu Grid & Search (65% width)               */}
        {/* ============================================================== */}
        <section className="flex-1 flex flex-col border-r border-stone-800 bg-stone-950 overflow-hidden">
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
                  {item.optionsCount > 0 && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-amber-500/90 text-stone-950 text-[10px] font-bold shadow-sm">
                      +{item.optionsCount} tùy chọn
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
                  <button className="w-6 h-6 rounded-lg bg-stone-800 group-hover:bg-amber-500 text-stone-400 group-hover:text-stone-950 flex items-center justify-center transition-colors">
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
        <aside className="w-full lg:w-[400px] xl:w-[440px] flex flex-col bg-stone-900/70 border-t lg:border-t-0 lg:border-l border-stone-800 shrink-0 overflow-hidden">
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
                <div className="p-3 border-t border-stone-800 bg-stone-900/90 flex items-center justify-between">
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
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md"
                  >
                    + Gọi thêm món
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

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

            {/* Modal Body: Option Groups */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
