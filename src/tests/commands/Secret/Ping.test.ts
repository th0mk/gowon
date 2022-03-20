import Ping from "../../../commands/Secret/Ping";
import { mockContext, mockRunAs } from "../../../mocks/MockContext";
import { setMockServices } from "../../../mocks/services/mockServices";

describe("Ping command", () => {
  beforeAll(setMockServices);

  test("should pong", async () => {
    const ping = new Ping();
    const ctx = mockContext();

    await ping.execute(ctx);

    const response = ctx.latestResponse<string>();

    expect(response).toMatch(/(pong|pang)/i);
  });

  test("should pon", async () => {
    const ping = new Ping();
    const ctx = mockContext({ runAs: mockRunAs("pin") });

    await ping.execute(ctx);

    const response = ctx.latestResponse<string>();

    expect(response).toBe("Pon 🏓");
  });
});
