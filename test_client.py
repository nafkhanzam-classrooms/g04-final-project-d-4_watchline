import socket, struct, json, threading, sys

HOST = "localhost"
PORT = 8443

def send(sock, msg):
    data = json.dumps(msg).encode()
    sock.sendall(struct.pack("!I", len(data)) + data)

def recv_loop(sock):
    """Background thread to print incoming messages."""
    try:
        while True:
            header = sock.recv(4)
            if not header:
                print("\n[Disconnected]")
                break
            length = struct.unpack("!I", header)[0]
            payload = b""
            while len(payload) < length:
                payload += sock.recv(length - len(payload))
            msg = json.loads(payload)
            print(f"\n<< {json.dumps(msg)}")
            print("> ", end="", flush=True)
    except (ConnectionResetError, OSError):
        print("\n[Connection lost]")

def print_help():
    print("""
Commands:
  register <username> <password>
  login <username> <password>
  room_create <name>
  room_join <room_id>
  room_leave <room_id>
  room_list
  raw <json>
  help
  quit
""")

def main():
    sock = socket.socket()
    sock.connect((HOST, PORT))
    print(f"Connected to {HOST}:{PORT}")
    print_help()

    t = threading.Thread(target=recv_loop, args=(sock,), daemon=True)
    t.start()

    try:
        while True:
            line = input("> ").strip()
            if not line:
                continue
            parts = line.split()
            cmd = parts[0].lower()

            if cmd == "quit":
                break
            elif cmd == "help":
                print_help()
            elif cmd == "register" and len(parts) == 3:
                send(sock, {"type": "REGISTER", "username": parts[1], "password": parts[2]})
            elif cmd == "login" and len(parts) == 3:
                send(sock, {"type": "LOGIN", "username": parts[1], "password": parts[2]})
            elif cmd == "room_create" and len(parts) == 2:
                send(sock, {"type": "ROOM_CREATE", "name": parts[1]})
            elif cmd == "room_join" and len(parts) == 2:
                send(sock, {"type": "ROOM_JOIN", "roomId": int(parts[1])})
            elif cmd == "room_leave" and len(parts) == 2:
                send(sock, {"type": "ROOM_LEAVE", "roomId": int(parts[1])})
            elif cmd == "room_list":
                send(sock, {"type": "ROOM_LIST"})
            elif cmd == "raw":
                send(sock, json.loads(" ".join(parts[1:])))
            else:
                print("Unknown command. Type 'help'.")
    except (KeyboardInterrupt, EOFError):
        pass
    finally:
        sock.close()
        print("Bye!")

if __name__ == "__main__":
    main()
