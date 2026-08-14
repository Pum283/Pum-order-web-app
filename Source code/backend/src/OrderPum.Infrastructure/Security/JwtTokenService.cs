using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OrderPum.Domain.Enums.Auth;

namespace OrderPum.Infrastructure.Security;

public interface IJwtTokenService
{
    string CreateToken(Guid userId, string displayName, StaffRole role, Guid? branchId);
}

public class JwtTokenService(IConfiguration config) : IJwtTokenService
{
    public string CreateToken(Guid userId, string displayName, StaffRole role, Guid? branchId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(ClaimTypes.Name, displayName),
            new(ClaimTypes.Role, role.ToString()),
        };
        if (branchId.HasValue)
            claims.Add(new Claim("branch_id", branchId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(12),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public static class PasswordHasher
{
    public static string Hash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes);
    }

    public static bool Verify(string input, string hash) =>
        string.Equals(Hash(input), hash, StringComparison.OrdinalIgnoreCase);
}
