import asyncio
from db import execute, fetchone
from services import room_service


async def handle(ws, msg, client, send, all_clients):
    msg_type = msg["type"]

    if msg_type == "CHAT_SEND":
        room_id = msg.get("roomId")
        content = msg.get("content")
        members = room_service.get_room_clients(room_id)
        if not members:
            await send(ws, {"type": "ERROR", "message": "Not in room or room empty"})
            return
        execute(
            "INSERT INTO messages (room_id, user_id, content) VALUES (%s, %s, %s)",
            (room_id, client["user_id"], content),
        )
        broadcast = {"type": "CHAT_MSG", "roomId": room_id, "username": client["username"], "content": content}
        for obj in members.values():
            asyncio.ensure_future(send(obj, broadcast))

    elif msg_type == "CHAT_DM":
        target_username = msg.get("target")
        content = msg.get("content")
        row = fetchone("SELECT id FROM users WHERE username = %s", (target_username,))
        if not row:
            await send(ws, {"type": "ERROR", "message": "User not found"})
            return
        target_id = row[0]
        execute(
            "INSERT INTO messages (room_id, user_id, content, is_dm, target_user_id) VALUES (NULL, %s, %s, TRUE, %s)",
            (client["user_id"], content, target_id),
        )
        # Find target socket
        target_obj = None
        for cobj, info in all_clients.items():
            if info.get("user_id") == target_id:
                target_obj = cobj
                break
        dm_msg = {"type": "CHAT_DM", "from": client["username"], "content": content}
        if target_obj:
            asyncio.ensure_future(send(target_obj, dm_msg))
        await send(ws, {"type": "CHAT_DM", "from": client["username"], "to": target_username, "content": content})
