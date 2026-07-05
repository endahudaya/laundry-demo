import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Client khusus server, pakai SERVICE ROLE KEY (bypass RLS) —
// JANGAN PERNAH taruh key ini di kode yang jalan di browser!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
  "mailto:admin@bersihlaundry.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(request) {
  try {
    const { userId, judul, pesan } = await request.json();

    if (!userId || !judul || !pesan) {
      return Response.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const hasil = { push: 0, email: 0 };

    // 1) KIRIM PUSH NOTIFICATION (kalau customer pernah aktifkan)
    const { data: subscriptions } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (subscriptions && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({ title: judul, body: pesan })
          );
          hasil.push += 1;
        } catch (err) {
          // subscription kadaluarsa/invalid, hapus biar bersih
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }
    }

    // 2) KIRIM EMAIL (lewat Resend)
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = userData?.user?.email;

    if (email && process.env.RESEND_API_KEY) {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Bersih Laundry <onboarding@resend.dev>",
          to: email,
          subject: judul,
          html: `<p>${pesan}</p>`,
        }),
      });
      if (resp.ok) hasil.email = 1;
    }

    return Response.json({ ok: true, hasil });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
