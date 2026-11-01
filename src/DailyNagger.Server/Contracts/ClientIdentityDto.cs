namespace DailyNagger.Server.Contracts;

public sealed record ClientIdentityDto(
    string ClientId,
    string DeviceName,
    string DeviceModel);
