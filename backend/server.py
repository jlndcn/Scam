from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, model_validator
from pydantic import EmailStr
from typing import List, Literal, Optional
import uuid
from datetime import datetime, timezone
import smtplib
from email.message import EmailMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


class InquiryRequestCreate(BaseModel):
    email: EmailStr
    business_account_name: str = Field(min_length=2, max_length=140)
    phone_numbers: List[str] = Field(min_length=1)
    package_type: Literal["monthly", "lifetime"]

    @model_validator(mode="after")
    def validate_form_data(self):
        cleaned_numbers = [number.strip() for number in self.phone_numbers if number and number.strip()]

        if not cleaned_numbers:
            raise ValueError("Mindestens eine betroffene Rufnummer ist erforderlich.")

        max_allowed = 5 if self.package_type == "monthly" else 3
        if len(cleaned_numbers) > max_allowed:
            raise ValueError(
                f"Für das gewählte Paket sind maximal {max_allowed} Rufnummern erlaubt."
            )

        for number in cleaned_numbers:
            if len(number) < 6 or len(number) > 30:
                raise ValueError("Jede Rufnummer muss zwischen 6 und 30 Zeichen lang sein.")

        self.phone_numbers = cleaned_numbers
        return self


class InquiryRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    business_account_name: str
    phone_numbers: List[str]
    package_type: Literal["monthly", "lifetime"]
    processing_status: Literal["new_request"] = "new_request"
    email_delivery_status: Literal["sent", "pending"] = "pending"
    status: Literal["payment_request_pending"] = "payment_request_pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def send_inquiry_email(inquiry: InquiryRequest) -> bool:
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = os.environ.get("SMTP_PORT")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    smtp_from = os.environ.get("SMTP_FROM")
    receiver = os.environ.get("INQUIRY_RECEIVER_EMAIL")

    if not all([smtp_host, smtp_port, smtp_from, receiver]):
        logger.warning("SMTP nicht vollständig konfiguriert: Anfrage wurde nur gespeichert.")
        return False

    try:
        port = int(smtp_port)
    except (TypeError, ValueError):
        logger.exception("SMTP_PORT ist ungültig: %s", smtp_port)
        return False

    timestamp = inquiry.created_at.isoformat()
    checkbox_yes = "Ja"

    email_body = (
        "Neue Anfrage über Landingpage\n\n"
        f"Zeitpunkt: {timestamp}\n"
        f"E-Mail-Adresse: {inquiry.email}\n"
        f"WhatsApp Business Account Name: {inquiry.business_account_name}\n"
        f"Rufnummer(n): {', '.join(inquiry.phone_numbers)}\n"
        f"Gewünschtes Paket: {inquiry.package_type}\n"
        f"Status: {checkbox_yes}\n"
    )

    message = EmailMessage()
    message["Subject"] = "Neue Anfrage: WhatsApp Business / API-Service"
    message["From"] = smtp_from
    message["To"] = receiver
    message.set_content(email_body)

    try:
        if port == 465:
            with smtplib.SMTP_SSL(smtp_host, port, timeout=20) as server:
                if smtp_user and smtp_password:
                    server.login(smtp_user, smtp_password)
                server.send_message(message)
        else:
            with smtplib.SMTP(smtp_host, port, timeout=20) as server:
                server.ehlo()
                if port in (587, 25):
                    server.starttls()
                    server.ehlo()
                if smtp_user and smtp_password:
                    server.login(smtp_user, smtp_password)
                server.send_message(message)

        return True
    except Exception:
        logger.exception("E-Mail-Versand fehlgeschlagen. Anfrage bleibt gespeichert.")
        return False

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


@api_router.post("/inquiries", response_model=InquiryRequest)
async def create_inquiry_request(input_data: InquiryRequestCreate):
    inquiry_obj = InquiryRequest(**input_data.model_dump())

    db_doc = inquiry_obj.model_dump()
    db_doc["created_at"] = db_doc["created_at"].isoformat()
    db_doc["email_delivery_status"] = "pending"

    await db.inquiry_requests.insert_one(db_doc)

    email_sent = send_inquiry_email(inquiry_obj)
    email_status = "sent" if email_sent else "pending"

    await db.inquiry_requests.update_one(
        {"id": inquiry_obj.id},
        {"$set": {"email_delivery_status": email_status}}
    )

    return InquiryRequest(
        **{
            **inquiry_obj.model_dump(),
            "email_delivery_status": email_status,
        }
    )


@api_router.get("/inquiries", response_model=List[InquiryRequest])
async def list_inquiry_requests():
    inquiries = await db.inquiry_requests.find({}, {"_id": 0}).to_list(1000)

    normalized_items = []
    for inquiry in inquiries:
        if "phone_numbers" not in inquiry:
            fallback_numbers = []
            primary = inquiry.get("business_phone")
            additional = inquiry.get("additional_numbers")

            if isinstance(primary, str) and primary.strip():
                fallback_numbers.append(primary.strip())

            if isinstance(additional, str) and additional.strip():
                split_additional = [num.strip() for num in additional.split(",") if num.strip()]
                fallback_numbers.extend(split_additional)

            inquiry["phone_numbers"] = fallback_numbers

        inquiry.setdefault("name_company", "Nicht angegeben")
        inquiry.setdefault("business_account_name", "Nicht angegeben")
        inquiry.setdefault("phone_numbers", [])
        inquiry.setdefault("processing_status", "new_request")
        inquiry.setdefault("email_delivery_status", "pending")

        if isinstance(inquiry.get("created_at"), str):
            inquiry["created_at"] = datetime.fromisoformat(inquiry["created_at"])

        inquiry.pop("business_phone", None)
        inquiry.pop("additional_numbers", None)
        inquiry.pop("business_numbers", None)
        inquiry.pop("accept_guarantee_terms", None)
        inquiry.pop("estimated_volume", None)
        inquiry.pop("project_message", None)
        inquiry.pop("confirm_business_account_exists", None)
        inquiry.pop("confirm_privacy_visibility_settings", None)
        inquiry.pop("confirm_payment_delivery_process_understood", None)
        inquiry.pop("confirm_no_independent_changes", None)
        inquiry.pop("name_company", None)
        normalized_items.append(InquiryRequest(**inquiry))

    normalized_items.sort(key=lambda item: item.created_at, reverse=True)
    return normalized_items

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()