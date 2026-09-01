import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const sourceDist = join(projectRoot, "dist");
const serverRoot = join(projectRoot, ".e2e-server");
const targetDist = join(serverRoot, "dist");

if (dirname(targetDist) !== serverRoot) {
  throw new Error("Refusing to prepare an E2E server outside the isolated directory.");
}

await mkdir(serverRoot, { recursive: true });
await rm(targetDist, { recursive: true, force: true });
await cp(sourceDist, targetDist, { recursive: true });
