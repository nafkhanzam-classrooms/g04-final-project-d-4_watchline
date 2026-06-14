"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";
import { ArrowRight, Film, MessageCircle, Radio, Users } from "lucide-react";
import { Brand } from "@/shared/components/Brand";
import { ConnectionBadge } from "@/shared/components/ConnectionBadge";
import { useAuth } from "@/features/auth/hooks/useAuth";

type Props = {
  mode: "login" | "register";
};

export function AuthView({ mode }: Props) {
  const router = useRouter();
  const { user, status, loading, initialized, error, login, register } =
    useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (initialized && user) router.replace("/rooms");
  }, [initialized, router, user]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === "login") login(username, password);
    else register(username, password);
  };

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <header className="auth-nav">
        <Brand />
        <ConnectionBadge status={status} />
      </header>

      <section className="auth-shell">
        <div className="auth-story">
          <p className="eyebrow">
            <Radio size={15} />
            Ruang nonton real-time
          </p>
          <h1>
            Nonton bareng,
            <br />
            tetap <em>sinkron.</em>
          </h1>
          <p className="hero-copy">
            Putar video yang sama, ngobrol langsung, dan nikmati movie night
            tanpa repot menyamakan waktu.
          </p>

          <div className="feature-row">
            <div className="feature-item">
              <span><Film size={20} /></span>
              <div>
                <strong>Video sinkron</strong>
                <small>Play dan pause bersama</small>
              </div>
            </div>
            <div className="feature-item">
              <span><MessageCircle size={20} /></span>
              <div>
                <strong>Live chat</strong>
                <small>Reaksi dalam hitungan detik</small>
              </div>
            </div>
            <div className="feature-item">
              <span><Users size={20} /></span>
              <div>
                <strong>Private rooms</strong>
                <small>Ruang nyaman untuk temanmu</small>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-card-wrap">
          <div className="auth-card">
            <div className="auth-tabs">
              <Link
                className={mode === "login" ? "active" : ""}
                href="/login"
              >
                Masuk
              </Link>
              <Link
                className={mode === "register" ? "active" : ""}
                href="/register"
              >
                Daftar
              </Link>
            </div>
            <div className="auth-card-heading">
              <p className="mini-label">Selamat datang</p>
              <h2>
                {mode === "login"
                  ? "Lanjutkan movie night-mu."
                  : "Buat akun WatchLine."}
              </h2>
              <p>
                {mode === "login"
                  ? "Masuk untuk kembali ke ruang tontonan."
                  : "Cukup username dan password untuk mulai."}
              </p>
            </div>

            <form onSubmit={submit}>
              <label>
                Username
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="contoh: nolanenthusiast"
                  autoComplete="username"
                  maxLength={50}
                  required
                />
              </label>
              <label>
                Password
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Masukkan password"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button
                className="primary-button auth-submit"
                disabled={loading || status !== "connected"}
                type="submit"
              >
                {loading
                  ? "Memproses..."
                  : mode === "login"
                    ? "Masuk ke WatchLine"
                    : "Buat akun"}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>
            <p className="auth-footnote">
              Dengan melanjutkan, kamu siap untuk movie night yang lebih rapi.
            </p>
          </div>
          <div className="card-caption">
            <span className="pulse-dot" />
            Dibangun untuk percakapan yang benar-benar real-time
          </div>
        </div>
      </section>
    </main>
  );
}
