from db import execute, fetchone, fetchall

# In-memory room membership: {room_id: {client_id: client_obj}}
_members = {}


def create_room(name, owner_id):
    if fetchone("SELECT id FROM rooms WHERE name = %s", (name,)):
        return False, "Room already exists", None
    execute("INSERT INTO rooms (name, owner_id) VALUES (%s, %s)", (name, owner_id))
    row = fetchone("SELECT id FROM rooms WHERE name = %s", (name,))
    return True, "Room created", row[0]


def join_room(room_id, user_id, client_id, client_obj):
    if not fetchone("SELECT id FROM rooms WHERE id = %s", (room_id,)):
        return False, "Room not found"
    try:
        execute("INSERT INTO room_members (room_id, user_id) VALUES (%s, %s)", (room_id, user_id))
    except Exception:
        pass
    _members.setdefault(room_id, {})[client_id] = client_obj
    return True, "Joined room"


def leave_room(room_id, user_id, client_id):
    execute("DELETE FROM room_members WHERE room_id = %s AND user_id = %s", (room_id, user_id))
    if room_id in _members:
        _members[room_id].pop(client_id, None)
        if not _members[room_id]:
            del _members[room_id]


def list_rooms():
    rows = fetchall("SELECT id, name, owner_id FROM rooms")
    return [{"id": r[0], "name": r[1], "owner_id": r[2]} for r in rows]


def get_room_clients(room_id):
    """Returns {client_id: client_obj} for online members."""
    return _members.get(room_id, {})


def get_online_usernames(room_id, all_clients):
    """Returns list of usernames online in a room."""
    members = _members.get(room_id, {})
    usernames = []
    for cid, obj in members.items():
        for client_obj, info in all_clients.items():
            if id(client_obj) == cid and info.get("username"):
                usernames.append(info["username"])
    return usernames


def remove_client(client_id):
    """Remove client from all rooms on disconnect."""
    for room_id in list(_members.keys()):
        _members[room_id].pop(client_id, None)
        if not _members[room_id]:
            del _members[room_id]
