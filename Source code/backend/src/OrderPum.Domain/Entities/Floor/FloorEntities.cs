using OrderPum.Domain.Base;

namespace OrderPum.Domain.Entities.Floor;

public class Area : EntityBase
{
    public Guid BranchId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public virtual ICollection<DiningTable> Tables { get; set; } = new List<DiningTable>();
}

public class DiningTable : EntityBase
{
    public Guid BranchId { get; set; }
    public Guid AreaId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Name { get; set; }
    public int Capacity { get; set; } = 4;
    public string QrToken { get; set; } = Guid.NewGuid().ToString("N");
    public string Status { get; set; } = "Available"; // Available, Occupied, Reserved, NeedsCleaning
    public int PosX { get; set; } = 0;
    public int PosY { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    // Navigation
    public virtual Area? Area { get; set; }
}

public class StaffAreaAssignment : EntityBase
{
    public Guid BranchId { get; set; }
    public Guid UserId { get; set; }
    public Guid AreaId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual Area? Area { get; set; }
}
