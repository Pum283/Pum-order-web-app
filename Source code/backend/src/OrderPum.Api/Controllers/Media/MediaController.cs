using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OrderPum.Application.Interfaces.Services.Media;

namespace OrderPum.Api.Controllers.Media;

[ApiController]
[Route("api/[controller]")]
public class MediaController(ICloudinaryService cloudinaryService) : ControllerBase
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile? file, [FromQuery] string? folder)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Vui lòng chọn một tệp hình ảnh để tải lên." });
        }

        if (file.Length > MaxFileSize)
        {
            return BadRequest(new { message = "Kích thước ảnh vượt quá giới hạn tối đa 10MB." });
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
        {
            return BadRequest(new { message = "Định dạng tệp không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG, WEBP hoặc GIF." });
        }

        try
        {
            await using var stream = file.OpenReadStream();
            var secureUrl = await cloudinaryService.UploadImageAsync(stream, file.FileName, folder);

            return Ok(new
            {
                url = secureUrl,
                fileName = file.FileName,
                size = file.Length
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
