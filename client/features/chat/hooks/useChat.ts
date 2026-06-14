"use client";

import { useEffect, useState } from "react";
import { useWebSocket } from "@/shared/providers/WebSocketProvider";
import type {
  ChatMessage,
  DirectMessage,
} from "@/shared/types/protocol";

export function useChat(activeRoomId?: number) {
  const { send, subscribe } = useWebSocket();
  const [messages, setMessages] = useState<Record<number, ChatMessage[]>>({});
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);

  useEffect(
    () =>
      subscribe((message) => {
        if (message.type === "CHAT_MSG") {
          const chatMessage: ChatMessage = {
            id: crypto.randomUUID(),
            roomId: message.roomId,
            username: message.username,
            content: message.content,
            sentAt: new Date(),
          };
          setMessages((current) => ({
            ...current,
            [message.roomId]: [
              ...(current[message.roomId] ?? []),
              chatMessage,
            ],
          }));
        }
        if (message.type === "CHAT_DM") {
          setDirectMessages((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              from: message.from,
              to: message.to,
              content: message.content,
              sentAt: new Date(),
            },
          ]);
        }
      }),
    [subscribe],
  );

  return {
    messages: activeRoomId ? (messages[activeRoomId] ?? []) : [],
    directMessages,
    sendMessage: (content: string) => {
      if (activeRoomId) {
        send({ type: "CHAT_SEND", roomId: activeRoomId, content });
      }
    },
    sendDirectMessage: (target: string, content: string) =>
      send({ type: "CHAT_DM", target, content }),
  };
}
