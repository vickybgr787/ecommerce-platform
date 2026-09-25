from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

producer = None

for attempt in range(10):
    try:
        producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda value: json.dumps(value).encode("utf-8")
        )
        print("Connected to Kafka")
        break
    except Exception as e:
        print(f"Kafka connection attempt {attempt + 1} failed: {e}")
        time.sleep(3)


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/orders")
def get_orders():
    return [
        {
            "id": 1,
            "product": "Laptop",
            "quantity": 1,
            "status": "CONFIRMED"
        },
        {
            "id": 2,
            "product": "Keyboard",
            "quantity": 2,
            "status": "PROCESSING"
        }
    ]


@app.post("/orders")
def create_order():
    order = {
        "id": 101,
        "product": "Laptop",
        "quantity": 1,
        "amount": 1200,
        "user_id": 1
    }

    event = {
        "event_type": "order.created",
        "order": order
    }

    if producer:
        producer.send("orders", value=event)
        producer.flush()

    return {
        "message": "Order created",
        "order": order,
        "event": "order.created"
    }
