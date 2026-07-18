# Khmer Sign Language Platform

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/LK-Hour/khmer-sign-language-learning-platform)

A full-stack platform for learning Khmer sign language with learner-facing curriculum content, admin management workflows, and AI-assisted practice experiences.

## Overview

This repository contains:

- A Next.js frontend for the learner and admin experience
- A FastAPI backend for curriculum, auth, media, and analytics workflows
- PostgreSQL, Redis, and pgAdmin services for local development
- Documentation and audit notes for product, admin, and engineering work

## Quick Start

### 1. Clone and enter the repository

```bash
git clone https://github.com/LK-Hour/khmer-sign-language-learning-platform
cd khmer-sign-language-platform
```

### 2. Start local services

```bash
docker compose up -d
```

### 3. Set up the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Example backend environment variables:

```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/khmer_sign_db
SECRET_KEY=change-me
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
```

### 4. Set up the frontend

```bash
cd frontend
npm install
```

Example frontend environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 5. Run the app

Backend:

```bash
cd backend
source .venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm run dev
```

### Local URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs
- pgAdmin: http://localhost:8080

## Project Structure

```text
backend/           # FastAPI backend services and API
frontend/          # Next.js frontend application
frontend/src/app/  # App Router pages and layouts
frontend/src/features/ # Domain-based frontend features
frontend/src/components/ # Shared UI components
docs/              # Developer and product documentation
scripts/           # Repository helper scripts
```

## Main Tech Stack

### Frontend

- Next.js 16.2.6
- React 19.2.4
- TypeScript 5.x
- Material UI 9.x
- Zustand
- Vitest

### Backend

- Python 3.10+
- FastAPI
- SQLAlchemy 2.x
- Alembic
- Pydantic 2.x
- PostgreSQL

## Development Workflow

### Backend

```bash
cd backend
source .venv/bin/activate
pytest
alembic upgrade head
```

### Frontend

```bash
cd frontend
npm run lint
npm run typecheck
npm test
```

## Documentation

Developer-facing guides are available in [docs](docs):

- [docs/developer-guide.md](docs/developer-guide.md) — onboarding and development workflow
- [docs/admin-content-lifecycle.md](docs/admin-content-lifecycle.md) — admin publish and visibility lifecycle
- [docs/admin-test-matrix.md](docs/admin-test-matrix.md) — admin feature test matrix
- [docs/refactor-audit-report.md](docs/refactor-audit-report.md) — frontend refactor notes
- [docs/feature-guides/finger-spelling.md](docs/feature-guides/finger-spelling.md) — backend, ML, and frontend ownership for finger spelling
- [docs/feature-guides/word-detection.md](docs/feature-guides/word-detection.md) — backend, ML, and frontend ownership for word detection
- [docs/feature-guides/ai-integration-overview.md](docs/feature-guides/ai-integration-overview.md) — how AI prediction is wired through the platform
- [docs/feature-guides/frontend-ownership-map.md](docs/feature-guides/frontend-ownership-map.md) — where to edit frontend feature areas

## Useful Commands

```bash
# Start all local services
docker compose up -d

# Stop all local services
docker compose down

# Start the backend manually
cd backend && source .venv/bin/activate && uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Start the frontend manually
cd frontend && npm run dev
```

## Contributing

Before opening a pull request:

- Keep changes scoped and documented
- Run relevant frontend or backend checks
- Update documentation when workflow or architecture changes
- Note any migration or seed-data changes clearly

## Notes

The repository includes a generated graph index under [graphify-out](graphify-out) and additional historical notes under [docs.local](docs.local).

### Backend `.env`
```
DATABASE_URL=postgresql://admin:admin@localhost:5432/khmer_sign_db
SECRET_KEY=your_super_secret_random_string_change_this_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
```

