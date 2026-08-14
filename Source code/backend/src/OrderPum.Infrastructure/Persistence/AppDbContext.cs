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

        base.OnModelCreating(modelBuilder);
    }
}
