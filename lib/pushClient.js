import { supabase } from "./supabaseClient";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function pushDidukung() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function aktifkanPushNotification(userId) {
  if (!pushDidukung()) {
    throw new Error("Browser ini tidak mendukung notifikasi push.");
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error("VAPID key belum dikonfigurasi di environment variable.");
  }

  // PENTING: minta izin notifikasi DULUAN, sebelum proses lain yang
  // pakai "await". Safari (beda dari Chrome) akan diam-diam menolak
  // kalau ada jeda proses sebelum minta izin, karena dianggap bukan
  // hasil klik langsung dari user.
  const izin = await Notification.requestPermission();
  if (izin !== "granted") {
    throw new Error("Izin notifikasi ditolak/belum diberikan.");
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const raw = subscription.toJSON();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: raw.endpoint,
      p256dh: raw.keys.p256dh,
      auth: raw.keys.auth,
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) throw error;

  return true;
}
