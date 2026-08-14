# OrderPum — Source code

Hệ thống **order tại bàn** (QR khách + NV order hộ) cho nhà hàng / chuỗi.

Tài liệu chức năng: `../Tài liệu/Yeu_cau_chuc_nang_App_Order_Nha_Hang.md`  
Checklist: `../Tài liệu/Checklist_phat_trien_App_Order_Nha_Hang.md`

## Stack

| Thành phần | Công nghệ | Lý do |
|------------|-----------|--------|
| **BE** | ASP.NET Core 9 (C#) — Clean Architecture modular | Theo cấu trúc ảnh tham chiếu; SignalR realtime; JWT |
| **FE** | Next.js 15 + TypeScript + Tailwind | 1 codebase cho Admin / Order QR / KDS web; deploy dễ |
| **Mobile** | Expo (React Native) + TypeScript | App NV order hộ, floor map, push; chung ngôn ngữ với FE |

## Cấu trúc thư mục

```
Source code/
├── MODULES.json          # Manifest module (bật/tắt theo giai đoạn)
├── backend/              # OrderPum.sln
│   └── src/
│       ├── OrderPum.Api/             Controllers/{Module}, Hubs, Filters
│       ├── OrderPum.Application/     DTOs, Interfaces
│       ├── OrderPum.Domain/          Entities, Enums, Base
│       └── OrderPum.Infrastructure/  EF Core, Services, Security
├── frontend/             # Next.js — /admin /order /kds
├── mobile/               # Expo — app nhân viên
└── docs/
```

### Module BE (theo MODULES.json)

`Auth` · `Branch` · `Floor` · `Menu` · `Order` · `Kitchen` · `Payment` · `Promo` · `Hrm` · `Report` · `Crm` · `Notify` · `Sys` · `Inventory`

## Chạy local

### Backend

```bash
cd backend
dotnet restore
dotnet run --project src/OrderPum.Api
```

- Swagger/OpenAPI: theo launchSettings  
- Seed mặc định: `admin@orderpum.local` / `Admin@123` (PIN `1234`)  
- Connection string: `appsettings.json` → LocalDB  
- Hubs: `/hubs/order`, `/hubs/notify`

### Frontend

```bash
cd frontend
npm install
# tạo .env.local: NEXT_PUBLIC_API_URL=http://localhost:5006
npm run dev
```

### Mobile

```bash
cd mobile
npm install
# EXPO_PUBLIC_API_URL=http://<IP-máy-dev>:5006
npx expo start
```

> Emulator/device không dùng `localhost` — trỏ IP LAN của máy chạy API.

## API đã có (nền MVP)

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/login-pin` | Đăng nhập PIN |
| GET/POST | `/api/auth/users` | CRUD user (cơ bản) |
| POST | `/api/orders/sessions/open` | Mở phiên bàn |
| POST | `/api/orders/staff` | **NV order hộ** (STT 21) → gửi thẳng KDS |
| POST | `/api/orders/qr` | Khách QR order → chờ xác nhận |
| POST | `/api/orders/qr/{id}/confirm` | NV xác nhận order QR (STT 24) |
| GET | `/api/orders/sessions/{id}` | Chi tiết phiên |

## Hướng làm tiếp (Checklist GĐ1)

1. Branch / Floor / Menu CRUD API + Admin UI  
2. Floor map + NV order hộ trên Mobile  
3. Web Order QR đầy đủ  
4. KDS + SignalR  
5. Payment / Promo tối thiểu / Report DT  

Giữ **đồng bộ STT** với 2 file tài liệu khi thêm chức năng.
