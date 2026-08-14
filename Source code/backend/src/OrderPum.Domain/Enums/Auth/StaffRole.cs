namespace OrderPum.Domain.Enums.Auth;

/// <summary>
/// 6 cấp bậc nội bộ theo yêu cầu nghiệp vụ (STT 2).
/// Cấp 1 (cao nhất) -> Cấp 6 (cơ bản nhất).
/// </summary>
public enum StaffRole
{
    ChainDirector = 1,    // Giám đốc chuỗi (Toàn quyền hệ thống & mọi chi nhánh)
    RestaurantOwner = 2,  // Chủ nhà hàng (Quản lý các chi nhánh trực thuộc)
    Manager = 3,          // Quản lý chi nhánh (Quản lý nhân sự & vận hành tại chi nhánh)
    DepartmentLead = 4,   // Trưởng bộ phận (Bếp trưởng, Bar trưởng, Giám sát sảnh)
    FullTimeStaff = 5,    // Nhân viên chính thức (Phục vụ, Thu ngân, Tiếp thực)
    ProbationStaff = 6    // Nhân viên thử việc (Nhân viên mới/part-time thử việc)
}

public static class StaffRoleExtensions
{
    public static string GetDisplayName(this StaffRole role) => role switch
    {
        StaffRole.ChainDirector => "Giám đốc chuỗi",
        StaffRole.RestaurantOwner => "Chủ nhà hàng",
        StaffRole.Manager => "Quản lý chi nhánh",
        StaffRole.DepartmentLead => "Trưởng bộ phận",
        StaffRole.FullTimeStaff => "Nhân viên chính thức",
        StaffRole.ProbationStaff => "Nhân viên thử việc",
        _ => role.ToString()
    };

    public static int GetHierarchyLevel(this StaffRole role) => (int)role;

    /// <summary>
    /// Kiểm tra xem actor có quyền quản lý targetRole hay không (cấp bậc cao hơn hoặc bằng trong quyền hạn).
    /// </summary>
    public static bool CanManageRole(this StaffRole actorRole, StaffRole targetRole)
    {
        // GĐ Chuỗi & Chủ nhà hàng quản lý tất cả
        if (actorRole == StaffRole.ChainDirector || actorRole == StaffRole.RestaurantOwner)
            return true;

        // Quản lý chỉ được quản lý cấp bậc từ Manager trở xuống (3, 4, 5, 6)
        if (actorRole == StaffRole.Manager)
            return (int)targetRole >= (int)StaffRole.Manager;

        // Các cấp khác không có quyền quản lý tài khoản nhân sự
        return false;
    }
}
