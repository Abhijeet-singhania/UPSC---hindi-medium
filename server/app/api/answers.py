from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db.models import Answer, Question, User, Vote
from app.schemas.answer import AnswerCreate, AnswerUpdate, AnswerResponse
from app.constants import POINTS_PER_ANSWER, POINTS_DOUBT_SOLVED
from app.services.reputation_service import add_reputation, apply_upvote_reputation, award_once
from app.api.users import get_current_user, get_optional_current_user

router = APIRouter()


def _format_answer(answer: Answer, user_vote: int = 0) -> AnswerResponse:
    return AnswerResponse(
        id=answer.id,
        content=answer.content,
        question_id=answer.question_id,
        user_id=answer.user_id,
        is_accepted=answer.is_accepted,
        upvotes=answer.upvotes,
        downvotes=answer.downvotes,
        created_at=answer.created_at,
        author=answer.author,
        user_vote=user_vote,
    )


def _get_user_votes(db: Session, user_id: int, answer_ids: List[int]) -> dict:
    if not answer_ids:
        return {}
    votes = db.query(Vote).filter(
        Vote.user_id == user_id,
        Vote.target_type == "answer",
        Vote.target_id.in_(answer_ids),
    ).all()
    return {vote.target_id: vote.value for vote in votes}


@router.post("/", response_model=AnswerResponse)
def create_answer(
    answer_data: AnswerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create an answer to a question (requires authentication)."""
    question = db.query(Question).filter(Question.id == answer_data.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    answer = Answer(
        content=answer_data.content,
        question_id=answer_data.question_id,
        user_id=current_user.id
    )
    db.add(answer)
    db.flush()

    add_reputation(db, current_user, POINTS_PER_ANSWER, "answer", "answer", answer.id)
    
    db.commit()
    db.refresh(answer)
    return _format_answer(answer, user_vote=0)


@router.get("/question/{question_id}", response_model=List[AnswerResponse])
def list_answers(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Get all answers for a question."""
    answers = db.query(Answer).filter(
        Answer.question_id == question_id
    ).order_by(Answer.upvotes.desc()).all()

    user_votes = {}
    if current_user:
        user_votes = _get_user_votes(db, current_user.id, [answer.id for answer in answers])

    return [_format_answer(answer, user_votes.get(answer.id, 0)) for answer in answers]


@router.put("/{answer_id}", response_model=AnswerResponse)
def update_answer(
    answer_id: int,
    answer_data: AnswerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an answer (only by owner)."""
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    if answer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this answer")
    
    for key, value in answer_data.model_dump(exclude_unset=True).items():
        setattr(answer, key, value)
    
    db.commit()
    db.refresh(answer)
    user_vote = _get_user_votes(db, current_user.id, [answer.id]).get(answer.id, 0)
    return _format_answer(answer, user_vote=user_vote)


@router.post("/{answer_id}/vote")
def vote_answer(
    answer_id: int,
    value: int = Query(..., ge=-1, le=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Vote on an answer (requires authentication)."""
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    existing_vote = db.query(Vote).filter(
        Vote.user_id == current_user.id,
        Vote.target_type == "answer",
        Vote.target_id == answer_id
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
            target_type="answer",
            target_id=answer_id,
            value=value,
        ))

    if old_value == 1:
        answer.upvotes -= 1
    elif old_value == -1:
        answer.downvotes -= 1

    if value == 1:
        answer.upvotes += 1
    elif value == -1:
        answer.downvotes += 1

    author = db.query(User).filter(User.id == answer.user_id).first()
    apply_upvote_reputation(db, author, old_value, value, "answer", answer.id)

    db.commit()
    return {"upvotes": answer.upvotes, "downvotes": answer.downvotes, "user_vote": value}


@router.post("/{answer_id}/accept")
def accept_answer(
    answer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept an answer (only by question owner)."""
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    question = answer.question
    if question.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only question owner can accept")
    
    # Unaccept any previously accepted answer
    db.query(Answer).filter(
        Answer.question_id == question.id,
        Answer.is_accepted == True
    ).update({"is_accepted": False})
    
    answer.is_accepted = True
    question.is_solved = True

    # Bonus reputation for getting answer accepted (doubt solved)
    answer_author = db.query(User).filter(User.id == answer.user_id).first()
    if answer_author:
        award_once(
            db, answer_author, POINTS_DOUBT_SOLVED, "doubt_solved", "answer", answer.id
        )

    db.commit()
    return {"message": "Answer accepted", "answer_id": answer_id}
