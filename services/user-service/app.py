from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
import os

app = FastAPI(title="User Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://ecommerce:ecommerce@postgres:5432/ecommerce"
)

engine = create_engine(DATABASE_URL)


class UserCreate(BaseModel):
    name: str
    email: str
    status: str = "ACTIVE"


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


@app.get("/users")
def get_users():
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT id, name, email, status
                FROM users
                ORDER BY id
            """)
        )

        users = [
            {
                "id": row.id,
                "name": row.name,
                "email": row.email,
                "status": row.status
            }
            for row in result
        ]

    return users


@app.post("/users")
def create_user(user: UserCreate):
    with engine.begin() as connection:
        result = connection.execute(
            text("""
                INSERT INTO users (name, email, status)
                VALUES (:name, :email, :status)
                RETURNING id, name, email, status
            """),
            {
                "name": user.name,
                "email": user.email,
                "status": user.status
            }
        )

        row = result.fetchone()

    return {
        "id": row.id,
        "name": row.name,
        "email": row.email,
        "status": row.status
    }