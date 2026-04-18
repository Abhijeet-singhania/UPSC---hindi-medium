from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone, timedelta

from app.db.database import get_db
from app.db.models import DailyQuestion, DailyAnswer, User, Vote, UserRole
from app.schemas.daily_answer import (
    DailyQuestionCreate, DailyQuestionUpdate, DailyQuestionResponse,
    DailyAnswerCreate, DailyAnswerUpdate, DailyAnswerResponse
)
from app.config import settings
from app.services.reputation_service import add_reputation

router = APIRouter()


# ==================== Daily Questions (Admin) ====================

@router.post("/questions/", response_model=DailyQuestionResponse)
def create_daily_question(
    question_data: DailyQuestionCreate,
    user_id: int = Query(..., description="Admin User ID"),
    db: Session = Depends(get_db)
):
    """Create a new daily question (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Only admins can create daily questions")
    
    daily_question = DailyQuestion(
        title=question_data.title,
        content=question_data.content,
        subject=question_data.subject,
        word_limit=question_data.word_limit,
        marks=question_data.marks,
        posted_by=user_id
    )
    db.add(daily_question)
    db.commit()
    db.refresh(daily_question)
    
    return _format_daily_question(daily_question)


@router.get("/questions/today", response_model=DailyQuestionResponse)
def get_todays_question(db: Session = Depends(get_db)):
    """Get today's active daily question."""
    today = datetime.now(timezone.utc).date()
    question = db.query(DailyQuestion).filter(
        DailyQuestion.is_active == True
    ).order_by(DailyQuestion.date.desc()).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="No active question for today")
    
    return _format_daily_question(question)


@router.get("/questions/", response_model=List[DailyQuestionResponse])
def list_daily_questions(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """List past daily questions."""
    questions = db.query(DailyQuestion).order_by(
        DailyQuestion.date.desc()
    ).offset(skip).limit(limit).all()
    
    return [_format_daily_question(q) for q in questions]


@router.get("/questions/{question_id}", response_model=DailyQuestionResponse)
def get_daily_question(question_id: int, db: Session = Depends(get_db)):
    """Get a specific daily question."""
    question = db.query(DailyQuestion).filter(DailyQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Daily question not found")
    return _format_daily_question(question)


@router.put("/questions/{question_id}", response_model=DailyQuestionResponse)
def update_daily_question(
    question_id: int,
    question_data: DailyQuestionUpdate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Update a daily question (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Only admins can update")
    
    question = db.query(DailyQuestion).filter(DailyQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Daily question not found")
    
    for key, value in question_data.model_dump(exclude_unset=True).items():
        setattr(question, key, value)
    
    db.commit()
    db.refresh(question)
    return _format_daily_question(question)


# ==================== Daily Answers (User Submissions) ====================

@router.post("/answers/", response_model=DailyAnswerResponse)
def submit_daily_answer(
    answer_data: DailyAnswerCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Submit an answer to today's daily question."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    question = db.query(DailyQuestion).filter(
        DailyQuestion.id == answer_data.daily_question_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Daily question not found")
    
    # Check if user already submitted
    existing = db.query(DailyAnswer).filter(
        DailyAnswer.daily_question_id == answer_data.daily_question_id,
        DailyAnswer.user_id == user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already submitted an answer")
    
    word_count = len(answer_data.content.split())
    
    answer = DailyAnswer(
        daily_question_id=answer_data.daily_question_id,
        user_id=user_id,
        content=answer_data.content,
        word_count=word_count
    )
    db.add(answer)
    
    # Add reputation for submission
    add_reputation(db, user, settings.POINTS_DAILY_SUBMISSION, "daily_submission", "daily_answer", answer.id)
    
    db.commit()
    db.refresh(answer)
    
    return _format_daily_answer(answer)


@router.get("/questions/{question_id}/answers", response_model=List[DailyAnswerResponse])
def list_daily_answers(
    question_id: int,
    sort_by: str = Query("upvotes", enum=["upvotes", "recent"]),
    db: Session = Depends(get_db)
):
    """Get all answers for a daily question."""
    query = db.query(DailyAnswer).filter(DailyAnswer.daily_question_id == question_id)
    
    if sort_by == "upvotes":
        query = query.order_by(DailyAnswer.is_pinned.desc(), DailyAnswer.upvotes.desc())
    else:
        query = query.order_by(DailyAnswer.created_at.desc())
    
    answers = query.all()
    return [_format_daily_answer(a) for a in answers]


@router.post("/answers/{answer_id}/vote")
def vote_daily_answer(
    answer_id: int,
    value: int = Query(..., ge=-1, le=1),
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Vote on a daily answer."""
    answer = db.query(DailyAnswer).filter(DailyAnswer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    existing_vote = db.query(Vote).filter(
        Vote.user_id == user_id,
        Vote.target_type == "daily_answer",
        Vote.target_id == answer_id
    ).first()
    
    if existing_vote:
        if existing_vote.value == 1:
            answer.upvotes -= 1
        if value == 0:
            db.delete(existing_vote)
        else:
            existing_vote.value = value
    else:
        if value != 0:
            new_vote = Vote(
                user_id=user_id,
                target_type="daily_answer",
                target_id=answer_id,
                value=value
            )
            db.add(new_vote)
    
    if value == 1:
        answer.upvotes += 1
        add_reputation(db, answer.author, settings.POINTS_PER_UPVOTE, "upvote", "daily_answer", answer.id)
    
    db.commit()
    return {"upvotes": answer.upvotes}


@router.post("/answers/{answer_id}/pin")
def pin_daily_answer(
    answer_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Pin/mark as best answer (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Only admins can pin answers")
    
    answer = db.query(DailyAnswer).filter(DailyAnswer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    # Unpin others
    db.query(DailyAnswer).filter(
        DailyAnswer.daily_question_id == answer.daily_question_id,
        DailyAnswer.is_best_answer == True
    ).update({"is_best_answer": False, "is_pinned": False})
    
    answer.is_best_answer = True
    answer.is_pinned = True

    # Bonus reputation for best answer
    best_author = db.query(User).filter(User.id == answer.user_id).first()
    if best_author:
        add_reputation(db, best_author, settings.POINTS_BEST_ANSWER, "best_answer", "daily_answer", answer.id)
    
    db.commit()
    return {"message": "Answer pinned as best", "answer_id": answer_id}


# ==================== Helper Functions ====================

def _format_daily_question(question: DailyQuestion) -> dict:
    return {
        "id": question.id,
        "title": question.title,
        "content": question.content,
        "subject": question.subject,
        "word_limit": question.word_limit,
        "marks": question.marks,
        "model_answer": question.model_answer,
        "is_active": question.is_active,
        "date": question.date,
        "submission_count": len(question.submissions)
    }


def _format_daily_answer(answer: DailyAnswer) -> dict:
    return {
        "id": answer.id,
        "daily_question_id": answer.daily_question_id,
        "user_id": answer.user_id,
        "content": answer.content,
        "word_count": answer.word_count,
        "upvotes": answer.upvotes,
        "is_best_answer": answer.is_best_answer,
        "is_pinned": answer.is_pinned,
        "created_at": answer.created_at,
        "author_name": answer.author.name if answer.author else None,
        "author_reputation": answer.author.reputation if answer.author else 0
    }
