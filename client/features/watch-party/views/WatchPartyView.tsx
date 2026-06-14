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
    <section className="watch-view">
      <header className="watch-header">
        <div>
          <div className="room-live">
            <span />
            LIVE ROOM
          </div>
          <h1>{room.name}</h1>
          <p>Room #{room.id} · Semua kontrol video akan disinkronkan</p>
        </div>
        <div className="watch-actions">
          <div className="avatars">
            {members.slice(0, 3).map((member) => (
              <span key={member} title={member}>
                {member.slice(0, 2).toUpperCase()}
              </span>
            ))}
          </div>
          <span className="watch-member-count">
            <Users size={15} />
            {members.length} online
          </span>
          <button className="leave-button" onClick={onLeave} type="button">
            Keluar room
          </button>
        </div>
      </header>

      <div className="video-card">
        <div className="video-stage">
          <div
            className={videoId ? "youtube-player active" : "youtube-player"}
          >
            <div id={playerElementId} />
          </div>
          {!videoId && (
            <div className="video-empty">
              <span className="video-empty-icon">
                <Play size={30} fill="currentColor" />
              </span>
              <p className="mini-label">Ready when you are</p>
              <h2>Tambahkan video YouTube untuk mulai menonton.</h2>
            </div>
          )}
        </div>
        <form className="video-url-form" onSubmit={submitUrl}>
          <Link2 size={17} />
          <input
            aria-label="URL atau video ID YouTube"
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="Tempel URL YouTube atau video ID..."
            type="text"
            value={urlInput}
          />
          <button disabled={!isPlayerReady} type="submit">
            Pasang video
          </button>
        </form>
        {urlError && <p className="video-url-error">{urlError}</p>}
      </div>
    </section>
  );
}
