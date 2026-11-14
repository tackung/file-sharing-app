import { spawn } from "node:child_process";
import path from "node:path";
import { prepareTenant, projectRoot, readTenant } from "./lib/tenant.mjs";

try {
  const [command, tenantId, ...nextArguments] = process.argv.slice(2);
  if (!["prepare", "dev", "build"].includes(command)) {
    throw new Error("使い方: node scripts/tenant.mjs <prepare|dev|build> <tenant-id>");
  }
  const tenant = await readTenant(tenantId);
  await prepareTenant(tenant);
  console.log(`テナントを準備しました: ${tenant.config.appName} (${tenant.config.id})`);

  if (command !== "prepare") {
    const child = spawn(process.execPath, [
      path.join(projectRoot, "node_modules", "next", "dist", "bin", "next"), command, ...nextArguments,
    ], { cwd: projectRoot, stdio: "inherit" });
    const forwardInterrupt = () => child.kill("SIGINT");
    const forwardTermination = () => child.kill("SIGTERM");
    process.on("SIGINT", forwardInterrupt);
    process.on("SIGTERM", forwardTermination);
    process.exitCode = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", (code) => resolve(code ?? 1));
    });
    process.off("SIGINT", forwardInterrupt);
    process.off("SIGTERM", forwardTermination);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
