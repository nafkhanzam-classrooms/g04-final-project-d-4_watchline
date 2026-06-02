import rooms
import logger 


def handle_video_sync(room_id, user_id, username, event_type, video_time, video_url=None):
    logger.log("VIDEO_SYNC", user_id, f"room={room_id} event={event_type} time={video_time} url={video_url}")
    msg = {
        "type": "VIDEO_STATE",
        "roomId": room_id,
        "username": username,
        "event": event_type,
        "videoTime": video_time,
    }
    if video_url:
        msg["videoUrl"] = video_url
    members = rooms.get_room_sockets(room_id)
    return msg, members
