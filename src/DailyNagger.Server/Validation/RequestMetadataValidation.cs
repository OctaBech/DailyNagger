using DailyNagger.Server.Contracts;
using DailyNagger.Server.Domain.Exceptions;

namespace DailyNagger.Server.Validation;

internal static class RequestMetadataValidation
{
    public static void ValidatePayloadVersion(
        int payloadVersion,
        int baseVersion,
        int nextVersion)
    {
        ValidationGuard.Require(
            payloadVersion >= baseVersion && payloadVersion < nextVersion,
            "Payload Version must be between BaseVersion and before NextVersion.");
    }

    public static void ValidateUpdatedAt(DateTimeOffset updatedAt)
    {
        if (updatedAt == default)
        {
            throw new NagValidationException("UpdatedAt is required.");
        }
    }

    public static void ValidateClientIdentity(ClientIdentityDto? clientIdentity)
    {
        if (clientIdentity is null)
        {
            return;
        }

        ValidationGuard.Require(!string.IsNullOrWhiteSpace(clientIdentity.ClientId), "ClientIdentity ClientId is required.");
        ValidationGuard.Require(clientIdentity.ClientId.Length <= 100, "ClientIdentity ClientId cannot be longer than 100 characters.");
        ValidationGuard.Require(!string.IsNullOrWhiteSpace(clientIdentity.DeviceName), "ClientIdentity DeviceName is required.");
        ValidationGuard.Require(clientIdentity.DeviceName.Length <= 200, "ClientIdentity DeviceName cannot be longer than 200 characters.");
        ValidationGuard.Require(!string.IsNullOrWhiteSpace(clientIdentity.DeviceModel), "ClientIdentity DeviceModel is required.");
        ValidationGuard.Require(clientIdentity.DeviceModel.Length <= 200, "ClientIdentity DeviceModel cannot be longer than 200 characters.");
    }

    public static void ValidateVersionTransition(
        int baseVersion,
        int nextVersion)
    {
        ValidationGuard.Require(nextVersion > baseVersion, "NextVersion must be greater than BaseVersion.");
    }
}
