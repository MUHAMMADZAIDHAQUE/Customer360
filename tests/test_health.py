"""Tests for Customer360 Health Check endpoint."""

from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_health_check_status_code():
    """Verify GET /health returns 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_check_payload():
    """Verify GET /health returns operational health status payload."""
    response = client.get("/health")
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    assert data["model_loaded"] is True
    assert "version" in data


def test_root_endpoint():
    """Verify GET / returns project metadata and status operational."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Customer360"
    assert data["status"] == "operational"
