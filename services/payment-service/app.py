from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from kafka import KafkaConsumer
from sqlalchemy import create_engine, text
import json
import os
import threading

app = FastAPI(title="Payment Service")

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


def process_order_event(event):
    if event.get("event_type") != "order.created":
        return

    order = event["order"]

    try:
        with engine.begin() as connection:
            existing_payment = connection.execute(
                text("""
                    SELECT id
                    FROM payments
                    WHERE order_id = :order_id
                """),
                {
                    "order_id": order["id"]
                }
            ).fetchone()

            if existing_payment:
                print(
                    f"Payment already exists for order_id={order['id']}. "
                    f"Skipping duplicate event.",
                    flush=True
                )
                return

            result = connection.execute(
                text("""
                    INSERT INTO payments (
                        order_id,
                        user_id,
                        amount,
                        currency,
                        status
                    )
                    VALUES (
                        :order_id,
                        :user_id,
                        :amount,
                        :currency,
                        :status
                    )
                    RETURNING id, order_id, user_id, amount, currency, status
                """),
                {
                    "order_id": order["id"],
                    "user_id": order["user_id"],
                    "amount": order["amount"],
                    "currency": "EUR",
                    "status": "SUCCESS"
                }
            )

            payment = result.fetchone()

        print(
            f"Payment saved: payment_id={payment.id}, "
            f"order_id={payment.order_id}, "
            f"amount={payment.amount} EUR",
            flush=True
        )

    except Exception as e:
        print(
            f"Payment processing failed for "
            f"order_id={order['id']}: {e}",
            flush=True
        )


def consume_orders():
    print("Starting Payment Kafka consumer...", flush=True)

    consumer = KafkaConsumer(
        "orders",
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id="payment-service",
        auto_offset_reset="latest",
        enable_auto_commit=True,
        value_deserializer=lambda value: json.loads(value.decode("utf-8"))
    )

    print("Payment Service connected to Kafka", flush=True)

    for message in consumer:
        event = message.value

        print(
            f"Received Kafka event: {event}",
            flush=True
        )

        process_order_event(event)


@app.on_event("startup")
def start_kafka_consumer():
    thread = threading.Thread(
        target=consume_orders,
        daemon=True
    )
    thread.start()


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


@app.get("/payments")
def get_payments():
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT
                    id,
                    order_id,
                    user_id,
                    amount,
                    currency,
                    status
                FROM payments
                ORDER BY id
            """)
        )

        payments = [
            {
                "id": row.id,
                "order_id": row.order_id,
                "user_id": row.user_id,
                "amount": float(row.amount),
                "currency": row.currency,
                "status": row.status
            }
            for row in result
        ]

    return payments