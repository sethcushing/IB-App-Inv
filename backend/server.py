from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import pandas as pd
import io
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# App password (for gate access)
APP_PASSWORD = os.environ.get('APP_PASSWORD', 'CompassX')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ AUTH ============

class PasswordVerify(BaseModel):
    password: str

@api_router.post("/auth/verify")
async def verify_password(body: PasswordVerify):
    if body.password == APP_PASSWORD:
        return {"authenticated": True}
    raise HTTPException(status_code=401, detail="Invalid password")

# ============ ADMIN SEED ============

@api_router.post("/admin/seed-production")
async def seed_production_data():
    """Seed the database from bundled seed_data.json if empty"""
    count = await db.applications.count_documents({})
    if count > 0:
        return {"message": f"Database already has {count} applications. Skipping seed.", "seeded": False}
    
    seed_file = ROOT_DIR / "seed_data.json"
    if not seed_file.exists():
        raise HTTPException(status_code=404, detail="Seed data file not found")
    
    with open(seed_file) as f:
        apps = json.load(f)
    
    if apps:
        await db.applications.insert_many(apps)
    
    return {"message": f"Seeded {len(apps)} applications", "seeded": True}

# ============ MODELS ============

class ApplicationCreate(BaseModel):
    title: str
    status: Optional[str] = "Active"
    functional_category: Optional[str] = None
    capabilities: Optional[str] = None
    short_description: Optional[str] = None
    data_sources: Optional[str] = None
    vendor: Optional[str] = None
    labels: Optional[str] = None
    notes: Optional[str] = None
    users_with_sso_access: Optional[int] = 0
    users_logging_in_via_sso: Optional[int] = 0
    provisioned_users: Optional[int] = 0
    engaged_users: Optional[int] = 0
    contract_annual_spend: Optional[float] = 0
    fiscal_ytd_expense_total: Optional[float] = 0
    prev_fiscal_year_expense_total: Optional[float] = 0
    cost_center_primary: Optional[str] = None
    cost_centers: Optional[List[str]] = []
    product_owner_name: Optional[str] = None
    business_pm: Optional[str] = None
    support_lead: Optional[str] = None
    lead_architect: Optional[str] = None
    security_contact: Optional[str] = None
    legal_contact: Optional[str] = None
    procurement_contact: Optional[str] = None
    general_contact: Optional[str] = None
    deployment_model: Optional[str] = None
    app_type: Optional[str] = None
    is_custom: Optional[bool] = False
    is_saas: Optional[bool] = False
    is_on_premise: Optional[bool] = False
    is_iaas_paas: Optional[bool] = False
    primary_functional_area: Optional[str] = None

class ApplicationUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    functional_category: Optional[str] = None
    capabilities: Optional[str] = None
    short_description: Optional[str] = None
    data_sources: Optional[str] = None
    vendor: Optional[str] = None
    labels: Optional[str] = None
    notes: Optional[str] = None
    users_with_sso_access: Optional[int] = None
    users_logging_in_via_sso: Optional[int] = None
    provisioned_users: Optional[int] = None
    engaged_users: Optional[int] = None
    contract_annual_spend: Optional[float] = None
    fiscal_ytd_expense_total: Optional[float] = None
    prev_fiscal_year_expense_total: Optional[float] = None
    cost_center_primary: Optional[str] = None
    cost_centers: Optional[List[str]] = None
    product_owner_name: Optional[str] = None
    business_pm: Optional[str] = None
    support_lead: Optional[str] = None
    lead_architect: Optional[str] = None
    security_contact: Optional[str] = None
    legal_contact: Optional[str] = None
    procurement_contact: Optional[str] = None
    general_contact: Optional[str] = None
    deployment_model: Optional[str] = None
    app_type: Optional[str] = None
    is_custom: Optional[bool] = None
    is_saas: Optional[bool] = None
    is_on_premise: Optional[bool] = None
    is_iaas_paas: Optional[bool] = None
    primary_functional_area: Optional[str] = None

class RequestCreate(BaseModel):
    app_id: str
    request_type: str
    to_role: str
    to_name: Optional[str] = None
    to_email: Optional[str] = None
    message: str
    priority: str = "Medium"
    due_date: Optional[str] = None

class RequestUpdate(BaseModel):
    status: Optional[str] = None
    response_notes: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None

# ============ HELPERS ============

def parse_currency(value) -> float:
    """Parse currency string to float"""
    if value is None or pd.isna(value):
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = re.sub(r'[^\d.\-]', '', value.replace(',', ''))
        try:
            return float(cleaned) if cleaned else 0.0
        except ValueError:
            return 0.0
    return 0.0

def parse_int(value) -> int:
    """Parse value to int"""
    if value is None or pd.isna(value):
        return 0
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return 0

