from services import auth_service, logger


async def handle(ws, msg, client, send):
    msg_type = msg["type"]

    if msg_type == "REGISTER":
        ok, message, user_id = auth_service.register(msg.get("username"), msg.get("password"))
        if ok:
            token = auth_service.create_token(user_id, msg.get("username"))
            client["user_id"] = user_id
            client["username"] = msg.get("username")
            logger.log("REGISTER", user_id, msg.get("username"))
            await send(ws, {"type": "AUTH_OK", "token": token, "username": msg.get("username")})
        else:
            await send(ws, {"type": "AUTH_FAIL", "message": message})

    elif msg_type == "LOGIN":
        ok, message, user_id = auth_service.login(msg.get("username"), msg.get("password"))
        if ok:
            token = auth_service.create_token(user_id, msg.get("username"))
            client["user_id"] = user_id
            client["username"] = msg.get("username")
            logger.log("LOGIN", user_id, msg.get("username"))
            await send(ws, {"type": "AUTH_OK", "token": token, "username": msg.get("username")})
        else:
            await send(ws, {"type": "AUTH_FAIL", "message": message})

    elif msg_type == "RECONNECT":
        session = auth_service.validate_token(msg.get("token"))
        if session:
            client["user_id"] = session["user_id"]
            client["username"] = session["username"]
            logger.log("RECONNECT", session["user_id"], session["username"])
            await send(ws, {"type": "AUTH_OK", "token": msg.get("token"), "username": session["username"]})
        else:
            await send(ws, {"type": "AUTH_FAIL", "message": "Invalid or expired token"})

    elif msg_type == "LOGOUT":
        if client.get("user_id"):
            auth_service.revoke_token(msg.get("token"))
            logger.log("LOGOUT", client["user_id"], client["username"])
            client["user_id"] = None
            client["username"] = None
        await send(ws, {"type": "LOGOUT_OK"})
