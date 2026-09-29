from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from kafka import KafkaProducer
import json
import os
import time

app = FastAPI(title="Order Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

KAFKA_BOOTSTRAP_SERVERS = os.getenv(
    "KAFKA_BOOTSTRAP_SERVERS",
    "kafka:9092"
)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://ecommerce:ecommerce@postgres:5432/ecommerce"
)

engine = create_engine(DATABASE_URL)

producer = None


def initialize_kafka():
    global producer

    for attempt in range(10):
        try:
            producer = KafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda value: json.dumps(value).encode("utf-8")
            )
            print("Connected to Kafka", flush=True)
            return

        except Exception as e:
            print(
                f"Kafka connection attempt {attempt + 1} failed: {e}",
                flush=True
            )
            time.sleep(3)

    print("Kafka connection failed after 10 attempts", flush=True)


@app.on_event("startup")
def startup_event():
    initialize_kafka()


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
            "kafka": "connected" if producer else "disconnected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "kafka": "connected" if producer else "disconnected",
            "error": str(e)
        }


@app.get("/orders")
def get_orders():
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT id, user_id, product, quantity, amount, status
                FROM orders
                ORDER BY id
            """)
        )

        orders = [
            {
                "id": row.id,
                "user_id": row.user_id,
                "product": row.product,
                "quantity": row.quantity,
                "amount": float(row.amount),
                "status": row.status
            }
            for row in result
        ]

    return orders


@app.post("/orders")
def create_order():
    with engine.begin() as connection:
        result = connection.execute(
            text("""
                INSERT INTO orders (
                    user_id,
                    product,
                    quantity,
                    amount,
                    status
                )
                VALUES (
                    :user_id,
                    :product,
                    :quantity,
                    :amount,
                    :status
                )
                RETURNING id, user_id, product, quantity, amount, status
            """),
            {
                "user_id": 1,
                "product": "Laptop",
                "quantity": 1,
                "amount": 1200,
                "status": "CONFIRMED"
            }
        )

        row = result.fetchone()

    order = {
        "id": row.id,
        "user_id": row.user_id,
        "product": row.product,
        "quantity": row.quantity,
        "amount": float(row.amount),
        "status": row.status
    }

    event = {
        "event_type": "order.created",
        "order": order
    }

    if producer:
        producer.send("orders", value=event)
        producer.flush()
        print(
            f"Published order.created event for order {order['id']}",
            flush=True
        )

    return {
        "message": "Order created",
        "order": order,
        "event": "order.created"
    }
