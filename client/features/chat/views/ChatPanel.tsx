"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const targetSuggestions = useMemo(() => {
    const query = target.trim().toLowerCase();
    if (!query) return [];

    return members
      .filter(
        (member) =>
          member !== currentUser.username &&
          member.toLowerCase().startsWith(query) &&
          member.toLowerCase() !== query,
      )
      .slice(0, 6);
  }, [currentUser.username, members, target]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, directMessages, tab]);

  useEffect(() => {
    const latestMessage = directMessages.at(-1);
    if (!latestMessage || latestMessage.from === currentUser.username) return;
    setTarget(latestMessage.from);
  }, [currentUser.username, directMessages]);

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
          onClick={() => {
            const latestIncoming = [...directMessages]
              .reverse()
              .find((message) => message.from !== currentUser.username);
            if (latestIncoming) setTarget(latestIncoming.from);
            setTab("dm");
          }}
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
            autoComplete="off"
            aria-label="Username penerima"
            onChange={(event) => setTarget(event.target.value)}
            placeholder="username tujuan"
            value={target}
          />
          {targetSuggestions.length > 0 && (
            <div
              aria-label="Saran username"
              className="username-suggestions"
              role="listbox"
            >
              {targetSuggestions.map((member) => (
                <button
                  key={member}
                  onClick={() => setTarget(member)}
                  role="option"
                  type="button"
                >
                  <span>{member.slice(0, 2).toUpperCase()}</span>
                  <strong>{member}</strong>
                </button>
              ))}
            </div>
          )}
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
                  {tab === "dm" && !ownMessage && (
                    <button
                      className="reply-button"
                      onClick={() => {
                        setTarget(sender);
                        setTab("dm");
                      }}
                      type="button"
                    >
                      Balas
                    </button>
                  )}
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