### Local Database Workflow
Use Alembic for schema changes and the seed utility for repeatable data:
```bash
cd backend
source venv/bin/activate

# sync the schema after pulling new migrations
alembic upgrade head

# export the current database snapshot
python seed_data/seed_database.py --export --output seed_data/seed_data.json

# import the same snapshot on another machine
python seed_data/seed_database.py --output seed_data/seed_data.json
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API Documentation

Once backend is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Current Endpoints
- `GET /` - Health check endpoint

---

## Development Workflow

### Frontend Project Structure - `src/` Wrapper

The frontend uses a structured `src/` folder to organize all source code:

```
frontend/src/
├── app/               # Next.js App Router (pages & routing)
├── components/        # Reusable UI components
├── hooks/             # Custom React hooks
├── layouts/           # Layout wrapper components
├── contexts/          # React Context providers
├── sections/          # Page sections (hero, feature, etc.)
├── theme/             # Material UI theme configuration
├── utils/             # Helper functions
├── constants/         # Constants & enums
├── auth/              # Authentication logic
├── assets/            # Images, fonts, icons
└── zustand/           # Zustand state stores
```

### Reorganizing Frontend to Use `src/` Structure

If you haven't already reorganized, follow these steps:

1. **Create src directory:**
   ```bash
   cd frontend
   mkdir -p src/{app,components,hooks,layouts,contexts,sections,theme,utils,constants,auth,assets,zustand}
   ```

2. **Move app folder into src:**
   ```bash
   mv app/* src/app/
   rmdir app
   ```

3. **Update next.config.ts if needed** to point to src directory

4. **Update tsconfig.json paths** (if using path aliases):
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"],
         "@components/*": ["./src/components/*"],
         "@hooks/*": ["./src/hooks/*"],
         "@utils/*": ["./src/utils/*"],
         "@constants/*": ["./src/constants/*"],
         "@zustand/*": ["./src/zustand/*"]
       }
     }
   }
   ```

5. **Update import statements** throughout the project to use new paths

### Common Commands

```bash
# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt    # Install dependencies
uvicorn main:app --reload          # Start development server
pytest                             # Run tests (when added)

# Frontend (Next.js)
cd frontend
npm run dev                         # Next.js dev server with hot reload
npm run build                       # Build for production
npm start                           # Start production server
npm run lint                        # Run ESLint
```

### Project Structure Guidelines

**Backend (FastAPI with `src/` wrapper):**
- Organize code in `src/` directory for cleaner separation
- Keep models in `src/models/` (SQLAlchemy models)
- Keep API schemas in `src/schemas/` (Pydantic models)
- Organize routes in `src/routes/` by feature (auth.py, users.py, etc.)
- Place business logic in `src/services/`
- Use `src/utils/` for helper functions
- Create `src/dependencies.py` for dependency injection
- Use `src/config.py` for configuration management

**Frontend (Next.js with `src/` wrapper):**
- Use Next.js App Router for pages and routing
- Build reusable components using TypeScript
- Keep components modular and organized in `src/components/`
- Store global state in `zustand/` folder
- Place utilities and constants in their respective folders
- Use path aliases (`@/`) for cleaner imports
- Leverage Next.js features: API routes, middleware, server components

---

## Frontend Dependencies Overview

| Package | Purpose |
|---------|---------|
| **Next.js** | Full-stack React framework with SSR, routing, and API routes |
| **React** | UI library (used by Next.js) |
| **TypeScript** | Type safety |
| **Material UI (MUI)** | Component library |
| **Emotion** | CSS-in-JS styling |
| **Zustand** | State management |
| **Tailwind CSS** | Utility-first CSS framework |

---

## Security Notes

- Never commit `.env` files with real secrets
- Change `SECRET_KEY` in production
- Use environment variables for all sensitive data
- JWT tokens expire after 30 minutes (configurable)

---

## Development Status

**Current Sprint:** Sprint 1.1 - Infrastructure & Environment

**Completed:**
- Backend infrastructure setup
- Frontend setup with Next.js & MUI
- Docker PostgreSQL configuration
- Environment variables
- CORS configuration

**Next:** Sprint 1.2 - Authentication & User Models

---

## Support

For issues or questions:
1. Check existing documentation in `docs.local/`
2. Review sprint checklists
3. Check Docker setup guides

---

## License

This project is part of the CADT Internship Program.

---

**Last Updated:** May 12, 2026
**Project Version:** 0.1.0
