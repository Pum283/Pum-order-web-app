using System.ComponentModel.DataAnnotations;

namespace OrderPum.Application.DTOs.Floor;

// --- AREA DTOs ---

public class AreaDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public int TableCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateAreaRequest
{
    [Required(ErrorMessage = "Chi nhánh không được để trống")]
    public Guid BranchId { get; set; }

    [Required(ErrorMessage = "Tên khu vực không được để trống")]
    [MaxLength(100, ErrorMessage = "Tên khu vực tối đa 100 ký tự")]
    public string Name { get; set; } = string.Empty;

    public int SortOrder { get; set; } = 0;
}

public class UpdateAreaRequest
{
    [Required(ErrorMessage = "Tên khu vực không được để trống")]
    [MaxLength(100, ErrorMessage = "Tên khu vực tối đa 100 ký tự")]
    public string Name { get; set; } = string.Empty;

    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}

// --- DINING TABLE DTOs ---

public class DiningTableDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public Guid AreaId { get; set; }
    public string AreaName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Name { get; set; }
    public int Capacity { get; set; }
    public string QrToken { get; set; } = string.Empty;
    public string QrUrl { get; set; } = string.Empty;
    public string Status { get; set; } = "Available"; // Available, Occupied, Reserved, NeedsCleaning
    public int PosX { get; set; }
    public int PosY { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }

    // Active session info for Floor Map (STT 16)
    public Guid? ActiveSessionId { get; set; }
    public DateTime? ActiveSessionOpenedAt { get; set; }
    public int ActiveSessionItemCount { get; set; }
    public decimal ActiveSessionTotalAmount { get; set; }
}

public class CreateTableRequest
{
    [Required(ErrorMessage = "Chi nhánh không được để trống")]
    public Guid BranchId { get; set; }

    [Required(ErrorMessage = "Khu vực không được để trống")]
    public Guid AreaId { get; set; }

    [Required(ErrorMessage = "Mã/Số bàn không được để trống")]
    [MaxLength(50, ErrorMessage = "Mã bàn tối đa 50 ký tự")]
    public string Code { get; set; } = string.Empty;

    [MaxLength(100, ErrorMessage = "Tên bàn tối đa 100 ký tự")]
    public string? Name { get; set; }

    [Range(1, 100, ErrorMessage = "Sức chứa phải từ 1 đến 100 khách")]
    public int Capacity { get; set; } = 4;

    public int PosX { get; set; } = 0;
    public int PosY { get; set; } = 0;
}

public class UpdateTableRequest
{
    [Required(ErrorMessage = "Khu vực không được để trống")]
    public Guid AreaId { get; set; }

    [Required(ErrorMessage = "Mã/Số bàn không được để trống")]
    [MaxLength(50, ErrorMessage = "Mã bàn tối đa 50 ký tự")]
    public string Code { get; set; } = string.Empty;

    [MaxLength(100, ErrorMessage = "Tên bàn tối đa 100 ký tự")]
    public string? Name { get; set; }

    [Range(1, 100, ErrorMessage = "Sức chứa phải từ 1 đến 100 khách")]
    public int Capacity { get; set; } = 4;

    public string Status { get; set; } = "Available";
    public int PosX { get; set; } = 0;
    public int PosY { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}

public class UpdateTableStatusRequest
{
    [Required(ErrorMessage = "Trạng thái bàn không được để trống")]
    public string Status { get; set; } = "Available"; // Available, Occupied, Reserved, NeedsCleaning
}

public class UpdateTablePositionRequest
{
    public Guid TableId { get; set; }
    public Guid? AreaId { get; set; }
    public int PosX { get; set; }
    public int PosY { get; set; }
}

public class BatchUpdateTablePositionsRequest
{
    [Required]
    public List<UpdateTablePositionRequest> Positions { get; set; } = [];
}

public class TransferTableRequest
{
    [Required(ErrorMessage = "Bàn nguồn không được để trống")]
    public Guid FromTableId { get; set; }

    [Required(ErrorMessage = "Bàn đích không được để trống")]
    public Guid ToTableId { get; set; }

    [MaxLength(300, ErrorMessage = "Ghi chú chuyển bàn tối đa 300 ký tự")]
    public string? Reason { get; set; }
}

public class TransferTableResultDto
{
    public Guid FromTableId { get; set; }
    public string FromTableCode { get; set; } = string.Empty;
    public Guid ToTableId { get; set; }
    public string ToTableCode { get; set; } = string.Empty;
    public Guid SessionId { get; set; }
    public string Message { get; set; } = string.Empty;
}
