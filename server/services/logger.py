import logging

_log = logging.getLogger("watchline")


def log(event_type, user_id=None, description=""):
    _log.info("[%s] user=%s %s", event_type, user_id, description)
