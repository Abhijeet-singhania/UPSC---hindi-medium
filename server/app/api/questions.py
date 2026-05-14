from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.db.models import Question, Tag, QuestionTag, User
from app.schemas.question import QuestionCreate, QuestionResponse, TagCreate, TagResponse
from app.api.users import get_current_user

router = APIRouter()


@router.post("/", response_model=QuestionResponse)
def create_question(
    question_data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Post a new question (requires authentication)."""
    question = Question(
        title=question_data.title,
        content=question_data.content,
        user_id=current_user.id,
        is_anonymous=question_data.is_anonymous
    )
    db.add(question)
    db.flush()

    if question_data.tags:
        for tag_name in question_data.tags:
            tag = db.query(Tag).filter(Tag.name == tag_name).first()
            if not tag:
                tag = Tag(name=tag_name)
                db.add(tag)
                db.flush()
            qt = QuestionTag(question_id=question.id, tag_id=tag.id)
            db.add(qt)

    db.commit()
    db.refresh(question)
    return question


@router.get("/", response_model=List[QuestionResponse])
def get_questions(
    skip: int = 0,
    limit: int = 20,
    tag: str = None,
    db: Session = Depends(get_db)
):
    """List questions with optional tag filter."""
    query = db.query(Question)

    if tag:
        query = query.join(Question.tags).filter(Tag.name == tag)

    questions = query.order_by(Question.created_at.desc()).offset(skip).limit(limit).all()
    return questions


# /tags must come before /{question_id} to avoid route shadowing
@router.get("/tags", response_model=List[TagResponse])
def get_tags(db: Session = Depends(get_db)):
    """List all available tags."""
    return db.query(Tag).all()


@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(question_id: int, db: Session = Depends(get_db)):
    """Get detailed question by ID."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question
