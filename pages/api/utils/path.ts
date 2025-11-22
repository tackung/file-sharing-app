const INVALID_SEGMENT_PATTERN = /(^\.{1,2}$)|[\\/]/;

// Normalize path under uploads/; returns '' for root, always ends with '/'
export const normalizePath = (rawPath?: string): string => {
  const path = (rawPath || "").trim();
  if (path === "") return "";
  const segments = path.split("/").filter(Boolean);
  if (segments.some((segment) => INVALID_SEGMENT_PATTERN.test(segment))) {
    throw new Error("Invalid path");
  }
  return segments.join("/") + "/";
};

export const validateFileName = (name?: string): string => {
  const fileName = (name || "").trim();
  if (!fileName) {
    throw new Error("File name is required");
  }
  if (INVALID_SEGMENT_PATTERN.test(fileName)) {
    throw new Error("Invalid file name");
  }
  return fileName;
};
