from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app import app


client = TestClient(app)


def test_health():
    mock_connection = MagicMock()

    with patch("app.engine.connect") as mock_connect:
        mock_connect.return_value.__enter__.return_value = mock_connection

        response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["database"] == "connected"