def infer_deployment_type(vendor: str, title: str) -> str:
    """Infer deployment type from vendor/title hints"""
    cloud_hints = ['aws', 'azure', 'gcp', 'google cloud', 'saas', 'cloud', 'salesforce', 'workday', 'servicenow', 'zoom', 'slack', 'microsoft 365', 'o365', 'dropbox', 'box', 'okta']
    on_prem_hints = ['on-premise', 'on-prem', 'server', 'local', 'hosted']
    
    search_text = f"{vendor or ''} {title or ''}".lower()
    
    for hint in cloud_hints:
        if hint in search_text:
            return "Cloud"
    for hint in on_prem_hints:
        if hint in search_text:
            return "On-Prem"
    return "Unknown"

# ============ APPLICATIONS ROUTES ============

@api_router.get("/applications")
async def get_applications(
    search: Optional[str] = None,
    status: Optional[str] = None,
    functional_category: Optional[str] = None,
    cost_center: Optional[str] = None,
    vendor: Optional[str] = None,
    deployment_model: Optional[str] = None,
    app_type: Optional[str] = None,
    primary_functional_area: Optional[str] = None,
    sort_by: Optional[str] = "title",
    sort_order: Optional[str] = "asc",
    skip: int = 0,
    limit: int = 100
):
    query = {}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"vendor": {"$regex": search, "$options": "i"}}
        ]
    if status:
        query["status"] = status
    if functional_category:
        query["functional_category"] = functional_category
    if cost_center:
        query["cost_center_primary"] = cost_center
    if vendor:
        query["vendor"] = vendor
    if deployment_model:
        query["deployment_model"] = deployment_model
    if app_type:
        query["app_type"] = app_type
    if primary_functional_area:
        query["primary_functional_area"] = primary_functional_area
    
    sort_direction = 1 if sort_order == "asc" else -1
    
    cursor = db.applications.find(query, {"_id": 0}).sort(sort_by, sort_direction).skip(skip).limit(limit)
    applications = await cursor.to_list(length=limit)
    total = await db.applications.count_documents(query)
    
    return {"applications": applications, "total": total}

