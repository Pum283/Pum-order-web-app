using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using OrderPum.Application.Interfaces.Services.Auth;
using OrderPum.Application.Interfaces.Services.Branch;
using OrderPum.Application.Interfaces.Services.Floor;
using OrderPum.Application.Interfaces.Services.Menu;
using OrderPum.Application.Interfaces.Services.Order;
using OrderPum.Domain.Entities.Auth;
using OrderPum.Domain.Entities.Branch;
using OrderPum.Domain.Entities.Floor;
using OrderPum.Domain.Entities.Menu;
using OrderPum.Domain.Enums.Auth;
using OrderPum.Infrastructure.Implementations.Services.Auth;
using OrderPum.Infrastructure.Implementations.Services.Branch;
using OrderPum.Infrastructure.Implementations.Services.Floor;
using OrderPum.Infrastructure.Implementations.Services.Menu;
using OrderPum.Infrastructure.Implementations.Services.Order;
using OrderPum.Infrastructure.Persistence;
using OrderPum.Infrastructure.Security;
using System.Text;

namespace OrderPum.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<AppDbContext>(opt =>
            opt.UseSqlServer(config.GetConnectionString("DefaultConnection"), sqlOpt =>
            {
                sqlOpt.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null);
            }));

        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IRoleService, RoleService>();
        services.AddScoped<IBranchService, BranchService>();
        services.AddScoped<IFloorService, FloorService>();
        services.AddScoped<IMenuService, MenuService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<OrderPum.Application.Interfaces.Services.Kitchen.IKitchenService, OrderPum.Infrastructure.Implementations.Services.Kitchen.KitchenService>();
        services.AddScoped<OrderPum.Application.Interfaces.Services.Payment.IPaymentService, OrderPum.Infrastructure.Implementations.Services.Payment.PaymentService>();
        services.AddScoped<OrderPum.Application.Interfaces.Services.Promo.IPromoService, OrderPum.Infrastructure.Implementations.Services.Promo.PromoService>();
        services.AddScoped<OrderPum.Application.Interfaces.Services.Payment.IPaymentGatewayService, OrderPum.Infrastructure.Implementations.Services.Payment.PaymentGatewayService>();
        services.AddScoped<OrderPum.Application.Interfaces.Services.Staff.IShiftService, OrderPum.Infrastructure.Implementations.Services.Staff.ShiftService>();
        services.AddScoped<OrderPum.Application.Interfaces.Services.Staff.IAttendanceService, OrderPum.Infrastructure.Implementations.Services.Staff.AttendanceService>();
        services.AddScoped<OrderPum.Application.Interfaces.Services.Report.IReportService, OrderPum.Infrastructure.Implementations.Services.Report.ReportService>();
        services.AddScoped<OrderPum.Application.Interfaces.Services.Media.ICloudinaryService, OrderPum.Infrastructure.Implementations.Services.Media.CloudinaryService>();

        var jwtKey = config["Jwt:Key"] ?? "OrderPum_Dev_Secret_Key_Change_Me_32chars!";
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = config["Jwt:Issuer"] ?? "OrderPum",
                    ValidAudience = config["Jwt:Audience"] ?? "OrderPum.Clients",
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                };
            });

        services.AddAuthorization();
        return services;
    }

    public static async Task SeedAsync(this IServiceProvider sp)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Tự động tạo cơ sở dữ liệu và bảng nếu chưa tồn tại
        await db.Database.EnsureCreatedAsync();

        // Tự động cập nhật cột mới nếu bảng Branches, Areas, Tables, MenuCategories, MenuItems đã tồn tại từ trước
        await db.Database.ExecuteSqlRawAsync(@"
            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Branches')
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Branches') AND name = 'Code')
                    ALTER TABLE [Branches] ADD [Code] NVARCHAR(50) NOT NULL DEFAULT '';
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Branches') AND name = 'ImageUrl')
                    ALTER TABLE [Branches] ADD [ImageUrl] NVARCHAR(MAX) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Branches') AND name = 'IsTaxIncludedInPrice')
                    ALTER TABLE [Branches] ADD [IsTaxIncludedInPrice] BIT NOT NULL DEFAULT 0;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Branches') AND name = 'IsServiceChargeIncluded')
                    ALTER TABLE [Branches] ADD [IsServiceChargeIncluded] BIT NOT NULL DEFAULT 0;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Branches') AND name = 'ReceiptHeaderNote')
                    ALTER TABLE [Branches] ADD [ReceiptHeaderNote] NVARCHAR(500) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Branches') AND name = 'ReceiptFooterNote')
                    ALTER TABLE [Branches] ADD [ReceiptFooterNote] NVARCHAR(500) NULL;
            END

            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Areas')
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Areas') AND name = 'IsActive')
                    ALTER TABLE [Areas] ADD [IsActive] BIT NOT NULL DEFAULT 1;
            END

            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Tables')
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tables') AND name = 'Status')
                    ALTER TABLE [Tables] ADD [Status] NVARCHAR(50) NOT NULL DEFAULT 'Available';
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tables') AND name = 'PosX')
                    ALTER TABLE [Tables] ADD [PosX] INT NOT NULL DEFAULT 0;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tables') AND name = 'PosY')
                    ALTER TABLE [Tables] ADD [PosY] INT NOT NULL DEFAULT 0;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tables') AND name = 'IsActive')
                    ALTER TABLE [Tables] ADD [IsActive] BIT NOT NULL DEFAULT 1;
            END

            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'MenuCategories')
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MenuCategories') AND name = 'Code')
                    ALTER TABLE [MenuCategories] ADD [Code] NVARCHAR(50) NOT NULL DEFAULT '';
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MenuCategories') AND name = 'ImageUrl')
                    ALTER TABLE [MenuCategories] ADD [ImageUrl] NVARCHAR(MAX) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MenuCategories') AND name = 'IsActive')
                    ALTER TABLE [MenuCategories] ADD [IsActive] BIT NOT NULL DEFAULT 1;
            END

            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'MenuItems')
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MenuItems') AND name = 'Code')
                    ALTER TABLE [MenuItems] ADD [Code] NVARCHAR(50) NOT NULL DEFAULT '';
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MenuItems') AND name = 'KitchenStation')
                    ALTER TABLE [MenuItems] ADD [KitchenStation] NVARCHAR(50) NOT NULL DEFAULT 'Kitchen';
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MenuItems') AND name = 'PreparationMinutes')
                    ALTER TABLE [MenuItems] ADD [PreparationMinutes] INT NOT NULL DEFAULT 15;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MenuItems') AND name = 'Is86ed')
                    ALTER TABLE [MenuItems] ADD [Is86ed] BIT NOT NULL DEFAULT 0;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MenuItems') AND name = 'IsActive')
                    ALTER TABLE [MenuItems] ADD [IsActive] BIT NOT NULL DEFAULT 1;
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MenuItemOptions')
            BEGIN
                CREATE TABLE [MenuItemOptions] (
                    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                    [MenuItemId] UNIQUEIDENTIFIER NOT NULL,
                    [Name] NVARCHAR(150) NOT NULL,
                    [OptionType] NVARCHAR(50) NOT NULL DEFAULT 'Single',
                    [IsRequired] BIT NOT NULL DEFAULT 0,
                    [SortOrder] INT NOT NULL DEFAULT 1,
                    [CreatedAt] DATETIME2 NOT NULL,
                    [UpdatedAt] DATETIME2 NULL,
                    [IsDeleted] BIT NOT NULL DEFAULT 0
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MenuItemOptionValues')
            BEGIN
                CREATE TABLE [MenuItemOptionValues] (
                    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                    [OptionId] UNIQUEIDENTIFIER NOT NULL,
                    [Name] NVARCHAR(150) NOT NULL,
                    [ExtraPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
                    [IsDefault] BIT NOT NULL DEFAULT 0,
                    [IsAvailable] BIT NOT NULL DEFAULT 1,
                    [SortOrder] INT NOT NULL DEFAULT 1,
                    [CreatedAt] DATETIME2 NOT NULL,
                    [UpdatedAt] DATETIME2 NULL,
                    [IsDeleted] BIT NOT NULL DEFAULT 0
                );
            END

            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'TableSessions')
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TableSessions') AND name = 'SessionCode')
                    ALTER TABLE [TableSessions] ADD [SessionCode] NVARCHAR(50) NOT NULL DEFAULT '';
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TableSessions') AND name = 'GuestCount')
                    ALTER TABLE [TableSessions] ADD [GuestCount] INT NOT NULL DEFAULT 1;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TableSessions') AND name = 'OpenedByUserId')
                    ALTER TABLE [TableSessions] ADD [OpenedByUserId] UNIQUEIDENTIFIER NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TableSessions') AND name = 'CustomerName')
                    ALTER TABLE [TableSessions] ADD [CustomerName] NVARCHAR(200) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TableSessions') AND name = 'CustomerPhone')
                    ALTER TABLE [TableSessions] ADD [CustomerPhone] NVARCHAR(50) NULL;
            END

            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderTickets')
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderTickets') AND name = 'TicketNumber')
                    ALTER TABLE [OrderTickets] ADD [TicketNumber] INT NOT NULL DEFAULT 1;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderTickets') AND name = 'CustomerName')
                    ALTER TABLE [OrderTickets] ADD [CustomerName] NVARCHAR(200) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderTickets') AND name = 'CustomerPhone')
                    ALTER TABLE [OrderTickets] ADD [CustomerPhone] NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderTickets') AND name = 'Note')
                    ALTER TABLE [OrderTickets] ADD [Note] NVARCHAR(500) NULL;
            END

            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderLines')
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderLines') AND name = 'SessionId')
                    ALTER TABLE [OrderLines] ADD [SessionId] UNIQUEIDENTIFIER NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderLines') AND name = 'ItemCodeSnapshot')
                    ALTER TABLE [OrderLines] ADD [ItemCodeSnapshot] NVARCHAR(50) NOT NULL DEFAULT '';
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderLines') AND name = 'SelectedOptionsText')
                    ALTER TABLE [OrderLines] ADD [SelectedOptionsText] NVARCHAR(MAX) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderLines') AND name = 'KitchenStation')
                    ALTER TABLE [OrderLines] ADD [KitchenStation] NVARCHAR(50) NOT NULL DEFAULT 'Kitchen';
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderLines') AND name = 'ReadyAt')
                    ALTER TABLE [OrderLines] ADD [ReadyAt] DATETIME2 NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderLines') AND name = 'ServedAt')
                    ALTER TABLE [OrderLines] ADD [ServedAt] DATETIME2 NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TableNotifications')
            BEGIN
                CREATE TABLE [TableNotifications] (
                    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                    [BranchId] UNIQUEIDENTIFIER NOT NULL,
                    [TableId] UNIQUEIDENTIFIER NOT NULL,
                    [SessionId] UNIQUEIDENTIFIER NULL,
                    [Type] NVARCHAR(50) NOT NULL DEFAULT 'CallStaff',
                    [Message] NVARCHAR(500) NOT NULL,
                    [IsHandled] BIT NOT NULL DEFAULT 0,
                    [HandledByUserId] UNIQUEIDENTIFIER NULL,
                    [HandledAt] DATETIME2 NULL,
                    [CreatedAt] DATETIME2 NOT NULL,
                    [UpdatedAt] DATETIME2 NULL,
                    [IsDeleted] BIT NOT NULL DEFAULT 0
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StaffAreaAssignments')
            BEGIN
                CREATE TABLE [StaffAreaAssignments] (
                    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                    [BranchId] UNIQUEIDENTIFIER NOT NULL,
                    [UserId] UNIQUEIDENTIFIER NOT NULL,
                    [AreaId] UNIQUEIDENTIFIER NOT NULL,
                    [IsActive] BIT NOT NULL DEFAULT 1,
                    [AssignedAt] DATETIME2 NOT NULL,
                    [CreatedAt] DATETIME2 NOT NULL,
                    [UpdatedAt] DATETIME2 NULL,
                    [IsDeleted] BIT NOT NULL DEFAULT 0
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Invoices')
            BEGIN
                CREATE TABLE [Invoices] (
                    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                    [BranchId] UNIQUEIDENTIFIER NOT NULL,
                    [SessionId] UNIQUEIDENTIFIER NULL,
                    [InvoiceNumber] NVARCHAR(50) NOT NULL,
                    [TableCodeSnapshot] NVARCHAR(100) NOT NULL DEFAULT '',
                    [TableNameSnapshot] NVARCHAR(150) NOT NULL DEFAULT '',
                    [MergedSessionIdsText] NVARCHAR(MAX) NULL,
                    [SubTotalAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
                    [DiscountAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
                    [VoucherCode] NVARCHAR(50) NULL,
                    [TaxRatePercent] DECIMAL(18,2) NOT NULL DEFAULT 0,
                    [TaxAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
                    [IsTaxIncludedInPrice] BIT NOT NULL DEFAULT 0,
                    [ServiceChargePercent] DECIMAL(18,2) NOT NULL DEFAULT 0,
                    [ServiceChargeAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
                    [IsServiceChargeIncluded] BIT NOT NULL DEFAULT 0,
                    [FinalAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
                    [PaidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
                    [ChangeAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
                    [PaymentStatus] NVARCHAR(50) NOT NULL DEFAULT 'Unpaid',
                    [CashierUserId] UNIQUEIDENTIFIER NULL,
                    [CashierNameSnapshot] NVARCHAR(150) NOT NULL DEFAULT '',
                    [CustomerName] NVARCHAR(150) NULL,
                    [CustomerPhone] NVARCHAR(50) NULL,
                    [Note] NVARCHAR(500) NULL,
                    [PaidAt] DATETIME2 NULL,
                    [CreatedAt] DATETIME2 NOT NULL,
                    [UpdatedAt] DATETIME2 NULL,
                    [IsDeleted] BIT NOT NULL DEFAULT 0
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InvoiceLines')
            BEGIN
                CREATE TABLE [InvoiceLines] (
                    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                    [InvoiceId] UNIQUEIDENTIFIER NOT NULL,
                    [OrderLineId] UNIQUEIDENTIFIER NULL,
                    [MenuItemId] UNIQUEIDENTIFIER NOT NULL,
                    [ItemCode] NVARCHAR(50) NOT NULL DEFAULT '',
                    [ItemName] NVARCHAR(200) NOT NULL DEFAULT '',
                    [UnitPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
                    [Quantity] INT NOT NULL DEFAULT 1,
                    [TotalPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
                    [SelectedOptionsText] NVARCHAR(MAX) NULL,
                    [Note] NVARCHAR(500) NULL,
                    [CreatedAt] DATETIME2 NOT NULL,
                    [UpdatedAt] DATETIME2 NULL,
                    [IsDeleted] BIT NOT NULL DEFAULT 0
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Payments')
            BEGIN
                CREATE TABLE [Payments] (
                    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                    [InvoiceId] UNIQUEIDENTIFIER NOT NULL,
                    [PaymentMethod] NVARCHAR(50) NOT NULL DEFAULT 'Cash',
                    [Amount] DECIMAL(18,2) NOT NULL DEFAULT 0,
                    [TransactionCode] NVARCHAR(100) NULL,
                    [Note] NVARCHAR(500) NULL,
                    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Success',
                    [PaidAt] DATETIME2 NOT NULL,
                    [CreatedAt] DATETIME2 NOT NULL,
                    [UpdatedAt] DATETIME2 NULL,
                    [IsDeleted] BIT NOT NULL DEFAULT 0
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Promotions')
            BEGIN
                CREATE TABLE [Promotions] (
                    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                    [BranchId] UNIQUEIDENTIFIER NULL,
                    [Code] NVARCHAR(50) NOT NULL DEFAULT '',
                    [Name] NVARCHAR(200) NOT NULL,
                    [Description] NVARCHAR(500) NULL,
                    [DiscountType] NVARCHAR(50) NOT NULL DEFAULT 'Percent',
                    [DiscountValue] DECIMAL(18,2) NOT NULL DEFAULT 0,
                    [MaxDiscountAmount] DECIMAL(18,2) NULL,
                    [MinOrderAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
                    [TargetType] NVARCHAR(50) NOT NULL DEFAULT 'Invoice',
                    [TargetId] UNIQUEIDENTIFIER NULL,
                    [IsAutoApply] BIT NOT NULL DEFAULT 0,
                    [StartAt] DATETIME2 NULL,
                    [EndAt] DATETIME2 NULL,
                    [UsageLimit] INT NULL,
                    [UsedCount] INT NOT NULL DEFAULT 0,
                    [IsActive] BIT NOT NULL DEFAULT 1,
                    [CreatedAt] DATETIME2 NOT NULL,
                    [UpdatedAt] DATETIME2 NULL,
                    [IsDeleted] BIT NOT NULL DEFAULT 0
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PaymentGatewayConfigs')
            BEGIN
                CREATE TABLE [PaymentGatewayConfigs] (
                    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                    [BranchId] UNIQUEIDENTIFIER NULL,
                    [Provider] NVARCHAR(50) NOT NULL DEFAULT 'VNPay',
                    [IsActive] BIT NOT NULL DEFAULT 1,
                    [IsSandbox] BIT NOT NULL DEFAULT 1,
                    [MerchantId] NVARCHAR(100) NOT NULL DEFAULT '',
                    [SecretKey] NVARCHAR(200) NOT NULL DEFAULT '',
                    [AccessKey] NVARCHAR(100) NULL,
                    [EndpointUrl] NVARCHAR(300) NULL,
                    [ReturnUrl] NVARCHAR(300) NULL,
                    [IpnUrl] NVARCHAR(300) NULL,
                    [ExtraSettingsJson] NVARCHAR(MAX) NULL,
                    [CreatedAt] DATETIME2 NOT NULL,
                    [UpdatedAt] DATETIME2 NULL,
                    [IsDeleted] BIT NOT NULL DEFAULT 0
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ShiftTemplates')
            BEGIN
                CREATE TABLE [ShiftTemplates] (
                    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                    [BranchId] UNIQUEIDENTIFIER NULL,
                    [Code] NVARCHAR(50) NOT NULL DEFAULT '',
                    [Name] NVARCHAR(200) NOT NULL,
                    [Description] NVARCHAR(500) NULL,
                    [StartTime] TIME NOT NULL,
                    [EndTime] TIME NOT NULL,
                    [BreakMinutes] INT NOT NULL DEFAULT 30,
                    [HourlyRateMultiplier] DECIMAL(18,2) NOT NULL DEFAULT 1.0,
                    [ColorHex] NVARCHAR(50) NOT NULL DEFAULT '#10b981',
                    [IsActive] BIT NOT NULL DEFAULT 1,
                    [CreatedAt] DATETIME2 NOT NULL,
                    [UpdatedAt] DATETIME2 NULL,
                    [IsDeleted] BIT NOT NULL DEFAULT 0
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StaffShiftSchedules')
            BEGIN
                CREATE TABLE [StaffShiftSchedules] (
                    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                    [BranchId] UNIQUEIDENTIFIER NOT NULL,
                    [UserId] UNIQUEIDENTIFIER NOT NULL,
                    [ShiftTemplateId] UNIQUEIDENTIFIER NOT NULL,
                    [AreaId] UNIQUEIDENTIFIER NULL,
                    [WorkDate] DATE NOT NULL,
                    [CustomStartTime] TIME NULL,
                    [CustomEndTime] TIME NULL,
                    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Scheduled',
                    [Note] NVARCHAR(500) NULL,
                    [AssignedByUserId] UNIQUEIDENTIFIER NULL,
                    [CreatedAt] DATETIME2 NOT NULL,
                    [UpdatedAt] DATETIME2 NULL,
                    [IsDeleted] BIT NOT NULL DEFAULT 0
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AttendanceRecords')
            BEGIN
                CREATE TABLE [AttendanceRecords] (
                    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                    [BranchId] UNIQUEIDENTIFIER NOT NULL,
                    [UserId] UNIQUEIDENTIFIER NOT NULL,
                    [ShiftScheduleId] UNIQUEIDENTIFIER NULL,
                    [ShiftTemplateId] UNIQUEIDENTIFIER NULL,
                    [WorkDate] DATE NOT NULL,
                    [CheckInTime] DATETIME2 NULL,
                    [CheckOutTime] DATETIME2 NULL,
                    [CheckInMethod] NVARCHAR(50) NOT NULL DEFAULT 'WebSelf',
                    [CheckOutMethod] NVARCHAR(50) NULL,
                    [CheckInPhotoUrl] NVARCHAR(500) NULL,
                    [LocationNote] NVARCHAR(200) NULL,
                    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Present',
                    [LateMinutes] INT NOT NULL DEFAULT 0,
                    [EarlyLeaveMinutes] INT NOT NULL DEFAULT 0,
                    [ActualWorkHours] DECIMAL(18,2) NOT NULL DEFAULT 0.0,
                    [Note] NVARCHAR(500) NULL,
                    [ApprovedByUserId] UNIQUEIDENTIFIER NULL,
                    [CreatedAt] DATETIME2 NOT NULL,
                    [UpdatedAt] DATETIME2 NULL,
                    [IsDeleted] BIT NOT NULL DEFAULT 0
                );
            END
        ");

        // 1. Seed Bảng Roles (Bảng Vai trò động trong CSDL)
        var systemRoles = new List<Role>
        {
            new()
            {
                Code = "ChainDirector",
                Name = "Giám đốc chuỗi",
                Level = 1,
                Description = "Toàn quyền quản trị hệ thống, tài chính và tất cả chi nhánh",
                IsSystem = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Code = "RestaurantOwner",
                Name = "Chủ nhà hàng",
                Level = 2,
                Description = "Quản lý hoạt động kinh doanh và các chi nhánh trực thuộc",
                IsSystem = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Code = "Manager",
                Name = "Quản lý chi nhánh",
                Level = 3,
                Description = "Quản lý vận hành ca, bàn, thực đơn và nhân sự tại chi nhánh",
                IsSystem = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Code = "ShiftLeader",
                Name = "Trưởng ca",
                Level = 4,
                Description = "Điều phối phục vụ, giám sát bếp/bar và hỗ trợ thanh toán",
                IsSystem = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Code = "WaitStaff",
                Name = "Nhân viên phục vụ",
                Level = 5,
                Description = "Order tại bàn, phục vụ món ăn và hỗ trợ khách hàng",
                IsSystem = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Code = "Cashier",
                Name = "Thu ngân",
                Level = 6,
                Description = "Tiếp nhận thanh toán, in hóa đơn và đối soát ca thu",
                IsSystem = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Code = "Chef",
                Name = "Bếp trưởng / Pha chế",
                Level = 6,
                Description = "Tiếp nhận chế biến món ăn trên màn hình KDS",
                IsSystem = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        foreach (var r in systemRoles)
        {
            var existing = await db.Roles.FirstOrDefaultAsync(x => x.Code == r.Code);
            if (existing == null)
            {
                db.Roles.Add(r);
            }
            else
            {
                existing.Name = r.Name;
                existing.Level = r.Level;
                existing.Description = r.Description;
                existing.IsSystem = true;
                existing.IsActive = true;
            }
        }
        await db.SaveChangesAsync();

        // 2. Seed Chi nhánh mẫu (Branches)
        var branchQ1 = await db.Branches.FirstOrDefaultAsync(b => b.Code == "CN01");
        if (branchQ1 == null)
        {
            branchQ1 = new Branch
            {
                Id = Guid.NewGuid(),
                Code = "CN01",
                Name = "OrderPum - Quận 1 (Flagship)",
                Address = "123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
                Phone = "0901234567",
                OpenHours = "08:00 - 23:00",
                ImageUrl = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
                TaxRatePercent = 8.00m,
                ServiceChargePercent = 5.00m,
                Currency = "VND",
                IsTaxIncludedInPrice = false,
                IsServiceChargeIncluded = false,
                ReceiptHeaderNote = "CHÀO MỪNG QUÝ KHÁCH ĐẾN VỚI ORDERPUM FLAGSHIP",
                ReceiptFooterNote = "Cảm ơn quý khách và hẹn gặp lại!",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Branches.Add(branchQ1);
        }

        var branchHN = await db.Branches.FirstOrDefaultAsync(b => b.Code == "CN02");
        if (branchHN == null)
        {
            branchHN = new Branch
            {
                Id = Guid.NewGuid(),
                Code = "CN02",
                Name = "OrderPum - Hoàn Kiếm Hà Nội",
                Address = "45 Phố Tràng Tiền, Quận Hoàn Kiếm, Hà Nội",
                Phone = "0909888999",
                OpenHours = "08:30 - 22:30",
                ImageUrl = "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80",
                TaxRatePercent = 8.00m,
                ServiceChargePercent = 0.00m,
                Currency = "VND",
                IsTaxIncludedInPrice = true,
                IsServiceChargeIncluded = false,
                ReceiptHeaderNote = "ORDERPUM HOÀN KIẾM HÂN HẠNH PHỤC VỤ",
                ReceiptFooterNote = "Chúc quý khách ngon miệng!",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Branches.Add(branchHN);
        }
        await db.SaveChangesAsync();

        // 3. Seed Tài khoản mẫu
        var roleChainDirector = await db.Roles.FirstAsync(r => r.Code == "ChainDirector");
        var roleOwner = await db.Roles.FirstAsync(r => r.Code == "RestaurantOwner");
        var roleManager = await db.Roles.FirstAsync(r => r.Code == "Manager");
        var roleWaitStaff = await db.Roles.FirstAsync(r => r.Code == "WaitStaff");

        var sampleUsers = new List<UserAccount>
        {
            new()
            {
                Id = Guid.NewGuid(),
                PhoneOrEmail = "director@pum.vn",
                DisplayName = "Nguyễn Văn Giám Đốc",
                PasswordHash = PasswordHasher.Hash("Director@123"),
                PinHash = PasswordHasher.Hash("111111"),
                RoleId = roleChainDirector.Id,
                CustomRoleCode = "ChainDirector",
                Role = StaffRole.ChainDirector,
                BranchId = null,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                PhoneOrEmail = "owner@pum.vn",
                DisplayName = "Trần Thị Chủ Quán",
                PasswordHash = PasswordHasher.Hash("Owner@123"),
                PinHash = PasswordHasher.Hash("222222"),
                RoleId = roleOwner.Id,
                CustomRoleCode = "RestaurantOwner",
                Role = StaffRole.RestaurantOwner,
                BranchId = branchQ1.Id,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                PhoneOrEmail = "manager.q1@pum.vn",
                DisplayName = "Lê Hoàng Quản Lý Q1",
                PasswordHash = PasswordHasher.Hash("Manager@123"),
                PinHash = PasswordHasher.Hash("333333"),
                RoleId = roleManager.Id,
                CustomRoleCode = "Manager",
                Role = StaffRole.Manager,
                BranchId = branchQ1.Id,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                PhoneOrEmail = "staff.q1@pum.vn",
                DisplayName = "Phạm Văn Phục Vụ",
                PasswordHash = PasswordHasher.Hash("Staff@123"),
                PinHash = PasswordHasher.Hash("1234"),
                RoleId = roleWaitStaff.Id,
                CustomRoleCode = "WaitStaff",
                Role = StaffRole.FullTimeStaff,
                BranchId = branchQ1.Id,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow
            }
        };

        foreach (var user in sampleUsers)
        {
            var existingUser = await db.Users.FirstOrDefaultAsync(u => u.PhoneOrEmail == user.PhoneOrEmail);
            if (existingUser == null)
            {
                db.Users.Add(user);
            }
            else
            {
                if (existingUser.RoleId == null && user.RoleId != null)
                {
                    existingUser.RoleId = user.RoleId;
                    existingUser.CustomRoleCode = user.CustomRoleCode;
                }
            }
        }
        await db.SaveChangesAsync();

        // 4. Seed Khu vực (Areas) & Bàn ăn (DiningTables) cho Chi nhánh mẫu
        var existingAreasQ1 = await db.Areas.Where(a => a.BranchId == branchQ1.Id && !a.IsDeleted).ToListAsync();
        if (existingAreasQ1.Count == 0)
        {
            var area1 = new Area { Id = Guid.NewGuid(), BranchId = branchQ1.Id, Name = "Tầng 1 - Sảnh chính", SortOrder = 1, IsActive = true, CreatedAt = DateTime.UtcNow };
            var area2 = new Area { Id = Guid.NewGuid(), BranchId = branchQ1.Id, Name = "Tầng 2 - Phòng máy lạnh", SortOrder = 2, IsActive = true, CreatedAt = DateTime.UtcNow };
            var area3 = new Area { Id = Guid.NewGuid(), BranchId = branchQ1.Id, Name = "Sân Vườn ngoài trời", SortOrder = 3, IsActive = true, CreatedAt = DateTime.UtcNow };
            var area4 = new Area { Id = Guid.NewGuid(), BranchId = branchQ1.Id, Name = "Phòng VIP", SortOrder = 4, IsActive = true, CreatedAt = DateTime.UtcNow };

            db.Areas.AddRange(area1, area2, area3, area4);
            await db.SaveChangesAsync();

            // Seed Bàn ăn cho từng khu vực
            var tablesQ1 = new List<DiningTable>
            {
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area1.Id, Code = "B01", Name = "Bàn 01", Capacity = 4, QrToken = Guid.NewGuid().ToString("N"), Status = "Available", PosX = 10, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area1.Id, Code = "B02", Name = "Bàn 02", Capacity = 4, QrToken = Guid.NewGuid().ToString("N"), Status = "Occupied", PosX = 30, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area1.Id, Code = "B03", Name = "Bàn 03", Capacity = 6, QrToken = Guid.NewGuid().ToString("N"), Status = "Available", PosX = 50, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area1.Id, Code = "B04", Name = "Bàn 04", Capacity = 2, QrToken = Guid.NewGuid().ToString("N"), Status = "NeedsCleaning", PosX = 70, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },
                
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area2.Id, Code = "B05", Name = "Bàn 05", Capacity = 4, QrToken = Guid.NewGuid().ToString("N"), Status = "Available", PosX = 10, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area2.Id, Code = "B06", Name = "Bàn 06", Capacity = 8, QrToken = Guid.NewGuid().ToString("N"), Status = "Reserved", PosX = 40, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area2.Id, Code = "B07", Name = "Bàn 07", Capacity = 4, QrToken = Guid.NewGuid().ToString("N"), Status = "Available", PosX = 70, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },

                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area3.Id, Code = "SV01", Name = "Bàn Sân Vườn 01", Capacity = 4, QrToken = Guid.NewGuid().ToString("N"), Status = "Available", PosX = 20, PosY = 20, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area3.Id, Code = "SV02", Name = "Bàn Sân Vườn 02", Capacity = 6, QrToken = Guid.NewGuid().ToString("N"), Status = "Available", PosX = 60, PosY = 20, IsActive = true, CreatedAt = DateTime.UtcNow },

                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area4.Id, Code = "VIP01", Name = "Phòng VIP Hoàng Gia", Capacity = 12, QrToken = Guid.NewGuid().ToString("N"), Status = "Available", PosX = 50, PosY = 50, IsActive = true, CreatedAt = DateTime.UtcNow }
            };

            db.Tables.AddRange(tablesQ1);
            await db.SaveChangesAsync();
        }

        var existingAreasHN = await db.Areas.Where(a => a.BranchId == branchHN.Id && !a.IsDeleted).ToListAsync();
        if (existingAreasHN.Count == 0)
        {
            var areaHN1 = new Area { Id = Guid.NewGuid(), BranchId = branchHN.Id, Name = "Tầng 1 - Sảnh trung tâm", SortOrder = 1, IsActive = true, CreatedAt = DateTime.UtcNow };
            var areaHN2 = new Area { Id = Guid.NewGuid(), BranchId = branchHN.Id, Name = "Tầng 2 - Không gian mở", SortOrder = 2, IsActive = true, CreatedAt = DateTime.UtcNow };

            db.Areas.AddRange(areaHN1, areaHN2);
            await db.SaveChangesAsync();

            var tablesHN = new List<DiningTable>
            {
                new() { Id = Guid.NewGuid(), BranchId = branchHN.Id, AreaId = areaHN1.Id, Code = "HN-01", Name = "Bàn HN 01", Capacity = 4, QrToken = Guid.NewGuid().ToString("N"), Status = "Available", PosX = 10, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), BranchId = branchHN.Id, AreaId = areaHN1.Id, Code = "HN-02", Name = "Bàn HN 02", Capacity = 6, QrToken = Guid.NewGuid().ToString("N"), Status = "Occupied", PosX = 40, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), BranchId = branchHN.Id, AreaId = areaHN2.Id, Code = "HN-03", Name = "Bàn HN 03", Capacity = 4, QrToken = Guid.NewGuid().ToString("N"), Status = "Available", PosX = 20, PosY = 20, IsActive = true, CreatedAt = DateTime.UtcNow }
            };

            db.Tables.AddRange(tablesHN);
            await db.SaveChangesAsync();
        }

        // 5. Seed Thực đơn mẫu (Menu Categories, Items & Options - STT 34, 35, 36)
        var allActiveBranches = await db.Branches.Where(b => !b.IsDeleted).ToListAsync();
        foreach (var br in allActiveBranches)
        {
            var branchCats = await db.MenuCategories.Where(c => c.BranchId == br.Id && !c.IsDeleted).ToListAsync();
            var catKhaiVi = branchCats.FirstOrDefault(c => c.Code == "KHAI_VI");
            if (catKhaiVi == null)
            {
                catKhaiVi = new MenuCategory
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    Code = "KHAI_VI",
                    Name = "Món Khai Vị & Ăn Nhẹ",
                    ImageUrl = "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80",
                    SortOrder = 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                db.MenuCategories.Add(catKhaiVi);
            }

            var catNuong = branchCats.FirstOrDefault(c => c.Code == "MON_NUONG");
            if (catNuong == null)
            {
                catNuong = new MenuCategory
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    Code = "MON_NUONG",
                    Name = "Món Nướng BBQ Đặc Biệt",
                    ImageUrl = "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
                    SortOrder = 2,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                db.MenuCategories.Add(catNuong);
            }

            var catLau = branchCats.FirstOrDefault(c => c.Code == "LAU_HAI_SAN");
            if (catLau == null)
            {
                catLau = new MenuCategory
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    Code = "LAU_HAI_SAN",
                    Name = "Lẩu & Món Chính Thượng Hạng",
                    ImageUrl = "https://images.unsplash.com/photo-1547928576-a4a33237cbc3?w=600&q=80",
                    SortOrder = 3,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                db.MenuCategories.Add(catLau);
            }

            var catDoUong = branchCats.FirstOrDefault(c => c.Code == "DO_UONG");
            if (catDoUong == null)
            {
                catDoUong = new MenuCategory
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    Code = "DO_UONG",
                    Name = "Đồ Uống & Trà Trái Cây",
                    ImageUrl = "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80",
                    SortOrder = 4,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                db.MenuCategories.Add(catDoUong);
            }

            var catTrangMieng = branchCats.FirstOrDefault(c => c.Code == "TRANG_MIENG");
            if (catTrangMieng == null)
            {
                catTrangMieng = new MenuCategory
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    Code = "TRANG_MIENG",
                    Name = "Tráng Miệng & Chè Cung Đình",
                    ImageUrl = "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80",
                    SortOrder = 5,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                db.MenuCategories.Add(catTrangMieng);
            }

            await db.SaveChangesAsync();

            var hasItems = await db.MenuItems.AnyAsync(i => i.BranchId == br.Id && !i.IsDeleted);
            if (!hasItems)
            {

                // ---------------- KHAI VỊ ----------------
                var itemSalad = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catKhaiVi.Id,
                    Code = "KV01",
                    Name = "Salad Cá Hồi Sốt Chanh Dây",
                    Description = "Cá hồi Na Uy tươi béo ngậy thái hạt lựu, rau xà lách thủy canh giòn ngọt kết hợp sốt chanh dây thơm thanh.",
                    ImageUrl = "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",
                    Price = 125000,
                    Unit = "Đĩa",
                    KitchenStation = "Kitchen",
                    PreparationMinutes = 10,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var itemGoiNgoSen = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catKhaiVi.Id,
                    Code = "KV02",
                    Name = "Gỏi Ngó Sen Tôm Thịt Cung Đình",
                    Description = "Ngó sen giòn sần sật, tôm sú tươi luộc ngọt thịt, tai heo giòn dai trộn nước mắm chua ngọt và lạc rang bùi béo.",
                    ImageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
                    Price = 89000,
                    Unit = "Đĩa",
                    KitchenStation = "Kitchen",
                    PreparationMinutes = 10,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var itemKhoaiTay = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catKhaiVi.Id,
                    Code = "KV03",
                    Name = "Khoai Tây Chiên Phô Mai Lắc",
                    Description = "Khoai tây cọng Bỉ chiên vàng giòn rụm, lắc đều bột phô mai béo ngậy chấm cùng sốt tương cà tương ớt.",
                    ImageUrl = "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80",
                    Price = 55000,
                    Unit = "Đĩa",
                    KitchenStation = "Kitchen",
                    PreparationMinutes = 8,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var itemNemHaiSan = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catKhaiVi.Id,
                    Code = "KV04",
                    Name = "Nem Rán Hải Sản Sốt Mayonnaise (6 Cuốn)",
                    Description = "Vỏ ram vàng ruộm giòn tan, nhân tôm mực tươi quện sốt mayonnaise béo thơm hấp dẫn.",
                    ImageUrl = "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80",
                    Price = 75000,
                    Unit = "Phần",
                    KitchenStation = "Kitchen",
                    PreparationMinutes = 12,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                // ---------------- MÓN NƯỚNG BBQ ----------------
                var itemBoFuji = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catNuong.Id,
                    Code = "BBQ01",
                    Name = "Bò Fuji Nướng Đá Sốt Tiêu Đen",
                    Description = "Thịt bò Fuji Nhật Bản vân mỡ mềm mọng, nướng đá nham thạch giữ trọn vị ngọt tự nhiên kết hợp sốt tiêu đen đậm đà.",
                    ImageUrl = "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
                    Price = 189000,
                    Unit = "Phần",
                    KitchenStation = "Kitchen",
                    PreparationMinutes = 15,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var optDoChin = new MenuItemOption
                {
                    Id = Guid.NewGuid(),
                    MenuItemId = itemBoFuji.Id,
                    Name = "Độ chín thịt",
                    OptionType = "Single",
                    IsRequired = true,
                    SortOrder = 1,
                    CreatedAt = DateTime.UtcNow,
                    Values = new List<MenuItemOptionValue>
                    {
                        new() { Id = Guid.NewGuid(), Name = "Tái vừa (Medium Rare)", ExtraPrice = 0, IsDefault = true, IsAvailable = true, SortOrder = 1, CreatedAt = DateTime.UtcNow },
                        new() { Id = Guid.NewGuid(), Name = "Chín vừa (Medium)", ExtraPrice = 0, IsDefault = false, IsAvailable = true, SortOrder = 2, CreatedAt = DateTime.UtcNow },
                        new() { Id = Guid.NewGuid(), Name = "Chín kỹ (Well Done)", ExtraPrice = 0, IsDefault = false, IsAvailable = true, SortOrder = 3, CreatedAt = DateTime.UtcNow }
                    }
                };

                var optToppingBo = new MenuItemOption
                {
                    Id = Guid.NewGuid(),
                    MenuItemId = itemBoFuji.Id,
                    Name = "Topping gọi thêm",
                    OptionType = "Multiple",
                    IsRequired = false,
                    SortOrder = 2,
                    CreatedAt = DateTime.UtcNow,
                    Values = new List<MenuItemOptionValue>
                    {
                        new() { Id = Guid.NewGuid(), Name = "Phô mai Mozzarella nướng kéo sợi", ExtraPrice = 25000, IsDefault = false, IsAvailable = true, SortOrder = 1, CreatedAt = DateTime.UtcNow },
                        new() { Id = Guid.NewGuid(), Name = "Trứng gà non lòng đào", ExtraPrice = 20000, IsDefault = false, IsAvailable = true, SortOrder = 2, CreatedAt = DateTime.UtcNow }
                    }
                };
                itemBoFuji.Options.Add(optDoChin);
                itemBoFuji.Options.Add(optToppingBo);

                var itemDeSuonBo = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catNuong.Id,
                    Code = "BBQ02",
                    Name = "Dẻ Sườn Bò Mỹ Nướng Sốt Cay Hàn Quốc",
                    Description = "Dẻ sườn bò Mỹ chọn lọc tẩm ướp 24h với sốt ớt Gochujang và mật ong rừng, nướng than hoa thơm lừng.",
                    ImageUrl = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
                    Price = 229000,
                    Unit = "Đĩa",
                    KitchenStation = "Kitchen",
                    PreparationMinutes = 18,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var itemBaChiNam = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catNuong.Id,
                    Code = "BBQ03",
                    Name = "Ba Chỉ Bò Mỹ Cuộn Nấm Kim Châm (8 Cuộn)",
                    Description = "Những lát ba chỉ bò Mỹ xen kẽ nạc mỡ mềm ngọt cuộn nấm kim châm thanh mát chấm sốt mè rang béo ngậy.",
                    ImageUrl = "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80",
                    Price = 139000,
                    Unit = "Đĩa",
                    KitchenStation = "Kitchen",
                    PreparationMinutes = 12,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var itemGaNuong = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catNuong.Id,
                    Code = "BBQ04",
                    Name = "Gà Nướng Mật Ong Rừng Tây Bắc",
                    Description = "Đùi gà ướp sốt mắc khén và mật ong rừng nướng than hoa vàng giòn da, thịt mềm ngọt đậm vị.",
                    ImageUrl = "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80",
                    Price = 165000,
                    Unit = "Đĩa",
                    KitchenStation = "Kitchen",
                    PreparationMinutes = 20,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var itemTomNuong = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catNuong.Id,
                    Code = "BBQ05",
                    Name = "Tôm Sú Biển Nướng Muối Ớt Tây Ninh (6 Con)",
                    Description = "Tôm sú sống tươi nhảy nướng muối ớt cay xè thơm lừng, thịt chắc ngọt giòn sần sật.",
                    ImageUrl = "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80",
                    Price = 179000,
                    Unit = "Đĩa",
                    KitchenStation = "Kitchen",
                    PreparationMinutes = 15,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                // ---------------- LẨU & MÓN CHÍNH ----------------
                var itemLauThai = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catLau.Id,
                    Code = "LAU01",
                    Name = "Lẩu Thái Hải Sản Tomyum Thượng Hạng",
                    Description = "Nước dùng Tomyum chua cay chuẩn vị Thái, kèm đĩa tôm sú, mực nháy, nghêu trắng, ba chỉ bò Mỹ và đĩa rau nấm tươi xanh.",
                    ImageUrl = "https://images.unsplash.com/photo-1547928576-a4a33237cbc3?w=800&q=80",
                    Price = 299000,
                    Unit = "Nồi",
                    KitchenStation = "Kitchen",
                    PreparationMinutes = 20,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var optCay = new MenuItemOption
                {
                    Id = Guid.NewGuid(),
                    MenuItemId = itemLauThai.Id,
                    Name = "Mức độ cay",
                    OptionType = "Single",
                    IsRequired = true,
                    SortOrder = 1,
                    CreatedAt = DateTime.UtcNow,
                    Values = new List<MenuItemOptionValue>
                    {
                        new() { Id = Guid.NewGuid(), Name = "Cay vừa phải (Ít cay)", ExtraPrice = 0, IsDefault = true, IsAvailable = true, SortOrder = 1, CreatedAt = DateTime.UtcNow },
                        new() { Id = Guid.NewGuid(), Name = "Cay nồng chuẩn vị Thái", ExtraPrice = 0, IsDefault = false, IsAvailable = true, SortOrder = 2, CreatedAt = DateTime.UtcNow }
                    }
                };

                var optToppingLau = new MenuItemOption
                {
                    Id = Guid.NewGuid(),
                    MenuItemId = itemLauThai.Id,
                    Name = "Đồ nhúng thêm",
                    OptionType = "Multiple",
                    IsRequired = false,
                    SortOrder = 2,
                    CreatedAt = DateTime.UtcNow,
                    Values = new List<MenuItemOptionValue>
                    {
                        new() { Id = Guid.NewGuid(), Name = "Thêm đĩa Ba chỉ bò Mỹ (150g)", ExtraPrice = 59000, IsDefault = false, IsAvailable = true, SortOrder = 1, CreatedAt = DateTime.UtcNow },
                        new() { Id = Guid.NewGuid(), Name = "Thêm đĩa Tôm sú tươi (4 con)", ExtraPrice = 69000, IsDefault = false, IsAvailable = true, SortOrder = 2, CreatedAt = DateTime.UtcNow },
                        new() { Id = Guid.NewGuid(), Name = "Mì Ramen Nhật Bản", ExtraPrice = 15000, IsDefault = false, IsAvailable = true, SortOrder = 3, CreatedAt = DateTime.UtcNow }
                    }
                };
                itemLauThai.Options.Add(optCay);
                itemLauThai.Options.Add(optToppingLau);

                var itemLauRieuCua = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catLau.Id,
                    Code = "LAU02",
                    Name = "Lẩu Riêu Cua Bắp Bò Sườn Sụn Hà Nội",
                    Description = "Gạch cua đồng béo ngậy ngọt thanh, kèm bắp bò tươi giòn, sườn sụn non hầm mềm và đĩa rau muống chẻ hoa chuối.",
                    ImageUrl = "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=800&q=80",
                    Price = 349000,
                    Unit = "Nồi",
                    KitchenStation = "Kitchen",
                    PreparationMinutes = 20,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var itemComChien = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catLau.Id,
                    Code = "MC01",
                    Name = "Cơm Chiên Hải Sản Hoàng Bào",
                    Description = "Hạt cơm tơi giòn phủ lớp trứng vàng óng, xào cùng tôm sú thái hạt lựu, mực ống tươi và cồi sò điệp ngọt bùi.",
                    ImageUrl = "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
                    Price = 119000,
                    Unit = "Dĩa",
                    KitchenStation = "Kitchen",
                    PreparationMinutes = 15,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                // ---------------- ĐỒ UỐNG & TRÀ ----------------
                var itemTraDao = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catDoUong.Id,
                    Code = "DU01",
                    Name = "Trà Đào Cam Sả Tươi Mát",
                    Description = "Trà đen ủ lạnh kết hợp nước cam vắt nguyên chất, sả thơm thanh mát và những lát đào giòn ngọt sảng khoái.",
                    ImageUrl = "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80",
                    Price = 45000,
                    Unit = "Ly",
                    KitchenStation = "Bar",
                    PreparationMinutes = 5,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var optSizeTra = new MenuItemOption
                {
                    Id = Guid.NewGuid(),
                    MenuItemId = itemTraDao.Id,
                    Name = "Kích cỡ Size",
                    OptionType = "Single",
                    IsRequired = true,
                    SortOrder = 1,
                    CreatedAt = DateTime.UtcNow,
                    Values = new List<MenuItemOptionValue>
                    {
                        new() { Id = Guid.NewGuid(), Name = "Size M (Vừa)", ExtraPrice = 0, IsDefault = true, IsAvailable = true, SortOrder = 1, CreatedAt = DateTime.UtcNow },
                        new() { Id = Guid.NewGuid(), Name = "Size L (Lớn +500ml)", ExtraPrice = 10000, IsDefault = false, IsAvailable = true, SortOrder = 2, CreatedAt = DateTime.UtcNow }
                    }
                };

                var optDuong = new MenuItemOption
                {
                    Id = Guid.NewGuid(),
                    MenuItemId = itemTraDao.Id,
                    Name = "Lượng đường",
                    OptionType = "Single",
                    IsRequired = true,
                    SortOrder = 2,
                    CreatedAt = DateTime.UtcNow,
                    Values = new List<MenuItemOptionValue>
                    {
                        new() { Id = Guid.NewGuid(), Name = "100% Đường (Chuẩn vị)", ExtraPrice = 0, IsDefault = true, IsAvailable = true, SortOrder = 1, CreatedAt = DateTime.UtcNow },
                        new() { Id = Guid.NewGuid(), Name = "70% Đường (Ít ngọt)", ExtraPrice = 0, IsDefault = false, IsAvailable = true, SortOrder = 2, CreatedAt = DateTime.UtcNow },
                        new() { Id = Guid.NewGuid(), Name = "50% Đường (Ngọt nhẹ)", ExtraPrice = 0, IsDefault = false, IsAvailable = true, SortOrder = 3, CreatedAt = DateTime.UtcNow },
                        new() { Id = Guid.NewGuid(), Name = "Không đường", ExtraPrice = 0, IsDefault = false, IsAvailable = true, SortOrder = 4, CreatedAt = DateTime.UtcNow }
                    }
                };

                var optToppingTra = new MenuItemOption
                {
                    Id = Guid.NewGuid(),
                    MenuItemId = itemTraDao.Id,
                    Name = "Topping thêm",
                    OptionType = "Multiple",
                    IsRequired = false,
                    SortOrder = 3,
                    CreatedAt = DateTime.UtcNow,
                    Values = new List<MenuItemOptionValue>
                    {
                        new() { Id = Guid.NewGuid(), Name = "Thêm 2 miếng đào giòn", ExtraPrice = 10000, IsDefault = false, IsAvailable = true, SortOrder = 1, CreatedAt = DateTime.UtcNow },
                        new() { Id = Guid.NewGuid(), Name = "Trân châu trắng 3Q giòn dai", ExtraPrice = 8000, IsDefault = false, IsAvailable = true, SortOrder = 2, CreatedAt = DateTime.UtcNow }
                    }
                };
                itemTraDao.Options.Add(optSizeTra);
                itemTraDao.Options.Add(optDuong);
                itemTraDao.Options.Add(optToppingTra);

                var itemTraSua = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catDoUong.Id,
                    Code = "DU02",
                    Name = "Trà Sữa Oolong Nướng Trân Châu Hoàng Kim",
                    Description = "Hương trà Oolong nướng đậm đà, sữa béo ngậy kết hợp trân châu hoàng kim nấu đường nâu dẻo dai hấp dẫn.",
                    ImageUrl = "https://images.unsplash.com/photo-1558857563-b371033873b8?w=800&q=80",
                    Price = 49000,
                    Unit = "Ly",
                    KitchenStation = "Bar",
                    PreparationMinutes = 5,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var optToppingTraSua = new MenuItemOption
                {
                    Id = Guid.NewGuid(),
                    MenuItemId = itemTraSua.Id,
                    Name = "Topping Trà Sữa",
                    OptionType = "Multiple",
                    IsRequired = false,
                    SortOrder = 1,
                    CreatedAt = DateTime.UtcNow,
                    Values = new List<MenuItemOptionValue>
                    {
                        new() { Id = Guid.NewGuid(), Name = "Kem Cheese phô mai mặn béo ngậy", ExtraPrice = 15000, IsDefault = false, IsAvailable = true, SortOrder = 1, CreatedAt = DateTime.UtcNow },
                        new() { Id = Guid.NewGuid(), Name = "Pudding trứng sữa mềm mịn", ExtraPrice = 12000, IsDefault = false, IsAvailable = true, SortOrder = 2, CreatedAt = DateTime.UtcNow }
                    }
                };
                itemTraSua.Options.Add(optToppingTraSua);

                var itemEpDuaHau = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catDoUong.Id,
                    Code = "DU03",
                    Name = "Nước Ép Dưa Hấu Tươi Nguyên Chất",
                    Description = "100% dưa hấu tươi mát ép tươi nguyên chất không thêm đường, giải nhiệt tức thì.",
                    ImageUrl = "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=800&q=80",
                    Price = 45000,
                    Unit = "Ly",
                    KitchenStation = "Bar",
                    PreparationMinutes = 5,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var itemBiaKen = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catDoUong.Id,
                    Code = "DU04",
                    Name = "Bia Heineken Silver (Lon 330ml)",
                    Description = "Bia Heineken Silver ướp lạnh mát lạnh, hương vị nhẹ êm sảng khoái tuyệt hảo cùng món nướng.",
                    ImageUrl = "https://images.unsplash.com/photo-1608270119853-4876251263c9?w=800&q=80",
                    Price = 32000,
                    Unit = "Lon",
                    KitchenStation = "Bar",
                    PreparationMinutes = 2,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                // ---------------- TRÁNG MIỆNG ----------------
                var itemPannaCotta = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catTrangMieng.Id,
                    Code = "TM01",
                    Name = "Panna Cotta Sốt Dâu Tây Tươi",
                    Description = "Bánh kem sữa Ý mềm mịn tan ngay đầu lưỡi, phủ sốt dâu tây tươi chua ngọt hài hòa.",
                    ImageUrl = "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80",
                    Price = 39000,
                    Unit = "Hũ",
                    KitchenStation = "Pastry",
                    PreparationMinutes = 3,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var itemCheBuoi = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catTrangMieng.Id,
                    Code = "TM02",
                    Name = "Chè Bưởi An Giang Cốt Dừa Béo Ngậy",
                    Description = "Cùi bưởi giòn sần sật khử đắng kỹ lưỡng, đỗ xanh xát vỏ dẻo thơm ngập trong nước cốt dừa béo ngọt.",
                    ImageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
                    Price = 35000,
                    Unit = "Bát",
                    KitchenStation = "Pastry",
                    PreparationMinutes = 3,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var itemTraiCay = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    BranchId = br.Id,
                    CategoryId = catTrangMieng.Id,
                    Code = "TM03",
                    Name = "Đĩa Trái Cây Tươi Thập Cẩm Theo Mùa",
                    Description = "Dưa hấu, ổi giòn, thanh long ruột đỏ, dưa lưới và xoài cát Hòa Lộc kèm chén muối tôm Tây Ninh.",
                    ImageUrl = "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&q=80",
                    Price = 69000,
                    Unit = "Đĩa",
                    KitchenStation = "Bar",
                    PreparationMinutes = 5,
                    IsAvailable = true,
                    Is86ed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                db.MenuItems.AddRange(
                    itemSalad, itemGoiNgoSen, itemKhoaiTay, itemNemHaiSan,
                    itemBoFuji, itemDeSuonBo, itemBaChiNam, itemGaNuong, itemTomNuong,
                    itemLauThai, itemLauRieuCua, itemComChien,
                    itemTraDao, itemTraSua, itemEpDuaHau, itemBiaKen,
                    itemPannaCotta, itemCheBuoi, itemTraiCay
                );
                await db.SaveChangesAsync();
            }
        }

        // 6. Seed Chương trình Khuyến mãi mặc định (STT 64, 65, 66, 71)
        if (!await db.Promotions.AnyAsync())
        {
            var promoList = new List<OrderPum.Domain.Entities.Promo.Promotion>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    BranchId = null, // Toàn chuỗi
                    Code = "PUMOPEN",
                    Name = "Mừng Khai Trương - Giảm 10% Tổng HĐ",
                    Description = "Giảm 10% tổng tiền món cho mọi đơn hàng khai trương, giảm tối đa 50.000đ.",
                    DiscountType = "Percent",
                    DiscountValue = 10,
                    MaxDiscountAmount = 50000,
                    MinOrderAmount = 100000,
                    TargetType = "Invoice",
                    IsAutoApply = false,
                    StartAt = DateTime.UtcNow.AddDays(-30),
                    EndAt = DateTime.UtcNow.AddMonths(3),
                    UsageLimit = 1000,
                    UsedCount = 0,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    BranchId = null,
                    Code = "GIAM50K",
                    Name = "Voucher 50K cho Đơn từ 500K",
                    Description = "Giảm ngay 50.000đ tiền mặt cho đơn hàng có giá trị từ 500.000đ trở lên.",
                    DiscountType = "FixedAmount",
                    DiscountValue = 50000,
                    MaxDiscountAmount = null,
                    MinOrderAmount = 500000,
                    TargetType = "Invoice",
                    IsAutoApply = false,
                    StartAt = DateTime.UtcNow.AddDays(-30),
                    EndAt = DateTime.UtcNow.AddMonths(6),
                    UsageLimit = 500,
                    UsedCount = 0,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    BranchId = null,
                    Code = "AUTOVIP5",
                    Name = "Tự Động Giảm 5% Đơn Lớn (Từ 1 Triệu)",
                    Description = "Hệ thống tự động chiết khấu 5% khi tổng tiền món ăn từ 1.000.000đ trở lên (không cần nhập mã).",
                    DiscountType = "Percent",
                    DiscountValue = 5,
                    MaxDiscountAmount = 100000,
                    MinOrderAmount = 1000000,
                    TargetType = "Invoice",
                    IsAutoApply = true, // Tự động áp dụng (STT 71)
                    StartAt = DateTime.UtcNow.AddDays(-30),
                    EndAt = DateTime.UtcNow.AddYears(1),
                    UsageLimit = null,
                    UsedCount = 0,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                }
            };

            db.Promotions.AddRange(promoList);
            await db.SaveChangesAsync();
        }

        // 7. Seed Cấu hình Cổng Thanh toán Mặc định (STT 102 - VNPay, MoMo, VietQR)
        if (!await db.PaymentGatewayConfigs.AnyAsync())
        {
            var gatewayList = new List<OrderPum.Domain.Entities.Payment.PaymentGatewayConfig>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    BranchId = null, // Toàn hệ thống
                    Provider = "VNPay",
                    IsActive = true,
                    IsSandbox = true,
                    MerchantId = "PUMVNPAY",
                    SecretKey = "VNPAYSECRETKEYPUM2026ORDERREST",
                    EndpointUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
                    ReturnUrl = "http://pumorder.runasp.net/payment/callback",
                    IpnUrl = "http://pumorderapi.runasp.net/api/payment-gateways/vnpay/ipn",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    BranchId = null,
                    Provider = "MoMo",
                    IsActive = true,
                    IsSandbox = true,
                    MerchantId = "MOMOPUM01",
                    SecretKey = "MOMOSECRETKEY123456",
                    AccessKey = "MOMOACCESS01",
                    EndpointUrl = "https://test-payment.momo.vn/v2/gateway/api/create",
                    ReturnUrl = "http://pumorder.runasp.net/payment/callback",
                    IpnUrl = "http://pumorderapi.runasp.net/api/payment-gateways/momo/ipn",
                    CreatedAt = DateTime.UtcNow
                }
            };

            db.PaymentGatewayConfigs.AddRange(gatewayList);
            await db.SaveChangesAsync();
        }

        // 8. Seed Mẫu Ca Làm Việc Mặc Định (STT 74, 75, 79, 80)
        if (!await db.ShiftTemplates.AnyAsync())
        {
            var shiftSang = new OrderPum.Domain.Entities.Staff.ShiftTemplate
            {
                Id = Guid.NewGuid(),
                BranchId = null,
                Code = "CA-SANG",
                Name = "Ca Sáng (06:30 - 14:30)",
                Description = "Ca sáng phục vụ ăn sáng và cơm trưa",
                StartTime = new TimeSpan(6, 30, 0),
                EndTime = new TimeSpan(14, 30, 0),
                BreakMinutes = 30,
                HourlyRateMultiplier = 1.0m,
                ColorHex = "#10b981", // Emerald
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var shiftChieu = new OrderPum.Domain.Entities.Staff.ShiftTemplate
            {
                Id = Guid.NewGuid(),
                BranchId = null,
                Code = "CA-CHIEU",
                Name = "Ca Chiều / Tối (14:00 - 22:00)",
                Description = "Ca chiều phục vụ giờ ăn tối cao điểm",
                StartTime = new TimeSpan(14, 0, 0),
                EndTime = new TimeSpan(22, 0, 0),
                BreakMinutes = 30,
                HourlyRateMultiplier = 1.0m,
                ColorHex = "#f59e0b", // Amber
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var shiftGay = new OrderPum.Domain.Entities.Staff.ShiftTemplate
            {
                Id = Guid.NewGuid(),
                BranchId = null,
                Code = "CA-GAY",
                Name = "Ca Gãy Full-time (10:00 - 22:00)",
                Description = "Ca fulltime cả ngày, nghỉ giữa ca 14:00 - 16:00 (120 phút)",
                StartTime = new TimeSpan(10, 0, 0),
                EndTime = new TimeSpan(22, 0, 0),
                BreakMinutes = 120,
                HourlyRateMultiplier = 1.0m,
                ColorHex = "#8b5cf6", // Purple
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var shiftDem = new OrderPum.Domain.Entities.Staff.ShiftTemplate
            {
                Id = Guid.NewGuid(),
                BranchId = null,
                Code = "CA-DEM",
                Name = "Ca Đêm (21:30 - 05:30)",
                Description = "Ca phục vụ khuya và dọn dẹp cuối ngày",
                StartTime = new TimeSpan(21, 30, 0),
                EndTime = new TimeSpan(5, 30, 0),
                BreakMinutes = 30,
                HourlyRateMultiplier = 1.3m,
                ColorHex = "#6366f1", // Indigo
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            db.ShiftTemplates.AddRange(shiftSang, shiftChieu, shiftGay, shiftDem);
            await db.SaveChangesAsync();

            // Seed lịch mẫu tuần này cho nhân viên chi nhánh Q1 (STT 75, 80)
            var staffUserQ1 = await db.Users.FirstOrDefaultAsync(u => u.PhoneOrEmail == "staff.q1@pum.vn");
            var chefUserQ1 = await db.Users.FirstOrDefaultAsync(u => u.PhoneOrEmail == "chef.q1@pum.vn");
            var bQ1 = await db.Branches.FirstOrDefaultAsync(b => b.Code == "PUM-Q1");
            var areaTang1 = bQ1 != null ? await db.Areas.FirstOrDefaultAsync(a => a.BranchId == bQ1.Id) : null;

            if (staffUserQ1 != null && bQ1 != null)
            {
                var today = DateTime.UtcNow.Date;
                var startMonday = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);

                var sampleSchedules = new List<OrderPum.Domain.Entities.Staff.StaffShiftSchedule>();

                for (var i = 0; i < 6; i++) // Thứ 2 đến Thứ 7
                {
                    sampleSchedules.Add(new OrderPum.Domain.Entities.Staff.StaffShiftSchedule
                    {
                        Id = Guid.NewGuid(),
                        BranchId = bQ1.Id,
                        UserId = staffUserQ1.Id,
                        ShiftTemplateId = i % 2 == 0 ? shiftSang.Id : shiftChieu.Id,
                        AreaId = areaTang1?.Id,
                        WorkDate = startMonday.AddDays(i),
                        Status = "Scheduled",
                        Note = "Phụ trách order & phục vụ sảnh",
                        CreatedAt = DateTime.UtcNow
                    });
                }

                if (chefUserQ1 != null)
                {
                    for (var i = 0; i < 6; i++)
                    {
                        sampleSchedules.Add(new OrderPum.Domain.Entities.Staff.StaffShiftSchedule
                        {
                            Id = Guid.NewGuid(),
                            BranchId = bQ1.Id,
                            UserId = chefUserQ1.Id,
                            ShiftTemplateId = shiftGay.Id,
                            AreaId = null,
                            WorkDate = startMonday.AddDays(i),
                            Status = "Scheduled",
                            Note = "Trưởng ca bếp nóng",
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                db.StaffShiftSchedules.AddRange(sampleSchedules);
                await db.SaveChangesAsync();

                // 9. Seed Bản ghi Chấm công Mẫu hôm nay (STT 77)
                if (!await db.AttendanceRecords.AnyAsync())
                {
                    var checkInTime = today.AddHours(6).AddMinutes(28); // Vào sớm 2 phút
                    db.AttendanceRecords.Add(new OrderPum.Domain.Entities.Staff.AttendanceRecord
                    {
                        Id = Guid.NewGuid(),
                        BranchId = bQ1.Id,
                        UserId = staffUserQ1.Id,
                        ShiftTemplateId = shiftSang.Id,
                        WorkDate = today,
                        CheckInTime = checkInTime,
                        CheckInMethod = "QuickPin",
                        LocationNote = "Quầy Thu Ngân",
                        Status = "InProgress",
                        LateMinutes = 0,
                        Note = "Đã check-in đúng giờ ca sáng",
                        CreatedAt = checkInTime
                    });
                    await db.SaveChangesAsync();
                }
            }
        }
    }
}
