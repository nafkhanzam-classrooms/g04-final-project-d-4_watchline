"""WatchLine Interactive Test Client.

Usage:
    pip install websockets
    python test_client.py [ws://localhost:8080]

Commands:
    register <username> <password>
    login <username> <password>
    reconnect <token>
    logout <token>
    room_create <name>
    room_join <room_id>
    room_leave <room_id>
    room_list
    room_members <room_id>
    chat <room_id> <message>
    dm <target_username> <message>
    video <room_id> <event> <time> [url]
    quit
"""

import asyncio
import json
import sys
import websockets

URI = sys.argv[1] if len(sys.argv) > 1 else "ws://localhost:8080"


async def receiver(ws):
    """Background task that prints incoming messages."""
    try:
        async for raw in ws:
            msg = json.loads(raw)
            print(f"\n  ← {json.dumps(msg, indent=2)}")
            print("  > ", end="", flush=True)
    except websockets.ConnectionClosed:
        print("\n  [Disconnected]")


def parse_command(line):
    parts = line.strip().split(maxsplit=2)
    if not parts:
        return None
    cmd = parts[0].lower()

    if cmd == "register" and len(parts) == 3:
        return {"type": "REGISTER", "username": parts[1], "password": parts[2]}
    elif cmd == "login" and len(parts) == 3:
        return {"type": "LOGIN", "username": parts[1], "password": parts[2]}
    elif cmd == "reconnect" and len(parts) == 2:
        return {"type": "RECONNECT", "token": parts[1]}
    elif cmd == "logout" and len(parts) == 2:
        return {"type": "LOGOUT", "token": parts[1]}
    elif cmd == "room_create" and len(parts) >= 2:
        return {"type": "ROOM_CREATE", "name": parts[1]}
    elif cmd == "room_join" and len(parts) == 2:
        return {"type": "ROOM_JOIN", "roomId": int(parts[1])}
    elif cmd == "room_leave" and len(parts) == 2:
        return {"type": "ROOM_LEAVE", "roomId": int(parts[1])}
    elif cmd == "room_list":
        return {"type": "ROOM_LIST"}
    elif cmd == "room_members" and len(parts) == 2:
        return {"type": "ROOM_MEMBERS", "roomId": int(parts[1])}
    elif cmd == "chat" and len(parts) == 3:
        room_id, content = parts[1], parts[2]
        return {"type": "CHAT_SEND", "roomId": int(room_id), "content": content}
    elif cmd == "dm" and len(parts) == 3:
        target, content = parts[1], parts[2]
        return {"type": "CHAT_DM", "target": target, "content": content}
    elif cmd == "video":
        # video <room_id> <event> <time> [url]
        vparts = line.strip().split()
        if len(vparts) >= 4:
            msg = {"type": "VIDEO_SYNC", "roomId": int(vparts[1]), "event": vparts[2], "videoTime": float(vparts[3])}
            if len(vparts) >= 5:
                msg["videoUrl"] = vparts[4]
            return msg
    elif cmd == "quit":
        return "QUIT"

    return None


async def main():
    print(f"WatchLine Interactive Client")
    print(f"Connecting to {URI}...")
    try:
        async with websockets.connect(URI) as ws:
            print("Connected! Type 'quit' to exit.\n")
            asyncio.create_task(receiver(ws))

            loop = asyncio.get_event_loop()
            while True:
                line = await loop.run_in_executor(None, lambda: input("  > "))
                if not line.strip():
                    continue
                msg = parse_command(line)
                if msg == "QUIT":
                    break
                if msg is None:
                    print("  Unknown command. Available: register, login, reconnect, logout,")
                    print("  room_join, room_leave, room_list, room_members, chat, dm, video, quit")
                    continue
                await ws.send(json.dumps(msg))
                print(f"  → {json.dumps(msg)}")
    except (ConnectionRefusedError, OSError):
        print(f"Cannot connect to {URI}. Is the server running?")


if __name__ == "__main__":
    asyncio.run(main())
