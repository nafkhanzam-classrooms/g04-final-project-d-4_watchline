import os

HOST = os.getenv("SERVER_HOST", "0.0.0.0")
PORT = int(os.getenv("SERVER_PORT", "8080"))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "watchline")
DB_USER = os.getenv("DB_USER", "watchline")
DB_PASS = os.getenv("DB_PASS", "watchline")

TLS_CERT = os.getenv("TLS_CERT", "certs/server.crt")
TLS_KEY = os.getenv("TLS_KEY", "certs/server.key")

MAX_MSG_SIZE = 65536
