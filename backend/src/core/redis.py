"""Redis connection management.

Provides a shared Redis connection pool and a FastAPI dependency for accessing
the Redis client. The connection is lazy-initialized on first use and reused
across all requests.
"""

from __future__ import annotations

import logging
from typing import Generator

import redis

from src.core.config import settings

logger = logging.getLogger(__name__)

# Global connection pool — created once, reused by all threads/coroutines.
_pool: redis.ConnectionPool | None = None


def _get_pool() -> redis.ConnectionPool:
    """Get or create the global Redis connection pool."""
    global _pool
    if _pool is None:
        _pool = redis.ConnectionPool.from_url(
            settings.redis_url,
            max_connections=20,
            decode_responses=True,  # Return strings instead of bytes
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
        )
    return _pool


def get_redis_client() -> redis.Redis:
    """Create a Redis client from the shared pool.

    Use this as a FastAPI dependency:
        redis_client: redis.Redis = Depends(get_redis_client)
    """
    return redis.Redis(connection_pool=_get_pool())


def get_redis() -> Generator[redis.Redis, None, None]:
    """FastAPI dependency that yields a Redis client."""
    client = get_redis_client()
    try:
        yield client
    finally:
        # Connection returns to pool automatically; no explicit close needed.
        pass


def check_redis_health() -> bool:
    """Check if Redis is reachable. Returns True if healthy."""
    try:
        client = get_redis_client()
        return client.ping()
    except (redis.ConnectionError, redis.TimeoutError):
        logger.warning("Redis health check failed")
        return False
