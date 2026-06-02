import socket
import selectors
import ssl
import os
import logging

import config
import protocol
import db
import auth

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

sel = selectors.DefaultSelector()

# {fileno: {sock, addr, buf, user_id, username}}
clients = {}


def create_ssl_context():
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(config.TLS_CERT, config.TLS_KEY)
    return ctx


def send_msg(sock, msg):
    try:
        sock.sendall(protocol.encode(msg))
    except (BrokenPipeError, OSError):
        disconnect(sock)


def disconnect(sock):
    fd = sock.fileno()
    if fd == -1:
        return
    sel.unregister(sock)
    info = clients.pop(fd, None)
    if info:
        logger.info("Client disconnected: %s", info["addr"])
    sock.close()


def handle_message(sock, msg):
    """Route incoming message to appropriate manager."""
    msg_type = msg.get("type")
    fd = sock.fileno()
    client = clients.get(fd)

    if msg_type == "REGISTER":
        ok, message, user_id = auth.register(msg.get("username"), msg.get("password"))
        if ok:
            token = auth.create_token(user_id, msg.get("username"))
            client["user_id"] = user_id
            client["username"] = msg.get("username")
            send_msg(sock, {"type": "AUTH_OK", "token": token, "username": msg.get("username")})
        else:
            send_msg(sock, {"type": "AUTH_FAIL", "message": message})

    elif msg_type == "LOGIN":
        ok, message, user_id = auth.login(msg.get("username"), msg.get("password"))
        if ok:
            token = auth.create_token(user_id, msg.get("username"))
            client["user_id"] = user_id
            client["username"] = msg.get("username")
            send_msg(sock, {"type": "AUTH_OK", "token": token, "username": msg.get("username")})
        else:
            send_msg(sock, {"type": "AUTH_FAIL", "message": message})

    else:
        if not client or not client.get("user_id"):
            send_msg(sock, {"type": "ERROR", "message": "Not authenticated"})
            return
        send_msg(sock, {"type": "ERROR", "message": f"Unknown type: {msg_type}"})


def on_read(sock):
    fd = sock.fileno()
    client = clients.get(fd)
    if not client:
        return
    try:
        data = sock.recv(4096)
    except (ConnectionResetError, OSError):
        data = b""
    if not data:
        disconnect(sock)
        return
    client["buf"].extend(data)
    if len(client["buf"]) > config.MAX_MSG_SIZE:
        send_msg(sock, {"type": "ERROR", "message": "Message too large"})
        disconnect(sock)
        return
    messages, client["buf"] = protocol.decode_from_buffer(client["buf"])
    for msg in messages:
        handle_message(sock, msg)


def on_accept(server_sock):
    conn, addr = server_sock.accept()
    conn.setblocking(False)
    fd = conn.fileno()
    clients[fd] = {"sock": conn, "addr": addr, "buf": bytearray(), "user_id": None, "username": None}
    sel.register(conn, selectors.EVENT_READ, on_read)
    logger.info("New connection from %s", addr)


def run():
    db.init_db()
    logger.info("Database initialized")

    server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_sock.bind((config.HOST, config.PORT))
    server_sock.listen()
    server_sock.setblocking(False)

    if os.path.exists(config.TLS_CERT) and os.path.exists(config.TLS_KEY):
        ctx = create_ssl_context()
        server_sock = ctx.wrap_socket(server_sock, server_side=True, do_handshake_on_connect=False)
        logger.info("TLS enabled")

    sel.register(server_sock, selectors.EVENT_READ, on_accept)
    logger.info("Server listening on %s:%d", config.HOST, config.PORT)

    try:
        while True:
            events = sel.select(timeout=1)
            for key, _ in events:
                callback = key.data
                callback(key.fileobj)
    except KeyboardInterrupt:
        logger.info("Shutting down")
    finally:
        sel.close()
        server_sock.close()


if __name__ == "__main__":
    run()
