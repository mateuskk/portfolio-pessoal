import { createServer, type Server } from "node:net";
import { afterEach, describe, expect, it } from "vitest";

import { assertPortAvailable } from "@/scripts/e2e-server-lifecycle";

let occupiedServer: Server | undefined;

afterEach(async () => {
  if (!occupiedServer?.listening) return;
  await new Promise<void>((resolveClose, rejectClose) => {
    occupiedServer?.close((error) => error ? rejectClose(error) : resolveClose());
  });
  occupiedServer = undefined;
});

describe("E2E server lifecycle", () => {
  it("rejects any occupied TCP port regardless of HTTP response", async () => {
    occupiedServer = createServer((_socket) => undefined);
    await new Promise<void>((resolveListen) => occupiedServer?.listen(0, "127.0.0.1", resolveListen));
    const address = occupiedServer.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP address.");

    await expect(assertPortAvailable(address.port)).rejects.toThrow(/already in use/i);
  });
});
