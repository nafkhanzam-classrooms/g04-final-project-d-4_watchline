"use client";

import { useState } from "react";
import { Link2, Play, Users } from "lucide-react";
import { useWatchParty } from "@/features/watch-party/hooks/useWatchParty";
import type { Room } from "@/shared/types/protocol";

type Props = {
  room: Room;
  members: string[];
  onLeave: () => void;
};

export function WatchPartyView({ room, members, onLeave }: Props) {
  const {
    playerElementId,
    videoId,
    isPlayerReady,
    changeVideo,
  } = useWatchParty(room.id);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");

  const submitUrl = (event: React.FormEvent) => {
    event.preventDefault();
    if (!urlInput.trim()) return;
    if (!changeVideo(urlInput.trim())) {
      setUrlError(
        isPlayerReady
          ? "URL atau video ID YouTube tidak valid."
          : "YouTube Player masih dimuat. Coba lagi sebentar.",
      );
      return;
    }
    setUrlError("");
    setUrlInput("");
  };

  return (
    <section className="min-w-0 overflow-y-auto bg-[radial-gradient(circle_at_50%_35%,rgba(255,91,77,0.04),transparent_35%),#0d0d11] p-8 scrollbar-none max-[560px]:px-3 max-[560px]:py-5">
      <header className="flex items-center justify-between gap-6 max-[560px]:flex-col max-[560px]:items-start">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-green">
            <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_0_4px_rgba(102,209,158,0.1)]" />
            LIVE ROOM
          </div>
          <h1 className="mt-2 mb-1 text-[40px] font-bold leading-[1.25] tracking-tight max-[560px]:text-2xl">{room.name}</h1>
          <p className="m-0 text-base text-[#74747f]">Room #{room.id} · Semua kontrol video akan disinkronkan</p>
        </div>
        <div className="flex items-center gap-3 max-[560px]:flex-wrap">
          <div className="flex">
            {members.slice(0, 3).map((member) => (
              <span className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-[#292932] text-xs first:ml-0" key={member} title={member}>
                {member.slice(0, 2).toUpperCase()}
              </span>
            ))}
          </div>
          <span className="flex items-center gap-2 text-xs text-[#85858f]">
            <Users size={15} />
            {members.length} online
          </span>
          <button className="rounded-lg border border-[#ef4444] bg-[#dc2626] px-3 py-2 text-xs font-semibold text-white hover:bg-[#ef4444]" onClick={onLeave} type="button">
            Keluar room
          </button>
        </div>
      </header>

      <div className="mt-7 overflow-hidden rounded-lg border border-line bg-panel shadow-[0_28px_72px_rgba(0,0,0,0.27)]">
        {/* Video stage */}
        <div className="relative aspect-video bg-[radial-gradient(circle_at_center,#24242c_0%,#111116_65%)]">
          <div className={`relative z-1 h-full w-full ${videoId ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
            <div id={playerElementId} />
          </div>
          {!videoId && (
            <div className="absolute left-1/2 top-1/2 z-2 w-[80%] max-w-[432px] -translate-x-1/2 -translate-y-1/2 text-center">
              <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent pl-1 text-white shadow-[0_0_0_12px_rgba(255,91,77,0.08)]">
                <Play size={30} fill="currentColor" />
              </span>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-accent">Ready when you are</p>
              <h2 className="mx-auto mt-2 mb-3 max-w-[400px] text-[clamp(20px,2.4vw,28px)] font-semibold leading-[1.4] text-wrap-balance">Tambahkan video YouTube untuk mulai menonton.</h2>
            </div>
          )}
        </div>

        {/* URL form */}
        <form className="flex items-center gap-3 border-t border-line p-3 text-[#666671] max-[560px]:flex-wrap max-[560px]:items-stretch" onSubmit={submitUrl}>
          <Link2 size={17} />
          <input
            className="min-w-0 flex-1 rounded-lg border border-line bg-[#101015] p-3 text-xs outline-none placeholder:text-[#555560] focus:border-accent/65 focus:shadow-[0_0_0_3px_rgba(255,91,77,0.09)] max-[560px]:basis-[calc(100%-28px)]"
            aria-label="URL atau video ID YouTube"
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="Tempel URL YouTube atau video ID..."
            type="text"
            value={urlInput}
          />
          <button className="self-stretch rounded-lg border-0 bg-accent px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 max-[560px]:min-h-10 max-[560px]:w-full" disabled={!isPlayerReady} type="submit">
            Pasang video
          </button>
        </form>
        {urlError && <p className="-mt-1 mx-4 mb-3 ml-10 text-xs text-[#ff8d83]">{urlError}</p>}
      </div>
    </section>
  );
}
