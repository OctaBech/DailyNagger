import { describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { apiRequest } from "@/api/client/apiRequest";
import type { ParcelBatch, ParcelQueueInstruction } from "@/services/sending/parcel-flow/contracts";
import { useSendParcelBatch } from "@/services/sending/parcel-flow/useSendParcelBatch";
import { useSendingPromptController } from "@/services/sending/sending-prompt/useSendingPromptController";

jest.mock("uuid", () => ({ v7: () => "00000000-0000-0000-0000-000000000001" }));
jest.mock("@/config", () => ({
  environment: {
    communityId: "00000000-0000-0000-0000-000000000001",
    userId: "00000000-0000-0000-0000-000000000002",
  },
}));
jest.mock("@/api/client/apiRequest", () => ({
  apiRequest: jest.fn(),
  ApiRequestError: class extends Error {},
}));

describe("useSendParcelBatch", () => {
  it("tells the queue to keep the batch and back off when the API cannot connect", async () => {
    jest.mocked(apiRequest).mockRejectedValueOnce(new Error("offline"));

    const batch: ParcelBatch = {
      parcels: [
        {
          formula: {
            type: "nagger-updated",
            label: "Test nagger",
            ownerType: "nagger",
            ownerId: "nagger-1",
            coalesceKey: "Nagger:nagger-1",
            canBatch: false,
            sendMethod: "PUT",
            endpointPath: "/api/nags/nagger-1",
            recipientExpectsVersioning: true,
            payload: { title: "Test nagger" },
          },
          stamp: {
            parcelId: "parcel-1",
            queuedAt: "2026-09-23T10:00:00.000Z",
            baseVersion: 7,
            nextVersion: 8,
            clientIdentity: { clientId: "test-client", deviceName: "test", deviceModel: "test" },
          },
        },
      ],
      middlewareContexts: [],
      versioning: { existingVersion: 7, newVersion: 8 },
    };

    const renderedSender = await renderHook(() => useSendParcelBatch(useSendingPromptController()));

    const instruction = await renderedSender.result.current(batch);
    const expectedInstruction = "keep-active-batch-and-backoff" satisfies ParcelQueueInstruction;

    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(instruction).toBe(expectedInstruction);
  });
});
