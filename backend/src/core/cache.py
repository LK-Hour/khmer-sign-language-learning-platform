"""Cache-aside helpers for Redis.

Provides simple get/set/invalidate functions that wrap Redis operations with
JSON serialization and graceful fallback (cache miss on error, never crash).

Usage:
    from src.core.cache import cache_get, cache_set, cache_invalidate

    # Read
    data = cache_get(redis_client, "ksl:cache:curriculum:finger:units")
    if data is None:
        data = db_query(...)
        cache_set(redis_client, "ksl:cache:curriculum:finger:units", data, ttl=600)

    # Invalidate on write
    cache_invalidate(redis_client, "ksl:cache:curriculum:finger:units")
    cache_invalidate_pattern(redis_client, "ksl:cache:dict:*")
"""

from __future__ import annotations

import json
import logging
from typing import Any

import redis

logger = logging.getLogger(__name__)


def cache_get(client: redis.Redis, key: str) -> Any | None:
    """Get a cached value. Returns None on miss or error."""
    try:
        raw = client.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except (redis.RedisError, json.JSONDecodeError) as e:
        logger.debug("Cache GET failed for %s: %s", key, e)
        return None


def cache_set(
    client: redis.Redis,
    key: str,
    value: Any,
    ttl: int = 600,
) -> bool:
    """Store a value in cache with TTL (seconds). Returns True on success."""
    try:
        serialized = json.dumps(value, default=str)
        client.set(key, serialized, ex=ttl)
        return True
    except (redis.RedisError, TypeError) as e:
        logger.debug("Cache SET failed for %s: %s", key, e)
        return False


def cache_invalidate(client: redis.Redis, key: str) -> bool:
    """Delete a specific cache key. Returns True if key existed."""
    try:
        return bool(client.delete(key))
    except redis.RedisError as e:
        logger.debug("Cache DELETE failed for %s: %s", key, e)
        return False


def cache_invalidate_pattern(client: redis.Redis, pattern: str) -> int:
    """Delete all keys matching a pattern (e.g., 'ksl:cache:dict:*').

    Uses SCAN to avoid blocking Redis with KEYS command.
    Returns the number of keys deleted.
    """
    try:
        deleted = 0
        cursor = 0
        while True:
            cursor, keys = client.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                deleted += client.delete(*keys)
            if cursor == 0:
                break
        return deleted
    except redis.RedisError as e:
        logger.debug("Cache pattern DELETE failed for %s: %s", pattern, e)
        return 0
