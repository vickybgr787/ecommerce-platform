from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="User Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/users")
def get_users():
    return [
        {
            "id": 1,
            "name": "Vikram Danu",
            "email": "vikram@example.com",
            "status": "ACTIVE"
        },
        {
            "id": 2,
            "name": "John Smith",
            "email": "john@example.com",
            "status": "ACTIVE"
        },
        {
            "id": 3,
            "name": "Alice Brown",
            "email": "alice@example.com",
            "status": "ACTIVE"
        }
    ]