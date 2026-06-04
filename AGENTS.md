# AGENTS.md

## Cursor Cloud specific instructions

Khmer Sign Language Platform: **Next.js** (`frontend/`, port 3000) + **FastAPI** (`backend/`, port 8000) + **PostgreSQL** via root `docker-compose.yml` (port 5432).

### First-time database schema

Alembic revision files live in `backend/alembic/versions/` and are **gitignored**. On a fresh clone, create the folder and generate the initial migration before seeding:

```bash
cd /workspace
docker compose up -d postgres
mkdir -p backend/alembic/versions
cd backend && source venv/bin/activate
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
python seed_data/seed_curriculum.py
python seed_data/seed_database.py --output seed_data/seed_data.json
```

If `alembic upgrade head` runs but tables are missing, re-run autogenerate as above.

### Environment files (not committed)

- `backend/.env` — see root `README.md` (`DATABASE_URL`, `SECRET_KEY`, etc.)
- `frontend/.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:8000`

### Docker on Cloud VMs

If `docker compose` reports permission denied on the socket, run once: `sudo chmod 666 /var/run/docker.sock` (or add the user to the `docker` group and restart the session).

### Running services (development)

Use separate terminals or tmux sessions (do not rely on `start.sh` alone in headless agents—it backgrounds both processes in one shell):

```bash
# Postgres
docker compose up -d postgres

# Backend
cd backend && source venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend && npm run dev
```

**Smoke URLs:** API health `http://localhost:8000/` · Swagger `http://localhost:8000/docs` · UI `http://localhost:3000/en/finger-spelling`

### Lint / test / build

| Area | Command | Notes |
|------|---------|--------|
| Frontend lint | `cd frontend && npm run lint` | May report existing React hook / `any` issues |
| Frontend build | `cd frontend && npm run build` | Dev server (`npm run dev`) is the usual local workflow |
| Backend tests | `cd backend && source venv/bin/activate && pytest tests/` | Media-related tests expect `data_set/` image assets (optional) |
| Frontend integration | `frontend/tests/letter-ka.test.ts` | Hits live API; requires backend + DB + seed |

### Optional assets

Finger-spelling **media** images come from repo-root `data_set/`. Without it, curriculum and API work but media counts in tests stay at 0 and sign images use placeholders.

### See also

- Root `README.md` — full setup
- `backend/seed_data/README.md` — seeding workflow
- `frontend/AGENTS.md` — Next.js 16.x agent notes for this app
