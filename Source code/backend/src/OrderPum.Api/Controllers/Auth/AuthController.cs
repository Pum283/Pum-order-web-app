using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderPum.Application.DTOs.Auth;
using OrderPum.Application.Interfaces.Services.Auth;

namespace OrderPum.Api.Controllers.Auth;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        try
        {
            var res = await auth.LoginAsync(request, ct);
            return Ok(res);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login-pin")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> LoginPin([FromBody] PinLoginRequest request, CancellationToken ct)
    {
        try
        {
            var res = await auth.LoginWithPinAsync(request, ct);
            return Ok(res);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct)
    {
        try
        {
            var userId = GetUserId();
            var res = await auth.GetCurrentUserAsync(userId, ct);
            return Ok(res);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        try
        {
            var userId = GetUserId();
            await auth.ChangePasswordAsync(userId, request, ct);
            return Ok(new { message = "Đổi mật khẩu thành công." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("set-pin")]
    [Authorize]
    public async Task<IActionResult> SetPin([FromBody] SetPinRequest request, CancellationToken ct)
    {
        try
        {
            var userId = GetUserId();
            await auth.SetPinAsync(userId, request, ct);
            return Ok(new { message = "Cập nhật mã PIN thành công." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(sub) || !Guid.TryParse(sub, out var guid))
            throw new UnauthorizedAccessException("Không xác thực được người dùng.");
        return guid;
    }
}
