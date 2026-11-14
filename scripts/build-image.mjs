import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { prepareBuildContext, projectRoot, readTenant } from "./lib/tenant.mjs";

const publicVariables = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];
const requiredVariables = publicVariables.filter((name) => ![
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "NEXT_PUBLIC_FIREBASE_SENDER_ID",
].includes(name));

let contextDirectory;
try {
  const [tenantId, imageName, ...extraArguments] = process.argv.slice(2);
  if (!imageName || extraArguments.length || (imageName.startsWith("-") && imageName !== "--context-only")) {
    throw new Error("使い方: npm run image:build -- <tenant-id> <イメージ名|--context-only>");
  }
  const tenant = await readTenant(tenantId);
  if (imageName === "--context-only") {
    contextDirectory = await prepareBuildContext(tenant);
    console.log(`ビルドコンテキストを作成しました: ${contextDirectory}`);
    console.log("確認後、この一時ディレクトリは削除できます。");
    contextDirectory = undefined;
  } else {
    const require = createRequire(import.meta.url);
    const { loadEnvConfig } = require("@next/env");
    loadEnvConfig(projectRoot, false);
    const missingVariables = requiredVariables.filter((name) => !process.env[name]);
    if (missingVariables.length) {
      throw new Error(`ビルド時の公開用Firebase設定が不足しています: ${missingVariables.join(", ")}`);
    }
    if (process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_PROJECT_ID !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      throw new Error("FIREBASE_PROJECT_IDとNEXT_PUBLIC_FIREBASE_PROJECT_IDを同じ認証プロジェクトに揃えてください。");
    }

    contextDirectory = await prepareBuildContext(tenant);
    const buildArguments = [
      "build", "--platform", "linux/amd64", "--tag", imageName,
      "--label", `app.tenant=${tenant.config.id}`,
    ];
    for (const name of publicVariables) {
      if (process.env[name]) buildArguments.push("--build-arg", name);
    }
    buildArguments.push(contextDirectory);
    console.log(`コンテナをビルドします: ${tenant.config.appName} → ${imageName}`);
    const child = spawn("docker", buildArguments, { cwd: projectRoot, stdio: "inherit", env: process.env });
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
} finally {
  if (contextDirectory) await rm(contextDirectory, { recursive: true, force: true });
}
