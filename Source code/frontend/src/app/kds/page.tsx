"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  api,
  BranchDto,
  KitchenOrderTicketDto,
  KitchenOrderLineDto,
  KitchenStatsDto,
  KitchenAggregateItemDto,
} from "@/shared/api/client";
import { useAuth } from "@/shared/context/AuthContext";
import {
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RefreshCw,
  Layers,
  UtensilsCrossed,
  Wine,
  Cake,
  Ban,
  ArrowLeft,
  ChevronRight,
  Filter,
  UserCheck,
  Smartphone,
  Info,
} from "lucide-react";

export default function KdsPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();

  // State
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<string>("ALL"); // ALL, Kitchen, Bar, Pastry
  const [statusFilter, setStatusFilter] = useState<string>("Active"); // Active, SentToKitchen, Preparing, Ready, ALL
  const [viewMode, setViewMode] = useState<"tickets" | "aggregate">("tickets");
  
  const [tickets, setTickets] = useState<KitchenOrderTicketDto[]>([]);
  const [aggregateItems, setAggregateItems] = useState<KitchenAggregateItemDto[]>([]);
  const [stats, setStats] = useState<KitchenStatsDto | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Cancel Modal
  const [cancelTargetLine, setCancelTargetLine] = useState<KitchenOrderLineDto | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  // Audio ref & previous ticket count to trigger chime on new orders
  const prevTicketCountRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sound Chime Generator using Web Audio API
  const playChime = useCallback((type: "new-order" | "ready" | "urgent") => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "new-order") {
        // Double ding for new order
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.15); // A5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === "ready") {
        // Upward pleasant triad
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === "urgent") {
        // Urgent beep
        osc.type = "square";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  // Load Branches
  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login?redirect=/kds");
      return;
    }

    const loadBranches = async () => {
      try {
        const branchList = await api.getBranches();
        setBranches(branchList);
        if (branchList.length > 0) {
          // If user belongs to a branch, select it, else select first
          if (user?.branchId) {
            const found = branchList.find((b) => b.id === user.branchId);
            setSelectedBranchId(found ? found.id : branchList[0].id);
          } else {
            setSelectedBranchId(branchList[0].id);
          }
        }
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg("Không thể tải danh sách chi nhánh: " + error.message);
      }
    };

    if (token) {
      loadBranches();
    }
  }, [token, authLoading, user, router]);

  // Fetch KDS Data
  const fetchKdsData = useCallback(async (showLoading = false) => {
    if (!selectedBranchId) return;
    if (showLoading) setIsLoading(true);
    setErrorMsg(null);

    try {
      const [ticketsData, statsData] = await Promise.all([
        api.getKitchenOrders(selectedBranchId, selectedStation, statusFilter),
        api.getKitchenStats(selectedBranchId),
      ]);

      setTickets(ticketsData);
      setStats(statsData);

      // Also fetch aggregate if in aggregate mode
      if (viewMode === "aggregate") {
        const aggData = await api.getKitchenAggregate(selectedBranchId, selectedStation);
        setAggregateItems(aggData);
      }

      // Check if new tickets arrived to trigger sound
      if (prevTicketCountRef.current > 0 && ticketsData.length > prevTicketCountRef.current) {
        playChime("new-order");
      }
      prevTicketCountRef.current = ticketsData.length;
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Lỗi tải dữ liệu bếp.");
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedBranchId, selectedStation, statusFilter, viewMode, playChime]);

  // Trigger load on branch/station/status changes
  useEffect(() => {
    if (selectedBranchId) {
      fetchKdsData(true);
    }
  }, [selectedBranchId, selectedStation, statusFilter, viewMode, fetchKdsData]);

  // Auto-refresh interval (every 4s)
  useEffect(() => {
    if (!selectedBranchId) return;
    const interval = setInterval(() => {
      fetchKdsData(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedBranchId, fetchKdsData]);

  // Live timer tick every 1s for dynamic elapsed UI
  const [, setTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Actions
  const handleUpdateLineStatus = async (lineId: string, newStatus: string) => {
    try {
      const updated = await api.updateKitchenLineStatus(lineId, { newStatus });
      if (newStatus === "Ready") {
        playChime("ready");
      }
      // Update local state optimistically
      setTickets((prev) =>
        prev
          .map((ticket) => ({
            ...ticket,
            lines: ticket.lines.map((l) => (l.id === lineId ? updated : l)),
          }))
          .filter((t) => statusFilter === "ALL" || t.lines.some((l) => l.status !== "Served" && l.status !== "Cancelled"))
      );
      // Refresh stats in background
      if (selectedBranchId) {
        api.getKitchenStats(selectedBranchId).then(setStats).catch(() => {});
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert("Lỗi cập nhật món: " + error.message);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      await api.updateKitchenTicketStatus(ticketId, newStatus);
      if (newStatus === "Ready") {
        playChime("ready");
      }
      fetchKdsData(false);
    } catch (err: unknown) {
      const error = err as Error;
      alert("Lỗi cập nhật đợt order: " + error.message);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetLine) return;
    setIsSubmittingCancel(true);
    try {
      await api.updateKitchenLineStatus(cancelTargetLine.id, {
        newStatus: "Cancelled",
        cancelReason: cancelReason.trim() || "Hủy theo yêu cầu bếp",
      });
      setCancelTargetLine(null);
      setCancelReason("");
      fetchKdsData(false);
    } catch (err: unknown) {
      const error = err as Error;
      alert("Lỗi hủy món: " + error.message);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const getStationIcon = (station: string) => {
    switch (station) {
      case "Bar":
        return <Wine className="w-3.5 h-3.5" />;
      case "Pastry":
        return <Cake className="w-3.5 h-3.5" />;
      default:
        return <Flame className="w-3.5 h-3.5" />;
    }
  };

  const getStationLabel = (station: string) => {
    switch (station) {
      case "Bar":
        return "Quầy Bar";
      case "Pastry":
        return "Quầy Bánh";
      default:
        return "Bếp Nóng";
    }
  };

  const getUrgencyBadge = (orderedAt: string) => {
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(orderedAt).getTime()) / 60000));
    if (elapsed >= 15) {
      return {
        bg: "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse",
        text: `${elapsed}p (Quá SLA!)`,
        isUrgent: true,
      };
    }
    if (elapsed >= 7) {
      return {
        bg: "bg-amber-500/20 text-amber-400 border-amber-500/40",
        text: `${elapsed} phút`,
        isUrgent: false,
      };
    }
    return {
      bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      text: `${elapsed} phút`,
      isUrgent: false,
    };
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col select-none font-sans">
      {/* KDS Top Header */}
      <header className="bg-stone-900/95 backdrop-blur border-b border-stone-800 px-4 py-3 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Left: Brand + Branch + View Switcher */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors border border-stone-700/60"
            title="Về trang Quản trị"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Quản trị</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-md shadow-rose-500/20">
              <Flame className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                KDS — MÀN HÌNH BẾP / BAR
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-semibold">
                  STT 51, 53
                </span>
              </h1>
            </div>
          </div>

          {/* Branch Dropdown */}
          {branches.length > 1 && (
            <div className="hidden md:block">
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-stone-800 text-stone-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-stone-700 focus:outline-none focus:border-amber-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Middle: Station & Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Station Tabs */}
          <div className="flex items-center bg-stone-950/80 p-1 rounded-xl border border-stone-800">
            {[
              { id: "ALL", label: "Tất cả trạm", icon: UtensilsCrossed },
              { id: "Kitchen", label: "Bếp Nóng", icon: Flame },
              { id: "Bar", label: "Quầy Bar", icon: Wine },
              { id: "Pastry", label: "Bánh / Kem", icon: Cake },
            ].map((st) => {
              const Icon = st.icon;
              const active = selectedStation === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStation(st.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? "bg-amber-500 text-stone-950 shadow-sm"
                      : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="hidden lg:flex items-center bg-stone-950/80 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => setViewMode("tickets")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "tickets"
                  ? "bg-stone-800 text-stone-100 shadow"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Thẻ theo bàn</span>
            </button>
            <button
              onClick={() => setViewMode("aggregate")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "aggregate"
                  ? "bg-stone-800 text-stone-100 shadow"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Tổng hợp món</span>
            </button>
          </div>
        </div>

        {/* Right: Sound, Fullscreen & Refresh Buttons */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                : "bg-stone-800 border-stone-700 text-stone-500 hover:text-stone-300"
            }`}
            title={soundEnabled ? "Âm thanh thông báo: Bật" : "Âm thanh: Tắt"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Refresh */}
          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchKdsData(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            <span className="hidden sm:inline">Cập nhật</span>
          </button>
        </div>
      </header>

      {/* KPI & Status Filter Strip */}
      <div className="bg-stone-900/60 border-b border-stone-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Quick status tabs */}
        <div className="flex items-center gap-1.5">
          <span className="text-stone-500 text-[11px] font-medium mr-1 uppercase tracking-wider">Lọc:</span>
          {[
            { id: "Active", label: "Đang làm (Tất cả)", count: (stats?.pendingCount || 0) + (stats?.preparingCount || 0) + (stats?.readyCount || 0) },
            { id: "SentToKitchen", label: "Chờ làm", count: stats?.pendingCount || 0, badgeBg: "bg-amber-500/20 text-amber-400" },
            { id: "Preparing", label: "Đang nấu", count: stats?.preparingCount || 0, badgeBg: "bg-sky-500/20 text-sky-400" },
            { id: "Ready", label: "Sẵn sàng bưng", count: stats?.readyCount || 0, badgeBg: "bg-emerald-500/20 text-emerald-400" },
            { id: "ALL", label: "Tất cả / Lịch sử", count: stats?.servedTodayCount || 0 },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                  active
                    ? "bg-stone-800 text-amber-400 font-semibold border border-amber-500/40 shadow-sm"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/40"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${tab.badgeBg || "bg-stone-800 text-stone-300"}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live SLA & Stats summary */}
        {stats && (
          <div className="hidden md:flex items-center gap-4 text-stone-400 text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Thời gian nấu TB:</span>
              <strong className="text-amber-400 font-mono">{stats.avgPreparationMinutes} phút</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Đã phục vụ hôm nay:</span>
              <strong className="text-emerald-400 font-mono">{stats.servedTodayCount} đĩa</strong>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 overflow-y-auto">
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-stone-400 font-medium tracking-wide">Đang tải dữ liệu đơn bếp realtime...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm max-w-xl mx-auto my-12 text-center">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="font-semibold">{errorMsg}</p>
            <button
              onClick={() => fetchKdsData(true)}
              className="mt-3 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
            >
              Thử lại
            </button>
          </div>
        ) : viewMode === "aggregate" ? (
          /* ==================================================== */
          /* AGGREGATE VIEW (Bảng tổng hợp số lượng món cần làm) */
          /* ==================================================== */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-500" />
                BẢNG TỔNG HỢP MÓN ĐANG CẦN CHẾ BIẾN (TẤT CẢ CÁC BÀN)
              </h2>
              <span className="text-xs text-stone-400">
                Tổng cộng: <strong className="text-amber-400 font-mono">{aggregateItems.length}</strong> món
              </span>
            </div>

            {aggregateItems.length === 0 ? (
              <div className="py-20 text-center text-stone-500 text-sm bg-stone-900/30 rounded-3xl border border-stone-800/60 border-dashed">
                <UtensilsCrossed className="w-12 h-12 text-stone-700 mx-auto mb-3" />
                <p className="font-medium">Hiện không có món nào đang cần chế biến.</p>
                <p className="text-xs text-stone-600 mt-1">Khi có order từ nhân viên hoặc khách quét QR, món sẽ tự động hiển thị ở đây.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {aggregateItems.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="bg-stone-900/90 rounded-2xl border border-stone-800 p-4 flex flex-col justify-between hover:border-stone-700 transition-all shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 font-mono text-[10px] border border-stone-700/60">
                          {item.itemCode}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-400">
                          {getStationIcon(item.kitchenStation)}
                          <span>{getStationLabel(item.kitchenStation)}</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white mb-2 leading-tight">
                        {item.itemName}
                      </h3>

                      {/* Quantities Badge */}
                      <div className="flex items-center gap-2 mb-3 bg-stone-950/80 p-2 rounded-xl border border-stone-800/80">
                        <div className="flex-1 text-center border-r border-stone-800">
                          <span className="text-[10px] text-stone-400 uppercase">Tổng cộng</span>
                          <p className="text-lg font-black text-amber-400 font-mono">{item.totalQuantity}</p>
                        </div>
                        <div className="flex-1 text-center border-r border-stone-800">
                          <span className="text-[10px] text-amber-500 uppercase">Chờ làm</span>
                          <p className="text-lg font-black text-amber-300 font-mono">{item.pendingQuantity}</p>
                        </div>
                        <div className="flex-1 text-center">
                          <span className="text-[10px] text-sky-400 uppercase">Đang nấu</span>
                          <p className="text-lg font-black text-sky-400 font-mono">{item.preparingQuantity}</p>
                        </div>
                      </div>

                      {/* Details by Table */}
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        <span className="text-[10px] text-stone-400 uppercase font-semibold block">Chi tiết theo bàn:</span>
                        {item.tableDetails.map((detail) => (
                          <div
                            key={detail.lineId}
                            className="flex items-center justify-between bg-stone-950/50 px-2.5 py-1.5 rounded-lg text-xs border border-stone-800/50"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-amber-400">{detail.tableCode}</span>
                                <span className="text-stone-300 font-mono font-semibold">x{detail.quantity}</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                    detail.status === "SentToKitchen"
                                      ? "bg-amber-500/20 text-amber-400"
                                      : "bg-sky-500/20 text-sky-400"
                                  }`}
                                >
                                  {detail.status === "SentToKitchen" ? "Chờ" : "Đang nấu"}
                                </span>
                              </div>
                              {detail.selectedOptionsText && (
                                <p className="text-[10px] text-stone-400 italic mt-0.5">{detail.selectedOptionsText}</p>
                              )}
                              {detail.note && (
                                <p className="text-[10px] text-amber-300/90 font-medium">💬 {detail.note}</p>
                              )}
                            </div>

                            <button
                              onClick={() =>
                                handleUpdateLineStatus(
                                  detail.lineId,
                                  detail.status === "SentToKitchen" ? "Preparing" : "Ready"
                                )
                              }
                              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                                detail.status === "SentToKitchen"
                                  ? "bg-sky-600/80 hover:bg-sky-500 text-white"
                                  : "bg-emerald-600/80 hover:bg-emerald-500 text-white"
                              }`}
                              title={detail.status === "SentToKitchen" ? "Bắt đầu nấu" : "Hoàn thành món"}
                            >
                              {detail.status === "SentToKitchen" ? <Play className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ==================================================== */
          /* TICKETS VIEW (Thẻ Order theo bàn và thời gian FIFO) */
          /* ==================================================== */
          <div>
            {tickets.length === 0 ? (
              <div className="py-24 text-center text-stone-500 bg-stone-900/30 rounded-3xl border border-stone-800/60 border-dashed max-w-2xl mx-auto">
                <UtensilsCrossed className="w-14 h-14 text-stone-700 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-300">Không có order nào trong bếp</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  Hiện các bàn đã hoàn thành hoặc chưa có món mới được gửi xuống. Hệ thống sẽ tự động cập nhật ngay khi có order mới.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Link
                    href="/admin/pos"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition-all shadow"
                  >
                    Đến màn hình POS đặt món thử
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {tickets.map((ticket) => {
                  const urgency = getUrgencyBadge(ticket.orderedAt);
                  const allLinesPreparing = ticket.lines.every((l) => l.status === "Preparing" || l.status === "Ready" || l.status === "Served" || l.status === "Cancelled");
                  const allLinesReady = ticket.lines.every((l) => l.status === "Ready" || l.status === "Served" || l.status === "Cancelled");

                  return (
                    <div
                      key={ticket.id}
                      className={`bg-stone-900 rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
                        ticket.urgencyLevel === "Critical"
                          ? "border-rose-500/70 shadow-rose-950/40"
                          : ticket.urgencyLevel === "Warning"
                          ? "border-amber-500/50 shadow-amber-950/30"
                          : "border-stone-800 hover:border-stone-700"
                      }`}
                    >
                      {/* Ticket Header */}
                      <div
                        className={`p-3 border-b flex items-start justify-between gap-2 ${
                          ticket.urgencyLevel === "Critical"
                            ? "bg-rose-950/40 border-rose-500/40"
                            : ticket.urgencyLevel === "Warning"
                            ? "bg-amber-950/30 border-amber-500/30"
                            : "bg-stone-800/70 border-stone-800"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-white tracking-tight">
                              {ticket.tableCode}
                            </span>
                            <span className="text-xs text-stone-400 font-medium">
                              ({ticket.areaName || "Sảnh chính"})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-stone-400 font-mono">
                            <span>#{ticket.ticketNumber}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {ticket.source === "CustomerQr" ? (
                                <>
                                  <Smartphone className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400 font-sans font-semibold">Khách QR</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3 h-3 text-amber-400" />
                                  <span className="text-amber-400 font-sans font-semibold">{ticket.createdByUserName || "NV Phục vụ"}</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Urgency / Elapsed Badge */}
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black font-mono border ${urgency.bg}`}
                          >
                            <Clock className="w-3 h-3" />
                            {urgency.text}
                          </span>
                          <span className="block text-[10px] text-stone-500 font-mono mt-0.5">
                            {new Date(ticket.orderedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>

                      {/* Ticket Note if exists */}
                      {ticket.note && (
                        <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 text-xs text-amber-300 font-medium flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
                          <span>Ghi chú đơn: {ticket.note}</span>
                        </div>
                      )}

                      {/* Ticket Food Items List */}
                      <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-[380px]">
                        {ticket.lines.map((line) => {
                          const isSent = line.status === "SentToKitchen";
                          const isPrep = line.status === "Preparing";
                          const isReady = line.status === "Ready";
                          const isServed = line.status === "Served";
                          const isCancelled = line.status === "Cancelled";

                          return (
                            <div
                              key={line.id}
                              className={`p-2.5 rounded-xl border transition-all ${
                                isReady
                                  ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-100"
                                  : isPrep
                                  ? "bg-sky-950/30 border-sky-500/40 text-sky-100"
                                  : isServed
                                  ? "bg-stone-950/40 border-stone-800/60 opacity-60 line-through"
                                  : isCancelled
                                  ? "bg-rose-950/20 border-rose-900/40 opacity-50 line-through"
                                  : "bg-stone-950/70 border-stone-800/80 text-stone-100"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-black text-amber-400 font-mono">
                                      x{line.quantity}
                                    </span>
                                    <h4 className="text-sm font-bold text-white leading-snug">
                                      {line.itemName}
                                    </h4>
                                  </div>

                                  {/* Options / Topping snapshot */}
                                  {line.SelectedOptionsText && (
                                    <p className="text-[11px] text-stone-400 mt-1 font-medium bg-stone-900/80 px-2 py-0.5 rounded-md border border-stone-800">
                                      {line.SelectedOptionsText}
                                    </p>
                                  )}

                                  {/* Line Note */}
                                  {line.note && (
                                    <p className="text-[11px] text-amber-300 font-semibold mt-1 flex items-center gap-1">
                                      <span>💬</span> {line.note}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-stone-500 font-mono">
                                    <span className="flex items-center gap-1">
                                      {getStationIcon(line.kitchenStation)}
                                      {getStationLabel(line.kitchenStation)}
                                    </span>
                                    <span>•</span>
                                    <span>{line.elapsedMinutes}p trước</span>
                                  </div>
                                </div>

                                {/* Item Status Action Buttons */}
                                <div className="flex flex-col items-end gap-1.5">
                                  {isSent && (
                                    <button
                                      onClick={() => handleUpdateLineStatus(line.id, "Preparing")}
                                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                                      title="Bắt đầu nấu món này"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-current" />
                                      <span>Nấu</span>
                                    </button>
                                  )}

                                  {isPrep && (
                                    <button
                                      onClick={() => handleUpdateLineStatus(line.id, "Ready")}
                                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-stone-950 text-xs font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                                      title="Hoàn thành món -> Sẵn sàng bưng"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Xong</span>
                                    </button>
                                  )}

                                  {isReady && (
                                    <button
                                      onClick={() => handleUpdateLineStatus(line.id, "Served")}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-colors"
                                      title="Đã mang ra bàn"
                                    >
                                      <span>Đã bưng</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  )}

                                  {!isServed && !isCancelled && (
                                    <button
                                      onClick={() => {
                                        setCancelTargetLine(line);
                                        setCancelReason("");
                                      }}
                                      className="text-[10px] text-stone-500 hover:text-rose-400 transition-colors p-1"
                                      title="Hủy món này"
                                    >
                                      <Ban className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Ticket Footer Actions (Batch Cook / Complete) */}
                      <div className="p-2.5 bg-stone-950 border-t border-stone-800 flex items-center gap-2">
                        {!allLinesPreparing && (
                          <button
                            onClick={() => handleUpdateTicketStatus(ticket.id, "Preparing")}
                            className="flex-1 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center justify-center gap-1 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Nấu tất cả</span>
                          </button>
                        )}

                        {!allLinesReady && (
                          <button
                            onClick={() => handleUpdateTicketStatus(ticket.id, "Ready")}
                            className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow flex items-center justify-center gap-1 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Xong toàn bộ</span>
                          </button>
                        )}

                        {allLinesReady && (
                          <button
                            onClick={() => handleUpdateTicketStatus(ticket.id, "Served")}
                            className="flex-1 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold border border-stone-700 flex items-center justify-center gap-1 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Đã phục vụ hết</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cancel Item Modal */}
      {cancelTargetLine && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác nhận Hủy món</h3>
                <p className="text-xs text-stone-400">
                  {cancelTargetLine.itemName} (x{cancelTargetLine.quantity})
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Lý do hủy món <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="VD: Hết nguyên liệu, Khách đổi món, v.v..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-rose-500"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelTargetLine(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={isSubmittingCancel}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {isSubmittingCancel ? "Đang xử lý..." : "Xác nhận Hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
