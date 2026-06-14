"""WatchLine Performance & Latency Tests"""
import asyncio, json, time, statistics
import websockets

URI = "ws://localhost:8080"
results = {}


async def send_recv(ws, msg):
    await ws.send(json.dumps(msg))
    return json.loads(await ws.recv())


async def test_latency():
    """Measure round-trip latency for ROOM_LIST requests."""
    print("\n=== Latency Test (100 round-trips) ===")
    async with websockets.connect(URI) as ws:
        await send_recv(ws, {"type": "REGISTER", "username": "latency_user", "password": "test123"})
        latencies = []
        for _ in range(100):
            start = time.perf_counter()
            await send_recv(ws, {"type": "ROOM_LIST"})
            latencies.append((time.perf_counter() - start) * 1000)

    results["latency"] = {
        "samples": 100,
        "avg_ms": round(statistics.mean(latencies), 2),
        "min_ms": round(min(latencies), 2),
        "max_ms": round(max(latencies), 2),
        "p50_ms": round(statistics.median(latencies), 2),
        "p95_ms": round(sorted(latencies)[94], 2),
        "p99_ms": round(sorted(latencies)[98], 2),
        "stdev_ms": round(statistics.stdev(latencies), 2),
    }
    for k, v in results["latency"].items():
        print(f"  {k}: {v}")


async def test_load(num_clients=100, msgs_per_client=20):
    """Load test with concurrent clients sending chat messages."""
    print(f"\n=== Load Test ({num_clients} clients, {msgs_per_client} msgs each) ===")

    # Setup: create a room
    async with websockets.connect(URI) as ws:
        await send_recv(ws, {"type": "REGISTER", "username": "load_owner", "password": "x"})
        resp = await send_recv(ws, {"type": "ROOM_CREATE", "name": "loadtest_room"})
        room_id = resp.get("room_id", 1)

    latencies = []
    errors = 0

    async def client_task(cid):
        nonlocal errors
        try:
            async with websockets.connect(URI) as ws:
                await send_recv(ws, {"type": "REGISTER", "username": f"load_{cid}", "password": "x"})
                await send_recv(ws, {"type": "ROOM_JOIN", "roomId": room_id})
                for i in range(msgs_per_client):
                    start = time.perf_counter()
                    await ws.send(json.dumps({"type": "CHAT_SEND", "roomId": room_id, "content": f"m{i}"}))
                    await ws.recv()
                    latencies.append((time.perf_counter() - start) * 1000)
        except Exception:
            errors += 1

    start = time.time()
    await asyncio.gather(*[client_task(i) for i in range(num_clients)])
    elapsed = time.time() - start

    results["load"] = {
        "clients": num_clients,
        "messages_per_client": msgs_per_client,
        "total_messages": len(latencies),
        "errors": errors,
        "duration_s": round(elapsed, 2),
        "throughput_msg_per_s": round(len(latencies) / elapsed, 1),
        "avg_ms": round(statistics.mean(latencies), 2) if latencies else 0,
        "p50_ms": round(statistics.median(latencies), 2) if latencies else 0,
        "p95_ms": round(sorted(latencies)[int(len(latencies) * 0.95)], 2) if latencies else 0,
        "p99_ms": round(sorted(latencies)[int(len(latencies) * 0.99)], 2) if latencies else 0,
    }
    for k, v in results["load"].items():
        print(f"  {k}: {v}")


async def test_broadcast(num_receivers=50):
    """Measure broadcast fan-out time to N receivers."""
    print(f"\n=== Broadcast Test ({num_receivers} receivers) ===")

    # Setup: create room
    async with websockets.connect(URI) as ws:
        await send_recv(ws, {"type": "REGISTER", "username": "bcast_owner", "password": "x"})
        resp = await send_recv(ws, {"type": "ROOM_CREATE", "name": "bcast_room"})
        room_id = resp.get("room_id", 1)

    conns = []
    for i in range(num_receivers + 1):
        ws = await websockets.connect(URI)
        await send_recv(ws, {"type": "REGISTER", "username": f"bcast_{i}", "password": "x"})
        await send_recv(ws, {"type": "ROOM_JOIN", "roomId": room_id})
        conns.append(ws)

    sender = conns[0]
    receivers = conns[1:]

    # Measure broadcast latency (10 rounds)
    latencies = []
    for _ in range(10):
        start = time.perf_counter()
        await sender.send(json.dumps({"type": "CHAT_SEND", "roomId": room_id, "content": "ping"}))
        await asyncio.gather(*[r.recv() for r in receivers])
        latencies.append((time.perf_counter() - start) * 1000)
        # Sender also gets broadcast
        await sender.recv()

    for ws in conns:
        await ws.close()

    results["broadcast"] = {
        "receivers": num_receivers,
        "rounds": 10,
        "avg_ms": round(statistics.mean(latencies), 2),
        "min_ms": round(min(latencies), 2),
        "max_ms": round(max(latencies), 2),
        "p95_ms": round(sorted(latencies)[int(len(latencies) * 0.95)], 2),
    }
    for k, v in results["broadcast"].items():
        print(f"  {k}: {v}")


async def test_connection_rate():
    """Measure how fast clients can connect and authenticate."""
    print("\n=== Connection Rate Test (200 connections) ===")
    num = 200

    async def connect_and_auth(i):
        ws = await websockets.connect(URI)
        await send_recv(ws, {"type": "REGISTER", "username": f"conn_{i}", "password": "x"})
        await ws.close()

    start = time.time()
    await asyncio.gather(*[connect_and_auth(i) for i in range(num)])
    elapsed = time.time() - start

    results["connection_rate"] = {
        "connections": num,
        "duration_s": round(elapsed, 2),
        "connections_per_s": round(num / elapsed, 1),
    }
    for k, v in results["connection_rate"].items():
        print(f"  {k}: {v}")


async def main():
    print("WatchLine Performance Test")
    print(f"Target: {URI}")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")

    await test_latency()
    await test_connection_rate()
    await test_load()
    await test_broadcast()

    # Save results
    output = {
        "server": URI,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "results": results,
    }
    with open("tests/performance_results.json", "w") as f:
        json.dump(output, f, indent=2)
    print("\n✓ Results saved to tests/performance_results.json")


if __name__ == "__main__":
    asyncio.run(main())
