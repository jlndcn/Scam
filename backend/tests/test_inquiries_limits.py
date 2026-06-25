"""Tests for /api/inquiries package limits, validation, and persistence behavior."""

import os
from pathlib import Path
from uuid import uuid4

import pytest
import requests
from dotenv import load_dotenv


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
    return f"{prefix}.{uuid4().hex[:8]}@example.com"


def test_create_inquiry_monthly_with_5_numbers_success(api_client, api_base_url):
    payload = {
        "email": _email("qa.monthly"),
        "business_numbers": [
            "+491700001001",
            "+491700001002",
            "+491700001003",
            "+491700001004",
            "+491700001005",
        ],
        "package_type": "monthly",
        "name_company": "TEST_Monthly5",
        "accept_guarantee_terms": True,
    }

    response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["email"] == payload["email"]
    assert data["package_type"] == "monthly"
    assert data["business_numbers"] == payload["business_numbers"]
    assert len(data["business_numbers"]) == 5
    assert data["accept_guarantee_terms"] is True
    assert data["status"] == "payment_request_pending"

    list_response = api_client.get(f"{api_base_url}/api/inquiries")
    assert list_response.status_code == 200
    inquiries = list_response.json()
    saved = next((item for item in inquiries if item.get("id") == data["id"]), None)
    assert saved is not None
    assert saved["business_numbers"] == payload["business_numbers"]


def test_create_inquiry_monthly_rejects_more_than_5(api_client, api_base_url):
    payload = {
        "email": _email("qa.monthly.over"),
        "business_numbers": [
            "+491700002001",
            "+491700002002",
            "+491700002003",
            "+491700002004",
            "+491700002005",
            "+491700002006",
        ],
        "package_type": "monthly",
        "name_company": "TEST_MonthlyOver",
        "accept_guarantee_terms": True,
    }

    response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
    assert response.status_code == 422
    detail = str(response.json().get("detail", ""))
    assert "maximal 5 Rufnummern" in detail


def test_create_inquiry_lifetime_rejects_more_than_3(api_client, api_base_url):
    payload = {
        "email": _email("qa.life.over"),
        "business_numbers": [
            "+491700003001",
            "+491700003002",
            "+491700003003",
            "+491700003004",
        ],
        "package_type": "lifetime",
        "name_company": "TEST_LifetimeOver",
        "accept_guarantee_terms": True,
    }

    response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
    assert response.status_code == 422
    detail = str(response.json().get("detail", ""))
    assert "maximal 3 Rufnummern" in detail


def test_create_inquiry_rejects_false_terms(api_client, api_base_url):
    payload = {
        "email": _email("qa.terms.false"),
        "business_numbers": ["+491700004001"],
        "package_type": "monthly",
        "name_company": "TEST_Terms",
        "accept_guarantee_terms": False,
    }

    response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
    assert response.status_code == 400
    assert "Garantiebedingungen" in response.json().get("detail", "")


def test_create_inquiry_rejects_invalid_number_length(api_client, api_base_url):
    payload = {
        "email": _email("qa.num.invalid"),
        "business_numbers": ["123"],
        "package_type": "monthly",
        "name_company": "TEST_InvalidNum",
        "accept_guarantee_terms": True,
    }

    response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
    assert response.status_code == 422
    detail = str(response.json().get("detail", ""))
    assert "zwischen 6 und 30 Zeichen" in detail
