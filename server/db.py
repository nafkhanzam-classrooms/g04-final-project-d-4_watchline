import psycopg2
import config

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    owner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS room_members (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    is_dm BOOLEAN DEFAULT FALSE,
    target_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
"""

import time

_conn = None


def get_conn():
    global _conn
    if _conn is None or _conn.closed:
        for attempt in range(10):
            try:
                _conn = psycopg2.connect(
                    host=config.DB_HOST,
                    port=config.DB_PORT,
                    dbname=config.DB_NAME,
                    user=config.DB_USER,
                    password=config.DB_PASS,
                )
                _conn.autocommit = True
                return _conn
            except psycopg2.OperationalError:
                print(f"DB not ready, retrying ({attempt+1}/10)...")
                time.sleep(2)
        raise Exception("Could not connect to database")
    return _conn


def init_db():
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(SCHEMA)


def execute(query, params=None):
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(query, params)


def fetchone(query, params=None):
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(query, params)
        return cur.fetchone()


def fetchall(query, params=None):
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(query, params)
        return cur.fetchall()
