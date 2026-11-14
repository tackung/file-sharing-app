import { cp, mkdir, mkdtemp, readFile, realpath, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("../../", import.meta.url));

const sharedFiles = [
  "Dockerfile", ".dockerignore", ".eslintrc.json", "package.json", "package-lock.json",
  "next.config.js", "tsconfig.json", "babel.config.js",
  "postcss.config.js", "tailwind.config.js",
];
const sharedDirectories = ["pages", "components", "context", "hooks", "libs", "styles", "types"];

export async function readTenant(tenantId) {
  if (!tenantId || !/^[a-z][a-z0-9-]*$/.test(tenantId)) {
    throw new Error("tenants内のテナントIDを明示してください。");
  }

  let manifest;
  try {
    manifest = JSON.parse(await readFile(path.join(projectRoot, "tenants", tenantId, "tenant.json"), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`未登録のテナントです: ${tenantId}`);
    throw error;
  }

  for (const field of ["id", "tenantName", "appName", "loginTitle", "headerTitle", "rootFolderLabel", "loginImageSource"]) {
    if (typeof manifest[field] !== "string" || !manifest[field].trim()) {
      throw new Error(`テナント設定が不足しています: ${tenantId}.${field}`);
    }
  }
  if (!/^[a-z][a-z0-9-]*$/.test(manifest.id)) {
    throw new Error("テナント設定のidは英小文字で始まる英小文字・数字・ハイフンにしてください。");
  }

  const tenantRoot = await realpath(path.join(projectRoot, "tenants", tenantId));
  const imageSource = await realpath(path.resolve(projectRoot, manifest.loginImageSource));
  if (!imageSource.startsWith(`${tenantRoot}${path.sep}`) || !(await stat(imageSource)).isFile()) {
    throw new Error("ログイン画像には対象テナントのディレクトリ内の画像ファイルを指定してください。");
  }
  const extension = path.extname(imageSource).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"].includes(extension)) {
    throw new Error("ログイン画像の形式がサポートされていません。");
  }

  return {
    imageSource,
    imageName: `login-background${extension}`,
    config: {
      id: manifest.id,
      tenantName: manifest.tenantName,
      appName: manifest.appName,
      loginTitle: manifest.loginTitle,
      headerTitle: manifest.headerTitle,
      rootFolderLabel: manifest.rootFolderLabel,
      loginBackgroundImage: `/tenant/login-background${extension}`,
    },
  };
}

export async function prepareTenant(tenant, destination = projectRoot) {
  const configDirectory = path.join(destination, "config");
  const assetDirectory = path.join(destination, "public", "tenant");
  await mkdir(configDirectory, { recursive: true });
  // next-env.d.tsはGit管理外なので、新しいチェックアウトでも準備できるようにする。
  try {
    await writeFile(path.join(destination, "next-env.d.ts"), [
      '/// <reference types="next" />',
      '/// <reference types="next/image-types/global" />',
      "",
      "// NOTE: This file should not be edited",
      "// see https://nextjs.org/docs/basic-features/typescript for more information.",
      "",
    ].join("\n"), { flag: "wx" });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  // このディレクトリはテナント準備処理専用の生成先。
  await rm(assetDirectory, { recursive: true, force: true });
  await mkdir(assetDirectory, { recursive: true });
  await cp(tenant.imageSource, path.join(assetDirectory, tenant.imageName));
  await writeFile(path.join(configDirectory, "tenant.generated.json"), `${JSON.stringify(tenant.config, null, 2)}\n`);
}

export async function prepareBuildContext(tenant) {
  const contextDirectory = await mkdtemp(path.join(tmpdir(), `file-share-${tenant.config.id}-`));
  try {
    for (const entry of [...sharedFiles, ...sharedDirectories]) {
      await cp(path.join(projectRoot, entry), path.join(contextDirectory, entry), {
        recursive: true,
        filter: (source) => path.basename(source) !== ".DS_Store",
      });
    }

    await mkdir(path.join(contextDirectory, "public"), { recursive: true });
    await cp(path.join(projectRoot, "public", "favicon.ico"), path.join(contextDirectory, "public", "favicon.ico"));
    const commonDirectory = path.join(projectRoot, "public", "common");
    try {
      await stat(commonDirectory);
      await cp(commonDirectory, path.join(contextDirectory, "public", "common"), { recursive: true });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    await prepareTenant(tenant, contextDirectory);
    await writeFile(path.join(contextDirectory, "tenant-build.json"), `${JSON.stringify({
      tenantId: tenant.config.id,
      appName: tenant.config.appName,
    }, null, 2)}\n`);
    return contextDirectory;
  } catch (error) {
    await rm(contextDirectory, { recursive: true, force: true });
    throw error;
  }
}
