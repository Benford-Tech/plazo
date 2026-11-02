/* 02/11/2026 (« Mes notifications »): the service worker of the pro space, for the browser notifications only
   (Web Push). No cache: the pages always come from the network. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Plazo", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Plazo";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/pro/apple-touch-icon-pro.png",
      badge: "/pro/favicon-pro.svg",
      tag: data.tag || undefined,
      data: { url: data.url || "/pro/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/pro/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/pro") && "focus" in client) {
          client.navigate(url).catch(() => undefined);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
