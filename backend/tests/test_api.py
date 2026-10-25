from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api_contract_and_error():
    paths = ["/api/v1/health", "/api/v1/meta", "/api/v1/forecast/decision-view?delivery_date=2026-01-15&cutoff=09:00", "/api/v1/accuracy/summary", "/api/v1/accuracy/daily", "/api/v1/accuracy/by-horizon", "/api/v1/accuracy/error-distribution"]
    assert all(client.get(path).status_code == 200 for path in paths)
    invalid = client.get("/api/v1/forecast/decision-view?delivery_date=2026-02-01")
    assert invalid.status_code == 400
    assert set(invalid.json()) == {"error"}

def test_after_cutoff_is_not_selected():
    response = client.get("/api/v1/forecast/decision-view?delivery_date=2026-01-15&cutoff=09:00")
    assert response.status_code == 200
    assert all(row["publish_time"] is None or row["publish_time"] <= "2026-01-14T09:00:00+00:00" for row in response.json()["rows"])
