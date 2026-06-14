"use client";

import { useEffect, useRef, useState } from "react";
import { AtSign, MessageSquare, Send, Users } from "lucide-react";
import type {
  ChatMessage,
  DirectMessage,
  User,
} from "@/shared/types/protocol";

type Props = {
  currentUser: User;
  roomName: string;
  members: string[];
  messages: ChatMessage[];
  directMessages: DirectMessage[];
  onSend: (content: string) => void;
  onSendDirect: (target: string, content: string) => boolean;
};

export function ChatPanel({
  currentUser,
  roomName,
  members,
  messages,
  directMessages,
  onSend,
  onSendDirect,
}: Props) {
  const [tab, setTab] = useState<"room" | "dm">("room");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, directMessages, tab]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    if (tab === "room") onSend(content.trim());
    else if (target.trim()) onSendDirect(target.trim(), content.trim());
    setContent("");
  };

  const displayedMessages = tab === "room" ? messages : directMessages;

  return (
    <aside className="chat-panel">
      <div className="chat-top">
        <div>
          <p className="mini-label">Percakapan</p>
          <h3>{tab === "room" ? roomName : "Direct message"}</h3>
        </div>
        <span className="member-count">
          <Users size={14} />
          {members.length}
        </span>
      </div>
      <div className="chat-tabs">
        <button
          className={tab === "room" ? "active" : ""}
          onClick={() => setTab("room")}
          type="button"
        >
          <MessageSquare size={15} />
          Room
        </button>
        <button
          className={tab === "dm" ? "active" : ""}
          onClick={() => setTab("dm")}
          type="button"
        >
          <AtSign size={15} />
          Direct
          {directMessages.length > 0 && <span>{directMessages.length}</span>}
        </button>
      </div>
      {tab === "dm" && (
        <div className="dm-target">
          <AtSign size={15} />
          <input
            aria-label="Username penerima"
            onChange={(event) => setTarget(event.target.value)}
            placeholder="username tujuan"
            value={target}
          />
        </div>
      )}
      <div className="message-list">
        {displayedMessages.length === 0 ? (
          <div className="empty-chat">
            <span><MessageSquare size={21} /></span>
            <strong>Mulai percakapan</strong>
            <p>
              {tab === "room"
                ? "Pesanmu akan terlihat oleh semua orang di room."
                : "Kirim pesan privat ke pengguna yang sedang online."}
            </p>
          </div>
        ) : (
          displayedMessages.map((message) => {
            const sender =
              "username" in message ? message.username : message.from;
            const ownMessage = sender === currentUser.username;
            return (
              <div
                className={`message ${ownMessage ? "own" : ""}`}
                key={message.id}
              >
                <div className="message-line">
                  <strong>{ownMessage ? "Kamu" : sender}</strong>
                  <time>
                    {message.sentAt.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p>{message.content}</p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form className="message-form" onSubmit={submit}>
        <textarea
          aria-label="Tulis pesan"
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={
            tab === "room" ? "Tulis pesan..." : "Tulis pesan privat..."
          }
          rows={1}
          value={content}
        />
        <button
          aria-label="Kirim pesan"
          disabled={!content.trim() || (tab === "dm" && !target.trim())}
          type="submit"
        >
          <Send size={17} />
        </button>
      </form>
    </aside>
  );
}
