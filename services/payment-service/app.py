from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from kafka import KafkaConsumer
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

payments = [
    {
        "id": 1,
        "order_id": 1,
        "user_id": 1,
        "amount": 1200,
        "currency": "EUR",
        "status": "SUCCESS"
    },
    {
        "id": 2,
        "order_id": 2,
        "user_id": 2,
        "amount": 80,
        "currency": "EUR",
        "status": "PENDING"
    },
    {
        "id": 3,
        "order_id": 3,
        "user_id": 3,
        "amount": 350,
        "currency": "EUR",
        "status": "FAILED"
    }
]


def process_order_event(event):
    if event.get("event_type") != "order.created":
        return

    order = event["order"]

    payment = {
        "id": len(payments) + 1,
        "order_id": order["id"],
        "user_id": order["user_id"],
        "amount": order["amount"],
        "currency": order.get("currency", "EUR"),
        "status": "SUCCESS"
    }

    payments.append(payment)

    print(
        f"Payment processed: order_id={order['id']}, "
        f"amount={order['amount']} EUR",
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
    return {"status": "healthy"}


@app.get("/payments")
def get_payments():
    return payments
