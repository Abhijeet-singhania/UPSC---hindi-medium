# UPSC Hindi Peer Network

A peer-to-peer UPSC Hindi learning ecosystem.

## Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Node.js 18+ (for React Native development)
- Android Studio / Xcode (for mobile development)

### Start Backend Services

```bash
# Start all services (PostgreSQL, Redis, FastAPI)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

The API will be available at: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### Project Structure

```
UPSC-hindi-medium/
├── docker-compose.yml      # Orchestrates all services
├── server/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── db/             # Database models
│   │   └── schemas/        # Pydantic schemas
│   ├── Dockerfile
│   └── requirements.txt
└── mobile/                 # React Native App (to be initialized)
```

## API Endpoints

### Users
- `POST /api/v1/users/` - Create/get user by device ID
- `GET /api/v1/users/{id}` - Get user details
- `PUT /api/v1/users/{id}` - Update profile

### Questions (Q&A)
- `GET /api/v1/questions/` - List questions
- `POST /api/v1/questions/` - Create question
- `POST /api/v1/questions/{id}/vote` - Vote on question

### Answers
- `POST /api/v1/answers/` - Create answer
- `GET /api/v1/answers/question/{id}` - Get answers for question
- `POST /api/v1/answers/{id}/accept` - Accept answer

### Silent Library
- `POST /api/v1/silent-library/join` - Start study session
- `POST /api/v1/silent-library/leave` - End session
- `GET /api/v1/silent-library/active` - Get active users
