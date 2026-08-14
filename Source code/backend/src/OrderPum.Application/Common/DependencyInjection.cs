using Microsoft.Extensions.DependencyInjection;
using OrderPum.Application.Interfaces.Services.Auth;
using OrderPum.Application.Interfaces.Services.Order;

namespace OrderPum.Application.Common;

public static class ApplicationMarker
{
    // Used by Infrastructure DI discovery if needed later.
}

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        return services;
    }
}
