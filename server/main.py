import asyncio
import json
import ssl
import os
import logging

import websockets

import config
import db
import auth
import rooms
import chat
import logger 

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# {ws: {user_id, username}}
ws_clients = {}


async def send_msg(ws_obj, msg):
    try:
        await ws_obj.send(json.dumps(msg))
    except websockets.ConnectionClosed:
        pass

async def handle_message(ws, msg):
    client = ws_clients.get(ws)
    if not client:
        return
    msg_type = msg.get("type")

    if msg_type == "REGISTER":
        ok, message, user_id = auth.register(msg.get("username"), msg.get("password"))
        if ok:
            token = auth.create_token(user_id, msg.get("username"))
            client["user_id"] = user_id
            client["username"] = msg.get("username")
            logger.log("REGISTER", user_id, msg.get("username"))
            await send_msg(ws, {"type": "AUTH_OK", "token": token, "username": msg.get("username")})
        else:
            await send_msg(ws, {"type": "AUTH_FAIL", "message": message})

    elif msg_type == "LOGIN":
        ok, message, user_id = auth.login(msg.get("username"), msg.get("password"))
        if ok:
            token = auth.create_token(user_id, msg.get("username"))
            client["user_id"] = user_id
            client["username"] = msg.get("username")
            logger.log("LOGIN", user_id, msg.get("username"))
            await send_msg(ws, {"type": "AUTH_OK", "token": token, "username": msg.get("username")})
        else:
            await send_msg(ws, {"type": "AUTH_FAIL", "message": message})

    elif msg_type == "RECONNECT":
        session = auth.validate_token(msg.get("token"))
        if session:
            client["user_id"] = session["user_id"]
            client["username"] = session["username"]
            logger.log("RECONNECT", session["user_id"], session["username"])
            await send_msg(ws, {"type": "AUTH_OK", "token": msg.get("token"), "username": session["username"]})
        else:
            await send_msg(ws, {"type": "AUTH_FAIL", "message": "Invalid or expired token"})

    else:
        if not client.get("user_id"):
            await send_msg(ws, {"type": "ERROR", "message": "Not authenticated"})
            return
        
        if msg_type == "ROOM_CREATE":
            ok, message, room_id = rooms.create_room(msg.get("name"), client["user_id"])
            if ok:
                await send_msg(ws, {"type": "ROOM_CREATE", "room_id": room_id, "name": msg.get("name")})
            else:
                await send_msg(ws, {"type": "ERROR", "message": message})

        elif msg_type == "ROOM_JOIN":
            ok, message = rooms.join_room(msg.get("roomId"), client["user_id"], id(ws), ws)
            if ok:
                await send_msg(ws, {"type": "ROOM_JOIN", "roomId": msg.get("roomId")})
            else:
                await send_msg(ws, {"type": "ERROR", "message": message})

        elif msg_type == "ROOM_LEAVE":
            rooms.leave_room(msg.get("roomId"), client["user_id"], id(ws))
            await send_msg(ws, {"type": "ROOM_LEAVE", "roomId": msg.get("roomId")})

        elif msg_type == "ROOM_LIST":
            room_list = rooms.list_rooms()
            await send_msg(ws, {"type": "ROOM_LIST_RESP", "rooms": room_list})

        elif msg_type == "ROOM_MEMBERS":
            usernames = rooms.get_online_usernames(msg.get("roomId"), ws_clients)
            await send_msg(ws, {"type": "ROOM_MEMBERS_RESP", "roomId": msg.get("roomId"), "members": usernames})

        elif msg_type == "CHAT_SEND":
            ok, result, members = chat.send_message(msg.get("roomId"), client["user_id"], client["username"], msg.get("content"))
            if ok:
                for ws_obj in members.values():
                    asyncio.ensure_future(send_msg(ws_obj, result))
            else:
                await send_msg(ws, {"type": "ERROR", "message": result})

        elif msg_type == "CHAT_DM":
            ok, result, target_ws = chat.send_dm(client["user_id"], client["username"], msg.get("target"), msg.get("content"), {id(w): {"user_id": c["user_id"], "sock": w} for w, c in ws_clients.items()})
            if ok:
                if target_ws:
                    asyncio.ensure_future(send_msg(target_ws, result))
                await send_msg(ws, {"type": "CHAT_DM", "from": client["username"], "to": msg.get("target"), "content": msg.get("content")})
            else:
                await send_msg(ws, {"type": "ERROR", "message": result})



async def handler(ws):
    ws_clients[ws] = {"user_id": None, "username": None}
    log.info("Client connected: %s", ws.remote_address)
    try:
        async for message in ws:
            try:
                msg = json.loads(message)
            except json.JSONDecodeError:
                await send_msg(ws, {"type": "ERROR", "message": "Invalid JSON"})
                continue
            await handle_message(ws, msg)
    except websockets.ConnectionClosed:
        pass
    finally:
        client = ws_clients.pop(ws, None)
        if client:
            logger.log("DISCONNECT", client.get("user_id"), str(ws.remote_address))
        rooms.remove_client(id(ws))

async def main():
    db.init_db()
    log.info("Database initialized")

    ssl_ctx = None
    if os.path.exists(config.TLS_CERT) and os.path.exists(config.TLS_KEY):
        ssl_ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_ctx.load_cert_chain(config.TLS_CERT, config.TLS_KEY)
        log.info("TLS enabled")

    async with websockets.serve(handler, config.HOST, config.PORT, ssl=ssl_ctx):
        log.info("Server listening on %s:%d", config.HOST, config.PORT)
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
