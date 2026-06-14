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
    <aside className="flex min-h-0 flex-col bg-[#111116]">
      {/* Top */}
      <div className="flex items-center justify-between border-b border-line px-5 pb-4 pt-6">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-accent">Percakapan</p>
          <h3 className="mt-1 text-base font-semibold">{tab === "room" ? roomName : "Direct message"}</h3>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-[#1e1e25] px-3 py-2 text-xs text-[#888892]">
          <Users size={14} />
          {members.length}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line px-4">
        <button
          className={`flex items-center gap-2 border-b-2 bg-transparent px-3 py-3 text-xs font-semibold ${tab === "room" ? "border-accent text-[#dedde2]" : "border-transparent text-[#6f6f79]"}`}
          onClick={() => setTab("room")}
          type="button"
        >
          <MessageSquare size={15} />
          Room
        </button>
        <button
          className={`flex items-center gap-2 border-b-2 bg-transparent px-3 py-3 text-xs font-semibold ${tab === "dm" ? "border-accent text-[#dedde2]" : "border-transparent text-[#6f6f79]"}`}
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
          {directMessages.length > 0 && <span className="rounded-[10px] bg-accent px-2 py-1 text-xs text-white">{directMessages.length}</span>}
        </button>
      </div>

      {/* DM target */}
      {tab === "dm" && (
        <div className="relative flex items-center gap-2 border-b border-line px-3 py-2 text-[#696974]">
          <AtSign size={15} />
          <input
            className="w-full rounded-lg border border-line bg-[#101015] px-3 py-2 text-xs outline-none placeholder:text-[#555560] focus:border-accent/65 focus:shadow-[0_0_0_3px_rgba(255,91,77,0.09)]"
            autoComplete="off"
            aria-label="Username penerima"
            onChange={(event) => setTarget(event.target.value)}
            placeholder="username tujuan"
            value={target}
          />
          {targetSuggestions.length > 0 && (
            <div
              aria-label="Saran username"
              className="absolute left-9 right-3 top-[calc(100%-4px)] z-10 flex flex-col gap-1 rounded-lg border border-line bg-[#18181e] p-2 shadow-[0_16px_32px_rgba(0,0,0,0.32)]"
              role="listbox"
            >
              {targetSuggestions.map((member) => (
                <button
                  className="flex w-full items-center gap-3 rounded-lg border-0 bg-transparent p-2 text-left hover:bg-accent/12"
                  key={member}
                  onClick={() => setTarget(member)}
                  role="option"
                  type="button"
                >
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#292932] text-xs font-semibold text-[#d8d7dc]">{member.slice(0, 2).toUpperCase()}</span>
                  <strong className="text-xs font-semibold text-[#f4f4f5]">{member}</strong>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {displayedMessages.length === 0 ? (
          <div className="mx-auto mt-[45%] max-w-[208px] text-center text-[#666671]">
            <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#1d1d24]">
              <MessageSquare size={21} />
            </span>
            <strong className="text-base font-semibold text-[#aaa9b1]">Mulai percakapan</strong>
            <p className="text-xs leading-[1.55]">
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
                className={`mb-4 ${ownMessage ? "text-right" : ""}`}
                key={message.id}
              >
                <div className={`flex items-center gap-2 ${ownMessage ? "justify-end" : ""}`}>
                  <strong className={`text-xs ${ownMessage ? "text-accent" : "text-[#cfced4]"}`}>{ownMessage ? "Kamu" : sender}</strong>
                  <time className="text-xs text-[#555560]">
                    {message.sentAt.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                  {tab === "dm" && !ownMessage && (
                    <button
                      className="ml-auto border-0 bg-transparent p-0 text-xs font-semibold text-accent hover:text-[#ff8177]"
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
                <p className={`mt-2 inline-block max-w-[90%] px-3 py-2 text-xs leading-relaxed ${ownMessage ? "rounded-[8px_2px_8px_8px] bg-accent/11 text-left text-[#e0c0bd]" : "rounded-[2px_8px_8px_8px] bg-panel-soft text-[#aaa9b1]"}`}>
                  {message.content}
                </p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Form */}
      <form className="flex items-end gap-2 border-t border-line p-3" onSubmit={submit}>
        <textarea
          className="flex-1 resize-none rounded-lg border border-line bg-[#1a1a20] p-3 text-xs leading-[1.45] outline-none max-h-22"
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
          className="flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-accent disabled:opacity-35"
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
