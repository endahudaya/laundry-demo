"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function HalamanLogin() {
  const { user, loading, loginGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading) {
    return <div className="card">Memuat...</div>;
  }

  return (
    <div className="login-wrap">
      <div className="login-hero-airy">
        <div className="login-hero-copy">
          <div className="login-eyebrow">
            <span className="login-eyebrow-mark">🧺</span> Bersih Laundry
          </div>

          <h1 className="login-title">
            Laundry beres,
            <br />
            <span className="login-title-accent">hidup lebih tenang.</span>
          </h1>

          <p className="login-subtitle">
            Pantau status cucian, atur jadwal jemput, dan dapat notifikasi otomatis — semua dalam satu tempat.
          </p>

          <div className="login-actions">
            <button className="login-google-btn-dark" onClick={loginGoogle} type="button">
              <span className="login-google-icon-box">
                <GoogleIcon />
              </span>
              Masuk dengan Google
            </button>
          </div>

          <div className="login-stats-row">
            <div className="login-stat">
              <div className="login-stat-value">Realtime</div>
              <div className="login-stat-label">Update status pesanan</div>
            </div>
            <div className="login-stat">
              <div className="login-stat-value">1 Klik</div>
              <div className="login-stat-label">Notifikasi WA &amp; Email</div>
            </div>
            <div className="login-stat">
              <div className="login-stat-value">24/7</div>
              <div className="login-stat-label">Pantau dari mana saja</div>
            </div>
          </div>
        </div>

        <div className="login-hero-visual">
          <span className="login-visual-blob login-visual-blob-1" />
          <span className="login-visual-blob login-visual-blob-2" />
          <span className="login-visual-bubble login-visual-bubble-a" />
          <span className="login-visual-bubble login-visual-bubble-b" />
          <span className="login-visual-bubble login-visual-bubble-c" />

          <div className="login-illustration-inner">
            <WasherIllustration />
            <div className="login-live-badge">
              <span className="badge-dot" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WasherIllustration() {
  return (
    <svg
      className="login-illustration svg-washer"
      viewBox="0 0 300 320"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="70" y="246" width="16" height="12" rx="3" className="w-leg" />
      <rect x="214" y="246" width="16" height="12" rx="3" className="w-leg" />

      <rect x="40" y="36" width="220" height="210" rx="26" className="w-body" />
      <rect x="54" y="50" width="192" height="28" rx="14" className="w-panel" />
      <circle cx="212" cy="64" r="9" className="w-dial" />
      <circle cx="184" cy="64" r="3" className="w-dial" opacity="0.6" />
      <circle cx="196" cy="64" r="3" className="w-dial" opacity="0.6" />

      <circle cx="150" cy="160" r="68" className="w-door-glass" />
      <g className="w-door-spin">
        <circle cx="130" cy="144" r="10" className="w-bubble" />
        <circle cx="172" cy="178" r="14" className="w-bubble" opacity="0.7" />
        <circle cx="150" cy="134" r="7" className="w-bubble" opacity="0.85" />
        <circle cx="168" cy="144" r="5" className="w-bubble" opacity="0.6" />
        <circle cx="132" cy="182" r="6" className="w-bubble" opacity="0.5" />
      </g>
      <circle cx="150" cy="160" r="68" className="w-door-ring" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.3 4.4-4.2 5.8l6.3 5.3C40.9 36.3 44 30.7 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}
