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
      <main className="flex min-h-screen items-center justify-center gap-2 bg-background text-xs text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_0_4px_rgba(102,209,158,0.1)]" />
        Menyiapkan ruang...
      </main>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <main className="grid h-screen overflow-hidden grid-cols-[288px_minmax(0,1fr)_320px] max-[1100px]:grid-cols-[240px_minmax(0,1fr)_288px] max-md:grid-cols-[80px_minmax(0,1fr)]">
      <RoomSidebar
        activeRoom={rooms.activeRoom}
        error={rooms.error}
        onCreate={rooms.createRoom}
        onJoin={(room) => router.push(`/rooms/${room.id}`)}
        onLogout={handleLogout}
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
          <div className="h-full min-h-0 max-md:hidden">
            <ChatPanel
              currentUser={user}
              directMessages={chat.directMessages}
              members={rooms.members}
              messages={chat.messages}
              onSend={chat.sendMessage}
              onSendDirect={chat.sendDirectMessage}
              roomName={rooms.activeRoom.name}
            />
          </div>
        </>
      ) : (
        <section className="col-span-2 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,91,77,0.055),transparent_28%),#0d0d11] text-center max-md:col-span-1">
          <div className="relative mb-7 flex h-22 w-22 items-center justify-center rounded-full border border-line bg-[#18181e] text-accent">
            <span className="absolute left-1/2 top-1/2 h-[136px] w-[136px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/7" />
            <span className="absolute left-1/2 top-1/2 h-[184px] w-[184px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/7" />
            <Film size={36} />
          </div>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-accent">WatchLine lobby</p>
          <h1 className="mt-2 mb-3 text-[32px] font-semibold leading-[1.25] tracking-tight">
            {rooms.error && selectedRoomId
              ? "Room tidak tersedia."
              : "Pilih ruang untuk memulai."}
          </h1>
          <p className="max-w-[392px] text-xs leading-relaxed text-[#777782]">
            {rooms.error && selectedRoomId
              ? "Kembali ke lobby dan pilih room lain yang tersedia."
              : "Gabung ke room yang tersedia atau buat ruang baru untuk movie night-mu."}
          </p>
        </section>
      )}
    </main>
  );
}
