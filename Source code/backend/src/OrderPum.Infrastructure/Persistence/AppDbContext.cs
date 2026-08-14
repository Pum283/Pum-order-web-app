using Microsoft.EntityFrameworkCore;
using OrderPum.Domain.Entities.Auth;
using OrderPum.Domain.Entities.Branch;
using OrderPum.Domain.Entities.Floor;
using OrderPum.Domain.Entities.Menu;
using OrderPum.Domain.Entities.Order;

namespace OrderPum.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Area> Areas => Set<Area>();
    public DbSet<DiningTable> Tables => Set<DiningTable>();
    public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<MenuItemOption> MenuItemOptions => Set<MenuItemOption>();
    public DbSet<MenuItemOptionValue> MenuItemOptionValues => Set<MenuItemOptionValue>();
    public DbSet<TableSession> TableSessions => Set<TableSession>();
    public DbSet<OrderTicket> OrderTickets => Set<OrderTicket>();
    public DbSet<OrderLine> OrderLines => Set<OrderLine>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        modelBuilder.Entity<UserAccount>()
            .HasOne(u => u.RoleRef)
            .WithMany()
            .HasForeignKey(u => u.RoleId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Branch>()
            .HasMany(b => b.Users)
            .WithOne()
            .HasForeignKey(u => u.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Area>()
            .HasMany(a => a.Tables)
            .WithOne(t => t.Area)
            .HasForeignKey(t => t.AreaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MenuCategory>()
            .HasMany(c => c.Items)
            .WithOne(i => i.Category)
            .HasForeignKey(i => i.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MenuItem>()
            .Property(i => i.Price)
            .HasPrecision(18, 2);

        modelBuilder.Entity<MenuItem>()
            .HasMany(i => i.Options)
            .WithOne(o => o.MenuItem)
            .HasForeignKey(o => o.MenuItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MenuItemOption>()
            .HasMany(o => o.Values)
            .WithOne(v => v.Option)
            .HasForeignKey(v => v.OptionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MenuItemOptionValue>()
            .Property(v => v.ExtraPrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<OrderLine>()
            .Property(l => l.UnitPrice)
            .HasPrecision(18, 2);

        base.OnModelCreating(modelBuilder);
    }
}
