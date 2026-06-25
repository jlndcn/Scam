"""Regression tests for landingpage-related API contract and persistence."""

import os
from pathlib import Path
from uuid import uuid4

import pytest
import requests
from dotenv import load_dotenv


# Load public backend URL from frontend env (required for preview-env testing)
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


# Status module tests
def test_status_create_and_list_persistence(api_client, api_base_url):
    create_payload = {"client_name": "TEST_LANDINGPAGE_QA"}
    create_response = api_client.post(f"{api_base_url}/api/status", json=create_payload)
    assert create_response.status_code == 200

    created = create_response.json()
    assert created["client_name"] == create_payload["client_name"]
    assert isinstance(created.get("id"), str)
    assert isinstance(created.get("timestamp"), str)

    list_response = api_client.get(f"{api_base_url}/api/status")
    assert list_response.status_code == 200
    status_items = list_response.json()
    match = next((item for item in status_items if item.get("id") == created["id"]), None)
    assert match is not None
    assert match["client_name"] == create_payload["client_name"]


# Inquiry module tests
def test_create_inquiry_success_and_persistence_with_full_payload(api_client, api_base_url):
    payload = {
        "name_company": "TEST_Company GmbH",
        "email": _email("qa.inquiry.ok"),
        "business_account_name": "TEST Support Account",
        "phone_numbers": ["+491700001111", "+491700001112"],
        "package_type": "monthly",
        "estimated_volume": "5000 Nachrichten / Tag",
        "project_message": "TEST Anfrage zur technischen Einbindung in bestehendes System.",
        "confirm_business_account_exists": True,
        "confirm_privacy_visibility_settings": True,
        "confirm_payment_delivery_process_understood": True,
        "confirm_no_independent_changes": True,
    }

    create_response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
    assert create_response.status_code == 200

    created = create_response.json()
    assert created["email"] == payload["email"]
    assert created["name_company"] == payload["name_company"]
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
    assert saved["phone_numbers"] == payload["phone_numbers"]


def test_create_inquiry_missing_confirmation_rejected(api_client, api_base_url):
    payload = {
        "name_company": "TEST_Company Confirm",
        "email": _email("qa.inquiry.confirm"),
        "business_account_name": "TEST Confirm Account",
        "phone_numbers": ["+491700001113"],
        "package_type": "monthly",
        "estimated_volume": "1000 / Tag",
        "project_message": "TEST Missing confirmation flow.",
        "confirm_business_account_exists": True,
        "confirm_privacy_visibility_settings": True,
        "confirm_payment_delivery_process_understood": True,
        "confirm_no_independent_changes": False,
    }

    response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
    assert response.status_code == 400
    assert "Bestätigungen" in response.json().get("detail", "")


def test_create_inquiry_monthly_number_limit_rejected(api_client, api_base_url):
    payload = {
        "name_company": "TEST_Company MonthlyLimit",
        "email": _email("qa.inquiry.monthly.limit"),
        "business_account_name": "TEST Monthly Limit",
        "phone_numbers": [
            "+491700001120",
            "+491700001121",
            "+491700001122",
            "+491700001123",
            "+491700001124",
            "+491700001125",
        ],
        "package_type": "monthly",
        "estimated_volume": "3000 / Tag",
        "project_message": "TEST monthly limit validation.",
        "confirm_business_account_exists": True,
        "confirm_privacy_visibility_settings": True,
        "confirm_payment_delivery_process_understood": True,
        "confirm_no_independent_changes": True,
    }

    response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
    assert response.status_code == 422
    assert "maximal 5 Rufnummern" in str(response.json().get("detail", ""))


def test_create_inquiry_lifetime_number_limit_rejected(api_client, api_base_url):
    payload = {
        "name_company": "TEST_Company LifetimeLimit",
        "email": _email("qa.inquiry.lifetime.limit"),
        "business_account_name": "TEST Lifetime Limit",
        "phone_numbers": [
            "+491700001130",
            "+491700001131",
            "+491700001132",
            "+491700001133",
        ],
        "package_type": "lifetime",
        "estimated_volume": "2000 / Tag",
        "project_message": "TEST lifetime limit validation.",
        "confirm_business_account_exists": True,
        "confirm_privacy_visibility_settings": True,
        "confirm_payment_delivery_process_understood": True,
        "confirm_no_independent_changes": True,
    }

    response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
    assert response.status_code == 422
    assert "maximal 3 Rufnummern" in str(response.json().get("detail", ""))


def test_smtp_missing_fallback_still_saves_request(api_client, api_base_url):
    payload = {
        "name_company": "TEST_Company SMTPFallback",
        "email": _email("qa.inquiry.smtp.fallback"),
        "business_account_name": "TEST SMTP Fallback",
        "phone_numbers": ["+491700001140"],
        "package_type": "monthly",
        "estimated_volume": "1200 / Tag",
        "project_message": "TEST fallback when SMTP config is missing.",
        "confirm_business_account_exists": True,
        "confirm_privacy_visibility_settings": True,
        "confirm_payment_delivery_process_understood": True,
        "confirm_no_independent_changes": True,
    }

    create_response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
    assert create_response.status_code == 200
    created = create_response.json()
    assert created["email"] == payload["email"]
    assert created["email_delivery_status"] == "pending"

    list_response = api_client.get(f"{api_base_url}/api/inquiries")
    assert list_response.status_code == 200
    inquiries = list_response.json()
    saved = next((item for item in inquiries if item.get("id") == created["id"]), None)
    assert saved is not None
    assert saved["email_delivery_status"] == "pending"
