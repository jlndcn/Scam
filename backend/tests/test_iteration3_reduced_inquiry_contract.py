"""Iteration 3 regression tests: reduced inquiry payload contract + core API availability."""

import os
from pathlib import Path
from uuid import uuid4

import pytest
import requests
from dotenv import load_dotenv


# Module: environment setup for public preview base URL
FRONTEND_ENV_PATH = Path("/app/frontend/.env")
if FRONTEND_ENV_PATH.exists():
    load_dotenv(FRONTEND_ENV_PATH)

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")


@pytest.fixture(scope="session")
def api_base_url() -> str:
    if not BASE_URL:
        pytest.fail("REACT_APP_BACKEND_URL is not set")
    return BASE_URL.rstrip("/")


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def _email(prefix: str) -> str:
    return f"{prefix}.{uuid4().hex[:10]}@example.com"


# Module: API availability
def test_api_root_reachable(api_client, api_base_url):
    response = api_client.get(f"{api_base_url}/api/")
    assert response.status_code == 200
    data = response.json()
    assert data.get("message") == "Hello World"


# Module: reduced inquiry contract submission
def test_create_inquiry_reduced_payload_success_and_persistence(api_client, api_base_url):
    payload = {
        "email": _email("qa.iter3.reduced"),
        "business_account_name": "TEST Iteration3 Business",
        "phone_numbers": ["+491700771001", "+491700771002"],
        "package_type": "monthly",
    }

    create_response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
    assert create_response.status_code == 200

    created = create_response.json()
    assert created["email"] == payload["email"]
    assert created["business_account_name"] == payload["business_account_name"]
    assert created["phone_numbers"] == payload["phone_numbers"]
    assert created["package_type"] == payload["package_type"]
    assert created["processing_status"] == "new_request"
    assert created["status"] == "payment_request_pending"
    assert created["email_delivery_status"] in ["sent", "pending"]
    assert isinstance(created.get("id"), str)

    list_response = api_client.get(f"{api_base_url}/api/inquiries")
    assert list_response.status_code == 200
    inquiries = list_response.json()
    saved = next((item for item in inquiries if item.get("id") == created["id"]), None)
    assert saved is not None
    assert saved["email"] == payload["email"]
    assert saved["business_account_name"] == payload["business_account_name"]
    assert saved["phone_numbers"] == payload["phone_numbers"]
    assert saved["package_type"] == payload["package_type"]


# Module: required fields validation
def test_create_inquiry_rejects_missing_business_account_name(api_client, api_base_url):
    payload = {
        "email": _email("qa.iter3.missing.accountname"),
        "phone_numbers": ["+491700772001"],
        "package_type": "monthly",
    }

    response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
    assert response.status_code == 422
    detail = response.json().get("detail")
    assert isinstance(detail, list)


# Module: package-based number limits
def test_create_inquiry_rejects_lifetime_above_3_numbers(api_client, api_base_url):
    payload = {
        "email": _email("qa.iter3.lifetime.over"),
        "business_account_name": "TEST Lifetime Over",
        "phone_numbers": [
            "+491700773001",
            "+491700773002",
            "+491700773003",
            "+491700773004",
        ],
        "package_type": "lifetime",
    }

    response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
    assert response.status_code == 422
    assert "maximal 3 Rufnummern" in str(response.json().get("detail", ""))
