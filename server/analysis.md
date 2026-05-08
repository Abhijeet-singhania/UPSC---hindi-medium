# Project Analysis: UPSC Hindi Peer Network

## 1. Project Overview
The **UPSC Hindi Peer Network** is a specialized backend platform designed for UPSC (Union Public Service Commission) aspirants who use Hindi as their primary medium. It aims to create a peer-to-peer learning ecosystem that facilitates collaborative study, answer writing practice, and resource sharing.

## 2. Tech Stack
- **Framework:** FastAPI (0.109.0)
- **Language:** Python 3.10+
- **Database:** PostgreSQL (via SQLAlchemy 2.0.25 and psycopg2-binary)
- **Asynchronous Task/Caching:** Redis (5.0.1) for leaderboards and potential task management.
- **Validation:** Pydantic (2.5.3) & Pydantic-settings
- **Server:** Uvicorn (0.27.0)

## 3. Core Features

### A. User Management & Reputation System
- **Authentication:** JWT (JSON Web Token) authentication is fully integrated (`OAuth2PasswordBearer`). It allows login via email/password, returning an `access_token` for secured route consumption.
- **Roles:** User, Contributor, Admin, Moderator, Mentor.
- **Exam Stages:** Beginner, Prelims, Mains, Interview.
- **Levels:** Beginner (0+), Learner (50+), Contributor (200+), Scholar (500+), Mentor (1000+).
- **Gamification:** 
    - **Reputation Points (Configurable in `config.py`):**
        - Upvote: +10 points
        - Best Answer: +25 points
        - Doubt Solved: +15 points
        - Daily Submission: +10 points
        - Answering a Question: +5 points
        - Asking a Question: +2 points
        - Study Time: +1 point per minute
    - **Auto-promotion:** Users are promoted from `USER` to `CONTRIBUTOR` automatically upon reaching 200 reputation points.
    - **Streak system:** Tracks daily study sessions and resets if a day is missed.

### B. Q&A System (Community-driven)
- Users can post questions (with an option for anonymity).
- Tagging system via `Tag` and `QuestionTag` models.
- Peer-reviewed answers with upvote/downvote mechanics (managed in `Vote` table).
- Ability to "Accept" answers as a solution, rewarding the author.

### C. Silent Library (Deep Work)
- Real-time tracking of study sessions called "Silent Sessions".
- **Streak Tracking:** Managed via `SilentStreak` model, calculating daily minutes and session counts.
- **Leaderboards:** Real-time leaderboard updates using Redis for daily, weekly, and all-time study duration.

### D. Daily Answer Writing (DAW)
- Admin-curated questions for mains-style practice.
- Features include word limits, marks, and "Best Answer" pinning by admins.
- Points rewarded for both submission and receiving upvotes.

### E. Past Year Problems (PYQ)
- Structured database of UPSC Prelims and Mains questions.
- **Prelims:** Supports 4-option MCQs with Hindi explanations.
- **Mains:** Supports descriptive questions with word limits and marks.
- **Seeding:** The application auto-seeds a few starter PYQs (2020-2023) on startup if the table is empty.

### F. Moderation & Reporting
- Reporting system for spam, abuse, or inappropriate content.
- Status tracking for reports (`pending`, `reviewed`, `resolved`, `dismissed`).

## 4. Database Architecture
Built on SQLAlchemy with the following key models:
- **`User`**: Central profile storage including reputation, streaks, and wallet balance.
- **`Question` / `Answer` / `Tag` / `Vote`**: Core entities for the Q&A system.
- **`DailyQuestion` / `DailyAnswer`**: Specialized models for the DAW feature.
- **`SilentSession` / `SilentStreak`**: Tracking study habits and consistency.
- **`PastYearProblem`**: Static repository of official exam questions.
- **`ReputationLog`**: Audit trail for all reputation changes.
- **`Report`**: Handling moderation tasks.

## 5. Service Layer
- **`ReputationService`**: Centralized engine for managing points, levels, and role promotions. Ensures consistency across the app by logging every change in `ReputationLog`.
- **`RedisService`**: Manages real-time leaderboards for reputation and study minutes using sorted sets.
- **`AuthService`**: Manages password hashing, token creation, and validation for user login flows.

## 6. Codebase Structure
- `app/api/`: Feature-based route handlers (e.g., `silent_library.py`, `daily_answer.py`, `users.py`, `past_year_problems.py`).
- `app/db/`: Database configuration (`database.py`) and schema definitions (`models.py`).
- `app/schemas/`: Pydantic models for request validation and response serialization.
- `app/services/`: Business logic (e.g., `auth_service.py`, `reputation_service.py`).
- `app/config.py`: Centralized settings using `pydantic-settings`.
- `app/main.py`: Entry point, middleware, and database seeding logic.

## 7. Current Steps Done (Context for Future Iterations)
- **JWT Authentication Flow**: The `Mock Auth` using `device_id` was replaced with secure JWT-based email/password authentication via `auth_service.py`. Endpoints now validate access using the `get_current_user` dependency.
- **PYQ Integration**: Completed endpoints for the Past Year Problems.

## 8. Observations & Potential Improvements
- **Asset Management:** Add support for image/PDF uploads for handwritten Daily Answers.
- **Search:** Implement PostgreSQL Full Text Search or a dedicated engine for Hindi content.
- **Testing:** Introduce a `tests/` directory with `pytest` for endpoint and service validation.
- **Scalability:** The `active_sessions` in `silent_library.py` is currently in-memory (dictionary); this should be moved to Redis for multi-worker support.
- **Internationalization:** Infrastructure is ready for multi-language support (already has `language` field in PYQs).
