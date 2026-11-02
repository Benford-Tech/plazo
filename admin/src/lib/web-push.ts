import { adminApi } from "./api";

/**
 * 02/11/2026 (« Mes notifications »): the browser notifications of the pro space. The service worker (`/pro/sw.js`)
 * shows them, even when no tab of Plazo is open; the server sends them by Web Push (VAPID).
 */

export type BrowserPushState = "unsupported" | "denied" | "off" | "on";

export function browserPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

const swUrl = () => `${import.meta.env.BASE_URL}sw.js`;

async function registration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register(swUrl(), { scope: import.meta.env.BASE_URL });
}

/** « Chrome · Mac », to tell the browsers apart in « Mes appareils ». */
export function browserLabel(ua = navigator.userAgent): string {
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Navigateur";
  const os = /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} · ${os}` : browser;
}

function keyBytes(base64url: string): Uint8Array {
  const padded = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** This browser's subscription, if it has one. */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!browserPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL);
  return reg ? reg.pushManager.getSubscription() : null;
}

export async function browserPushState(): Promise<BrowserPushState> {
  if (!browserPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return (await currentSubscription()) ? "on" : "off";
}

/** Asks the browser (one click of the member), subscribes it and tells the server. */
export async function enableBrowserPush(publicKey: string) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error(permission === "denied" ? "denied" : "dismissed");
  const reg = await registration();
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) as BufferSource }));
  const json = sub.toJSON();
  return adminApi.subscribeBrowser({
    endpoint: sub.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
    label: browserLabel(),
  });
}

export async function disableBrowserPush() {
  const sub = await currentSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => undefined);
  return adminApi.unsubscribeBrowser(endpoint);
}
