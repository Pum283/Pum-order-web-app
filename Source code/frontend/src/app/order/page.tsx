"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  api,
  QrTableInfoDto,
  MenuItemDetailDto,
  StaffOrderSelectedOption,
  StaffOrderLineRequest,
  TableSessionDetailDto,
} from "@/shared/api/client";
import {
  UtensilsCrossed,
  Search,
  ShoppingCart,
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
  X,
  History,
  Sparkles,
  ChevronRight,
  Info,
  RefreshCw,
  Phone,
  MapPin,
  Check,
  Receipt,
  Eye,
} from "lucide-react";

interface QrCartItem {
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

function QrOrderContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  // Data states
  const [tableInfo, setTableInfo] = useState<QrTableInfoDto | null>(null);
  const [sessionData, setSessionData] = useState<TableSessionDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter & Search states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Cart & Drawer states
  const [cart, setCart] = useState<QrCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [ticketNote, setTicketNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "session">("menu");

  // Option Customization Modal state
  const [customizingItem, setCustomizingItem] = useState<MenuItemDetailDto | null>(null);
  const [optionSelections, setOptionSelections] = useState<Record<string, string[]>>({});
  const [customizingNote, setCustomizingNote] = useState<string>("");
  const [customizingQuantity, setCustomizingQuantity] = useState<number>(1);

  // Success Notification state
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Load Table & Menu Info by QR Token
  useEffect(() => {
    if (!token) {
      setErrorMessage("Không tìm thấy mã QR bàn. Vui lòng quét lại mã QR được dán trên bàn ăn.");
      setLoading(false);
      return;
    }
    loadQrData();
  }, [token]);

  const loadQrData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await api.getQrTableInfo(token);
      setTableInfo(data);
      setSessionData(data.currentSession);
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể tải thông tin bàn hoặc mã QR đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  // Poll or refresh session data periodically if active session exists
  const refreshSession = async () => {
    if (!token) return;
    try {
      const updated = await api.getQrSessionStatus(token);
      setSessionData(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    if (!tableInfo) return [];
    return tableInfo.menuItems.filter((item) => {
      const matchCat = selectedCategoryId === "ALL" || item.categoryId === selectedCategoryId;
      const matchSearch =
        !searchKeyword ||
        item.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.code.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [tableInfo, selectedCategoryId, searchKeyword]);

  // Click on Item
  const handleItemClick = (item: MenuItemDetailDto) => {
    if (item.options && item.options.length > 0) {
      openCustomizationModal(item);
    } else {
      addDirectToCart(item);
    }
  };

  const addDirectToCart = (item: MenuItemDetailDto) => {
    const existingIndex = cart.findIndex(
      (c) => c.menuItemId === item.id && (!c.selectedOptions || c.selectedOptions.length === 0)
    );

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      const newCartItem: QrCartItem = {
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

    // Set default selections
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

  // Calculate current customized unit price
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

    const newCartItem: QrCartItem = {
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
        .filter(Boolean) as QrCartItem[]
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Submit QR Order (STT 23, 24, 25)
  const handleSubmitQrOrder = async () => {
    if (cart.length === 0 || !token) return;

    try {
      setIsSubmitting(true);
      const lines: StaffOrderLineRequest[] = cart.map((c) => ({
        menuItemId: c.menuItemId,
        quantity: c.quantity,
        note: c.note,
        selectedOptions: c.selectedOptions,
      }));

      await api.placeQrOrder({
        tableQrToken: token,
        note: ticketNote.trim() || undefined,
        lines,
      });

      // Clear Cart
      setCart([]);
      setTicketNote("");
      setIsCartOpen(false);

      // Refresh Session to display new ticket in history
      await refreshSession();
      setActiveTab("session");
      setOrderSuccessMsg(
        `Đã gửi yêu cầu đặt ${lines.length} món thành công! Nhân viên sẽ xác nhận và phục vụ bạn trong giây lát.`
      );
    } catch (err: any) {
      alert(err.message || "Lỗi khi gửi order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStationIcon = (station: string) => {
    switch (station) {
      case "Bar":
        return <Wine className="w-3 h-3 text-purple-400" />;
      case "Pastry":
        return <Cake className="w-3 h-3 text-pink-400" />;
      default:
        return <Flame className="w-3 h-3 text-amber-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PendingConfirm":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" /> Chờ NV xác nhận
          </span>
        );
      case "SentToKitchen":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <Flame className="w-3 h-3" /> Đã chuyển bếp
          </span>
        );
      case "Preparing":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
            <Flame className="w-3 h-3 animate-bounce" /> Đang nấu
          </span>
        );
      case "Ready":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Sẵn sàng
          </span>
        );
      case "Served":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-800 text-stone-300 border border-stone-700 flex items-center gap-1">
            <Check className="w-3 h-3" /> Đã phục vụ
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
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-stone-300 text-center">
        <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <h2 className="text-base font-bold text-white mb-1">Đang mở thực đơn tại bàn...</h2>
        <p className="text-xs text-stone-500">Vui lòng chờ trong giây lát.</p>
      </div>
    );
  }

  if (errorMessage || !tableInfo) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-stone-300 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Không thể tải thực đơn</h2>
        <p className="text-xs text-stone-400 max-w-sm mb-6 leading-relaxed">
          {errorMessage || "Mã QR bàn không hợp lệ hoặc nhà hàng đã đổi mã."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Thử tải lại</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col pb-24 selection:bg-amber-500 selection:text-stone-950">
      {/* ============================================================== */}
      {/* RESTAURANT & TABLE HERO HEADER                                 */}
      {/* ============================================================== */}
      <header className="relative bg-gradient-to-b from-stone-900 to-stone-950 border-b border-stone-800/80 px-4 pt-5 pb-4 shrink-0 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-amber-400">
                {tableInfo.branchName}
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white mt-0.5 flex items-center gap-2">
              <span>{tableInfo.tableName || tableInfo.tableCode}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 font-semibold">
                {tableInfo.areaName}
              </span>
            </h1>
          </div>

          {/* Tab Switcher: Menu vs Session */}
          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setActiveTab("menu")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "menu"
                  ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Thực đơn</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("session");
                refreshSession();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                activeTab === "session"
                  ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Đơn bàn</span>
              {sessionData && sessionData.totalItemsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Success Notification Banner */}
      {orderSuccessMsg && (
        <div className="max-w-xl mx-auto w-full px-4 mt-3">
          <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 flex items-start gap-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-bold">{orderSuccessMsg}</p>
            </div>
            <button
              onClick={() => setOrderSuccessMsg(null)}
              className="text-stone-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: MENU VIEW (STT 22, 23)                                  */}
      {/* ============================================================== */}
      {activeTab === "menu" && (
        <main className="max-w-xl mx-auto w-full px-4 pt-4 flex-1 flex flex-col gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="Tìm món ăn, đồ uống yêu thích..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full bg-stone-900/90 border border-stone-800 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 shadow-inner"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategoryId("ALL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategoryId === "ALL"
                  ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              Tất cả ({tableInfo.menuItems.length})
            </button>
            {tableInfo.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategoryId === cat.id
                    ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                    : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Items List (Mobile-first Cards) */}
          <div className="space-y-3">
            {filteredMenuItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="group bg-stone-900/80 hover:bg-stone-900 rounded-2xl border border-stone-800/80 hover:border-amber-500/40 p-3 flex items-center justify-between gap-3.5 transition-all duration-150 cursor-pointer shadow-md active:scale-[0.99] select-none"
              >
                {/* Food Image */}
                <div className="w-20 h-20 rounded-xl bg-stone-950 overflow-hidden relative shrink-0 border border-stone-800">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-700">
                      <UtensilsCrossed className="w-6 h-6" />
                    </div>
                  )}

                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-stone-950/80 backdrop-blur-sm border border-stone-700/50 flex items-center gap-0.5 text-[9px] font-bold text-stone-300">
                    {getStationIcon(item.kitchenStation)}
                  </div>
                </div>

                {/* Food Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-amber-500/90">{item.code}</span>
                    <span className="text-[10px] text-stone-500">• {item.unit || "Phần"}</span>
                  </div>
                  <h3 className="text-sm font-bold text-stone-100 group-hover:text-amber-400 line-clamp-1 transition-colors">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  )}

                  {/* Price & Options indicator */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-black text-amber-400 font-mono">
                      {item.price.toLocaleString("vi-VN")}đ
                    </span>
                    {item.options && item.options.length > 0 && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        +{item.options.length} tùy chọn
                      </span>
                    )}
                  </div>
                </div>

                {/* Plus Button */}
                <button
                  type="button"
                  className="w-9 h-9 rounded-xl bg-stone-800 group-hover:bg-amber-500 text-stone-300 group-hover:text-stone-950 flex items-center justify-center font-black transition-colors shrink-0 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}

            {filteredMenuItems.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-stone-500 text-center">
                <UtensilsCrossed className="w-10 h-10 mb-2 stroke-[1.5] text-stone-600" />
                <p className="text-xs">Không có món ăn nào trong danh mục này.</p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SESSION STATUS & TIMELINE (STT 25)                      */}
      {/* ============================================================== */}
      {activeTab === "session" && (
        <main className="max-w-xl mx-auto w-full px-4 pt-4 flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-200 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Đơn món đã gọi tại bàn</span>
            </h2>
            <button
              onClick={refreshSession}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Cập nhật</span>
            </button>
          </div>

          {sessionData && sessionData.tickets.length > 0 ? (
            <div className="space-y-3.5">
              {sessionData.tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-2xl bg-stone-900 border border-stone-800 p-4 flex flex-col gap-3 shadow-md"
                >
                  {/* Ticket Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-stone-800/80">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 text-[10px] font-extrabold">
                        Đợt #{ticket.ticketNumber}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(ticket.orderedAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-400">
                      {ticket.source === "CustomerQr" ? "📱 Khách quét QR" : "👨‍💼 Nhân viên ghi món"}
                    </span>
                  </div>

                  {/* Lines List */}
                  <div className="space-y-2.5">
                    {ticket.lines.map((line) => (
                      <div key={line.id} className="flex items-start justify-between gap-2 text-xs">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-100">
                              {line.quantity}x {line.itemName}
                            </span>
                          </div>
                          {line.selectedOptionsText && (
                            <p className="text-[10px] text-stone-400 mt-0.5">
                              {line.selectedOptionsText}
                            </p>
                          )}
                          {line.note && (
                            <p className="text-[10px] text-amber-400/90 italic mt-0.5">
                              *Ghi chú: {line.note}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="font-mono text-xs font-bold text-stone-200">
                            {line.totalPrice.toLocaleString("vi-VN")}đ
                          </span>
                          {getStatusBadge(line.status)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {ticket.note && (
                    <p className="text-[11px] text-amber-400 italic bg-amber-500/5 px-2.5 py-1.5 rounded-lg border border-amber-500/10">
                      Ghi chú: {ticket.note}
                    </p>
                  )}
                </div>
              ))}

              {/* Total Session Bill Card */}
              <div className="rounded-2xl bg-stone-900 border border-stone-800 p-4 flex items-center justify-between shadow-xl">
                <div>
                  <span className="text-xs text-stone-400 block">
                    Tổng cộng ({sessionData.totalItemsCount} món):
                  </span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {sessionData.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab("menu")}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  + Gọi thêm món
                </button>
              </div>
            </div>
          ) : (
            <div className="h-56 rounded-2xl border border-stone-800/80 bg-stone-900/40 flex flex-col items-center justify-center p-6 text-center text-stone-500">
              <History className="w-10 h-10 mb-2 text-stone-600 stroke-[1.5]" />
              <p className="text-xs font-medium text-stone-300">Bàn này chưa gửi đợt món nào.</p>
              <p className="text-[11px] text-stone-500 mt-1">
                Hãy chọn món trong thực đơn và nhấn "Gửi Đặt Món".
              </p>
              <button
                onClick={() => setActiveTab("menu")}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
              >
                Xem Thực Đơn Ngay
              </button>
            </div>
          )}
        </main>
      )}

      {/* ============================================================== */}
      {/* FLOATING CART BAR (Mobile-First Bottom Bar)                     */}
      {/* ============================================================== */}
      {cart.length > 0 && activeTab === "menu" && (
        <div className="fixed bottom-4 inset-x-4 max-w-xl mx-auto z-40 animate-in slide-in-from-bottom duration-200">
          <div
            onClick={() => setIsCartOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 p-3.5 rounded-2xl shadow-2xl shadow-amber-500/30 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-950 text-amber-400 flex items-center justify-center font-black relative shadow-md">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-stone-900 block">Đang chọn {cartCount} món</span>
                <span className="text-base font-black font-mono leading-none">
                  {cartTotal.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 font-black text-xs bg-stone-950 text-amber-400 px-3.5 py-2 rounded-xl shadow-sm">
              <span>Xem giỏ & Đặt</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CART DRAWER MODAL                                              */}
      {/* ============================================================== */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center backdrop-blur-sm">
          <div className="bg-stone-900 border-t border-stone-800 rounded-t-3xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-white">Giỏ món đặt bàn ({cartCount} món)</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-stone-950 border border-stone-800/80 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-amber-500">{item.code}</span>
                        <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      </div>

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
                        <p className="text-[11px] text-amber-400 italic mt-0.5">
                          *Ghi chú: {item.note}
                        </p>
                      )}
                    </div>

                    <span className="text-xs font-bold text-amber-400 font-mono shrink-0">
                      {(item.unitPrice * item.quantity).toLocaleString("vi-VN")}đ
                    </span>
                  </div>

                  {/* Stepper */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-800/60">
                    <span className="text-[11px] text-stone-500 font-mono">
                      {item.unitPrice.toLocaleString("vi-VN")}đ / món
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCartQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-stone-800 text-stone-300 flex items-center justify-center text-xs"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-stone-800 text-stone-300 flex items-center justify-center text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-400 flex items-center justify-center text-xs ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-stone-800 bg-stone-950/90 space-y-3">
              <input
                type="text"
                placeholder="Ghi chú thêm cho nhân viên (VD: Khách ăn vội...)"
                value={ticketNote}
                onChange={(e) => setTicketNote(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />

              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Tạm tính đợt gọi này:</span>
                <span className="text-lg font-black text-amber-400 font-mono">
                  {cartTotal.toLocaleString("vi-VN")}đ
                </span>
              </div>

              <button
                onClick={handleSubmitQrOrder}
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang gửi đặt món...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>XÁC NHẬN ĐẶT MÓN NGAY</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CUSTOMIZE ITEM OPTIONS & TOPPINGS                       */}
      {/* ============================================================== */}
      {customizingItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-200">
            {/* Header */}
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
                    {customizingItem.price.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Option Groups */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {customizingItem.options.map((opt) => {
                const selectedValIds = optionSelections[opt.id] || [];
                return (
                  <div
                    key={opt.id}
                    className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80 space-y-2.5"
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
                                : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
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

              {/* Note */}
              <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80 space-y-1.5">
                <label className="text-xs font-bold text-stone-300">Ghi chú riêng cho món này</label>
                <input
                  type="text"
                  placeholder="VD: Không cay, ít đường, nhiều đá..."
                  value={customizingNote}
                  onChange={(e) => setCustomizingNote(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-800 bg-stone-950/90 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomizingQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-xl bg-stone-800 text-stone-200 flex items-center justify-center font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold font-mono">
                  {customizingQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomizingQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-xl bg-stone-800 text-stone-200 flex items-center justify-center font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={confirmCustomization}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Thêm vào giỏ</span>
                <span className="font-mono text-stone-950 font-black">
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

export default function OrderQrPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mr-2" /> Đang tải...
        </div>
      }
    >
      <QrOrderContent />
    </Suspense>
  );
}
