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
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),#0d0d11] bg-[length:56px_56px] after:absolute after:bottom-0 after:left-[15%] after:h-px after:w-[70%] after:bg-[linear-gradient(90deg,transparent,rgba(255,91,77,0.45),transparent)]">
      {/* Glows */}
      <div className="pointer-events-none absolute left-[-248px] top-[20%] h-[360px] w-[360px] rounded-full bg-accent opacity-20 blur-[5px]" />
      <div className="pointer-events-none absolute right-[-328px] top-[12%] h-[432px] w-[432px] rounded-full bg-[#a54464] opacity-20 blur-[5px]" />

      {/* Nav */}
      <header className="relative z-2 mx-auto flex max-w-[1184px] items-center justify-between px-8 py-7 max-md:px-5 max-md:py-5">
        <Brand />
        <ConnectionBadge status={status} />
      </header>

      {/* Shell */}
      <section className="relative z-1 mx-auto grid max-w-[1184px] min-h-[calc(100vh-96px)] items-center gap-[8%] px-8 pb-22 pt-8 grid-cols-[minmax(0,1.1fr)_minmax(360px,432px)] max-[1050px]:gap-[5%] max-[1050px]:grid-cols-[minmax(0,1fr)_392px] max-md:flex max-md:flex-col max-md:gap-14 max-md:px-5 max-md:pb-20 max-md:pt-14">
        {/* Story */}
        <div className="max-md:text-center">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-accent max-md:justify-center">
            <Radio size={15} />
            Ruang nonton real-time
          </p>
          <h1 className="mt-6 mb-6 max-w-[720px] text-[clamp(44px,5vw,64px)] font-bold leading-[1.12] tracking-[-0.04em] max-[560px]:text-[40px]">
            Nonton bareng,
            <br />
            tetap <em className="not-italic font-bold text-accent">sinkron.</em>
          </h1>
          <p className="max-w-[560px] text-base leading-[1.75] text-[#aaa9b1]">
            Putar video yang sama, ngobrol langsung, dan nikmati movie night
            tanpa repot menyamakan waktu.
          </p>

          <div className="mt-12 flex gap-8 max-[1050px]:flex-col max-[1050px]:items-start max-[1050px]:gap-4 max-md:flex-row max-md:flex-wrap max-md:items-center max-md:justify-center max-[560px]:grid max-[560px]:grid-cols-1 max-[560px]:gap-3 max-[560px]:mt-9 max-[560px]:text-left">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/22 bg-accent/10 text-accent">
                <Film size={20} />
              </span>
              <div className="flex flex-col gap-1">
                <strong className="text-xs">Video sinkron</strong>
                <small className="text-xs text-[#777782]">Play dan pause bersama</small>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/22 bg-accent/10 text-accent">
                <MessageCircle size={20} />
              </span>
              <div className="flex flex-col gap-1">
                <strong className="text-xs">Live chat</strong>
                <small className="text-xs text-[#777782]">Reaksi dalam hitungan detik</small>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/22 bg-accent/10 text-accent">
                <Users size={20} />
              </span>
              <div className="flex flex-col gap-1">
                <strong className="text-xs">Private rooms</strong>
                <small className="text-xs text-[#777782]">Ruang nyaman untuk temanmu</small>
              </div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="relative before:absolute before:left-[-20px] before:top-8 before:h-px before:w-11 before:rotate-90 before:bg-white/8 after:absolute after:right-[-20px] after:top-8 after:h-px after:w-11 after:rotate-90 after:bg-white/8 max-md:w-full max-md:max-w-[440px]">
          <div className="rounded border border-white/10 bg-[rgba(23,23,29,0.92)] px-8 pb-8 pt-3 shadow-[0_32px_80px_rgba(0,0,0,0.35)] backdrop-blur-[18px] max-[560px]:px-5">
            {/* Tabs */}
            <div className="-mx-8 mb-7 flex border-b border-line px-8 max-[560px]:-mx-5 max-[560px]:px-5">
              <Link
                className={`border-b-2 px-5 pb-3 pt-4 text-xs font-semibold no-underline ${mode === "login" ? "border-accent text-ink" : "border-transparent text-[#777782]"}`}
                href="/login"
              >
                Masuk
              </Link>
              <Link
                className={`border-b-2 px-5 pb-3 pt-4 text-xs font-semibold no-underline ${mode === "register" ? "border-accent text-ink" : "border-transparent text-[#777782]"}`}
                href="/register"
              >
                Daftar
              </Link>
            </div>

            {/* Heading */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">Selamat datang</p>
              <h2 className="mt-3 mb-2 text-2xl font-semibold leading-[1.35] tracking-tight">
                {mode === "login"
                  ? "Lanjutkan movie night-mu."
                  : "Buat akun WatchLine."}
              </h2>
              <p className="mb-6 text-xs text-muted">
                {mode === "login"
                  ? "Masuk untuk kembali ke ruang tontonan."
                  : "Cukup username dan password untuk mulai."}
              </p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={submit}>
              <label className="flex flex-col gap-2 text-xs font-semibold text-[#c7c6cc]">
                Username
                <input
                  className="rounded-lg border border-line bg-[#101015] px-4 py-3 outline-none transition-[border-color,box-shadow] placeholder:text-[#555560] focus:border-accent/65 focus:shadow-[0_0_0_3px_rgba(255,91,77,0.09)]"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="contoh: nolanenthusiast"
                  autoComplete="username"
                  maxLength={50}
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-[#c7c6cc]">
                Password
                <input
                  className="rounded-lg border border-line bg-[#101015] px-4 py-3 outline-none transition-[border-color,box-shadow] placeholder:text-[#555560] focus:border-accent/65 focus:shadow-[0_0_0_3px_rgba(255,91,77,0.09)]"
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
              {error && <p className="m-0 rounded border border-accent/20 bg-accent/9 px-3 py-2 text-xs text-[#ff8d83]">{error}</p>}
              <button
                className="mt-1 flex items-center justify-center gap-2 rounded-lg border-0 bg-accent px-4 py-3 font-semibold hover:bg-[#ff6b5f] disabled:cursor-not-allowed disabled:opacity-50"
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
            <p className="mt-4 text-center text-xs text-[#5f5f69]">
              Dengan melanjutkan, kamu siap untuk movie night yang lebih rapi.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#696973]">
            <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_0_4px_rgba(102,209,158,0.1)]" />
            Dibangun untuk percakapan yang benar-benar real-time
          </div>
        </div>
      </section>
    </main>
  );
}
