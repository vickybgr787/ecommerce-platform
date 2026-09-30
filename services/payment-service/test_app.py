from unittest.mock import MagicMock, patch

from app import app, process_order_event


def test_process_order_event_creates_payment():
    mock_connection = MagicMock()

    existing_payment_result = MagicMock()
    existing_payment_result.fetchone.return_value = None

    inserted_payment = MagicMock()
    inserted_payment.id = 1
    inserted_payment.order_id = 101
    inserted_payment.user_id = 5
    inserted_payment.amount = 49.99

    insert_result = MagicMock()
    insert_result.fetchone.return_value = inserted_payment

    mock_connection.execute.side_effect = [
        existing_payment_result,
        insert_result,
    ]

    with patch("app.engine.begin") as mock_begin:
        mock_begin.return_value.__enter__.return_value = mock_connection

        event = {
            "event_type": "order.created",
            "order": {
                "id": 101,
                "user_id": 5,
                "amount": 49.99,
            },
        }

        process_order_event(event)

    assert mock_connection.execute.call_count == 2


def test_process_order_event_ignores_non_order_created_event():
    with patch("app.engine.begin") as mock_begin:
        event = {
            "event_type": "order.updated",
            "order": {
                "id": 101,
                "user_id": 5,
                "amount": 49.99,
            },
        }

        process_order_event(event)

    mock_begin.assert_not_called()
