namespace OrderPum.Application.Interfaces.Services.Media;

public interface ICloudinaryService
{
    Task<string> UploadImageAsync(Stream fileStream, string fileName, string? customFolder = null);
    Task<bool> DeleteImageAsync(string publicId);
}
