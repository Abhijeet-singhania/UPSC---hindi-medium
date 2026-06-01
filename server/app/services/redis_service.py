import json
import redis
from typing import List, Optional
from app.config import settings


# Redis keys for silent-library live presence
ACTIVE_ROOM_KEY = "silent_library:active_users"
ACTIVE_USER_KEY = "silent_library:user:{user_id}"
PRESENCE_CHANNEL = "silent_library:presence"
ACTIVE_SESSION_TTL = 8 * 3600  # 8 hours — matches stale-session expiry


class RedisService:
    """Redis service for leaderboards and caching."""
    
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
    
    # ==================== Leaderboard Operations ====================
    
    def update_leaderboard(self, board_name: str, user_id: int, score: int):
        """Add or update a user's score in a leaderboard."""
        self.redis.zadd(board_name, {str(user_id): score})
    
    def increment_leaderboard(self, board_name: str, user_id: int, increment: int):
        """Increment a user's score in a leaderboard."""
        self.redis.zincrby(board_name, increment, str(user_id))
    
    def get_leaderboard(
        self, 
        board_name: str, 
        start: int = 0, 
        end: int = 9,
        with_scores: bool = True
    ) -> List[dict]:
        """Get top users from a leaderboard."""
        results = self.redis.zrevrange(board_name, start, end, withscores=with_scores)
        
        if with_scores:
            return [
                {"user_id": int(user_id), "score": int(score), "rank": start + i + 1}
                for i, (user_id, score) in enumerate(results)
            ]
        return [{"user_id": int(user_id), "rank": start + i + 1} for i, user_id in enumerate(results)]
    
    def get_user_rank(self, board_name: str, user_id: int) -> Optional[int]:
        """Get a user's rank in a leaderboard (1-indexed)."""
        rank = self.redis.zrevrank(board_name, str(user_id))
        return rank + 1 if rank is not None else None
    
    def get_user_score(self, board_name: str, user_id: int) -> int:
        """Get a user's score in a leaderboard."""
        score = self.redis.zscore(board_name, str(user_id))
        return int(score) if score else 0
    
    def get_leaderboard_count(self, board_name: str) -> int:
        """Get total number of users in a leaderboard."""
        return self.redis.zcard(board_name)
    
    # ==================== Caching Operations ====================
    
    def set_cache(self, key: str, value: str, expire_seconds: int = 300):
        """Set a cache value with expiration."""
        self.redis.setex(key, expire_seconds, value)
    
    def get_cache(self, key: str) -> Optional[str]:
        """Get a cached value."""
        return self.redis.get(key)
    
    def delete_cache(self, key: str):
        """Delete a cached value."""
        self.redis.delete(key)

    # ==================== Silent Library Presence ====================

    def join_active_room(
        self, user_id: int, name: str, session_id: int, since_iso: str, *, publish: bool = True
    ) -> None:
        """Register a user as actively studying (Redis SET + HASH)."""
        user_key = ACTIVE_USER_KEY.format(user_id=user_id)
        pipe = self.redis.pipeline()
        pipe.hset(
            user_key,
            mapping={
                "name": name or "Anonymous",
                "session_id": str(session_id),
                "since": since_iso,
            },
        )
        pipe.sadd(ACTIVE_ROOM_KEY, str(user_id))
        pipe.expire(user_key, ACTIVE_SESSION_TTL)
        pipe.execute()
        if publish:
            self.redis.publish(PRESENCE_CHANNEL, "update")

    def leave_active_room(self, user_id: int) -> None:
        """Remove a user from the active study room."""
        user_key = ACTIVE_USER_KEY.format(user_id=user_id)
        pipe = self.redis.pipeline()
        pipe.srem(ACTIVE_ROOM_KEY, str(user_id))
        pipe.delete(user_key)
        pipe.execute()
        self.redis.publish(PRESENCE_CHANNEL, "update")

    def get_active_room(self) -> dict:
        """Return count + list of users currently in the focus room."""
        user_ids = self.redis.smembers(ACTIVE_ROOM_KEY)
        users = []
        stale_ids = []
        for uid in user_ids:
            data = self.redis.hgetall(ACTIVE_USER_KEY.format(user_id=uid))
            if data:
                users.append({
                    "id": int(uid),
                    "name": data.get("name") or "Anonymous",
                    "study_since": data.get("since") or "",
                })
            else:
                stale_ids.append(uid)
        if stale_ids:
            self.redis.srem(ACTIVE_ROOM_KEY, *stale_ids)
        users.sort(key=lambda u: u.get("study_since") or "")
        return {"count": len(users), "users": users}

    def clear_active_room(self) -> None:
        """Remove all presence keys (used when rebuilding from DB)."""
        user_ids = self.redis.smembers(ACTIVE_ROOM_KEY)
        pipe = self.redis.pipeline()
        pipe.delete(ACTIVE_ROOM_KEY)
        for uid in user_ids:
            pipe.delete(ACTIVE_USER_KEY.format(user_id=uid))
        pipe.execute()

    def subscribe_presence(self):
        """Return a pubsub object subscribed to presence updates."""
        pubsub = self.redis.pubsub(ignore_subscribe_messages=True)
        pubsub.subscribe(PRESENCE_CHANNEL)
        return pubsub


# Leaderboard key names
LEADERBOARD_KEYS = {
    "reputation": "leaderboard:reputation:alltime",
    "study_daily": "leaderboard:study:daily",
    "study_weekly": "leaderboard:study:weekly",
    "study_alltime": "leaderboard:study:alltime",
    "answers_weekly": "leaderboard:answers:weekly",
    "daily_answer_weekly": "leaderboard:daily_answer:weekly"
}


# Singleton instance
redis_service = RedisService()
