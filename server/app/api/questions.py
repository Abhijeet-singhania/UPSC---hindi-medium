from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db.models import Question, Tag, QuestionTag, User, Vote
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse
from app.config import settings

router = APIRouter()


@router.post("/", response_model=QuestionResponse)
def create_question(
    question_data: QuestionCreate,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Create a new question."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    question = Question(
        title=question_data.title,
        content=question_data.content,
        is_anonymous=question_data.is_anonymous,
        user_id=user_id
    )
    db.add(question)
    db.flush()
    
    # Handle tags
    for tag_name in question_data.tags:
        tag = db.query(Tag).filter(Tag.name == tag_name.lower()).first()
        if not tag:
            tag = Tag(name=tag_name.lower())
            db.add(tag)
            db.flush()
        question_tag = QuestionTag(question_id=question.id, tag_id=tag.id)
        db.add(question_tag)
    
    # Add reputation points
    user.reputation += settings.POINTS_PER_QUESTION
    
    db.commit()
    db.refresh(question)
    
    return _format_question_response(question, db)


@router.get("/", response_model=List[QuestionResponse])
def list_questions(
    skip: int = 0,
    limit: int = 20,
    tag: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List questions with optional tag filter."""
    query = db.query(Question).order_by(Question.created_at.desc())
    
    if tag:
        query = query.join(QuestionTag).join(Tag).filter(Tag.name == tag.lower())
    
    questions = query.offset(skip).limit(limit).all()
    return [_format_question_response(q, db) for q in questions]


@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(question_id: int, db: Session = Depends(get_db)):
    """Get a specific question."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return _format_question_response(question, db)


@router.put("/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    question_data: QuestionUpdate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Update a question (only by owner)."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if question.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for key, value in question_data.model_dump(exclude_unset=True).items():
        setattr(question, key, value)
    
    db.commit()
    db.refresh(question)
    return _format_question_response(question, db)


@router.post("/{question_id}/vote")
def vote_question(
    question_id: int,
    value: int = Query(..., ge=-1, le=1),
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Vote on a question (+1 upvote, -1 downvote, 0 remove vote)."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    existing_vote = db.query(Vote).filter(
        Vote.user_id == user_id,
        Vote.target_type == "question",
        Vote.target_id == question_id
    ).first()
    
    if existing_vote:
        # Reverse old vote effect
        if existing_vote.value == 1:
            question.upvotes -= 1
        elif existing_vote.value == -1:
            question.downvotes -= 1
        
        if value == 0:
            db.delete(existing_vote)
        else:
            existing_vote.value = value
    else:
        if value != 0:
            new_vote = Vote(
                user_id=user_id,
                target_type="question",
                target_id=question_id,
                value=value
            )
            db.add(new_vote)
    
    # Apply new vote effect
    if value == 1:
        question.upvotes += 1
        question.author.reputation += settings.POINTS_PER_UPVOTE
    elif value == -1:
        question.downvotes += 1
    
    db.commit()
    return {"upvotes": question.upvotes, "downvotes": question.downvotes}


def _format_question_response(question: Question, db: Session) -> dict:
    """Format question response with additional data."""
    tags = [t.name for t in question.tags]
    author_info = None
    if not question.is_anonymous and question.author:
        author_info = {
            "id": question.author.id,
            "name": question.author.name,
            "reputation": question.author.reputation
        }
    
    return {
        "id": question.id,
        "title": question.title,
        "content": question.content,
        "is_anonymous": question.is_anonymous,
        "user_id": question.user_id,
        "is_solved": question.is_solved,
        "upvotes": question.upvotes,
        "downvotes": question.downvotes,
        "created_at": question.created_at,
        "author": author_info,
        "tags": tags,
        "answer_count": len(question.answers)
    }
