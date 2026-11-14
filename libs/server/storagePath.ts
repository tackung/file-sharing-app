export function getStorageRootPrefix(): string {
  const configured = process.env.STORAGE_ROOT_PREFIX ?? "home/";
  const root = configured.trim().replace(/\/$/, "");
  const segments = root.split("/");
  if (!root || root.startsWith("/") || root.includes("\\") ||
      segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error("Invalid STORAGE_ROOT_PREFIX configuration");
  }
  return `${root}/`;
}
