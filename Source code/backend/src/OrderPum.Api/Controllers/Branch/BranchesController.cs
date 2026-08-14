using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderPum.Application.DTOs.Auth;
using OrderPum.Application.Interfaces.Services.Auth;

namespace OrderPum.Api.Controllers.Branch;

[ApiController]
[Route("api/branches")]
public class BranchesController(IAuthService auth) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<BranchSimpleDto>>> List(CancellationToken ct)
    {
        var branches = await auth.ListBranchesAsync(ct);
        return Ok(branches);
    }
}
