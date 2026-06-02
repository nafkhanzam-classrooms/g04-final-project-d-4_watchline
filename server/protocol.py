import json
import struct

HEADER_SIZE = 4


def encode(msg: dict) -> bytes:
    payload = json.dumps(msg).encode()
    return struct.pack("!I", len(payload)) + payload


def decode_from_buffer(buf: bytearray):
    """Extract complete messages from buffer. Returns (messages, remaining_buffer)."""
    messages = []
    while len(buf) >= HEADER_SIZE:
        length = struct.unpack("!I", buf[:HEADER_SIZE])[0]
        if len(buf) < HEADER_SIZE + length:
            break
        payload = buf[HEADER_SIZE:HEADER_SIZE + length]
        buf = buf[HEADER_SIZE + length:]
        messages.append(json.loads(payload))
    return messages, buf
