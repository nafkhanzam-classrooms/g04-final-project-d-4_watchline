"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Film } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRooms } from "@/features/rooms/hooks/useRooms";
import { RoomSidebar } from "@/features/rooms/views/RoomSidebar";
import { useChat } from "@/features/chat/hooks/useChat";
import { ChatPanel } from "@/features/chat/views/ChatPanel";
import { WatchPartyView } from "@/features/watch-party/views/WatchPartyView";

export function DashboardView({
  selectedRoomId,
}: {
  selectedRoomId?: number;
}) {
  const router = useRouter();
  const { user, initialized, logout } = useAuth();
  const onRoomCreated = useCallback(
    (room: { id: number }) => router.push(`/rooms/${room.id}`),
    [router],
  );
  const onRoomLeft = useCallback(() => router.push("/rooms"), [router]);
  const rooms = useRooms({
    selectedRoomId,
    onRoomCreated,
    onRoomLeft,
  });
  const chat = useChat(rooms.activeRoom?.id);

  useEffect(() => {
    if (initialized && !user) router.replace("/login");
  }, [initialized, router, user]);

  if (!initialized || !user) {
    return (
      <main className="route-loading">
        <span className="pulse-dot" />
        Menyiapkan ruang...
      </main>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <main className="dashboard">
      <RoomSidebar
        activeRoom={rooms.activeRoom}
        error={rooms.error}
        onCreate={rooms.createRoom}
        onJoin={(room) => router.push(`/rooms/${room.id}`)}
        onLogout={handleLogout}
        onRefresh={rooms.refresh}
        rooms={rooms.rooms}
        user={user}
      />
      {selectedRoomId && rooms.activeRoom ? (
        <>
          <WatchPartyView
            members={rooms.members}
            onLeave={rooms.leaveRoom}
            room={rooms.activeRoom}
          />
          <ChatPanel
            currentUser={user}
            directMessages={chat.directMessages}
            members={rooms.members}
            messages={chat.messages}
            onSend={chat.sendMessage}
            onSendDirect={chat.sendDirectMessage}
            roomName={rooms.activeRoom.name}
          />
        </>
      ) : (
        <section className="no-room-view">
          <div className="no-room-art">
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <Film size={36} />
          </div>
          <p className="mini-label">WatchLine lobby</p>
          <h1>
            {rooms.error && selectedRoomId
              ? "Room tidak tersedia."
              : "Pilih ruang untuk memulai."}
          </h1>
          <p>
            {rooms.error && selectedRoomId
              ? "Kembali ke lobby dan pilih room lain yang tersedia."
              : "Gabung ke room yang tersedia atau buat ruang baru untuk movie night-mu."}
          </p>
        </section>
      )}
    </main>
  );
}
