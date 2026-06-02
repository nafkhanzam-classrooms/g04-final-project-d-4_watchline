import asyncio
from services import room_service, logger


async def handle(ws, msg, client, send):
    room_id = msg.get("roomId")
    event_type = msg.get("event")
    video_time = msg.get("videoTime", 0)
    video_url = msg.get("videoUrl")

    logger.log("VIDEO_SYNC", client["user_id"], f"room={room_id} event={event_type} time={video_time}")

    broadcast = {
        "type": "VIDEO_STATE",
        "roomId": room_id,
        "username": client["username"],
        "event": event_type,
        "videoTime": video_time,
    }
    if video_url:
        broadcast["videoUrl"] = video_url

    members = room_service.get_room_clients(room_id)
    for obj in members.values():
        if obj != ws:
            asyncio.ensure_future(send(obj, broadcast))
