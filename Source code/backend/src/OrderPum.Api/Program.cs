using OrderPum.Application.Common;
using OrderPum.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSignalR();
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyHeader().AllowAnyMethod().AllowCredentials()
        .SetIsOriginAllowed(_ => true)));

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<OrderPum.Api.Hubs.OrderHub>("/hubs/order");
app.MapHub<OrderPum.Api.Hubs.NotifyHub>("/hubs/notify");

await app.Services.SeedAsync();

app.Run();
