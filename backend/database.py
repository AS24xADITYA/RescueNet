import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Expecting the user to set DATABASE_URL or we default to a local rescue_net db
# For local dev, ensure PostgreSQL is running and a database named 'rescue_net' exists.
# postgresql://user:password@localhost/dbname
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:AS24%40postgres@localhost:5432/rescue_net"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
