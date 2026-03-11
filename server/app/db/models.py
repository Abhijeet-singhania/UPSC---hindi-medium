from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.database import Base


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"
    MENTOR = "mentor"


class ExamStage(str, enum.Enum):
    BEGINNER = "beginner"
    PRELIMS = "prelims"
    MAINS = "mains"
    INTERVIEW = "interview"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(255), unique=True, index=True)  # Mock auth
    name = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    exam_stage = Column(Enum(ExamStage), default=ExamStage.BEGINNER)
    optional_subject = Column(String(100), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER)
    reputation = Column(Integer, default=0)
    wallet_balance = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    questions = relationship("Question", back_populates="author")
    answers = relationship("Answer", back_populates="author")
    silent_sessions = relationship("SilentSession", back_populates="user")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)
    
    questions = relationship("Question", secondary="question_tags", back_populates="tags")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    is_anonymous = Column(Boolean, default=False)
    is_solved = Column(Boolean, default=False)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    author = relationship("User", back_populates="questions")
    answers = relationship("Answer", back_populates="question")
    tags = relationship("Tag", secondary="question_tags", back_populates="questions")


class QuestionTag(Base):
    __tablename__ = "question_tags"

    question_id = Column(Integer, ForeignKey("questions.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    is_accepted = Column(Boolean, default=False)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    author = relationship("User", back_populates="answers")
    question = relationship("Question", back_populates="answers")


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    target_type = Column(String(20))  # 'question' or 'answer'
    target_id = Column(Integer)
    value = Column(Integer)  # 1 for upvote, -1 for downvote
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SilentSession(Base):
    __tablename__ = "silent_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="silent_sessions")


class Leaderboard(Base):
    __tablename__ = "leaderboards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    metric_type = Column(String(50))  # 'silent_daily', 'silent_weekly', 'answers_weekly'
    score = Column(Integer, default=0)
    period = Column(String(20))  # 'daily', 'weekly', 'monthly', 'alltime'
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class DailyQuestion(Base):
    """Daily Answer Writing Practice Question posted by Admin."""
    __tablename__ = "daily_questions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    subject = Column(String(100), nullable=True)  # e.g., "राजनीति", "इतिहास"
    word_limit = Column(Integer, default=250)
    marks = Column(Integer, default=15)  # UPSC style marks
    model_answer = Column(Text, nullable=True)  # Admin can add later
    is_active = Column(Boolean, default=True)
    posted_by = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    submissions = relationship("DailyAnswer", back_populates="daily_question")
    admin = relationship("User")


class DailyAnswer(Base):
    """User submission for Daily Answer Writing."""
    __tablename__ = "daily_answers"

    id = Column(Integer, primary_key=True, index=True)
    daily_question_id = Column(Integer, ForeignKey("daily_questions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    word_count = Column(Integer, default=0)
    upvotes = Column(Integer, default=0)
    is_best_answer = Column(Boolean, default=False)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    daily_question = relationship("DailyQuestion", back_populates="submissions")
    author = relationship("User")

