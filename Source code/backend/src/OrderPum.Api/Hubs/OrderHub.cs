using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace OrderPum.Api.Hubs;

[Authorize]
public class OrderHub : Hub
{
}

[Authorize]
public class NotifyHub : Hub
{
}
