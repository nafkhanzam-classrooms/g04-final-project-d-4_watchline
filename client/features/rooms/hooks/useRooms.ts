"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "@/shared/providers/WebSocketProvider";
import type { Room } from "@/shared/types/protocol";

type Options = {
  selectedRoomId?: number;
  onRoomCreated?: (room: Room) => void;
  onRoomLeft?: () => void;
};

export function useRooms({
  selectedRoomId,
  onRoomCreated,
  onRoomLeft,
}: Options = {}) {
  const { send, subscribe } = useWebSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [error, setError] = useState("");
  const roomsRef = useRef<Room[]>([]);
  const joinedRoomIdRef = useRef<number | null>(null);

  const refresh = useCallback(() => {
    send({ type: "ROOM_LIST" });
  }, [send]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(
    () =>
      subscribe((message) => {
        if (message.type === "ROOM_LIST_RESP") {
          roomsRef.current = message.rooms;
          setRooms(message.rooms);
        }
        if (message.type === "ROOM_CREATE") {
          const room: Room = {
            id: message.room_id,
            name: message.name,
            owner_id: 0,
          };
          roomsRef.current = [
            room,
            ...roomsRef.current.filter((item) => item.id !== room.id),
          ];
          setRooms(roomsRef.current);
          onRoomCreated?.(room);
        }
        if (message.type === "ROOM_JOIN") {
          const joined = roomsRef.current.find(
            (room) => room.id === message.roomId,
          );
          if (joined) setActiveRoom(joined);
          joinedRoomIdRef.current = message.roomId;
          send({ type: "ROOM_MEMBERS", roomId: message.roomId });
        }
        if (
          message.type === "ROOM_LEAVE" &&
          joinedRoomIdRef.current === message.roomId
        ) {
          joinedRoomIdRef.current = null;
          setActiveRoom(null);
          setMembers([]);
        }
        if (message.type === "ROOM_MEMBERS_RESP") {
          setMembers(message.members);
        }
        if (message.type === "ERROR") setError(message.message);
      }),
    [onRoomCreated, send, subscribe],
  );

  useEffect(() => {
    if (!selectedRoomId || rooms.length === 0) return;
    const selectedRoom = rooms.find((room) => room.id === selectedRoomId);

    if (!selectedRoom) {
      setError("Room tidak ditemukan.");
      return;
    }
    if (joinedRoomIdRef.current === selectedRoomId) {
      setActiveRoom(selectedRoom);
      return;
    }

    setError("");
    setActiveRoom(selectedRoom);
    send({ type: "ROOM_JOIN", roomId: selectedRoomId });
  }, [rooms, selectedRoomId, send]);

  useEffect(() => {
    if (!selectedRoomId) return;
    return () => {
      send({ type: "ROOM_LEAVE", roomId: selectedRoomId });
      joinedRoomIdRef.current = null;
    };
  }, [selectedRoomId, send]);

  useEffect(() => {
    if (!activeRoom) return;
    const timer = setInterval(
      () => send({ type: "ROOM_MEMBERS", roomId: activeRoom.id }),
      5000,
    );
    return () => clearInterval(timer);
  }, [activeRoom, send]);

  const leaveRoom = () => {
    if (activeRoom) {
      send({ type: "ROOM_LEAVE", roomId: activeRoom.id });
      joinedRoomIdRef.current = null;
      setActiveRoom(null);
      setMembers([]);
    }
    onRoomLeft?.();
  };

  const createRoom = (name: string) => {
    setError("");
    send({ type: "ROOM_CREATE", name: name.trim() });
  };

  return {
    rooms,
    activeRoom,
    members,
    error,
    refresh,
    leaveRoom,
    createRoom,
  };
}