@api_router.get("/applications/{app_id}")
async def get_application(app_id: str):
    app = await db.applications.find_one({"app_id": app_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app

@api_router.post("/applications")
async def create_application(app: ApplicationCreate):
    # Check for duplicate by title (case-insensitive)
    existing = await db.applications.find_one(
        {"title": {"$regex": f"^{re.escape(app.title)}$", "$options": "i"}},
        {"_id": 0, "app_id": 1, "title": 1}
    )
    if existing:
        raise HTTPException(
            status_code=409, 
            detail=f"Application '{existing['title']}' already exists"
        )
    
    app_id = str(uuid.uuid4())
    app_doc = app.model_dump()
    app_doc["app_id"] = app_id
    app_doc["last_updated"] = datetime.now(timezone.utc).isoformat()
    
    await db.applications.insert_one(app_doc)
    return {"app_id": app_id, "message": "Application created"}

@api_router.put("/applications/{app_id}")
async def update_application(app_id: str, update: ApplicationUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["last_updated"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.applications.update_one({"app_id": app_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application updated"}

@api_router.delete("/applications/{app_id}")
async def delete_application(app_id: str):
    result = await db.applications.delete_one({"app_id": app_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application deleted"}

# ============ REQUESTS ROUTES ============

@api_router.get("/requests")
async def get_requests(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    app_id: Optional[str] = None
):
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if app_id:
        query["app_id"] = app_id
    
    requests = await db.requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"requests": requests}

@api_router.get("/requests/{request_id}")
async def get_request(request_id: str):
    req = await db.requests.find_one({"request_id": request_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req

@api_router.post("/requests")
async def create_request(req: RequestCreate):
    app = await db.applications.find_one({"app_id": req.app_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    request_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    req_doc = req.model_dump()
    req_doc["request_id"] = request_id
    req_doc["app_title"] = app.get("title", "")
    req_doc["status"] = "Draft"
    req_doc["created_at"] = now
    req_doc["updated_at"] = now
    req_doc["created_by"] = "user"
    req_doc["response_notes"] = None
    
    await db.requests.insert_one(req_doc)
    return {"request_id": request_id, "message": "Request created"}

@api_router.put("/requests/{request_id}")
async def update_request(request_id: str, update: RequestUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.requests.update_one({"request_id": request_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "Request updated"}

@api_router.post("/requests/{request_id}/send")
async def send_request(request_id: str):
    """Mark request as sent (in-app only, no actual email)"""
    result = await db.requests.update_one(
        {"request_id": request_id},
        {"$set": {"status": "Sent", "sent_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "Request sent"}

# ============ DASHBOARD ROUTES ============

@api_router.get("/dashboard/kpis")
async def get_dashboard_kpis(
    search: Optional[str] = None,
    status: Optional[str] = None,
    functional_category: Optional[str] = None,
    cost_center: Optional[str] = None,
    vendor: Optional[str] = None
):
    query = {}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"vendor": {"$regex": search, "$options": "i"}}
        ]
    if status:
        query["status"] = status
    if functional_category:
        query["functional_category"] = functional_category
    if cost_center:
        query["cost_center_primary"] = cost_center
    if vendor:
        query["vendor"] = vendor
    
    apps = await db.applications.find(query, {"_id": 0}).to_list(10000)
    
    total_apps = len(apps)
    total_contract_spend = sum(a.get("contract_annual_spend", 0) or 0 for a in apps)
    total_ytd_expense = sum(a.get("fiscal_ytd_expense_total", 0) or 0 for a in apps)
    total_engaged_users = sum(a.get("engaged_users", 0) or 0 for a in apps)
    
    # Count Active vs Inactive
    active_count = sum(1 for a in apps if a.get("status") == "Active")
    inactive_count = sum(1 for a in apps if a.get("status") == "Inactive")
    
    return {
        "total_apps": total_apps,
        "total_contract_spend": total_contract_spend,
        "total_ytd_expense": total_ytd_expense,
        "total_engaged_users": total_engaged_users,
        "active_apps": active_count,
        "inactive_apps": inactive_count
    }

@api_router.get("/dashboard/spend-by-category")
async def get_spend_by_category():
    pipeline = [
        {"$match": {"functional_category": {"$ne": None, "$ne": ""}}},
        {"$group": {
            "_id": "$functional_category",
            "total_spend": {"$sum": "$contract_annual_spend"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"total_spend": -1}},
        {"$limit": 10}
    ]
    results = await db.applications.aggregate(pipeline).to_list(10)
    return [{"category": r["_id"], "total_spend": r["total_spend"], "count": r["count"]} for r in results]

@api_router.get("/dashboard/apps-by-category")
async def get_apps_by_category():
    pipeline = [
        {"$match": {"functional_category": {"$ne": None, "$ne": ""}}},
        {"$group": {
            "_id": "$functional_category",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    results = await db.applications.aggregate(pipeline).to_list(10)
    return [{"category": r["_id"], "count": r["count"]} for r in results]

@api_router.get("/dashboard/spend-by-cost-center")
async def get_spend_by_cost_center():
    pipeline = [
        {"$match": {"cost_center_primary": {"$ne": None, "$ne": ""}}},
        {"$group": {
            "_id": "$cost_center_primary",
            "total_spend": {"$sum": "$contract_annual_spend"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"total_spend": -1}},
        {"$limit": 10}
    ]
    results = await db.applications.aggregate(pipeline).to_list(10)
    return [{"cost_center": r["_id"], "total_spend": r["total_spend"], "count": r.get("count", 0)} for r in results]

@api_router.get("/dashboard/users-by-category")
async def get_users_by_category():
    pipeline = [
        {"$match": {"functional_category": {"$ne": None, "$ne": ""}}},
        {"$group": {
            "_id": "$functional_category",
            "total_engaged": {"$sum": "$engaged_users"},
            "total_provisioned": {"$sum": "$provisioned_users"},
            "total_sso": {"$sum": "$users_logging_in_via_sso"}
        }},
        {"$sort": {"total_engaged": -1}},
        {"$limit": 10}
    ]
    results = await db.applications.aggregate(pipeline).to_list(10)
    return [{"category": r["_id"], "total_engaged": r["total_engaged"], "total_provisioned": r.get("total_provisioned", 0), "total_sso": r.get("total_sso", 0)} for r in results]

@api_router.get("/dashboard/custom-vs-cots")
async def get_custom_vs_cots():
    pipeline = [
        {"$group": {
            "_id": {"$ifNull": ["$app_type", "COTS"]},
            "count": {"$sum": 1},
            "total_spend": {"$sum": {"$ifNull": ["$contract_annual_spend", 0]}}
        }},
        {"$sort": {"count": -1}}
    ]
    results = await db.applications.aggregate(pipeline).to_list(10)
    return [{"type": r["_id"], "count": r["count"], "total_spend": r["total_spend"]} for r in results]

@api_router.get("/dashboard/deployment-model")
async def get_deployment_model():
    pipeline = [
        {"$group": {
            "_id": {"$ifNull": ["$deployment_model", "Unknown"]},
            "count": {"$sum": 1},
            "total_spend": {"$sum": {"$ifNull": ["$contract_annual_spend", 0]}}
        }},
        {"$sort": {"count": -1}}
    ]
    results = await db.applications.aggregate(pipeline).to_list(10)
    return [{"model": r["_id"], "count": r["count"], "total_spend": r["total_spend"]} for r in results]

@api_router.get("/dashboard/apps-by-functional-area")
async def get_apps_by_functional_area():
    pipeline = [
        {"$match": {"primary_functional_area": {"$nin": [None, ""]}}},
        {"$group": {
            "_id": "$primary_functional_area",
            "count": {"$sum": 1},
            "total_spend": {"$sum": {"$ifNull": ["$contract_annual_spend", 0]}}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 15}
    ]
    results = await db.applications.aggregate(pipeline).to_list(15)
    return [{"area": r["_id"], "count": r["count"], "total_spend": r["total_spend"]} for r in results]

@api_router.get("/dashboard/high-spend-low-engagement")
async def get_high_spend_low_engagement(
    spend_threshold: float = 50000,
    engagement_threshold: int = 100
):
    query = {
        "contract_annual_spend": {"$gte": spend_threshold},
        "engaged_users": {"$lte": engagement_threshold}
    }
    
    apps = await db.applications.find(query, {"_id": 0}).sort("contract_annual_spend", -1).to_list(20)
    return apps

@api_router.get("/dashboard/executive-summary")
async def get_executive_summary():
    apps = await db.applications.find({}, {"_id": 0}).to_list(10000)
    
    total_apps = len(apps)
    total_spend = sum(a.get("contract_annual_spend", 0) or 0 for a in apps)
    total_engaged = sum(a.get("engaged_users", 0) or 0 for a in apps)
    total_provisioned = sum(a.get("provisioned_users", 0) or 0 for a in apps)
    
    deployment_counts = {"Cloud": 0, "On-Prem": 0, "Hybrid": 0, "Unknown": 0}
    for app in apps:
        dt = app.get("deployment_type", "Unknown")
        if dt in deployment_counts:
            deployment_counts[dt] += 1
    
    category_spend = {}
    for app in apps:
        cat = app.get("functional_category") or "Uncategorized"
        category_spend[cat] = category_spend.get(cat, 0) + (app.get("contract_annual_spend", 0) or 0)
    top_categories = sorted(category_spend.items(), key=lambda x: x[1], reverse=True)[:3]
    
    missing_owner = sum(1 for a in apps if not a.get("product_owner_name"))
    high_spend_low_engage = sum(1 for a in apps if (a.get("contract_annual_spend", 0) or 0) > 50000 and (a.get("engaged_users", 0) or 0) < 100)
    
    summary_parts = [
        f"Portfolio Overview: {total_apps} applications with ${total_spend:,.0f} in annual contract spend.",
    ]
    if top_categories:
        summary_parts.append(f"Top spend: {', '.join([f'{c[0]} (${c[1]:,.0f})' for c in top_categories[:2]])}.")
    summary_parts.append(f"Deployment: {deployment_counts['Cloud']} Cloud, {deployment_counts['On-Prem']} On-Prem, {deployment_counts['Unknown']} Unknown.")
    if high_spend_low_engage > 0:
        summary_parts.append(f"⚠️ {high_spend_low_engage} apps need review (high spend, low engagement).")
    if missing_owner > 0:
        summary_parts.append(f"📋 {missing_owner} apps missing owner.")
    
    return {
        "summary": " ".join(summary_parts),
        "metrics": {
            "total_apps": total_apps,
            "total_spend": total_spend,
            "total_engaged": total_engaged,
            "total_provisioned": total_provisioned,
            "deployment_counts": deployment_counts,
            "missing_owner_count": missing_owner,
            "high_spend_low_engage_count": high_spend_low_engage
        }
    }

@api_router.get("/dashboard/yoy/{app_id}")
async def get_yoy_trends(app_id: str):
    """Get Year-over-Year trend data for a specific application"""
    app = await db.applications.find_one({"app_id": app_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Generate simulated YoY data based on current values
    # In production, this would come from historical data storage
    current_spend = app.get("contract_annual_spend", 0) or 0
    prev_spend = app.get("prev_fiscal_year_expense_total", current_spend * 0.9) or current_spend * 0.9
    current_users = app.get("engaged_users", 0) or 0
    
    base_spend = max(prev_spend * 0.7, 1000)
    base_users = max(int(current_users * 0.5), 5)
    
    import random
    years = ['2020', '2021', '2022', '2023', '2024']
    trends = []
    
    for idx, year in enumerate(years):
        growth_factor = 1 + (idx * 0.15) + (random.random() * 0.1 - 0.05)
        user_growth = 1 + (idx * 0.2) + (random.random() * 0.15 - 0.075)
        
        trends.append({
            "year": year,
            "spend": round(base_spend * growth_factor),
            "users": round(base_users * user_growth),
            "ytd_expense": round(base_spend * growth_factor * 0.75),
        })
    
    # Calculate YoY changes
    if len(trends) >= 2:
        current = trends[-1]
        previous = trends[-2]
        spend_change = ((current["spend"] - previous["spend"]) / previous["spend"] * 100) if previous["spend"] > 0 else 0
        users_change = ((current["users"] - previous["users"]) / previous["users"] * 100) if previous["users"] > 0 else 0
    else:
        spend_change = 0
        users_change = 0
    
    return {
        "app_id": app_id,
        "title": app.get("title"),
        "trends": trends,
        "yoy_changes": {
            "spend_change_percent": round(spend_change, 1),
            "users_change_percent": round(users_change, 1)
        },
        "note": "Trend data is simulated for demonstration. Connect to historical data source for actual values."
    }

# ============ FILTER OPTIONS ============

@api_router.get("/filters/options")
async def get_filter_options():
    statuses = await db.applications.distinct("status")
    categories = await db.applications.distinct("functional_category")
    vendors = await db.applications.distinct("vendor")
    cost_centers = await db.applications.distinct("cost_center_primary")
    deployment_models = await db.applications.distinct("deployment_model")
    app_types = await db.applications.distinct("app_type")
    functional_areas = await db.applications.distinct("primary_functional_area")
    
    return {
        "statuses": [s for s in statuses if s],
        "categories": [c for c in categories if c],
        "vendors": [v for v in vendors if v],
        "cost_centers": [c for c in cost_centers if c],
        "deployment_models": [d for d in deployment_models if d],
        "app_types": [a for a in app_types if a],
        "functional_areas": [f for f in functional_areas if f]
    }

# ============ AI CAPABILITY SCANNER ============

class CapabilityScanRequest(BaseModel):
    app_id: str
    
class OverlappingApp(BaseModel):
    app_id: str
    title: str
    vendor: Optional[str]
    capabilities: Optional[str]
    similarity_reason: str
    overlap_score: int  # 1-100

@api_router.post("/ai/scan-capabilities")
async def scan_overlapping_capabilities(request: CapabilityScanRequest):
    """Use AI to find applications with overlapping capabilities"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Get the target application
    target_app = await db.applications.find_one({"app_id": request.app_id}, {"_id": 0})
    if not target_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    target_capabilities = target_app.get("capabilities") or target_app.get("short_description") or ""
    target_category = target_app.get("functional_category") or ""
    target_title = target_app.get("title", "")
    
    if not target_capabilities and not target_category:
        return {
            "target_app": target_title,
            "overlapping_apps": [],
            "analysis_summary": "No capabilities or category defined for this application. Please add capability information to enable overlap detection."
        }
    
    # Get all other applications with capabilities
    other_apps = await db.applications.find(
        {"app_id": {"$ne": request.app_id}},
        {"_id": 0, "app_id": 1, "title": 1, "vendor": 1, "capabilities": 1, 
         "short_description": 1, "functional_category": 1}
    ).to_list(length=500)
    
    if not other_apps:
        return {
            "target_app": target_title,
            "overlapping_apps": [],
            "analysis_summary": "No other applications in the inventory to compare."
        }
    
    # Build comparison data
    apps_summary = []
    for app in other_apps:
        cap = app.get("capabilities") or app.get("short_description") or ""
        cat = app.get("functional_category") or ""
        if cap or cat:
            apps_summary.append({
                "id": app["app_id"],
                "title": app["title"],
                "vendor": app.get("vendor"),
                "capabilities": cap[:200] if cap else "",
                "category": cat
            })
    
    if not apps_summary:
        return {
            "target_app": target_title,
            "overlapping_apps": [],
            "analysis_summary": "No other applications have capability information to compare."
        }
    
    # Build AI prompt
    apps_text = "\n".join([
        f"- ID: {a['id']}, Title: {a['title']}, Category: {a['category']}, Capabilities: {a['capabilities'][:150]}"
        for a in apps_summary[:50]  # Limit to 50 apps for context
    ])
    
    prompt = f"""Analyze the following target application and identify other applications with overlapping or similar capabilities.

TARGET APPLICATION:
- Title: {target_title}
- Category: {target_category}
- Capabilities: {target_capabilities[:300]}

OTHER APPLICATIONS IN INVENTORY:
{apps_text}

Your task:
1. Identify applications that have overlapping, similar, or redundant capabilities with the target application
2. For each overlapping app, provide:
   - The app ID
   - A brief reason for the overlap (1 sentence)
   - An overlap score from 1-100 (100 = identical capabilities, 50 = moderate overlap, 10 = slight similarity)

Respond in this exact JSON format:
{{
  "overlapping_apps": [
    {{"app_id": "...", "similarity_reason": "...", "overlap_score": 85}},
    ...
  ],
  "summary": "Brief analysis summary (1-2 sentences)"
}}

Only include apps with overlap_score >= 30. Return empty array if no significant overlaps found."""

    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"capability-scan-{request.app_id}",
            system_message="You are an IT portfolio analyst expert at identifying redundant and overlapping software applications. Respond only with valid JSON."
        ).with_model("openai", "gpt-4o-mini")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse AI response
        import json
        try:
            # Extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                result = json.loads(json_match.group())
            else:
                result = {"overlapping_apps": [], "summary": "Unable to parse AI response"}
        except json.JSONDecodeError:
            result = {"overlapping_apps": [], "summary": "AI response parsing error"}
        
        # Enrich results with full app data
        enriched_overlaps = []
        for overlap in result.get("overlapping_apps", []):
            app_data = next((a for a in apps_summary if a["id"] == overlap.get("app_id")), None)
            if app_data:
                enriched_overlaps.append({
                    "app_id": app_data["id"],
                    "title": app_data["title"],
                    "vendor": app_data.get("vendor"),
                    "capabilities": app_data.get("capabilities", ""),
                    "similarity_reason": overlap.get("similarity_reason", ""),
                    "overlap_score": overlap.get("overlap_score", 0)
                })
        
        # Sort by overlap score
        enriched_overlaps.sort(key=lambda x: x["overlap_score"], reverse=True)
        
        return {
            "target_app": target_title,
            "target_capabilities": target_capabilities[:200],
            "overlapping_apps": enriched_overlaps[:10],  # Top 10
            "analysis_summary": result.get("summary", "Analysis complete.")
        }
        
    except Exception as e:
        logger.error(f"AI capability scan error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


@api_router.post("/ai/portfolio-heatmap")
async def generate_portfolio_heatmap():
    """Generate AI-powered C-Suite executive heatmap analysis of entire portfolio"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    import json
    
    # Get all applications with relevant data
    apps = await db.applications.find(
        {},
        {"_id": 0, "app_id": 1, "title": 1, "vendor": 1, "capabilities": 1, 
         "short_description": 1, "functional_category": 1, "contract_annual_spend": 1,
         "fiscal_ytd_expense_total": 1, "engaged_users": 1, "provisioned_users": 1,
         "deployment_type": 1, "status": 1}
    ).to_list(length=500)
    
    if not apps:
        raise HTTPException(status_code=404, detail="No applications found in portfolio")
    
    # Calculate portfolio statistics
    total_spend = sum(app.get("contract_annual_spend", 0) or 0 for app in apps)
    total_users = sum(app.get("engaged_users", 0) or 0 for app in apps)
    
    # Build condensed app summaries for AI analysis
    apps_summary = []
    for app in apps:
        cap = app.get("capabilities") or app.get("short_description") or ""
        spend = app.get("contract_annual_spend", 0) or 0
        users = app.get("engaged_users", 0) or 0
        apps_summary.append({
            "id": app["app_id"],
            "title": app["title"],
            "vendor": app.get("vendor", "Unknown"),
            "category": app.get("functional_category", "Uncategorized"),
            "capabilities": cap[:150] if cap else "No capabilities listed",
            "spend": spend,
            "users": users,
            "deployment": app.get("deployment_type", "Unknown")
        })
    
    # Sort by spend for priority analysis
    apps_summary.sort(key=lambda x: x["spend"], reverse=True)
    
    # Build AI prompt - focus on top 100 apps by spend for context limits
    top_apps = apps_summary[:100]
    apps_text = "\n".join([
        f"- {a['title']} | {a['vendor']} | {a['category']} | ${a['spend']:,.0f}/yr | {a['users']} users | {a['capabilities'][:80]}"
        for a in top_apps
    ])
    
    prompt = f"""You are a C-Suite IT Portfolio Advisor analyzing a software portfolio for executive decision-making.

PORTFOLIO OVERVIEW:
- Total Applications: {len(apps)}
- Total Annual Spend: ${total_spend:,.0f}
- Total Engaged Users: {total_users:,}

TOP APPLICATIONS BY SPEND:
{apps_text}

Analyze this portfolio and provide an EXECUTIVE-LEVEL assessment in this exact JSON format:

{{
  "executive_summary": "2-3 sentence C-Suite summary of portfolio health and key concerns",
  
  "overlap_clusters": [
    {{
      "cluster_name": "Name for this overlap group (e.g., 'CRM & Sales Tools')",
      "severity": "high|medium|low",
      "apps": ["App1", "App2", "App3"],
      "combined_spend": 150000,
      "recommendation": "1 sentence consolidation recommendation",
      "potential_savings": 50000
    }}
  ],
  
  "consolidation_opportunities": [
    {{
      "title": "Opportunity name",
      "apps_involved": ["App1", "App2"],
      "current_spend": 200000,
      "estimated_savings": 80000,
      "effort": "low|medium|high",
      "rationale": "Why consolidate"
    }}
  ],
  
  "risk_areas": [
    {{
      "risk_type": "single_point_of_failure|vendor_concentration|security|compliance",
      "severity": "critical|high|medium",
      "description": "Brief risk description",
      "affected_apps": ["App1"],
      "mitigation": "Recommended action"
    }}
  ],
  
  "underutilized_high_cost": [
    {{
      "app_title": "App name",
      "annual_spend": 100000,
      "engaged_users": 5,
      "cost_per_user": 20000,
      "recommendation": "Action to take"
    }}
  ],
  
  "category_breakdown": [
    {{
      "category": "IT",
      "app_count": 50,
      "total_spend": 5000000,
      "overlap_risk": "high|medium|low"
    }}
  ],
  
  "action_items": [
    {{
      "priority": 1,
      "action": "Immediate action recommendation",
      "impact": "high|medium",
      "estimated_savings": 100000
    }}
  ]
}}

Focus on:
1. Finding REAL capability overlaps where consolidation makes business sense
2. Identifying apps with high spend but low user engagement
3. Vendor concentration risks
4. Actionable recommendations with estimated savings
5. Be specific with app names and numbers"""

    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"portfolio-heatmap-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            system_message="You are a senior IT portfolio strategist providing C-Suite level analysis. Be specific, actionable, and data-driven. Respond only with valid JSON."
        ).with_model("openai", "gpt-4o")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse AI response
        try:
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                result = json.loads(json_match.group())
            else:
                result = {"error": "Unable to parse AI response"}
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            result = {"error": "AI response parsing error"}
        
        # Add metadata
        result["metadata"] = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_apps_analyzed": len(apps),
            "total_portfolio_spend": total_spend,
            "total_engaged_users": total_users
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Portfolio heatmap analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


# ============ IMPORT ROUTES ============

@api_router.post("/import/upload")
async def import_file(file: UploadFile = File(...)):
    """Import Excel or CSV file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    content = await file.read()
    
    try:
        if file.filename.endswith('.xlsx') or file.filename.endswith('.xls'):
            df = pd.read_excel(io.BytesIO(content))
        elif file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use Excel (.xlsx, .xls) or CSV (.csv)")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
    
    column_map = {
        "Title": "title",
        "App_status": "status",
        "Functional_category": "functional_category",
        "Capabilities": "capabilities",
        "Short_description": "short_description",
        "Data_sources": "data_sources",
        "Vendor": "vendor",
        "App_labels": "labels",
        "App_notes": "notes",
        "Users_with_SSO_access": "users_with_sso_access",
        "Users_logging_in_via_SSO": "users_logging_in_via_sso",
        "Provisioned_users": "provisioned_users",
        "Engaged_users": "engaged_users",
        "Contract_annual_spend": "contract_annual_spend",
        "Fiscal_YTD_expense_Total": "fiscal_ytd_expense_total",
        "Prev_fiscal_year_expense_Total": "prev_fiscal_year_expense_total",
        "cost_center": "cost_center_primary",
        "Cost_Centers": "cost_centers",
        "IT_Product_Manager": "product_owner_name",
        "IT_contact": "it_contact",
        "Security_contact": "security_contact",
        "Legal_contact": "legal_contact",
        "Procurement_contact": "procurement_contact",
        "Vendor_contact": "vendor_contact",
        "Contact": "general_contact",
        "Application_ID": "original_app_id"
    }
    
    imported_count = 0
    errors = []
    
    for idx, row in df.iterrows():
        try:
            app_doc = {
                "app_id": str(uuid.uuid4()),
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
            
            for excel_col, db_col in column_map.items():
                if excel_col in df.columns:
                    value = row.get(excel_col)
                    if pd.isna(value):
                        value = None
                    
                    if db_col in ["contract_annual_spend", "fiscal_ytd_expense_total", "prev_fiscal_year_expense_total"]:
                        app_doc[db_col] = parse_currency(value)
                    elif db_col in ["users_with_sso_access", "users_logging_in_via_sso", "provisioned_users", "engaged_users"]:
                        app_doc[db_col] = parse_int(value)
                    elif db_col == "cost_centers" and value:
                        app_doc[db_col] = [c.strip() for c in str(value).split(",") if c.strip()]
                    else:
                        app_doc[db_col] = str(value) if value else None
            
            app_doc["deployment_type"] = infer_deployment_type(
                app_doc.get("vendor", ""),
                app_doc.get("title", "")
            )
            
            if not app_doc.get("title"):
                continue
            
            app_doc.setdefault("status", "unknown")
            app_doc.setdefault("users_with_sso_access", 0)
            app_doc.setdefault("users_logging_in_via_sso", 0)
            app_doc.setdefault("provisioned_users", 0)
            app_doc.setdefault("engaged_users", 0)
            app_doc.setdefault("contract_annual_spend", 0)
            app_doc.setdefault("fiscal_ytd_expense_total", 0)
            app_doc.setdefault("prev_fiscal_year_expense_total", 0)
            app_doc.setdefault("cost_centers", [])
            
            await db.applications.insert_one(app_doc)
            imported_count += 1
            
        except Exception as e:
            errors.append(f"Row {idx + 2}: {str(e)}")
    
    return {
        "message": f"Import completed. {imported_count} applications imported.",
        "imported_count": imported_count,
        "total_rows": len(df),
        "errors": errors[:10] if errors else []
    }

@api_router.delete("/import/clear")
async def clear_data():
    """Clear all applications (for re-import)"""
    result = await db.applications.delete_many({})
    await db.requests.delete_many({})
    return {"message": f"Cleared {result.deleted_count} applications and all requests"}

@api_router.get("/import/template")
async def get_template():
    """Return expected column headers for CSV template"""
    headers = [
        "Title", "App_status", "Functional_category", "Capabilities", "Short_description",
        "Data_sources", "Vendor", "App_labels", "App_notes",
        "Users_with_SSO_access", "Users_logging_in_via_SSO", "Provisioned_users", "Engaged_users",
        "Contract_annual_spend", "Fiscal_YTD_expense_Total", "Prev_fiscal_year_expense_Total",
        "cost_center", "IT_Product_Manager", "IT_contact", "Security_contact",
        "Legal_contact", "Procurement_contact", "Vendor_contact", "Contact"
    ]
    return {"headers": headers, "sample_row": {h: "" for h in headers}}

# ============ SEED DATA ============

@api_router.post("/seed")
async def seed_sample_data():
    """Generate sample data if database is empty"""
    count = await db.applications.count_documents({})
    if count > 0:
        return {"message": f"Database already has {count} applications. Clear first to reseed."}
    
    sample_apps = [
        {"title": "Salesforce CRM", "vendor": "Salesforce", "functional_category": "Sales Engagement", "deployment_type": "Cloud", "contract_annual_spend": 4817879, "engaged_users": 850, "status": "approved", "product_owner_name": "John Smith", "cost_center_primary": "Sales Operations"},
        {"title": "Microsoft 365", "vendor": "Microsoft", "functional_category": "Productivity", "deployment_type": "Cloud", "contract_annual_spend": 1589780, "engaged_users": 2500, "status": "approved", "product_owner_name": "Jane Doe", "cost_center_primary": "IT"},
        {"title": "Workday HCM", "vendor": "Workday", "functional_category": "Human Resources", "deployment_type": "Cloud", "contract_annual_spend": 980000, "engaged_users": 450, "status": "approved", "product_owner_name": "Mike Johnson", "cost_center_primary": "HR"},
        {"title": "ServiceNow ITSM", "vendor": "ServiceNow", "functional_category": "IT Service Management", "deployment_type": "Cloud", "contract_annual_spend": 750000, "engaged_users": 300, "status": "approved", "product_owner_name": "Sarah Wilson", "cost_center_primary": "IT"},
        {"title": "SAP ERP", "vendor": "SAP", "functional_category": "Finance & Accounting", "deployment_type": "Hybrid", "contract_annual_spend": 2100000, "engaged_users": 180, "status": "approved", "product_owner_name": "Robert Brown", "cost_center_primary": "Finance"},
    ]
    
    for app in sample_apps:
        app["app_id"] = str(uuid.uuid4())
        app["last_updated"] = datetime.now(timezone.utc).isoformat()
        app.setdefault("users_with_sso_access", app.get("engaged_users", 0) + 50)
        app.setdefault("users_logging_in_via_sso", app.get("engaged_users", 0))
        app.setdefault("provisioned_users", app.get("engaged_users", 0) + 100)
        app.setdefault("fiscal_ytd_expense_total", app.get("contract_annual_spend", 0) * 0.75)
        app.setdefault("prev_fiscal_year_expense_total", app.get("contract_annual_spend", 0) * 0.9)
        app.setdefault("cost_centers", [])
        
    await db.applications.insert_many(sample_apps)
    
    return {"message": f"Seeded {len(sample_apps)} sample applications"}

# ============ MAIN ============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve React static files in production (when build exists)
from starlette.staticfiles import StaticFiles
from starlette.responses import FileResponse

static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir / "static")), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        """Serve React app for all non-API routes"""
        file_path = static_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(static_dir / "index.html"))

@app.on_event("startup")
async def auto_seed():
    """Auto-seed database on startup if empty"""
    count = await db.applications.count_documents({})
    if count == 0:
        seed_file = ROOT_DIR / "seed_data.json"
        if seed_file.exists():
            with open(seed_file) as f:
                apps = json.load(f)
            if apps:
                await db.applications.insert_many(apps)
            logger.info(f"Auto-seeded {len(apps)} applications into empty database")
        else:
            logger.warning("Database is empty and no seed_data.json found")
    else:
        logger.info(f"Database already has {count} applications")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
