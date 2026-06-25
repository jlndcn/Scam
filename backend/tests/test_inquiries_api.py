"""Tests for inquiry creation/listing endpoints and core validation behavior."""

import os
from pathlib import Path

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


class TestInquiriesAPI:
    """Core /api/inquiries behavior: valid submit, list, and invalid payload handling."""

    def test_create_inquiry_success_and_data_values(self, api_client, api_base_url):
        payload = {
            "email": "qa.test.inquiry@example.com",
            "business_phone": "+491700001234",
            "package_type": "monthly",
            "additional_numbers": "+491700009876",
            "name_company": "TEST_QA GmbH",
            "accept_guarantee_terms": True,
        }

        response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data.get("id"), str)
        assert data["email"] == payload["email"]
        assert data["business_phone"] == payload["business_phone"]
        assert data["package_type"] == payload["package_type"]
        assert data["additional_numbers"] == payload["additional_numbers"]
        assert data["name_company"] == payload["name_company"]
        assert data["accept_guarantee_terms"] is True
        assert data["status"] == "payment_request_pending"
        assert isinstance(data.get("created_at"), str)

    def test_get_inquiries_contains_recently_created_item(self, api_client, api_base_url):
        seed_payload = {
            "email": "qa.list.verify@example.com",
            "business_phone": "+491700002222",
            "package_type": "lifetime",
            "additional_numbers": "",
            "name_company": "TEST_List Check",
            "accept_guarantee_terms": True,
        }
        create_response = api_client.post(f"{api_base_url}/api/inquiries", json=seed_payload)
        assert create_response.status_code == 200
        created_id = create_response.json()["id"]

        list_response = api_client.get(f"{api_base_url}/api/inquiries")
        assert list_response.status_code == 200

        items = list_response.json()
        assert isinstance(items, list)
        assert len(items) > 0

        matched = next((item for item in items if item.get("id") == created_id), None)
        assert matched is not None
        assert matched["email"] == seed_payload["email"]
        assert matched["package_type"] == seed_payload["package_type"]

    def test_create_inquiry_rejects_false_terms(self, api_client, api_base_url):
        payload = {
            "email": "qa.false.terms@example.com",
            "business_phone": "+491700003333",
            "package_type": "monthly",
            "additional_numbers": "",
            "name_company": "TEST_False Terms",
            "accept_guarantee_terms": False,
        }

        response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
        assert response.status_code == 400

        data = response.json()
        assert "detail" in data
        assert "Garantiebedingungen" in data["detail"]

    def test_create_inquiry_rejects_invalid_email(self, api_client, api_base_url):
        payload = {
            "email": "invalid-email-format",
            "business_phone": "+491700004444",
            "package_type": "monthly",
            "additional_numbers": "",
            "name_company": "TEST_Invalid Email",
            "accept_guarantee_terms": True,
        }

        response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
        assert response.status_code == 422

        data = response.json()
        assert "detail" in data
        assert isinstance(data["detail"], list)

    def test_create_inquiry_rejects_missing_package_type(self, api_client, api_base_url):
        payload = {
            "email": "qa.no.package@example.com",
            "business_phone": "+491700005555",
            "additional_numbers": "",
            "name_company": "TEST_No Package",
            "accept_guarantee_terms": True,
        }

        response = api_client.post(f"{api_base_url}/api/inquiries", json=payload)
        assert response.status_code == 422

        data = response.json()
        assert "detail" in data
        assert isinstance(data["detail"], list)
