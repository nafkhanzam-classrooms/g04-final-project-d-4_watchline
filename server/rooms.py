import db

# In-memory room membership: {room_id: {fd: sock}}
room_members = {}


def create_room(name, owner_id):
    existing = db.fetchone("SELECT id FROM rooms WHERE name = %s", (name,))
    if existing:
        return False, "Room already exists", None
    db.execute("INSERT INTO rooms (name, owner_id) VALUES (%s, %s)", (name, owner_id))
    row = db.fetchone("SELECT id FROM rooms WHERE name = %s", (name,))
    return True, "Room created", row[0]


def join_room(room_id, user_id, fd, sock):
    room = db.fetchone("SELECT id FROM rooms WHERE id = %s", (room_id,))
    if not room:
        return False, "Room not found"
    try:
        db.execute(
            "INSERT INTO room_members (room_id, user_id) VALUES (%s, %s)",
            (room_id, user_id),
        )
    except Exception:
        pass  # already a member
    if room_id not in room_members:
        room_members[room_id] = {}
    room_members[room_id][fd] = sock
    return True, "Joined room"


def leave_room(room_id, user_id, fd):
    db.execute(
        "DELETE FROM room_members WHERE room_id = %s AND user_id = %s",
        (room_id, user_id),
    )
    if room_id in room_members:
        room_members[room_id].pop(fd, None)
        if not room_members[room_id]:
            del room_members[room_id]
    return True, "Left room"


def list_rooms():
    rows = db.fetchall("SELECT id, name, owner_id FROM rooms")
    return [{"id": r[0], "name": r[1], "owner_id": r[2]} for r in rows]


def get_room_sockets(room_id):
    """Return dict of {fd: sock} for all online members in a room."""
    return room_members.get(room_id, {})


def get_online_usernames(room_id, ws_clients):
    """Return list of usernames currently online in a room."""
    members = room_members.get(room_id, {})
    usernames = []
    for fd, obj in members.items():
        for client_obj, info in ws_clients.items():
            if id(client_obj) == fd and info.get("username"):
                usernames.append(info["username"])
    return usernames


def remove_client(fd):
    """Remove a client from all rooms (on disconnect)."""
    for room_id in list(room_members.keys()):
        room_members[room_id].pop(fd, None)
        if not room_members[room_id]:
            del room_members[room_id]
