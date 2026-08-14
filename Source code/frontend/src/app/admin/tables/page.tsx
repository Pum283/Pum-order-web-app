"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import QRCode from "qrcode";
import {
  api,
  BranchDto,
  AreaDto,
  DiningTableDto,
  CreateAreaRequest,
  UpdateAreaRequest,
  CreateTableRequest,
  UpdateTableRequest,
} from "@/shared/api/client";
import {
  QrCode,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Users,
  Building2,
  Printer,
  Download,
  Layers,
  Sparkles,
  Search,
  KeyRound,
  LayoutGrid,
  Map,
  ArrowRightLeft,
  Move,
  Save,
  Clock,
  Coffee,
} from "lucide-react";

export default function TablesManagementPage() {
  // Global & Branch states
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [userRoleLevel, setUserRoleLevel] = useState<number>(5);

  // View Mode: 'grid' | 'floormap'
  const [viewMode, setViewMode] = useState<"grid" | "floormap">("grid");
  const [isEditLayoutMode, setIsEditLayoutMode] = useState<boolean>(false);

  // Data states
  const [areas, setAreas] = useState<AreaDto[]>([]);
  const [tables, setTables] = useState<DiningTableDto[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaDto | null>(null);
  const [areaFormData, setAreaFormData] = useState({ name: "", sortOrder: 0 });

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<DiningTableDto | null>(null);
  const [tableFormData, setTableFormData] = useState({
    areaId: "",
    code: "",
    name: "",
    capacity: 4,
    posX: 0,
    posY: 0,
  });

  // QR Modal Single
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeQrTable, setActiveQrTable] = useState<DiningTableDto | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // QR Batch Print Modal
  const [isBatchQrModalOpen, setIsBatchQrModalOpen] = useState(false);
  const [batchQrDataUrls, setBatchQrDataUrls] = useState<Record<string, string>>({});

  // Transfer Table Modal (STT 17)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFromTable, setTransferFromTable] = useState<DiningTableDto | null>(null);
  const [transferToTableId, setTransferToTableId] = useState<string>("");
  const [transferReason, setTransferReason] = useState<string>("");

  // Confirm delete / action modals
  const [deleteTarget, setDeleteTarget] = useState<{ type: "area" | "table"; id: string; name: string } | null>(null);
  const [regenerateTarget, setRegenerateTarget] = useState<DiningTableDto | null>(null);

  // Dragging state for Floor Map
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [hasUnsavedPositions, setHasUnsavedPositions] = useState<boolean>(false);
  const floorMapRef = useRef<HTMLDivElement>(null);

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

  // Fetch areas and tables when selectedBranchId changes
  const fetchData = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [areasRes, tablesRes] = await Promise.all([
        api.getAreas(selectedBranchId),
        api.getTables(selectedBranchId),
      ]);
      setAreas(areasRes);
      setTables(tablesRes);
      setHasUnsavedPositions(false);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Không thể tải dữ liệu bàn và khu vực.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (selectedBranchId) {
      fetchData();
    }
  }, [selectedBranchId, fetchData]);

  // Generate QR code Data URL when activeQrTable changes
  useEffect(() => {
    if (activeQrTable) {
      QRCode.toDataURL(activeQrTable.qrUrl, {
        width: 380,
        margin: 2,
        color: {
          dark: "#1c1917",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [activeQrTable]);

  // Filtered Tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (selectedAreaId !== "ALL" && t.areaId !== selectedAreaId) return false;
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchCode = t.code.toLowerCase().includes(q);
        const matchName = t.name?.toLowerCase().includes(q) || false;
        const matchArea = t.areaName.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchArea) return false;
      }
      return true;
    });
  }, [tables, selectedAreaId, statusFilter, searchKeyword]);

  // Generate QR codes for Batch Print
  useEffect(() => {
    if (isBatchQrModalOpen && filteredTables.length > 0) {
      const urls: Record<string, string> = {};
      const promises = filteredTables.map((t) =>
        QRCode.toDataURL(t.qrUrl, {
          width: 250,
          margin: 1,
          color: { dark: "#1c1917", light: "#ffffff" },
        }).then((url) => {
          urls[t.id] = url;
        })
      );
      Promise.all(promises).then(() => setBatchQrDataUrls(urls));
    }
  }, [isBatchQrModalOpen, filteredTables]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = tables.length;
    const available = tables.filter((t) => t.status === "Available").length;
    const occupied = tables.filter((t) => t.status === "Occupied").length;
    const reserved = tables.filter((t) => t.status === "Reserved").length;
    const needsCleaning = tables.filter((t) => t.status === "NeedsCleaning").length;
    return { total, available, occupied, reserved, needsCleaning };
  }, [tables]);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  // Available destination tables for Transfer
  const availableTargetTables = useMemo(() => {
    if (!transferFromTable) return [];
    return tables.filter(
      (t) => t.id !== transferFromTable.id && t.status === "Available"
    );
  }, [tables, transferFromTable]);

  // --- AREA HANDLERS ---
  const handleOpenCreateArea = () => {
    setEditingArea(null);
    setAreaFormData({ name: "", sortOrder: areas.length + 1 });
    setIsAreaModalOpen(true);
  };

  const handleOpenEditArea = (area: AreaDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingArea(area);
    setAreaFormData({ name: area.name, sortOrder: area.sortOrder });
    setIsAreaModalOpen(true);
  };

  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaFormData.name.trim()) {
      setErrorMsg("Tên khu vực không được để trống.");
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    try {
      if (editingArea) {
        const req: UpdateAreaRequest = {
          name: areaFormData.name.trim(),
          sortOrder: Number(areaFormData.sortOrder),
          isActive: true,
        };
        await api.updateArea(editingArea.id, req);
        setSuccessMsg(`Đã cập nhật khu vực '${req.name}'`);
      } else {
        const req: CreateAreaRequest = {
          branchId: selectedBranchId,
          name: areaFormData.name.trim(),
          sortOrder: Number(areaFormData.sortOrder),
        };
        await api.createArea(req);
        setSuccessMsg(`Đã tạo khu vực '${req.name}' thành công.`);
      }
      setIsAreaModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Thao tác khu vực thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.deleteArea(areaId);
      setSuccessMsg("Đã xóa khu vực thành công.");
      setDeleteTarget(null);
      if (selectedAreaId === areaId) setSelectedAreaId("ALL");
      await fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Không thể xóa khu vực.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- TABLE HANDLERS ---
  const handleOpenCreateTable = () => {
    setEditingTable(null);
    setTableFormData({
      areaId: selectedAreaId !== "ALL" ? selectedAreaId : areas[0]?.id || "",
      code: "",
      name: "",
      capacity: 4,
      posX: 10 + (tables.length % 5) * 18,
      posY: 10 + Math.floor(tables.length / 5) * 20,
    });
    setIsTableModalOpen(true);
  };

  const handleOpenEditTable = (table: DiningTableDto) => {
    setEditingTable(table);
    setTableFormData({
      areaId: table.areaId,
      code: table.code,
      name: table.name || "",
      capacity: table.capacity,
      posX: table.posX,
      posY: table.posY,
    });
    setIsTableModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableFormData.code.trim()) {
      setErrorMsg("Mã bàn không được để trống.");
      return;
    }
    if (!tableFormData.areaId) {
      setErrorMsg("Vui lòng chọn khu vực.");
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    try {
      if (editingTable) {
        const req: UpdateTableRequest = {
          areaId: tableFormData.areaId,
          code: tableFormData.code.trim().toUpperCase(),
          name: tableFormData.name.trim() || tableFormData.code.trim().toUpperCase(),
          capacity: Number(tableFormData.capacity),
          status: editingTable.status,
          posX: Number(tableFormData.posX),
          posY: Number(tableFormData.posY),
          isActive: true,
        };
        await api.updateTable(editingTable.id, req);
        setSuccessMsg(`Đã cập nhật bàn '${req.code}'`);
      } else {
        const req: CreateTableRequest = {
          branchId: selectedBranchId,
          areaId: tableFormData.areaId,
          code: tableFormData.code.trim().toUpperCase(),
          name: tableFormData.name.trim() || tableFormData.code.trim().toUpperCase(),
          capacity: Number(tableFormData.capacity),
          posX: Number(tableFormData.posX),
          posY: Number(tableFormData.posY),
        };
        await api.createTable(req);
        setSuccessMsg(`Đã tạo bàn '${req.code}' thành công.`);
      }
      setIsTableModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Thao tác bàn thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickStatusChange = async (tableId: string, newStatus: string) => {
    try {
      await api.updateTableStatus(tableId, newStatus);
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId ? { ...t, status: newStatus as DiningTableDto["status"] } : t
        )
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Không thể cập nhật trạng thái bàn.");
    }
  };

  const handleOpenTransferModal = (table: DiningTableDto) => {
    setTransferFromTable(table);
    setTransferToTableId("");
    setTransferReason("");
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFromTable || !transferToTableId) {
      setErrorMsg("Vui lòng chọn bàn đích để chuyển sang.");
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.transferTable({
        fromTableId: transferFromTable.id,
        toTableId: transferToTableId,
        reason: transferReason.trim() || undefined,
      });
      setSuccessMsg(res.message);
      setIsTransferModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Chuyển bàn thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateQr = async () => {
    if (!regenerateTarget) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const updated = await api.regenerateTableQr(regenerateTarget.id);
      setSuccessMsg(`Đã tạo mã QR Token mới cho bàn ${updated.code}. Mã cũ đã bị vô hiệu hóa!`);
      setRegenerateTarget(null);
      if (activeQrTable && activeQrTable.id === updated.id) {
        setActiveQrTable(updated);
      }
      await fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Không thể đổi mã QR.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.deleteTable(tableId);
      setSuccessMsg("Đã xóa bàn thành công.");
      setDeleteTarget(null);
      await fetchData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Không thể xóa bàn.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- FLOOR MAP DRAG & DROP POSITION HANDLERS (STT 16) ---
  const handleFloorMapDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedTableId || !floorMapRef.current || !isEditLayoutMode) return;

    const rect = floorMapRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert pixel to percentage (0 - 90%)
    let posX = Math.round((clientX / rect.width) * 100);
    let posY = Math.round((clientY / rect.height) * 100);

    posX = Math.max(2, Math.min(88, posX));
    posY = Math.max(2, Math.min(88, posY));

    setTables((prev) =>
      prev.map((t) => (t.id === draggedTableId ? { ...t, posX, posY } : t))
    );
    setHasUnsavedPositions(true);
    setDraggedTableId(null);
  };

  const handleSaveFloorPositions = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const positions = tables.map((t) => ({
        tableId: t.id,
        posX: t.posX,
        posY: t.posY,
      }));
      await api.updateTablePositions(positions);
      setSuccessMsg("Đã lưu sơ đồ mặt bằng bàn thành công!");
      setHasUnsavedPositions(false);
      setIsEditLayoutMode(false);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Không thể lưu vị trí sơ đồ bàn.");
    } finally {
      setActionLoading(false);
    }
  };

  // Download QR as PNG
  const handleDownloadQrPng = (tableName: string, qrUrlString: string) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 800;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 600, 800);

    // Border
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, 580, 780);

    // Inner subtle border
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, 556, 756);

    // Brand Name
    ctx.fillStyle = "#d97706";
    ctx.font = "bold 26px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ORDERPUM RESTAURANT", 300, 75);

    // Slogan
    ctx.fillStyle = "#6b7280";
    ctx.font = "16px Arial, sans-serif";
    ctx.fillText("QUÉT MÃ ĐẶT MÓN TẠI BÀN", 300, 110);

    // Table Name
    ctx.fillStyle = "#111827";
    ctx.font = "bold 38px Arial, sans-serif";
    ctx.fillText(tableName.toUpperCase(), 300, 175);

    // Branch & Area
    ctx.fillStyle = "#4b5563";
    ctx.font = "18px Arial, sans-serif";
    const areaInfo = activeQrTable ? `${activeQrTable.areaName} • ${selectedBranch?.name || ""}` : "";
    ctx.fillText(areaInfo, 300, 215);

    // Draw QR Image
    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 125, 250, 350, 350);

      // Bottom instructions
      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 18px Arial, sans-serif";
      ctx.fillText("Mở Camera hoặc Zalo để quét mã", 300, 650);

      ctx.fillStyle = "#9ca3af";
      ctx.font = "14px monospace";
      ctx.fillText(qrUrlString.replace("http://", "").replace("https://", ""), 300, 690);

      // Trigger download
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `QR_${tableName.replace(/\s+/g, "_")}.png`;
      a.click();
    };
    qrImg.src = qrDataUrl;
  };

  const handlePrint = () => {
    window.print();
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
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-stone-100">Khu vực, Bàn & Sơ đồ mặt bằng</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  STT 13, 14, 15, 16, 17 (MVP)
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Sơ đồ bàn trực quan (Floor map), trạng thái phục vụ realtime, chuyển bàn và xuất mã QR gọi món
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons, View Mode Switch & Branch selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch selector */}
          {userRoleLevel <= 2 && branches.length > 1 && (
            <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-300">
              <Building2 className="w-4 h-4 text-amber-500" />
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  setSelectedAreaId("ALL");
                }}
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

          {/* View Mode Toggle */}
          <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "grid"
                  ? "bg-amber-500 text-stone-950 font-semibold shadow-md"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Dạng lưới</span>
            </button>
            <button
              onClick={() => setViewMode("floormap")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "floormap"
                  ? "bg-amber-500 text-stone-950 font-semibold shadow-md"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Sơ đồ tầng (STT 16)</span>
            </button>
          </div>

          <button
            onClick={() => setIsBatchQrModalOpen(true)}
            disabled={filteredTables.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            In hàng loạt QR ({filteredTables.length})
          </button>

          <button
            onClick={handleOpenCreateArea}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            Thêm Khu vực
          </button>

          <button
            onClick={handleOpenCreateTable}
            disabled={areas.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-semibold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Thêm Bàn mới
          </button>
        </div>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-stone-900/60 border border-stone-800/80 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">Tổng số bàn</div>
          <div className="text-xl font-bold text-stone-100 mt-1">{stats.total}</div>
        </div>
        <div className="bg-stone-900/60 border border-emerald-500/20 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bàn trống
          </div>
          <div className="text-xl font-bold text-emerald-300 mt-1">{stats.available}</div>
        </div>
        <div className="bg-stone-900/60 border border-amber-500/20 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Đang có khách
          </div>
          <div className="text-xl font-bold text-amber-300 mt-1">{stats.occupied}</div>
        </div>
        <div className="bg-stone-900/60 border border-blue-500/20 p-3.5 rounded-xl">
          <div className="text-[11px] font-medium text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Đã đặt trước
          </div>
          <div className="text-xl font-bold text-blue-300 mt-1">{stats.reserved}</div>
        </div>
        <div className="bg-stone-900/60 border border-rose-500/20 p-3.5 rounded-xl col-span-2 sm:col-span-1">
          <div className="text-[11px] font-medium text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Cần dọn dẹp
          </div>
          <div className="text-xl font-bold text-rose-300 mt-1">{stats.needsCleaning}</div>
        </div>
      </div>

      {/* Area Filter Tabs & Quick Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedAreaId("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedAreaId === "ALL"
                  ? "bg-amber-500 text-stone-950 font-semibold shadow-md shadow-amber-500/20"
                  : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
              }`}
            >
              Tất cả khu vực ({tables.length})
            </button>

            {areas.map((area) => (
              <div key={area.id} className="relative group flex items-center">
                <button
                  onClick={() => setSelectedAreaId(area.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                    selectedAreaId === area.id
                      ? "bg-amber-500 text-stone-950 font-semibold shadow-md shadow-amber-500/20"
                      : "bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800"
                  }`}
                >
                  <span>{area.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedAreaId === area.id ? "bg-amber-600/40 text-stone-950" : "bg-stone-800 text-stone-400"
                    }`}
                  >
                    {tables.filter((t) => t.areaId === area.id).length}
                  </span>
                </button>

                {/* Edit / Delete small hover buttons */}
                <div className="hidden group-hover:flex items-center gap-1 ml-1 bg-stone-900/90 border border-stone-800 px-1 py-0.5 rounded-lg">
                  <button
                    onClick={(e) => handleOpenEditArea(area, e)}
                    title="Sửa khu vực"
                    className="p-1 hover:text-amber-400 text-stone-400"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ type: "area", id: area.id, name: area.name });
                    }}
                    title="Xóa khu vực"
                    className="p-1 hover:text-rose-400 text-stone-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Search, Status Filter & Floor Map Controls */}
          <div className="flex items-center gap-2">
            {viewMode === "floormap" && (
              <div className="flex items-center gap-2 mr-2">
                {isEditLayoutMode ? (
                  <button
                    onClick={handleSaveFloorPositions}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-stone-950 text-xs font-semibold shadow-md shadow-emerald-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {actionLoading ? "Đang lưu..." : "Lưu vị trí"}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditLayoutMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-medium border border-stone-700"
                  >
                    <Move className="w-3.5 h-3.5" />
                    Kéo thả vị trí bàn
                  </button>
                )}
              </div>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm mã bàn, tên bàn..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="bg-stone-900 border border-stone-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 w-44 sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="Available">🟢 Trống</option>
              <option value="Occupied">🟠 Có khách</option>
              <option value="Reserved">🔵 Đã đặt</option>
              <option value="NeedsCleaning">🔴 Cần dọn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Floor Map or Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-stone-900/30 border border-stone-800/80 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
          <p className="text-sm text-stone-400">Đang tải danh sách bàn và sơ đồ mặt bằng...</p>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-stone-900/30 border border-stone-800/80 rounded-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
            <LayoutGrid className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-stone-200">Không tìm thấy bàn nào</h3>
          <p className="text-xs text-stone-400 max-w-md mt-1 mb-5">
            {areas.length === 0
              ? "Chi nhánh này chưa có khu vực nào. Hãy tạo khu vực trước khi thêm bàn."
              : "Chưa có bàn nào phù hợp với bộ lọc hiện tại. Bấm nút bên dưới để thêm bàn mới."}
          </p>
          {areas.length === 0 ? (
            <button
              onClick={handleOpenCreateArea}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-semibold"
            >
              Tạo Khu vực đầu tiên
            </button>
          ) : (
            <button
              onClick={handleOpenCreateTable}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-semibold"
            >
              Thêm Bàn vào khu vực
            </button>
          )}
        </div>
      ) : viewMode === "floormap" ? (
        /* ======================================================== */
        /* INTERACTIVE FLOOR MAP VIEW (STT 16) */
        /* ======================================================== */
        <div className="space-y-3">
          {isEditLayoutMode && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Chế độ chỉnh sửa sơ đồ:</strong> Bạn có thể nắm và kéo thả bất kỳ bàn nào trên mặt bằng bên dưới để sắp xếp vị trí thực tế của quán, sau đó bấm <strong>Lưu vị trí</strong>.
                </span>
              </div>
              <button
                onClick={handleSaveFloorPositions}
                disabled={actionLoading}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs"
              >
                {actionLoading ? "Đang lưu..." : "Lưu ngay"}
              </button>
            </div>
          )}

          <div
            ref={floorMapRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFloorMapDrop}
            className="relative w-full h-[620px] bg-stone-950/80 border-2 border-dashed border-stone-800 rounded-2xl overflow-hidden p-6 shadow-inner select-none"
            style={{
              backgroundImage: "radial-gradient(#292524 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          >
            {/* Floor Map Legend / Status indicators */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-stone-900/90 border border-stone-800 px-3.5 py-2 rounded-xl backdrop-blur-md text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50"></span> Trống
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-md shadow-amber-500/50"></span> Có khách
              </span>
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/50"></span> Đã đặt
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/50"></span> Cần dọn
              </span>
            </div>

            {/* Render Floor Map Dining Tables */}
            {filteredTables.map((table) => {
              const statusTheme = {
                Available: {
                  border: "border-emerald-500/40 hover:border-emerald-500 shadow-emerald-500/10",
                  headerBg: "bg-emerald-950/80 text-emerald-300",
                  badge: "bg-emerald-500 text-stone-950",
                  glow: "shadow-emerald-950/40",
                },
                Occupied: {
                  border: "border-amber-500/60 hover:border-amber-500 shadow-amber-500/20",
                  headerBg: "bg-amber-950/80 text-amber-300",
                  badge: "bg-amber-500 text-stone-950",
                  glow: "shadow-amber-950/60 animate-pulse",
                },
                Reserved: {
                  border: "border-blue-500/40 hover:border-blue-500 shadow-blue-500/10",
                  headerBg: "bg-blue-950/80 text-blue-300",
                  badge: "bg-blue-500 text-stone-950",
                  glow: "shadow-blue-950/40",
                },
                NeedsCleaning: {
                  border: "border-rose-500/40 hover:border-rose-500 shadow-rose-500/10",
                  headerBg: "bg-rose-950/80 text-rose-300",
                  badge: "bg-rose-500 text-white",
                  glow: "shadow-rose-950/40",
                },
              }[table.status] || {
                border: "border-stone-700",
                headerBg: "bg-stone-800 text-stone-300",
                badge: "bg-stone-600 text-white",
                glow: "",
              };

              return (
                <div
                  key={table.id}
                  draggable={isEditLayoutMode}
                  onDragStart={() => setDraggedTableId(table.id)}
                  style={{
                    left: `${table.posX}%`,
                    top: `${table.posY}%`,
                  }}
                  className={`absolute w-36 bg-stone-900 border-2 ${statusTheme.border} ${statusTheme.glow} rounded-2xl shadow-xl transition-transform duration-100 flex flex-col justify-between overflow-hidden ${
                    isEditLayoutMode ? "cursor-move ring-2 ring-amber-500/50" : "cursor-pointer hover:scale-105"
                  }`}
                >
                  {/* Table Card Header on Map */}
                  <div className={`px-2.5 py-1.5 ${statusTheme.headerBg} flex items-center justify-between border-b border-stone-800/80`}>
                    <span className="font-black text-xs font-mono">{table.code}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold flex items-center gap-1">
                      <Users className="w-2.5 h-2.5" />
                      {table.capacity}
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-2 text-center">
                    <div className="text-[11px] font-bold text-stone-200 truncate">
                      {table.name || table.code}
                    </div>
                    <div className="text-[9px] text-stone-400 truncate">{table.areaName}</div>

                    {/* Quick action buttons in Map view */}
                    <div className="mt-2 flex items-center justify-center gap-1 pt-1.5 border-t border-stone-800/60">
                      {table.status === "Occupied" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTransferModal(table);
                          }}
                          title="Chuyển bàn này (STT 17)"
                          className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center gap-1 border border-amber-500/30"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Chuyển</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveQrTable(table);
                            setIsQrModalOpen(true);
                          }}
                          title="Xem mã QR bàn"
                          className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px]"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <select
                        value={table.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleQuickStatusChange(table.id, e.target.value);
                        }}
                        className="bg-stone-950 text-[10px] border border-stone-800 rounded-lg px-1 py-0.5 text-stone-300 focus:outline-none"
                      >
                        <option value="Available">Trống</option>
                        <option value="Occupied">Khách</option>
                        <option value="Reserved">Đặt</option>
                        <option value="NeedsCleaning">Dọn</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* GRID CARDS VIEW (STT 14) */
        /* ======================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const statusConfig = {
              Available: {
                label: "Trống",
                bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                dot: "bg-emerald-500",
              },
              Occupied: {
                label: "Có khách",
                bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                dot: "bg-amber-500",
              },
              Reserved: {
                label: "Đã đặt",
                bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                dot: "bg-blue-500",
              },
              NeedsCleaning: {
                label: "Cần dọn",
                bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                dot: "bg-rose-500",
              },
            }[table.status] || {
              label: table.status,
              bg: "bg-stone-800 text-stone-400 border-stone-700",
              dot: "bg-stone-500",
            };

            return (
              <div
                key={table.id}
                className="group relative bg-stone-900/60 hover:bg-stone-900 border border-stone-800 hover:border-stone-700/80 p-4 rounded-2xl transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Code & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center font-black text-amber-400 text-base shadow-inner">
                        {table.code}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-200 group-hover:text-amber-400 transition-colors">
                          {table.name || table.code}
                        </h4>
                        <div className="text-[11px] text-stone-400">{table.areaName}</div>
                      </div>
                    </div>

                    {/* Quick Status Dropdown */}
                    <select
                      value={table.status}
                      onChange={(e) => handleQuickStatusChange(table.id, e.target.value)}
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border focus:outline-none cursor-pointer ${statusConfig.bg}`}
                    >
                      <option value="Available" className="bg-stone-900 text-emerald-400">🟢 Trống</option>
                      <option value="Occupied" className="bg-stone-900 text-amber-400">🟠 Có khách</option>
                      <option value="Reserved" className="bg-stone-900 text-blue-400">🔵 Đã đặt</option>
                      <option value="NeedsCleaning" className="bg-stone-900 text-rose-400">🔴 Cần dọn</option>
                    </select>
                  </div>

                  {/* Info: Capacity & Coordinates */}
                  <div className="flex items-center justify-between text-xs text-stone-400 py-2 border-y border-stone-800/80">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-stone-500" />
                      <span>{table.capacity} khách</span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono">
                      Vị trí: ({table.posX}%, {table.posY}%)
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-2 flex items-center justify-between gap-1 text-xs">
                  {/* Transfer Button (STT 17) */}
                  {table.status === "Occupied" ? (
                    <button
                      onClick={() => handleOpenTransferModal(table)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold transition-colors shadow-sm"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Chuyển bàn</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveQrTable(table);
                        setIsQrModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-medium transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Xem QR</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveQrTable(table);
                      setIsQrModalOpen(true);
                    }}
                    title="Xem mã QR"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleOpenEditTable(table)}
                    title="Sửa bàn"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setRegenerateTarget(table)}
                    title="Đổi mã Token QR mới"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteTarget({ type: "table", id: table.id, name: table.code })}
                    title="Xóa bàn"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TRANSFER TABLE MODAL (STT 17) */}
      {/* ======================================================== */}
      {isTransferModalOpen && transferFromTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-100">Chuyển Bàn (STT 17)</h3>
                  <p className="text-xs text-stone-400">Chuyển toàn bộ order và phiên phục vụ sang bàn mới</p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-5 space-y-4">
              {/* From Table Info */}
              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Bàn nguồn hiện tại</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-base font-black text-amber-400">{transferFromTable.code} - {transferFromTable.name}</div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                    Đang phục vụ
                  </span>
                </div>
                <div className="text-xs text-stone-400 mt-0.5">{transferFromTable.areaName} • Sức chứa {transferFromTable.capacity} khách</div>
              </div>

              {/* To Table Selection */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Chọn bàn đích chuyển sang (Chỉ bàn đang trống) <span className="text-rose-400">*</span>
                </label>
                {availableTargetTables.length === 0 ? (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                    Hiện tại không có bàn trống nào trong chi nhánh để chuyển!
                  </div>
                ) : (
                  <select
                    required
                    value={transferToTableId}
                    onChange={(e) => setTransferToTableId(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Chọn bàn đích --</option>
                    {availableTargetTables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} ({t.name}) — {t.areaName} (Sức chứa: {t.capacity} khách)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Lý do chuyển bàn (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Khách đổi sang phòng máy lạnh, ghép thêm bạn bè..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || availableTargetTables.length === 0 || !transferToTableId}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-semibold shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {actionLoading ? "Đang chuyển..." : "Xác nhận Chuyển Bàn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT AREA (STT 13) */}
      {/* ======================================================== */}
      {isAreaModalOpen && (
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
                  <p className="text-xs text-stone-400">VD: Tầng 1, Sân vườn, Tầng 2, Phòng VIP</p>
                </div>
              </div>
              <button
                onClick={() => setIsAreaModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArea} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Tên khu vực / tầng <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tầng 1 - Sảnh chính"
                  value={areaFormData.name}
                  onChange={(e) => setAreaFormData({ ...areaFormData, name: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Thứ tự sắp xếp (Sort Order)
                </label>
                <input
                  type="number"
                  min="0"
                  value={areaFormData.sortOrder}
                  onChange={(e) => setAreaFormData({ ...areaFormData, sortOrder: Number(e.target.value) })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-stone-500 mt-1">Số nhỏ hơn sẽ hiển thị trước trên thanh tab</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAreaModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-semibold shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {actionLoading ? "Đang lưu..." : editingArea ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT DINING TABLE (STT 14) */}
      {/* ======================================================== */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-100">
                    {editingTable ? `Chỉnh sửa bàn ${editingTable.code}` : "Thêm Bàn mới"}
                  </h3>
                  <p className="text-xs text-stone-400">Gán mã bàn, sức chứa và khu vực trực thuộc</p>
                </div>
              </div>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Khu vực / Tầng <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={tableFormData.areaId}
                  onChange={(e) => setTableFormData({ ...tableFormData, areaId: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    Mã/Số bàn <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: B01, VIP01"
                    value={tableFormData.code}
                    onChange={(e) => setTableFormData({ ...tableFormData, code: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    Sức chứa (Khách) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={tableFormData.capacity}
                    onChange={(e) => setTableFormData({ ...tableFormData, capacity: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Tên hiển thị của bàn (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Bàn 01 - Gần Cửa Sổ"
                  value={tableFormData.name}
                  onChange={(e) => setTableFormData({ ...tableFormData, name: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">Tọa độ X (Floor Map %)</label>
                  <input
                    type="number"
                    value={tableFormData.posX}
                    onChange={(e) => setTableFormData({ ...tableFormData, posX: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">Tọa độ Y (Floor Map %)</label>
                  <input
                    type="number"
                    value={tableFormData.posY}
                    onChange={(e) => setTableFormData({ ...tableFormData, posY: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-semibold shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {actionLoading ? "Đang lưu..." : editingTable ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIEW & PRINT SINGLE QR TEMPLATE (STT 15) */}
      {/* ======================================================== */}
      {isQrModalOpen && activeQrTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-stone-100">
                  Mã QR Đặt Món: {activeQrTable.name || activeQrTable.code}
                </h3>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Preview Card */}
            <div className="p-6 overflow-y-auto flex items-center justify-center bg-stone-950/50">
              <div
                id="printable-single-qr"
                className="w-80 bg-white text-stone-950 rounded-2xl p-6 border-4 border-amber-500 shadow-2xl flex flex-col items-center text-center"
              >
                <div className="text-amber-600 font-extrabold text-xs tracking-widest uppercase">
                  ORDERPUM RESTAURANT
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">QUÉT MÃ ĐẶT MÓN TẠI BÀN</div>

                <div className="my-3 py-1 px-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-2xl font-black text-stone-900 tracking-tight">
                    {activeQrTable.code}
                  </div>
                  <div className="text-[11px] font-semibold text-amber-700">
                    {activeQrTable.areaName}
                  </div>
                </div>

                {/* QR Image */}
                <div className="p-2 bg-white rounded-xl border border-stone-200 shadow-inner my-1">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="w-52 h-52 object-contain" />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center text-xs text-stone-400">
                      Đang tạo mã QR...
                    </div>
                  )}
                </div>

                <div className="text-xs font-bold text-stone-800 mt-3">
                  Mở Camera hoặc Zalo để quét mã
                </div>
                <div className="text-[10px] text-stone-400 mt-1 truncate max-w-full font-mono">
                  {activeQrTable.qrUrl}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-stone-800 flex items-center justify-between gap-3 bg-stone-900">
              <div className="text-[11px] text-stone-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Tem chuẩn in bàn 8x12cm</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleDownloadQrPng(activeQrTable.code, activeQrTable.qrUrl)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  Tải PNG
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-semibold shadow-md shadow-amber-500/20"
                >
                  <Printer className="w-3.5 h-3.5" />
                  In Tem này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BATCH QR PRINT MODAL (STT 15) */}
      {/* ======================================================== */}
      {isBatchQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="flex items-center justify-between p-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-stone-100">
                    In Hàng Loạt QR ({filteredTables.length} bàn)
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {selectedBranch?.name} • {selectedAreaId === "ALL" ? "Tất cả khu vực" : areas.find(a => a.id === selectedAreaId)?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-semibold shadow-md shadow-amber-500/20"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Bắt đầu In (Print All)
                </button>
                <button
                  onClick={() => setIsBatchQrModalOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Batch Grid Container */}
            <div className="p-6 overflow-y-auto bg-stone-950/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredTables.map((t) => (
                <div
                  key={t.id}
                  className="bg-white text-stone-950 rounded-2xl p-4 border-2 border-amber-500 shadow-md flex flex-col items-center text-center page-break-inside-avoid"
                >
                  <div className="text-[10px] text-amber-700 font-black tracking-widest uppercase">
                    ORDERPUM
                  </div>
                  <div className="text-xl font-black text-stone-900 mt-1">{t.code}</div>
                  <div className="text-[10px] text-stone-500 font-semibold">{t.areaName}</div>

                  <div className="p-1 bg-white rounded-lg border border-stone-200 my-2">
                    {batchQrDataUrls[t.id] ? (
                      <img src={batchQrDataUrls[t.id]} alt={`QR ${t.code}`} className="w-36 h-36 object-contain" />
                    ) : (
                      <div className="w-36 h-36 flex items-center justify-center text-[10px] text-stone-400">
                        Đang tạo...
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] font-bold text-stone-800">
                    Quét mã để gọi món
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRM REGENERATE QR TOKEN */}
      {/* ======================================================== */}
      {regenerateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-100">Đổi mã Token QR?</h3>
                <p className="text-xs text-stone-400">Bàn: {regenerateTarget.code}</p>
              </div>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Thao tác này sẽ sinh ra một mã định danh QR mới. Các mã QR đã in trước đây cho bàn này sẽ bị{" "}
              <strong className="text-amber-400">vô hiệu hóa ngay lập tức</strong>. Bạn cần in lại tem QR mới.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setRegenerateTarget(null)}
                className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleRegenerateQr}
                disabled={actionLoading}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-semibold disabled:opacity-50"
              >
                {actionLoading ? "Đang xử lý..." : "Xác nhận Đổi QR"}
              </button>
            </div>
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
                <h3 className="text-sm font-bold text-stone-100">
                  Xác nhận xóa {deleteTarget.type === "area" ? "Khu vực" : "Bàn"}
                </h3>
                <p className="text-xs text-stone-400">Đối tượng: {deleteTarget.name}</p>
              </div>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa {deleteTarget.type === "area" ? "khu vực" : "bàn"} này?
              {deleteTarget.type === "area" && " (Lưu ý: Không thể xóa khu vực nếu vẫn còn bàn bên trong)"}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (deleteTarget.type === "area") {
                    handleDeleteArea(deleteTarget.id);
                  } else {
                    handleDeleteTable(deleteTarget.id);
                  }
                }}
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
