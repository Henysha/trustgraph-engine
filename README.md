# TrustGraph Engine

TrustGraph Engine is a portfolio-grade fintech risk and reputation platform for community finance products. The MVP receives user profiles, group profiles, trust signals, transaction events, and trust graph edges, then creates explainable risk scores, fraud alerts, and review cases.

## Tech Stack

- Backend: Python 3.12, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL, Pydantic, Pytest
- Frontend: React, TypeScript, Vite, React Router, Axios, Tailwind CSS
- Infrastructure: Docker Compose with PostgreSQL, backend, and frontend services

## Project Structure

```text
backend/
  app/
    api/
    core/
    db/
    models/
    schemas/
    services/
  alembic/
  tests/
frontend/
  src/
docker-compose.yml
```

## Risk Model

Scores are deterministic and explainable:

- `0-30`: `LOW`, recommendation `APPROVE`
- `31-70`: `MEDIUM`, recommendation `REVIEW`
- `71-100`: `HIGH`, recommendation `BLOCK`

Every scored transaction creates a `RiskScore`. High-risk transactions also create a `FraudAlert` and a `ReviewCase`.

## Run With Docker

```bash
docker compose up --build
```

In another terminal, run migrations:

```bash
docker compose exec backend alembic upgrade head
```

Services:

- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432

## Demo API Flow

After the backend is running and migrations are applied, run the portfolio demo script:

```bash
docker compose exec backend python scripts/demo_flow.py
```

The script creates low-risk and high-risk demo profiles, scores transactions, then prints the resulting risk scores, fraud alerts, and review cases.

## Run Backend Locally

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

On macOS/Linux, use `source .venv/bin/activate` instead of the Windows activation command.

## Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

## Tests

```bash
cd backend
pytest
```

Or run the backend test suite through Docker:

```bash
docker compose run --rm backend pytest
```

## MVP API Surface

- `GET /api/health`
- `POST /api/users`
- `GET /api/users`
- `GET /api/users/{id}`
- `GET /api/users/{id}/risk`
- `POST /api/groups`
- `GET /api/groups`
- `GET /api/groups/{id}`
- `GET /api/groups/{id}/risk`
- `POST /api/transactions`
- `GET /api/transactions`
- `GET /api/transactions/{id}`
- `POST /api/transactions/{id}/score`
- `POST /api/users/{id}/signals`
- `GET /api/users/{id}/signals`
- `GET /api/alerts`
- `GET /api/alerts/{id}`
- `POST /api/alerts/{id}/resolve`
- `GET /api/review-cases`
- `GET /api/review-cases/{id}`
- `POST /api/review-cases/{id}/approve`
- `POST /api/review-cases/{id}/reject`
- `POST /api/trust-edges`
- `GET /api/users/{id}/network`
