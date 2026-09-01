import { spawn, type ChildProcess } from "node:child_process";
import { join, resolve } from "node:path";

import { assertPortAvailable, stopChildProcess } from "../scripts/e2e-server-lifecycle";

const serverPort = 3100;
const serverURL = `http://127.0.0.1:${serverPort}`;

async function waitForServer(server: ChildProcess) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Isolated E2E server exited with code ${server.exitCode}.`);

    try {
      const response = await fetch(serverURL);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }

  throw new Error("Isolated E2E server did not become ready within 30 seconds.");
}

export default async function globalSetup() {
  await assertPortAvailable(serverPort);

  const projectRoot = resolve(import.meta.dirname, "..");
  const serverRoot = join(projectRoot, ".e2e-server");
  const vinextCli = join(projectRoot, "node_modules", "vinext", "dist", "cli.js");
  const server = spawn(process.execPath, [vinextCli, "start", "--port", String(serverPort)], {
    cwd: serverRoot,
    env: process.env,
    stdio: "ignore",
    windowsHide: true,
  });

  try {
    await waitForServer(server);
  } catch (error) {
    await stopChildProcess(server);
    throw error;
  }

  return () => stopChildProcess(server);
}
