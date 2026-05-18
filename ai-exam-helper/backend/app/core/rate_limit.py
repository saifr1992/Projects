from collections import defaultdict
from datetime import date
from threading import Lock

from fastapi import HTTPException, status

from app.core.config import settings

_counts: dict[tuple[int, date], int] = defaultdict(int)
_lock = Lock()


def enforce_ai_quota(user_id: int) -> None:
    today = date.today()
    with _lock:
        used = _counts[(user_id, today)]
        if used >= settings.AI_DAILY_LIMIT_PER_USER:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Daily AI request limit ({settings.AI_DAILY_LIMIT_PER_USER}) reached. "
                    "Try again tomorrow."
                ),
            )
        _counts[(user_id, today)] = used + 1
