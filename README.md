# 🤟 Khmer Sign Language Platform

A comprehensive web platform for learning Khmer sign language with AI-powered real-time feedback through computer vision. This platform enables users to practice sign language gestures and receive instant accuracy assessments.

---

## 📋 Table of Contents
- [Tech Stack](#tech-stack)
- [System Requirements](#system-requirements)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Database](#database)
- [API Documentation](#api-documentation)

---

## 🏗️ Tech Stack

### **Frontend**
| Component | Version | Notes |
|-----------|---------|-------|
| Next.js | 16.2.6 | Full-stack React framework |
| React | 19.2.4 | UI library (used by Next.js) |
| React DOM | 19.2.4 | DOM rendering for React |
| TypeScript | 5.x | Type safety |
| Material UI (MUI) | 9.0.1 | Component library |
| Emotion | 11.14.0 & 11.14.1 | CSS-in-JS styling |
| Zustand | 5.0.13 | State management |
| Tailwind CSS | 4.x | Utility-first CSS |
| ESLint | 9.x | Code linting |

### **Backend**
| Component | Version |
|-----------|---------|
| Python | 3.10+ |
| FastAPI | 0.104.1 |
| Uvicorn | 0.24.0 |
| SQLAlchemy | 2.0.23 |
| Alembic | 1.12.1 |
| Pydantic | 2.5.0 |
| PyJWT | 2.8.0 |
| python-dotenv | 1.0.0 |
| bcrypt | 4.1.1 |
| passlib | 1.7.4 |

### **Database**
| Component | Version |
|-----------|---------|
| PostgreSQL | 17-alpine (latest Alpine) |
| Docker | Latest |
| Docker Compose | Latest |

---

## 💻 System Requirements

### Required Software
- **Docker & Docker Compose** - For PostgreSQL
- **Node.js** - 18+ LTS
- **Python** - 3.10+
- **Git**

---

## 📁 Project Structure

```
khmer-sign-language-platform/

├── frontend/                   # Next.js Frontend
│   ├── src/                   # Source code wrapper
│   │   ├── app/               # Next.js App Router
│   │   │   ├── layout.tsx     # Root layout
│   │   │   ├── page.tsx       # Home page
│   │   │   └── globals.css    # Global styles
│   │   ├── components/        # Reusable React components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── layouts/           # Layout components
│   │   ├── contexts/          # React context providers
│   │   ├── sections/          # Page sections
│   │   ├── theme/             # MUI theme configuration
│   │   ├── utils/             # Utility functions
│   │   ├── constants/         # Application constants
│   │   ├── auth/              # Authentication utilities
│   │   ├── assets/            # Images, fonts, etc.
│   │   └── zustand/           # Zustand store definitions
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies
│   ├── next.config.ts         # Next.js configuration
│   ├── tsconfig.json          # TypeScript configuration
│   ├── postcss.config.mjs      # PostCSS configuration
│   ├── eslint.config.mjs       # ESLint configuration
│   └── .env.local             # Frontend environment variables
│
├── backend/                    # FastAPI Backend
│   ├── src/                   # Source code wrapper
│   │   ├── main.py            # Main FastAPI application
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic
│   │   ├── dependencies/      # Dependency injection
│   │   ├── utils/             # Utility functions
│   │   ├── constants/         # Constants & enums
│   │   ├── middleware/        # Custom middleware
│   │   ├── config/            # Configuration files
│   │   └── validators/        # Data validators
│   ├── requirements.txt        # Python dependencies
│   ├── .env                   # Environment variables
│   ├── venv/                  # Python virtual environment
│   └── test_db_connection.py  # Database connection tester
│
│
├── docker-compose.yml          # Docker Compose configuration
├── start.sh                    # Automated startup script
└── README.md                   # This file
```

---

## 🚀 Installation & Setup

### Step 1: Clone Repository
```bash
cd /path/to/project
git clone <repository-url>
cd khmer-sign-language-platform
```

### Step 2: Set Up Backend

```bash
cd backend

# Create a virtual environment and activate it
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

cd ..
```

### Step 3: Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install

cd ..
```

### Step 4: Start PostgreSQL (Docker)

From the project root:
```bash
# Start PostgreSQL container
docker compose up -d

# Verify it's running
docker compose ps

# Test connection
cd backend && source venv/bin/activate
python test_db_connection.py
cd ..
```

**Database Credentials:**
```
Username: admin
Password: admin
Database: khmer_sign_db
Host: localhost
Port: 5432
```

---

## 🎯 Running the Application

### Terminal 1: Start Backend
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Backend URL:** http://localhost:8000

### Terminal 2: Start Next.js Frontend
```bash
cd frontend
npm run dev
```

This starts the **Next.js development server** with hot reload.

**Frontend URL:** http://localhost:3000

### Using the Start Script (Optional)
```bash
bash start.sh
```

---

## 🗄️ Database

### PostgreSQL Setup
- **Image:** `postgres:17-alpine`
- **Container:** `khmer_sign_postgres`
- **Port:** 5432
- **Credentials:** See Environment Variables
- **Data Persistence:** Docker volume `postgres_data`

### Database Commands

```bash
# Start PostgreSQL
docker compose up -d

# Stop PostgreSQL
docker compose down

# View logs
docker compose logs -f postgres

# Connect to database CLI
docker compose exec postgres psql -U admin -d khmer_sign_db

# Stop and remove all data
docker compose down -v
```

---

## 📝 Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql://admin:admin@localhost:5432/khmer_sign_db
SECRET_KEY=your_super_secret_random_string_change_this_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📚 API Documentation

Once backend is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Current Endpoints
- `GET /` - Health check endpoint

---

## 🔄 Development Workflow

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

## 📦 Frontend Dependencies Overview

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

## 🔐 Security Notes

- ⚠️ Never commit `.env` files with real secrets
- ⚠️ Change `SECRET_KEY` in production
- ⚠️ Use environment variables for all sensitive data
- ✅ JWT tokens expire after 30 minutes (configurable)

---

## 🚧 Development Status

**Current Sprint:** Sprint 1.1 - Infrastructure & Environment ✅

**Completed:**
- ✅ Backend infrastructure setup
- ✅ Frontend setup with Next.js & MUI
- ✅ Docker PostgreSQL configuration
- ✅ Environment variables
- ✅ CORS configuration

**Next:** Sprint 1.2 - Authentication & User Models

---

## 📞 Support

For issues or questions:
1. Check existing documentation in `docs.local/`
2. Review sprint checklists
3. Check Docker setup guides

---

## 📄 License

This project is part of the CADT Internship Program.

---

**Last Updated:** May 12, 2026  
**Project Version:** 0.1.0
