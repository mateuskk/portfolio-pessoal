import { type ChildProcess } from "node:child_process";
import { createConnection } from "node:net";

function hasExited(server: ChildProcess) {
  return server.exitCode !== null || server.signalCode !== null;
}

function waitForExit(server: ChildProcess, timeoutMs: number) {
  if (hasExited(server)) return Promise.resolve();

  return Promise.race([
    new Promise<void>((resolveExit) => server.once("exit", () => resolveExit())),
    new Promise<void>((resolveTimeout) => setTimeout(resolveTimeout, timeoutMs)),
  ]);
}

export function assertPortAvailable(port: number, host = "127.0.0.1") {
  return new Promise<void>((resolveAvailable, rejectUnavailable) => {
    const socket = createConnection({ host, port });
    let settled = false;

    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      callback();
    };

    socket.setTimeout(1_000);
    socket.once("connect", () => {
      settle(() => rejectUnavailable(new Error(`Port ${port} is already in use.`)));
    });
    socket.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ECONNREFUSED") {
        settle(resolveAvailable);
        return;
      }

      settle(() => rejectUnavailable(new Error(`Could not verify port ${port}: ${error.message}`)));
    });
    socket.once("timeout", () => {
      settle(() => rejectUnavailable(new Error(`Could not verify port ${port}: connection timed out.`)));
    });
  });
}

export async function stopChildProcess(server: ChildProcess) {
  if (hasExited(server)) return;

  server.kill("SIGTERM");
  await waitForExit(server, 750);

  if (!hasExited(server) && server.pid) {
    try {
      process.kill(server.pid, "SIGKILL");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
    }

    await waitForExit(server, 750);
  }
}
