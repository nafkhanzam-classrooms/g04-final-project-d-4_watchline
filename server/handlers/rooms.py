from services import room_service


async def handle(ws, msg, client, send, all_clients):
    msg_type = msg["type"]

    if msg_type == "ROOM_CREATE":
        ok, message, room_id = room_service.create_room(msg.get("name"), client["user_id"])
        if ok:
            await send(ws, {"type": "ROOM_CREATE", "room_id": room_id, "name": msg.get("name")})
        else:
            await send(ws, {"type": "ERROR", "message": message})

    elif msg_type == "ROOM_JOIN":
        ok, message = room_service.join_room(msg.get("roomId"), client["user_id"], id(ws), ws)
        if ok:
            await send(ws, {"type": "ROOM_JOIN", "roomId": msg.get("roomId")})
        else:
            await send(ws, {"type": "ERROR", "message": message})

    elif msg_type == "ROOM_LEAVE":
        room_service.leave_room(msg.get("roomId"), client["user_id"], id(ws))
        await send(ws, {"type": "ROOM_LEAVE", "roomId": msg.get("roomId")})

    elif msg_type == "ROOM_LIST":
        await send(ws, {"type": "ROOM_LIST_RESP", "rooms": room_service.list_rooms()})

    elif msg_type == "ROOM_MEMBERS":
        usernames = room_service.get_online_usernames(msg.get("roomId"), all_clients)
        await send(ws, {"type": "ROOM_MEMBERS_RESP", "roomId": msg.get("roomId"), "members": usernames})
