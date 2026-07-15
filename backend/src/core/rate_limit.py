"""Redis-based rate limiting.

Implements a sliding window counter using Redis INCR + EXPIRE.
Designed as a FastAPI dependency that raises 429 when limit is exceeded.

Usage:
    from src.core.rate_limit import RateLimiter

    rate_limiter = RateLimiter(max_requests=10, window_seconds=60)

    @router.post("/endpoint")
    def my_endpoint(
        request: Request,
        _: None = Depends(rate_limiter),
    ):
        ...
"""

import logging

from fastapi import Depends, HTTPException, Request, status

import redis as redis_lib

from src.core.redis import get_redis

logger = logging.getLogger(__name__)


class RateLimiter:
    """Configurable rate limiter as a FastAPI dependency.

    Args:
        max_requests: Maximum number of requests allowed in the window.
        window_seconds: Time window in seconds.
        key_prefix: Redis key prefix for this limiter.
    """

    def __init__(
        self,
        max_requests: int = 10,
        window_seconds: int = 60,
        key_prefix: str = "ksl:rate",
    ):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.key_prefix = key_prefix

    def _get_key(self, request: Request) -> str:
        """Build a rate limit key from client IP + path."""
        ip = request.client.host if request.client else "unknown"
        path = request.url.path
        return f"{self.key_prefix}:{ip}:{path}"

    async def __call__(
        self,
        request: Request,
        rc: redis_lib.Redis = Depends(get_redis),
    ) -> None:
        key = self._get_key(request)
        try:
            count = rc.incr(key)
            if count == 1:
                rc.expire(key, self.window_seconds)
            if count > self.max_requests:
                logger.warning(
                    "Rate limit exceeded: %s (%d/%d)",
                    key,
                    count,
                    self.max_requests,
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later.",
                )
        except redis_lib.RedisError:
            # If Redis is down, allow the request through (fail-open).
            # Rate limiting is a best-effort protection, not a hard gate.
            pass


# Pre-configured limiters for common use cases
auth_rate_limiter = RateLimiter(max_requests=10, window_seconds=60, key_prefix="ksl:rate:auth")
upload_rate_limiter = RateLimiter(max_requests=5, window_seconds=60, key_prefix="ksl:rate:upload")
feedback_rate_limiter = RateLimiter(max_requests=10, window_seconds=60, key_prefix="ksl:rate:feedback")
