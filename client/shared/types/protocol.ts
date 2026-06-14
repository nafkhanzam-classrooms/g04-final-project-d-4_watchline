export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export type Room = {
  id: number;
  name: string;
  owner_id: number;
};

export type User = {
  username: string;
  token: string;
};

export type ChatMessage = {
  id: string;
  roomId: number;
  username: string;
  content: string;
  sentAt: Date;
};

export type DirectMessage = {
  id: string;
  from: string;
  to?: string;
  content: string;
  sentAt: Date;
};

export type ClientMessage =
  | { type: "REGISTER"; username: string; password: string }
  | { type: "LOGIN"; username: string; password: string }
  | { type: "RECONNECT"; token: string }
  | { type: "LOGOUT"; token: string }
  | { type: "ROOM_CREATE"; name: string }
  | { type: "ROOM_JOIN"; roomId: number }
  | { type: "ROOM_LEAVE"; roomId: number }
  | { type: "ROOM_LIST" }
  | { type: "ROOM_MEMBERS"; roomId: number }
  | { type: "CHAT_SEND"; roomId: number; content: string }
  | { type: "CHAT_DM"; target: string; content: string }
  | {
      type: "VIDEO_SYNC";
      roomId: number;
      event: "play" | "pause" | "seek" | "url";
      videoTime: number;
      videoUrl?: string;
    };

export type ServerMessage =
  | { type: "AUTH_OK"; token: string; username: string }
  | { type: "AUTH_FAIL"; message: string }
  | { type: "LOGOUT_OK" }
  | { type: "ERROR"; message: string }
  | { type: "ROOM_CREATE"; room_id: number; name: string }
  | { type: "ROOM_JOIN"; roomId: number }
  | { type: "ROOM_LEAVE"; roomId: number }
  | { type: "ROOM_LIST_RESP"; rooms: Room[] }
  | { type: "ROOM_MEMBERS_RESP"; roomId: number; members: string[] }
  | {
      type: "CHAT_MSG";
      roomId: number;
      username: string;
      content: string;
    }
  | { type: "CHAT_DM"; from: string; to?: string; content: string }
  | {
      type: "VIDEO_STATE";
      roomId: number;
      username: string;
      event: "play" | "pause" | "seek" | "url";
      videoTime: number;
      videoUrl?: string;
    };
