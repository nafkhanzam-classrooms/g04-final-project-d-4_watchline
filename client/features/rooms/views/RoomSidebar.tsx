"use client";

import { useState } from "react";
import {
  ChevronRight,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Users,
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
  const visibleRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(query.toLowerCase()),
  );

  const submitRoom = (event: React.FormEvent) => {
    event.preventDefault();
    if (!roomName.trim()) return;
    onCreate(roomName);
    setRoomName("");
    setCreating(false);
  };

  return (
    <aside className="flex min-h-0 flex-col border-r border-line bg-[#111116] px-4 py-6 max-md:px-2 max-[560px]:px-2">
      {/* Brand */}
      <div className="-mx-4 mb-6 border-b border-line px-4 pb-5 max-md:-mx-2 max-md:px-3">
        <Brand compact />
      </div>

      {/* Heading */}
      <div className="flex items-center justify-between">
        <div className="max-md:hidden">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-accent">Browse</p>
          <h2 className="mt-1 text-xl font-semibold">Ruang nonton</h2>
        </div>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-transparent text-muted max-md:mx-auto"
          onClick={onRefresh}
          title="Muat ulang"
          type="button"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="mt-5 flex items-center gap-2 rounded-lg border border-line bg-[#18181e] px-3 text-[#696974] max-md:justify-center max-md:p-3">
        <Search size={16} />
        <input
          className="w-full border-0 bg-transparent py-3 text-xs outline-none max-md:hidden"
          aria-label="Cari room"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari room..."
          value={query}
        />
      </div>

      {/* Create */}
      <button
        className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-accent/40 bg-accent/9 p-3 text-xs font-semibold text-[#ff8177] max-md:p-3"
        onClick={() => setCreating((value) => !value)}
        type="button"
      >
        <Plus size={17} />
        <span className="max-md:hidden">Buat ruang baru</span>
      </button>

      {creating && (
        <form className="mt-2 flex gap-2" onSubmit={submitRoom}>
          <input
            className="min-w-0 flex-1 rounded-lg border border-line bg-[#101015] px-3 py-2 text-xs outline-none placeholder:text-[#555560] focus:border-accent/65 focus:shadow-[0_0_0_3px_rgba(255,91,77,0.09)]"
            aria-label="Nama room baru"
            autoFocus
            onChange={(event) => setRoomName(event.target.value)}
            placeholder="Friday movie night"
            value={roomName}
          />
          <button className="rounded-lg border-0 bg-accent px-3 text-xs font-semibold text-white" type="submit">Buat</button>
        </form>
      )}

      {error && <p className="mt-2 rounded border border-accent/20 bg-accent/9 px-3 py-2 text-xs text-[#ff8d83]">{error}</p>}

      {/* Room list */}
      <div className="-mx-1 mt-6 flex-1 overflow-y-auto px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#656570] max-md:hidden">
          Tersedia <span className="ml-1 rounded-full bg-[#202027] px-2 py-1">{visibleRooms.length}</span>
        </p>
        {visibleRooms.length === 0 ? (
          <div className="px-4 py-9 text-center text-[#656570]">
            <Users size={22} />
            <p className="mt-3 text-xs text-[#a1a0a8]">Belum ada room.</p>
            <small className="text-xs leading-relaxed">Buat ruang pertama dan undang temanmu.</small>
          </div>
        ) : (
          visibleRooms.map((room) => (
            <button
              className={`mb-1 flex w-full items-center gap-3 rounded-lg border-0 p-3 text-left max-md:justify-center max-md:p-2 ${
                activeRoom?.id === room.id
                  ? "bg-accent text-white"
                  : "bg-transparent hover:bg-[#1c1c23]"
              }`}
              key={room.id}
              onClick={() => onJoin(room)}
              type="button"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold ${activeRoom?.id === room.id ? "bg-white/18 text-white" : "bg-[#292932] text-[#d8d7dc]"}`}>
                {room.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1 max-md:hidden">
                <strong className="truncate text-xs">{room.name}</strong>
              </span>
              <ChevronRight size={15} className={`max-md:hidden ${activeRoom?.id === room.id ? "text-white/80" : "text-[#50505a]"}`} />
            </button>
          ))
        )}
      </div>

      {/* User */}
      <div className="-mx-4 mt-3 flex items-center gap-3 border-t border-line px-4 pt-4 max-md:-mx-2 max-md:justify-center max-md:px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#292932] text-xs font-semibold text-[#d8d7dc]">
          {user.username.slice(0, 2).toUpperCase()}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden max-md:hidden">
          <strong className="block w-full truncate text-sm font-semibold leading-5 text-[#f4f4f5]" title={user.username}>{user.username}</strong>
          <small className="text-xs leading-4 text-green">Online</small>
        </span>
        <button
          className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border-0 bg-[#dc2626] p-2 text-white hover:bg-[#ef4444]"
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
