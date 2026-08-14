using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using OrderPum.Application.Interfaces.Services.Auth;
using OrderPum.Application.Interfaces.Services.Branch;
using OrderPum.Application.Interfaces.Services.Floor;
using OrderPum.Application.Interfaces.Services.Order;
using OrderPum.Domain.Entities.Auth;
using OrderPum.Domain.Entities.Branch;
using OrderPum.Domain.Entities.Floor;
using OrderPum.Domain.Enums.Auth;
using OrderPum.Infrastructure.Implementations.Services.Auth;
using OrderPum.Infrastructure.Implementations.Services.Branch;
using OrderPum.Infrastructure.Implementations.Services.Floor;
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

        // Tự động cập nhật cột mới nếu bảng Branches, Areas, Tables đã tồn tại từ trước
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
                Code = "DepartmentLead",
                Name = "Trưởng bộ phận",
                Level = 4,
                Description = "Trưởng bếp, Bar trưởng, Giám sát sảnh phục vụ",
                IsSystem = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Code = "FullTimeStaff",
                Name = "Nhân viên chính thức",
                Level = 5,
                Description = "Nhân viên phục vụ tại bàn, thu ngân, tiếp thực chính thức",
                IsSystem = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Code = "ProbationStaff",
                Name = "Nhân viên thử việc",
                Level = 6,
                Description = "Nhân viên mới, nhân viên part-time thử việc",
                IsSystem = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        foreach (var r in systemRoles)
        {
            var existingRole = await db.Roles.FirstOrDefaultAsync(x => x.Code == r.Code);
            if (existingRole == null)
            {
                db.Roles.Add(r);
            }
            else
            {
                existingRole.Name = r.Name;
                existingRole.Level = r.Level;
                existingRole.Description = r.Description;
                existingRole.IsSystem = true;
            }
        }
        await db.SaveChangesAsync();

        var roleMap = await db.Roles.ToDictionaryAsync(r => r.Code, r => r);

        // 2. Seed Chi nhánh mẫu với cấu hình tài chính chuẩn
        Branch branchQ1;
        Branch branchHN;

        var existingBranches = await db.Branches.OrderBy(b => b.CreatedAt).ToListAsync();
        if (existingBranches.Count == 0)
        {
            branchQ1 = new Branch
            {
                Id = Guid.NewGuid(),
                Code = "CN01",
                Name = "Chi nhánh 1 - Bến Nghé, Quận 1 (TP.HCM)",
                Address = "Số 12 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
                Phone = "028 3822 1234",
                OpenHours = "08:00 - 22:30",
                TaxRatePercent = 8,
                ServiceChargePercent = 5,
                Currency = "VND",
                IsTaxIncludedInPrice = false,
                IsServiceChargeIncluded = false,
                ReceiptHeaderNote = "OrderPum Bến Nghé - Chúc quý khách ngon miệng!",
                ReceiptFooterNote = "Cảm ơn quý khách và hẹn gặp lại!",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            branchHN = new Branch
            {
                Id = Guid.NewGuid(),
                Code = "CN02",
                Name = "Chi nhánh 2 - Cầu Giấy (Hà Nội)",
                Address = "Số 88 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, TP. Hà Nội",
                Phone = "024 3766 5678",
                OpenHours = "08:00 - 22:30",
                TaxRatePercent = 8,
                ServiceChargePercent = 5,
                Currency = "VND",
                IsTaxIncludedInPrice = false,
                IsServiceChargeIncluded = false,
                ReceiptHeaderNote = "OrderPum Cầu Giấy - Hân hạnh phục vụ quý khách!",
                ReceiptFooterNote = "Cảm ơn quý khách và hẹn gặp lại!",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            db.Branches.AddRange(branchQ1, branchHN);
            await db.SaveChangesAsync();
        }
        else
        {
            branchQ1 = existingBranches[0];
            if (string.IsNullOrEmpty(branchQ1.Code))
            {
                branchQ1.Code = "CN01";
            }
            if (existingBranches.Count > 1)
            {
                branchHN = existingBranches[1];
                if (string.IsNullOrEmpty(branchHN.Code))
                {
                    branchHN.Code = "CN02";
                }
            }
            else
            {
                branchHN = new Branch
                {
                    Id = Guid.NewGuid(),
                    Code = "CN02",
                    Name = "Chi nhánh 2 - Cầu Giấy (Hà Nội)",
                    Address = "Số 88 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, TP. Hà Nội",
                    Phone = "024 3766 5678",
                    OpenHours = "08:00 - 22:30",
                    TaxRatePercent = 8,
                    ServiceChargePercent = 5,
                    Currency = "VND",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                db.Branches.Add(branchHN);
            }
            await db.SaveChangesAsync();
        }

        // 3. Seed Tài khoản nhân viên mẫu liên kết bảng Roles
        var defaultPasswordHash = PasswordHasher.Hash("Pass@123");

        var sampleUsers = new List<UserAccount>
        {
            new()
            {
                PhoneOrEmail = "director@orderpum.vn",
                DisplayName = "Nguyễn Văn Giám Đốc",
                PasswordHash = defaultPasswordHash,
                PinHash = PasswordHasher.Hash("1111"),
                RoleId = roleMap.TryGetValue("ChainDirector", out var r1) ? r1.Id : null,
                Role = StaffRole.ChainDirector,
                CustomRoleCode = "ChainDirector",
                BranchId = null,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                PhoneOrEmail = "owner@orderpum.vn",
                DisplayName = "Trần Thị Chủ Quán",
                PasswordHash = defaultPasswordHash,
                PinHash = PasswordHasher.Hash("2222"),
                RoleId = roleMap.TryGetValue("RestaurantOwner", out var r2) ? r2.Id : null,
                Role = StaffRole.RestaurantOwner,
                CustomRoleCode = "RestaurantOwner",
                BranchId = branchQ1.Id,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                PhoneOrEmail = "manager.q1@orderpum.vn",
                DisplayName = "Lê Văn Quản Lý Q1",
                PasswordHash = defaultPasswordHash,
                PinHash = PasswordHasher.Hash("3333"),
                RoleId = roleMap.TryGetValue("Manager", out var r3) ? r3.Id : null,
                Role = StaffRole.Manager,
                CustomRoleCode = "Manager",
                BranchId = branchQ1.Id,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                PhoneOrEmail = "manager.hn@orderpum.vn",
                DisplayName = "Phạm Minh Quản Lý HN",
                PasswordHash = defaultPasswordHash,
                PinHash = PasswordHasher.Hash("3334"),
                RoleId = roleMap.TryGetValue("Manager", out var r3b) ? r3b.Id : null,
                Role = StaffRole.Manager,
                CustomRoleCode = "Manager",
                BranchId = branchHN.Id,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                PhoneOrEmail = "lead.kitchen@orderpum.vn",
                DisplayName = "Võ Quốc Bếp Trưởng",
                PasswordHash = defaultPasswordHash,
                PinHash = PasswordHasher.Hash("4444"),
                RoleId = roleMap.TryGetValue("DepartmentLead", out var r4) ? r4.Id : null,
                Role = StaffRole.DepartmentLead,
                CustomRoleCode = "DepartmentLead",
                BranchId = branchQ1.Id,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                PhoneOrEmail = "staff.service1@orderpum.vn",
                DisplayName = "Đỗ Mai Phục Vụ",
                PasswordHash = defaultPasswordHash,
                PinHash = PasswordHasher.Hash("5555"),
                RoleId = roleMap.TryGetValue("FullTimeStaff", out var r5) ? r5.Id : null,
                Role = StaffRole.FullTimeStaff,
                CustomRoleCode = "FullTimeStaff",
                BranchId = branchQ1.Id,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                PhoneOrEmail = "staff.cashier@orderpum.vn",
                DisplayName = "Hoàng Lan Thu Ngân",
                PasswordHash = defaultPasswordHash,
                PinHash = PasswordHasher.Hash("5556"),
                RoleId = roleMap.TryGetValue("FullTimeStaff", out var r5b) ? r5b.Id : null,
                Role = StaffRole.FullTimeStaff,
                CustomRoleCode = "FullTimeStaff",
                BranchId = branchQ1.Id,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                PhoneOrEmail = "probation.waiter@orderpum.vn",
                DisplayName = "Ngô Tuấn Thử Việc",
                PasswordHash = defaultPasswordHash,
                PinHash = PasswordHasher.Hash("6666"),
                RoleId = roleMap.TryGetValue("ProbationStaff", out var r6) ? r6.Id : null,
                Role = StaffRole.ProbationStaff,
                CustomRoleCode = "ProbationStaff",
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
                // Tầng 1
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area1.Id, Code = "B01", Name = "Bàn 01", Capacity = 4, QrToken = Guid.NewGuid().ToString("N"), Status = "Available", PosX = 10, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area1.Id, Code = "B02", Name = "Bàn 02", Capacity = 4, QrToken = Guid.NewGuid().ToString("N"), Status = "Occupied", PosX = 30, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area1.Id, Code = "B03", Name = "Bàn 03", Capacity = 6, QrToken = Guid.NewGuid().ToString("N"), Status = "Available", PosX = 50, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area1.Id, Code = "B04", Name = "Bàn 04", Capacity = 2, QrToken = Guid.NewGuid().ToString("N"), Status = "NeedsCleaning", PosX = 70, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },
                
                // Tầng 2
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area2.Id, Code = "B05", Name = "Bàn 05", Capacity = 4, QrToken = Guid.NewGuid().ToString("N"), Status = "Available", PosX = 10, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area2.Id, Code = "B06", Name = "Bàn 06", Capacity = 8, QrToken = Guid.NewGuid().ToString("N"), Status = "Reserved", PosX = 40, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area2.Id, Code = "B07", Name = "Bàn 07", Capacity = 4, QrToken = Guid.NewGuid().ToString("N"), Status = "Available", PosX = 70, PosY = 10, IsActive = true, CreatedAt = DateTime.UtcNow },

                // Sân vườn
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area3.Id, Code = "SV01", Name = "Bàn Sân Vườn 01", Capacity = 4, QrToken = Guid.NewGuid().ToString("N"), Status = "Available", PosX = 20, PosY = 20, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { Id = Guid.NewGuid(), BranchId = branchQ1.Id, AreaId = area3.Id, Code = "SV02", Name = "Bàn Sân Vườn 02", Capacity = 6, QrToken = Guid.NewGuid().ToString("N"), Status = "Available", PosX = 60, PosY = 20, IsActive = true, CreatedAt = DateTime.UtcNow },

                // VIP
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
    }
}
