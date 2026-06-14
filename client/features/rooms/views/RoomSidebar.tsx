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
    <aside className="room-sidebar">
      <div className="sidebar-brand">
        <Brand compact />
      </div>
      <div className="room-heading">
        <div>
          <p className="mini-label">Browse</p>
          <h2>Ruang nonton</h2>
        </div>
        <button
          className="icon-button"
          onClick={onRefresh}
          title="Muat ulang"
          type="button"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      <div className="search-box">
        <Search size={16} />
        <input
          aria-label="Cari room"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari room..."
          value={query}
        />
      </div>
      <button
        className="create-room-button"
        onClick={() => setCreating((value) => !value)}
        type="button"
      >
        <Plus size={17} />
        Buat ruang baru
      </button>
      {creating && (
        <form className="create-room-form" onSubmit={submitRoom}>
          <input
            aria-label="Nama room baru"
            autoFocus
            onChange={(event) => setRoomName(event.target.value)}
            placeholder="Friday movie night"
            value={roomName}
          />
          <button type="submit">Buat</button>
        </form>
      )}
      {error && <p className="sidebar-error">{error}</p>}
      <div className="room-list">
        <p className="list-label">
          Tersedia <span>{visibleRooms.length}</span>
        </p>
        {visibleRooms.length === 0 ? (
          <div className="empty-list">
            <Users size={22} />
            <p>Belum ada room.</p>
            <small>Buat ruang pertama dan undang temanmu.</small>
          </div>
        ) : (
          visibleRooms.map((room) => (
            <button
              className={`room-item ${
                activeRoom?.id === room.id ? "active" : ""
              }`}
              key={room.id}
              onClick={() => onJoin(room)}
              type="button"
            >
              <span className="room-monogram">
                {room.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="room-meta">
                <strong>{room.name}</strong>
                <small>Room #{room.id}</small>
              </span>
              <ChevronRight size={15} />
            </button>
          ))
        )}
      </div>
      <div className="sidebar-user">
        <span className="user-avatar">
          {user.username.slice(0, 2).toUpperCase()}
        </span>
        <span>
          <strong>{user.username}</strong>
          <small>Online</small>
        </span>
        <button onClick={onLogout} title="Keluar" type="button">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
