import logging

logger = logging.getLogger("watchline")


def log(event_type, user_id=None, description=""):
    logger.info("[%s] user=%s %s", event_type, user_id, description)
