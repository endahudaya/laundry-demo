self.addEventListener("push", function (event) {
  let data = { title: "Bersih Laundry", body: "Ada update pesanan kamu!" };
  try {
    data = event.data.json();
  } catch (e) {
    // biarkan default kalau gagal parse
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Bersih Laundry", {
      body: data.body || "",
      icon: "/icon.png",
      badge: "/icon.png",
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || "/pesanan-saya")
  );
});
