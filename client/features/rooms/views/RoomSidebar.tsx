"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import type { Room, User } from "@/shared/types/protocol";
import { Brand } from "@/shared/components/Brand";

type Props = {
  user: User;
  rooms: Room[];
  activeRoom: Room | null;
  error: string;
  onCreate: (name: string) => void;
  onJoin: (room: Room) => void;
  onRefresh: () => void;
  onLogout: () => void;
};

export function RoomSidebar({
  user,
  rooms,
  activeRoom,
  error,
  onCreate,
  onJoin,
  onRefresh,
  onLogout,
}: Props) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [roomName, setRoomName] = useState("");

  const visibleRooms = useMemo(
    () =>
      rooms.filter((room) =>
        room.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [rooms, query],
  );

  const submitRoom = (event: React.FormEvent) => {
    event.preventDefault();

    const cleanRoomName = roomName.trim();
    if (!cleanRoomName) return;

    onCreate(cleanRoomName);
    setRoomName("");
    setCreating(false);
  };

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col border-r border-white/8 bg-[#0d0d12]/95 px-4 py-5 shadow-2xl shadow-black/20 backdrop-blur-xl max-md:px-2">
      {/* Brand */}
      <div className="-mx-4 mb-5 border-b border-white/8 px-4 pb-5 max-md:-mx-2 max-md:px-2">
        <Brand compact />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 max-md:hidden">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            Watchline
          </p>
          <h2 className="mt-1 truncate text-xl font-semibold text-white">
            Ruang Nonton
          </h2>
        </div>

        <button
          className="group flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/3 text-[#a1a1aa] transition hover:border-accent/40 hover:bg-accent/10 hover:text-accent max-md:mx-auto"
          onClick={onRefresh}
          title="Muat ulang"
          type="button"
        >
          <RefreshCw size={16} className="transition group-hover:rotate-180" />
        </button>
      </div>

      {/* Search */}
      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-3 text-[#71717a] transition focus-within:border-accent/50 focus-within:bg-white/6 max-md:justify-center max-md:px-0">
        <Search size={16} className="shrink-0" />
        <input
          className="w-full border-0 bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#62626c] max-md:hidden"
          aria-label="Cari room"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari ruang nonton..."
          value={query}
        />
      </div>

      {/* Create Button */}
      <button
        className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-accent/35 bg-accent/8 p-3 text-sm font-semibold text-[#ff8177] transition hover:border-accent/70 hover:bg-accent/15 hover:text-[#ff9a92] max-md:p-3"
        onClick={() => setCreating((value) => !value)}
        type="button"
      >
        {creating ? <X size={17} /> : <Plus size={17} />}
        <span className="max-md:hidden">
          {creating ? "Batal membuat ruang" : "Buat ruang baru"}
        </span>
      </button>

      {/* Create Form */}
      {creating && (
        <form
          className="mt-3 overflow-hidden rounded-2xl border border-white/8 bg-white/3.5 p-2 max-md:hidden"
          onSubmit={submitRoom}
        >
          <input
            className="mb-2 w-full rounded-xl border border-white/8 bg-[#0b0b10] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#555560] focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(255,91,77,0.10)]"
            aria-label="Nama room baru"
            autoFocus
            onChange={(event) => setRoomName(event.target.value)}
            placeholder="Contoh: Friday Movie Night"
            value={roomName}
          />

          <button
            className="w-full rounded-xl border-0 bg-accent px-3 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
            type="submit"
          >
            Buat Room
          </button>
        </form>
      )}

      {/* Error */}
      {error && (
        <p className="mt-3 rounded-2xl border border-accent/20 bg-accent/8 px-3 py-2.5 text-xs leading-relaxed text-[#ff9a92] max-md:hidden">
          {error}
        </p>
      )}

      {/* Room List */}
      <div className="scrollbar-none -mx-1 mt-6 min-h-0 flex-1 overflow-y-auto px-1">
        <div className="mb-3 flex items-center justify-between max-md:hidden">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#696974]">
            Tersedia
          </p>
          <span className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-xs font-semibold text-[#d4d4d8]">
            {visibleRooms.length}
          </span>
        </div>

        {visibleRooms.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/2.5 px-4 py-10 text-center max-md:border-0 max-md:bg-transparent max-md:px-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-[#71717a]">
              <Users size={22} />
            </div>

            <p className="mt-3 text-sm font-semibold text-[#d4d4d8] max-md:hidden">
              Belum ada ruang
            </p>
            <small className="mt-1 text-xs leading-relaxed text-[#71717a] max-md:hidden">
              Buat ruang pertama dan mulai nonton bareng temanmu.
            </small>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleRooms.map((room) => {
              const isActive = activeRoom?.id === room.id;

              return (
                <button
                  className={`group flex w-full min-w-0 items-center gap-3 rounded-xl border-0 p-2.5 text-left transition max-md:justify-center max-md:p-2 ${
                    isActive
                      ? "bg-orange-300/10 text-white"
                      : "text-[#d8d7dc] hover:bg-white/5.5"
                  }`}
                  key={room.id}
                  onClick={() => onJoin(room)}
                  type="button"
                >
          
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 max-md:hidden">
                    <strong className="truncate text-sm font-semibold">
                      {room.name}
                    </strong>
                  
                  </span>

                  <ChevronRight
                    size={16}
                    className={`max-md:hidden ${
                      isActive
                        ? "text-white/80"
                        : "text-[#52525b] transition group-hover:translate-x-0.5 group-hover:text-[#a1a1aa]"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* User */}
      <div className="-mx-4 mt-4 shrink-0 border-t border-white/8 px-4 pt-4 max-md:-mx-2 max-md:px-2">
        <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3.5 p-2.5 max-md:justify-center max-md:border-0 max-md:bg-transparent max-md:p-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/8 text-xs font-bold text-[#e4e4e7]">
            {user.username.slice(0, 2).toUpperCase()}
          </span>

          <span className="flex min-w-0 flex-1 flex-col overflow-hidden max-md:hidden">
            <strong
              className="block truncate text-sm font-semibold leading-5 text-white"
              title={user.username}
            >
              {user.username}
            </strong>

            <small className="flex items-center gap-1.5 text-xs leading-4 text-green">
              <span className="h-1.5 w-1.5 rounded-full bg-green" />
              Online
            </small>
          </span>

          <button
            className="flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 transition hover:bg-red-500 hover:text-white max-md:hidden"
            aria-label="Keluar dari akun"
            onClick={onLogout}
            title="Keluar"
            type="button"
          >
            <LogOut size={16} />
          </button>
        </div>

        <button
          className="mt-2 hidden h-9 w-full items-center justify-center rounded-xl bg-red-500/10 text-red-300 transition hover:bg-red-500 hover:text-white max-md:flex"
          aria-label="Keluar dari akun"
          onClick={onLogout}
          title="Keluar"
          type="button"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
