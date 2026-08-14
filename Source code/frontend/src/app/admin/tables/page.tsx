"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
} from "lucide-react";

export default function TablesManagementPage() {
  // Global & Branch states
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [userRoleLevel, setUserRoleLevel] = useState<number>(5);

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

  // Confirm delete / action modals
  const [deleteTarget, setDeleteTarget] = useState<{ type: "area" | "table"; id: string; name: string } | null>(null);
  const [regenerateTarget, setRegenerateTarget] = useState<DiningTableDto | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

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
  const fetchData = async () => {
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
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Không thể tải dữ liệu bàn và khu vực.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBranchId) {
      fetchData();
    }
  }, [selectedBranchId]);

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

  // Generate QR codes for Batch Print
  useEffect(() => {
    if (isBatchQrModalOpen) {
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
  }, [isBatchQrModalOpen, tables, selectedAreaId]);

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
      posX: 0,
      posY: 0,
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
                <h1 className="text-xl font-bold text-stone-100">Khu vực, Bàn & Mã QR</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  STT 13, 14, 15 (MVP)
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Thiết lập mặt bằng nhà hàng, quản lý số bàn, sức chứa và xuất mã QR gọi món tại bàn
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Branch selector */}
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

          {/* Search & Status Filter */}
          <div className="flex items-center gap-2">
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

      {/* Main Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-stone-900/30 border border-stone-800/80 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
          <p className="text-sm text-stone-400">Đang tải danh sách bàn và khu vực...</p>
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
      ) : (
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
                      Vị trí: ({table.posX}, {table.posY})
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-2 flex items-center justify-between gap-1 text-xs">
                  {/* View QR Button */}
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
      {/* MODAL 1: CREATE / EDIT AREA (STT 13) */}
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
      {/* MODAL 2: CREATE / EDIT DINING TABLE (STT 14) */}
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
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">Tọa độ X (Floor Map)</label>
                  <input
                    type="number"
                    value={tableFormData.posX}
                    onChange={(e) => setTableFormData({ ...tableFormData, posX: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">Tọa độ Y (Floor Map)</label>
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
      {/* MODAL 3: VIEW & PRINT SINGLE QR TEMPLATE (STT 15) */}
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
      {/* MODAL 4: BATCH QR PRINT MODAL (STT 15) */}
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
            <div
              ref={printAreaRef}
              className="p-6 overflow-y-auto bg-stone-950/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
            >
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
      {/* MODAL 5: CONFIRM REGENERATE QR TOKEN */}
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
      {/* MODAL 6: CONFIRM DELETE MODAL */}
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
