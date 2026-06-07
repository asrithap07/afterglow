from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Any, Dict

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = "HS256"

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

app = FastAPI()
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
api = APIRouter(prefix="/api")


# ---------- helpers ----------
def hash_pw(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_pw(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def make_access(uid: str, email: str) -> str:
    return jwt.encode({"sub": uid, "email": email, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}, JWT_SECRET, algorithm=JWT_ALGO)

async def current_user(request: Request) -> Dict[str, Any]:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(401, "User not found")
        user.pop("_id", None); user.pop("password_hash", None)
        return user
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")


# ---------- models ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ScrapbookIn(BaseModel):
    title: str
    description: Optional[str] = ""
    cover_style: str = "polkadot"  # polkadot | rainbow | iridescent | glitter

class ScrapbookUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_style: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = None

class HomeItemUpdate(BaseModel):
    items: List[Dict[str, Any]]


# ---------- auth ----------
@api.post("/auth/register")
async def register(data: RegisterIn, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    uid = str(uuid.uuid4())
    doc = {"id": uid, "email": email, "name": data.name or email.split("@")[0],
           "password_hash": hash_pw(data.password),
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.users.insert_one(doc)
    token = make_access(uid, email)
    response.set_cookie("access_token", token, httponly=True, samesite="lax", max_age=604800, path="/")
    return {"id": uid, "email": email, "name": doc["name"], "token": token}

@api.post("/auth/login")
async def login(data: LoginIn, response: Response):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_pw(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = make_access(user["id"], email)
    response.set_cookie("access_token", token, httponly=True, samesite="lax", max_age=604800, path="/")
    return {"id": user["id"], "email": email, "name": user.get("name"), "token": token}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user=Depends(current_user)):
    return user


# ---------- uploads ----------
@api.post("/upload")
async def upload_photo(file: UploadFile = File(...), user=Depends(current_user)):
    ext = (file.filename or "img").split(".")[-1].lower()
    if ext not in {"jpg", "jpeg", "png", "gif", "webp", "heic"}:
        ext = "jpg"
    fname = f"{user['id']}_{uuid.uuid4().hex}.{ext}"
    path = UPLOAD_DIR / fname
    content = await file.read()
    path.write_bytes(content)
    return {"url": f"/uploads/{fname}", "filename": fname}


# ---------- scrapbooks ----------
@api.get("/scrapbooks")
async def list_scrapbooks(user=Depends(current_user)):
    rows = await db.scrapbooks.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return rows

@api.post("/scrapbooks")
async def create_scrapbook(data: ScrapbookIn, user=Depends(current_user)):
    sid = str(uuid.uuid4())
    doc = {"id": sid, "user_id": user["id"], "title": data.title,
           "description": data.description, "cover_style": data.cover_style,
           "items": [], "created_at": datetime.now(timezone.utc).isoformat()}
    await db.scrapbooks.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/scrapbooks/{sid}")
async def get_scrapbook(sid: str, user=Depends(current_user)):
    row = await db.scrapbooks.find_one({"id": sid, "user_id": user["id"]}, {"_id": 0})
    if not row:
        raise HTTPException(404, "Not found")
    return row

@api.put("/scrapbooks/{sid}")
async def update_scrapbook(sid: str, data: ScrapbookUpdate, user=Depends(current_user)):
    patch = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not patch:
        raise HTTPException(400, "No changes")
    res = await db.scrapbooks.update_one({"id": sid, "user_id": user["id"]}, {"$set": patch})
    if res.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}

@api.delete("/scrapbooks/{sid}")
async def delete_scrapbook(sid: str, user=Depends(current_user)):
    await db.scrapbooks.delete_one({"id": sid, "user_id": user["id"]})
    return {"ok": True}


# ---------- home canvas (each user has one) ----------
@api.get("/home")
async def get_home(user=Depends(current_user)):
    row = await db.home_canvases.find_one({"user_id": user["id"]}, {"_id": 0})
    if not row:
        row = {"user_id": user["id"], "items": []}
        await db.home_canvases.insert_one(dict(row))
    return row

@api.put("/home")
async def update_home(data: HomeItemUpdate, user=Depends(current_user)):
    await db.home_canvases.update_one(
        {"user_id": user["id"]},
        {"$set": {"items": data.items}},
        upsert=True,
    )
    return {"ok": True}


# ---------- seed demo data on first login ----------
@api.post("/seed-demo")
async def seed_demo(user=Depends(current_user)):
    existing = await db.scrapbooks.count_documents({"user_id": user["id"]})
    if existing > 0:
        return {"ok": True, "skipped": True}
    demos = [
        {"title": "summer 2025", "cover_style": "polkadot", "description": "beach days + golden hour"},
        {"title": "nyc trip", "cover_style": "rainbow", "description": "concrete & coffee"},
        {"title": "senior year", "cover_style": "iridescent", "description": "the last one"},
        {"title": "birthday weekend", "cover_style": "glitter", "description": "💗"},
    ]
    for d in demos:
        await db.scrapbooks.insert_one({
            "id": str(uuid.uuid4()), "user_id": user["id"],
            "items": [], "created_at": datetime.now(timezone.utc).isoformat(), **d,
        })
    return {"ok": True}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.scrapbooks.create_index([("user_id", 1)])
    await db.home_canvases.create_index("user_id", unique=True)
