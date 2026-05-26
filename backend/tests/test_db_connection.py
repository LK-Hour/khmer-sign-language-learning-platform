"""
Database connection test and initialization script
"""
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file")
    sys.exit(1)

try:
    print(f"🔍 Testing connection to: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'database'}")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ PostgreSQL connection successful!")
        print(f"✅ Database is ready and accessible")
        
except Exception as e:
    print(f"❌ PostgreSQL connection failed: {e}")
    print("\n📝 Setup Instructions:")
    print("1. Ensure PostgreSQL is running on your system")
    print("2. Create a database: createdb khmer_sign_db")
    print("3. Update DATABASE_URL in .env file with correct credentials")
    sys.exit(1)
