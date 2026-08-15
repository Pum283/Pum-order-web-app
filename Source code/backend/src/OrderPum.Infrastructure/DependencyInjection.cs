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

            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'TableSessions')
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TableSessions') AND name = 'SessionCode')
                    ALTER TABLE [TableSessions] ADD [SessionCode] NVARCHAR(50) NOT NULL DEFAULT '';
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TableSessions') AND name = 'GuestCount')
                    ALTER TABLE [TableSessions] ADD [GuestCount] INT NOT NULL DEFAULT 1;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TableSessions') AND name = 'OpenedByUserId')
                    ALTER TABLE [TableSessions] ADD [OpenedByUserId] UNIQUEIDENTIFIER NULL;
            END

            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderTickets')
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('OrderTickets') AND name = 'TicketNumber')
                    ALTER TABLE [OrderTickets] ADD [TicketNumber] INT NOT NULL DEFAULT 1;
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
        var existingCategoriesQ1 = await db.MenuCategories.Where(c => c.BranchId == branchQ1.Id && !c.IsDeleted).ToListAsync();
        if (existingCategoriesQ1.Count == 0)
        {
            var catKhaiVi = new MenuCategory
            {
                Id = Guid.NewGuid(),
                BranchId = branchQ1.Id,
                Code = "KHAI_VI",
                Name = "Món Khai Vị & Salad",
                ImageUrl = "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80",
                SortOrder = 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var catNuong = new MenuCategory
            {
                Id = Guid.NewGuid(),
                BranchId = branchQ1.Id,
                Code = "MON_NUONG",
                Name = "Món Nướng BBQ Đặc Biệt",
                ImageUrl = "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
                SortOrder = 2,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var catLau = new MenuCategory
            {
                Id = Guid.NewGuid(),
                BranchId = branchQ1.Id,
                Code = "LAU_HAI_SAN",
                Name = "Lẩu & Món Chính Thượng Hạng",
                ImageUrl = "https://images.unsplash.com/photo-1547928576-a4a33237cbc3?w=600&q=80",
                SortOrder = 3,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var catDoUong = new MenuCategory
            {
                Id = Guid.NewGuid(),
                BranchId = branchQ1.Id,
                Code = "DO_UONG",
                Name = "Đồ Uống & Trà Hoa Quả",
                ImageUrl = "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80",
                SortOrder = 4,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var catTrangMieng = new MenuCategory
            {
                Id = Guid.NewGuid(),
                BranchId = branchQ1.Id,
                Code = "TRANG_MIENG",
                Name = "Tráng Miệng & Chè Cung Đình",
                ImageUrl = "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80",
                SortOrder = 5,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            db.MenuCategories.AddRange(catKhaiVi, catNuong, catLau, catDoUong, catTrangMieng);
            await db.SaveChangesAsync();

            // Seed Món ăn kèm Options
            // Món 1: Bò Fuji Nướng
            var itemBoFuji = new MenuItem
            {
                Id = Guid.NewGuid(),
                BranchId = branchQ1.Id,
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

            // Món 2: Lẩu Thái Tomyum
            var itemLauThai = new MenuItem
            {
                Id = Guid.NewGuid(),
                BranchId = branchQ1.Id,
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
                    new() { Id = Guid.NewGuid(), Name = "Mì tôm / Mì Ramen", ExtraPrice = 15000, IsDefault = false, IsAvailable = true, SortOrder = 3, CreatedAt = DateTime.UtcNow }
                }
            };
            itemLauThai.Options.Add(optCay);
            itemLauThai.Options.Add(optToppingLau);

            // Món 3: Salad Cá Hồi
            var itemSalad = new MenuItem
            {
                Id = Guid.NewGuid(),
                BranchId = branchQ1.Id,
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

            // Món 4: Gà nướng mật ong
            var itemGaNuong = new MenuItem
            {
                Id = Guid.NewGuid(),
                BranchId = branchQ1.Id,
                CategoryId = catNuong.Id,
                Code = "BBQ02",
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

            // Món 5: Trà Đào Cam Sả
            var itemTraDao = new MenuItem
            {
                Id = Guid.NewGuid(),
                BranchId = branchQ1.Id,
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
                    new() { Id = Guid.NewGuid(), Name = "Trân châu trắng 3Q", ExtraPrice = 8000, IsDefault = false, IsAvailable = true, SortOrder = 2, CreatedAt = DateTime.UtcNow }
                }
            };
            itemTraDao.Options.Add(optSizeTra);
            itemTraDao.Options.Add(optDuong);
            itemTraDao.Options.Add(optToppingTra);

            // Món 6: Trà Sữa Oolong Nướng
            var itemTraSua = new MenuItem
            {
                Id = Guid.NewGuid(),
                BranchId = branchQ1.Id,
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

            // Món 7: Panna Cotta
            var itemPannaCotta = new MenuItem
            {
                Id = Guid.NewGuid(),
                BranchId = branchQ1.Id,
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

            db.MenuItems.AddRange(itemBoFuji, itemLauThai, itemSalad, itemGaNuong, itemTraDao, itemTraSua, itemPannaCotta);
            await db.SaveChangesAsync();
        }
    }
}
