from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db.models import Question, Tag, QuestionTag, User, Vote
from app.schemas.question import QuestionCreate, QuestionResponse, TagCreate, TagResponse
from app.api.users import get_current_user, get_optional_current_user
from app.constants import POINTS_PER_QUESTION
from app.services.reputation_service import add_reputation, apply_upvote_reputation

router = APIRouter()


def _format_question(question: Question, user_vote: int = 0) -> QuestionResponse:
    return QuestionResponse(
        id=question.id,
        title=question.title,
        content=question.content,
        user_id=question.user_id,
        is_anonymous=question.is_anonymous,
        is_solved=question.is_solved,
        upvotes=question.upvotes,
        downvotes=question.downvotes,
        created_at=question.created_at,
        author=question.author,
        tags=question.tags,
        answer_count=question.answer_count,
        user_vote=user_vote,
    )


def _get_user_votes(db: Session, user_id: int, question_ids: List[int]) -> dict:
    if not question_ids:
        return {}
    votes = db.query(Vote).filter(
        Vote.user_id == user_id,
        Vote.target_type == "question",
        Vote.target_id.in_(question_ids),
    ).all()
    return {vote.target_id: vote.value for vote in votes}


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

    add_reputation(db, current_user, POINTS_PER_QUESTION, "question", "question", question.id)

    db.commit()
    db.refresh(question)
    return _format_question(question, user_vote=0)


@router.get("/", response_model=List[QuestionResponse])
def get_questions(
    skip: int = 0,
    limit: int = 20,
    tag: str = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """List questions with optional tag filter."""
    query = db.query(Question)

    if tag:
        query = query.join(Question.tags).filter(Tag.name == tag)

    questions = query.order_by(Question.created_at.desc()).offset(skip).limit(limit).all()

    user_votes = {}
    if current_user:
        user_votes = _get_user_votes(db, current_user.id, [question.id for question in questions])

    return [
        _format_question(question, user_votes.get(question.id, 0))
        for question in questions
    ]


# /tags must come before /{question_id} to avoid route shadowing
@router.get("/tags", response_model=List[TagResponse])
def get_tags(db: Session = Depends(get_db)):
    """List all available tags."""
    return db.query(Tag).all()


@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Get detailed question by ID."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    user_vote = 0
    if current_user:
        user_vote = _get_user_votes(db, current_user.id, [question.id]).get(question.id, 0)

    return _format_question(question, user_vote=user_vote)


@router.post("/{question_id}/vote")
def vote_question(
    question_id: int,
    value: int = Query(..., ge=-1, le=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Vote on a question (requires authentication)."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    existing_vote = db.query(Vote).filter(
        Vote.user_id == current_user.id,
        Vote.target_type == "question",
        Vote.target_id == question_id,
    ).first()

    old_value = existing_vote.value if existing_vote else 0

    if value == 0:
        if existing_vote:
            db.delete(existing_vote)
    elif existing_vote:
        existing_vote.value = value
    else:
        db.add(Vote(
            user_id=current_user.id,
            target_type="question",
            target_id=question_id,
            value=value,
        ))

    if old_value == 1:
        question.upvotes -= 1
    elif old_value == -1:
        question.downvotes -= 1

    if value == 1:
        question.upvotes += 1
    elif value == -1:
        question.downvotes += 1

    author = db.query(User).filter(User.id == question.user_id).first()
    apply_upvote_reputation(db, author, old_value, value, "question", question.id)

    db.commit()
    return {"upvotes": question.upvotes, "downvotes": question.downvotes, "user_vote": value}
