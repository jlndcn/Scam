from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from pydantic import EmailStr
from typing import List, Literal, Optional
import uuid
from datetime import datetime, timezone


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
    business_phone: str = Field(min_length=6, max_length=30)
    package_type: Literal["monthly", "lifetime"]
    additional_numbers: Optional[str] = None
    name_company: Optional[str] = None
    accept_guarantee_terms: bool


class InquiryRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    business_phone: str
    package_type: Literal["monthly", "lifetime"]
    additional_numbers: Optional[str] = None
    name_company: Optional[str] = None
    accept_guarantee_terms: bool
    status: Literal["payment_request_pending"] = "payment_request_pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    if not input_data.accept_guarantee_terms:
        raise HTTPException(
            status_code=400,
            detail="Die Garantiebedingungen müssen akzeptiert werden."
        )

    inquiry_obj = InquiryRequest(**input_data.model_dump())

    db_doc = inquiry_obj.model_dump()
    db_doc["created_at"] = db_doc["created_at"].isoformat()

    await db.inquiry_requests.insert_one(db_doc)
    return inquiry_obj


@api_router.get("/inquiries", response_model=List[InquiryRequest])
async def list_inquiry_requests():
    inquiries = await db.inquiry_requests.find({}, {"_id": 0}).to_list(1000)

    normalized_items = []
    for inquiry in inquiries:
        if isinstance(inquiry.get("created_at"), str):
            inquiry["created_at"] = datetime.fromisoformat(inquiry["created_at"])
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