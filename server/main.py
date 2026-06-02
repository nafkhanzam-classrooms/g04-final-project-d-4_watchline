"""WatchLine Server — WebSocket entry point."""

import asyncio
import json
import ssl
import os
import logging

import websockets

import config
import db
from services import room_service, logger
from handlers import auth, rooms, chat, video

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# All connected clients: {ws: {user_id, username}}
clients = {}

AUTH_TYPES = {"REGISTER", "LOGIN", "RECONNECT"}
ROOM_TYPES = {"ROOM_CREATE", "ROOM_JOIN", "ROOM_LEAVE", "ROOM_LIST", "ROOM_MEMBERS"}
CHAT_TYPES = {"CHAT_SEND", "CHAT_DM"}


async def send_msg(ws_obj, msg):
    """Send JSON message to a WebSocket client."""
    try:
        await ws_obj.send(json.dumps(msg))
    except websockets.ConnectionClosed:
        pass


async def route_message(ws, msg):
    """Route incoming message to the appropriate handler."""
    client = clients.get(ws)
    if not client:
        return

    msg_type = msg.get("type")

    # Auth messages (no authentication required)
    if msg_type in AUTH_TYPES:
        await auth.handle(ws, msg, client, send_msg)
        return

    # All other messages require authentication
    if not client.get("user_id"):
        await send_msg(ws, {"type": "ERROR", "message": "Not authenticated"})
        return

    if msg_type in ROOM_TYPES:
        await rooms.handle(ws, msg, client, send_msg, clients)
    elif msg_type in CHAT_TYPES:
        await chat.handle(ws, msg, client, send_msg, clients)
    elif msg_type == "VIDEO_SYNC":
        await video.handle(ws, msg, client, send_msg)
    else:
        await send_msg(ws, {"type": "ERROR", "message": f"Unknown type: {msg_type}"})


async def on_connect(ws):
    """Handle a new WebSocket connection lifecycle."""
    clients[ws] = {"user_id": None, "username": None}
    log.info("Connected: %s", ws.remote_address)

    try:
        async for message in ws:
            try:
                msg = json.loads(message)
            except json.JSONDecodeError:
                await send_msg(ws, {"type": "ERROR", "message": "Invalid JSON"})
                continue
            await route_message(ws, msg)
    except websockets.ConnectionClosed:
        pass
    finally:
        client = clients.pop(ws, None)
        if client:
            logger.log("DISCONNECT", client.get("user_id"), str(ws.remote_address))
        room_service.remove_client(id(ws))
        log.info("Disconnected: %s", ws.remote_address)


async def main():
    db.init_db()
    log.info("Database initialized")

    ssl_ctx = None
    if os.path.exists(config.TLS_CERT) and os.path.exists(config.TLS_KEY):
        ssl_ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_ctx.load_cert_chain(config.TLS_CERT, config.TLS_KEY)
        log.info("TLS enabled")

    async with websockets.serve(on_connect, config.HOST, config.PORT, ssl=ssl_ctx):
        log.info("Server listening on %s:%d", config.HOST, config.PORT)
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
