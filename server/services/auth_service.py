import hashlib
import secrets
from db import execute, fetchone

# In-memory session store: {token: {user_id, username}}
_sessions = {}


def _hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


def register(username, password):
    """Returns (success, message, user_id)."""
    if not username or not password:
        return False, "Username and password required", None
    if len(username) > 50:
        return False, "Username too long", None
    if fetchone("SELECT id FROM users WHERE username = %s", (username,)):
        return False, "Username already taken", None
    execute(
        "INSERT INTO users (username, password_hash) VALUES (%s, %s)",
        (username, _hash_password(password)),
    )
    row = fetchone("SELECT id FROM users WHERE username = %s", (username,))
    return True, "Registered", row[0]


def login(username, password):
    """Returns (success, message, user_id)."""
    if not username or not password:
        return False, "Username and password required", None
    row = fetchone("SELECT id, password_hash FROM users WHERE username = %s", (username,))
    if not row or row[1] != _hash_password(password):
        return False, "Invalid credentials", None
    return True, "Login successful", row[0]


def create_token(user_id, username):
    token = secrets.token_hex(16)
    _sessions[token] = {"user_id": user_id, "username": username}
    return token


def validate_token(token):
    return _sessions.get(token)
