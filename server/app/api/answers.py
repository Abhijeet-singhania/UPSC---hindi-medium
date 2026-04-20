from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.db.models import Answer, Question, User, Vote
from app.schemas.answer import AnswerCreate, AnswerUpdate, AnswerResponse
from app.config import settings
from app.services.reputation_service import add_reputation
from app.api.users import get_current_user

router = APIRouter()


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
    
    # Add reputation points
    add_reputation(db, current_user, settings.POINTS_PER_ANSWER, "answer", "answer", answer.id)
    
    db.commit()
    db.refresh(answer)
    return answer


@router.get("/question/{question_id}", response_model=List[AnswerResponse])
def list_answers(question_id: int, db: Session = Depends(get_db)):
    """Get all answers for a question."""
    answers = db.query(Answer).filter(
        Answer.question_id == question_id
    ).order_by(Answer.upvotes.desc()).all()
    return answers


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
    return answer


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
    
    if existing_vote:
        if existing_vote.value == 1:
            answer.upvotes -= 1
        elif existing_vote.value == -1:
            answer.downvotes -= 1
        
        if value == 0:
            db.delete(existing_vote)
        else:
            existing_vote.value = value
    else:
        if value != 0:
            new_vote = Vote(
                user_id=current_user.id,
                target_type="answer",
                target_id=answer_id,
                value=value
            )
            db.add(new_vote)
    
    if value == 1:
        answer.upvotes += 1
        add_reputation(db, answer.author, settings.POINTS_PER_UPVOTE, "upvote", "answer", answer.id)
    elif value == -1:
        answer.downvotes += 1
    
    db.commit()
    return {"upvotes": answer.upvotes, "downvotes": answer.downvotes}


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
        add_reputation(db, answer_author, settings.POINTS_DOUBT_SOLVED, "doubt_solved", "answer", answer.id)

    db.commit()
    return {"message": "Answer accepted", "answer_id": answer_id}
