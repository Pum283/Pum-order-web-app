using OrderPum.Domain.Base;
using OrderPum.Domain.Enums.Auth;

namespace OrderPum.Domain.Entities.Auth;

public class UserAccount : EntityBase
{
    public string PhoneOrEmail { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PinHash { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    
    // Khóa ngoại liên kết tới bảng Roles
    public Guid? RoleId { get; set; }
    public virtual Role? RoleRef { get; set; }

    // Lưu mã vai trò để tương thích nhanh (e.g. ChainDirector, Manager, CustomRole...)
    public StaffRole Role { get; set; } = StaffRole.FullTimeStaff;
    public string? CustomRoleCode { get; set; }

    public Guid? BranchId { get; set; }
    public bool IsLocked { get; set; }
}
