self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/api/download")) {
    event.respondWith(
      fetch(event.request).then((response) => {
        return response.blob().then((blob) => {
          return new Response(blob, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        });
      })
    );
  }
});

self.addEventListener("message", async (event) => {
  const { id, name } = event.data;

  try {
    const response = await fetch(`/api/download?id=${id}`, { credentials: "include" });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Powiadomienie o zakończeniu pobierania
    self.registration.showNotification("Pobieranie zakończone", {
      body: name,
      icon: "/icon.png",
      data: { url, name },
    });
  } catch (error) {
    console.error("Błąd pobierania", error);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { url, name } = event.notification.data;

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow(url).then((windowClient) => {
          if (windowClient) {
            const a = document.createElement("a");
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
          }
        });
      }
    })
  );
});
