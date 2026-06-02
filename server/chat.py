import db
import rooms


def send_message(room_id, user_id, username, content):
    """Broadcast message to room. Returns (success, msg_dict)."""
    members = rooms.get_room_sockets(room_id)
    if not members:
        return False, "Not in room or room empty"
    db.execute(
        "INSERT INTO messages (room_id, user_id, content) VALUES (%s, %s, %s)",
        (room_id, user_id, content),
    )
    msg = {"type": "CHAT_MSG", "roomId": room_id, "username": username, "content": content}
    return True, msg, members


def send_dm(sender_id, sender_name, target_username, content, clients):
    """Send private message. Returns (success, error_or_none, target_sock)."""
    row = db.fetchone("SELECT id FROM users WHERE username = %s", (target_username,))
    if not row:
        return False, "User not found", None
    target_id = row[0]
    db.execute(
        "INSERT INTO messages (room_id, user_id, content, is_dm, target_user_id) VALUES (NULL, %s, %s, TRUE, %s)",
        (sender_id, content, target_id),
    )
    # Find target's socket
    target_sock = None
    for fd, info in clients.items():
        if info.get("user_id") == target_id:
            target_sock = info["sock"]
            break
    msg = {"type": "CHAT_DM", "from": sender_name, "content": content}
    return True, msg, target_sock
