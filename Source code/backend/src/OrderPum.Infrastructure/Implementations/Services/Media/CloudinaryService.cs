using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OrderPum.Application.Interfaces.Services.Media;

namespace OrderPum.Infrastructure.Implementations.Services.Media;

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;
    private readonly string _defaultFolder;
    private readonly ILogger<CloudinaryService> _logger;

    public CloudinaryService(IConfiguration config, ILogger<CloudinaryService> logger)
    {
        _logger = logger;
        var cloudName = config["Cloudinary:CloudName"] ?? "ddxmreppz";
        var apiKey = config["Cloudinary:ApiKey"] ?? "313728631461314";
        var apiSecret = config["Cloudinary:ApiSecret"] ?? "P38sEm9xzL6s5JNH_zqdBBuwWDQ";
        _defaultFolder = config["Cloudinary:Folder"] ?? "Web Order";

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
        _cloudinary.Api.Secure = true;
    }

    public async Task<string> UploadImageAsync(Stream fileStream, string fileName, string? customFolder = null)
    {
        try
        {
            var targetFolder = !string.IsNullOrWhiteSpace(customFolder) ? customFolder : _defaultFolder;
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, fileStream),
                Folder = targetFolder,
                UseFilename = true,
                UniqueFilename = true,
                Overwrite = false
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            if (uploadResult.Error != null)
            {
                _logger.LogError("Cloudinary upload error: {Error}", uploadResult.Error.Message);
                throw new InvalidOperationException($"Lỗi tải ảnh lên Cloudinary: {uploadResult.Error.Message}");
            }

            var url = uploadResult.SecureUrl?.ToString() ?? uploadResult.Url?.ToString() ?? string.Empty;
            _logger.LogInformation("Image uploaded successfully to Cloudinary: {Url}", url);
            return url;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during Cloudinary image upload: {Message}", ex.Message);
            throw;
        }
    }

    public async Task<bool> DeleteImageAsync(string publicId)
    {
        try
        {
            var deletionParams = new DeletionParams(publicId);
            var result = await _cloudinary.DestroyAsync(deletionParams);
            return result.Result == "ok";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete Cloudinary image: {PublicId}", publicId);
            return false;
        }
    }
}
