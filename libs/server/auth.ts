import type { NextApiRequest, NextApiResponse } from "next";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const invalidTokenCodes = new Set([
  "auth/argument-error",
  "auth/invalid-id-token",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/user-disabled",
]);

export async function requireAllowedUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<boolean> {
  res.setHeader("Cache-Control", "private, no-store");
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || "");
  if (!match) {
    res.status(401).json({ message: "Authentication required" });
    return false;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const allowedEmails = (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (!projectId || allowedEmails.length === 0) {
    res.status(500).json({ message: "Authentication configuration error" });
    return false;
  }

  try {
    const app = getApps().find((app) => app.name === "hal-share-server") ||
      initializeApp({ projectId, credential: applicationDefault() }, "hal-share-server");
    const token = await getAuth(app).verifyIdToken(match[1]);
    if (!token.email_verified || !token.email ||
        !allowedEmails.includes(token.email.trim().toLowerCase())) {
      res.status(403).json({ message: "Access denied" });
      return false;
    }
    return true;
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? String(error.code) : "unknown";
    if (invalidTokenCodes.has(code)) {
      res.status(401).json({ message: "Invalid or expired token" });
    } else {
      console.error("Firebase authentication failed:", code);
      res.status(503).json({ message: "Authentication service unavailable" });
    }
    return false;
  }
}
