# Khmer Sign Language Platform - Backend

This is the backend service for the Khmer Sign Language Platform, built with [FastAPI](https://fastapi.tiangolo.com/).

## Prerequisites
- Python 3.10 or higher
- PostgreSQL running locally or via Docker Compose

## Setup Instructions

**1. Navigate to the backend directory**
```bash
cd backend
```

**2. Create a virtual environment**
```bash
python3 -m venv venv
```

**3. Activate the virtual environment**
- On Linux/macOS:
  ```bash
  source venv/bin/activate
  ```
- On Windows:
  ```bash
  venv\Scripts\activate
  ```

**4. Install dependencies**
```bash
pip install -r requirements.txt
```

**5. Environment Configuration**
Create a `.env` file in the `backend` directory. You will need to define your database connection and other required secrets:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```
*(Check the source code in `test_db_connection.py` or `.env` examples if available for the exact driver).*

For this repository, the usual local database URL is:
```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/khmer_sign_db
```

> **Note on OAuth Setup:** For detailed instructions on how to set up and retrieve the required credentials for Google, Facebook, and Telegram authentication, please refer to the [`REAL_OAUTH_SETUP.md`](./REAL_OAUTH_SETUP.md) guide.

**6. Test Database Connection (Optional)**
Verify that your backend can communicate with your configured database:
```bash
python test_db_connection.py
```

## Running the Server

You can run the development server via the provided shell script (on Linux/Mac) or manually using Uvicorn.

**Option A: Using the shell script**
```bash
bash run_server.sh
```

**Option B: Using Uvicorn directly**
```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Once running, the server will be available at: **http://localhost:8000**

### API Documentation
FastAPI automatically generates interactive API documentation. While the server is running, you can access these at:
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Project Structure Overview

- `src/main.py`: The main entry point of the FastAPI application.
- `src/routes/`: Contains API endpoint definitions (e.g., `oauth.py`).
- `src/services/`: Business logic and third-party integrations (Google, Facebook, Telegram OAuth).
- `src/models/`: SQLAlchemy database models.
- `src/schemas/`: Pydantic models for data validation (requests/responses).
- `src/db/`: Database connection and session management.
- `src/utils/`: Utility functions (JWT generation, password hashing, etc.).
- `postman/`: Postman collections for testing the API.

## Database Schema and Seed Workflow

Use Alembic when the schema changes:
```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

Use the seed utility when you need repeatable data import/export:
```bash
python seed_data/seed_database.py --export --output seed_data/seed_data.json
python seed_data/seed_database.py --output seed_data/seed_data.json
python seed_data/seed_database.py --output seed_data/seed_data.json --wipe
```

If you pull updates on another machine, the order should be:
1. start PostgreSQL
2. pull the latest code
3. run `alembic upgrade head`
4. import seed data only if you need shared reference/demo rows
5. start the backend
