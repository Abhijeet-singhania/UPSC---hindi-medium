import redis
from typing import List, Optional
from app.config import settings


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
