import { auth } from "./firebase";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const url = new URL(path, window.location.origin);
  if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/")) {
    throw new Error("Expected a same-origin API URL");
  }
  const user = auth.currentUser;
  if (!user) throw new Error("Authentication required");
  const token = await user.getIdToken();
  if (auth.currentUser !== user) throw new Error("Authentication changed");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(url.href, { ...init, headers, redirect: "error" });
}
