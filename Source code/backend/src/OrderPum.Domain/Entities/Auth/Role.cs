using OrderPum.Domain.Base;

namespace OrderPum.Domain.Entities.Auth;

/// <summary>
/// Bảng Vai trò trong CSDL, cho phép tùy chỉnh chức danh và cấp bậc (STT 2).
/// Cấp 1 là cao nhất (Giám đốc), các cấp tăng dần thể hiện cấp bậc thấp hơn.
/// </summary>
public class Role : EntityBase
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Level { get; set; } = 5;
    public string? Description { get; set; }
    public bool IsSystem { get; set; }
    public bool IsActive { get; set; } = true;
}
