import { existsSync } from "node:fs";
import { chromium, defineConfig } from "@playwright/test";

const windowsChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const fallbackChannel = !existsSync(chromium.executablePath()) && process.platform === "win32" && existsSync(windowsChrome)
  ? "chrome" as const
  : undefined;

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "chromium",
    channel: fallbackChannel,
    trace: "retain-on-failure",
  },
});
