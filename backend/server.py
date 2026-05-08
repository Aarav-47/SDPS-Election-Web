from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import io
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import openpyxl

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'sdps-election-secret-key-2026')
JWT_ALGO = 'HS256'

POSTS = [
    {"key": "head_boy", "title": "Head Boy"},
    {"key": "head_girl", "title": "Head Girl"},
    {"key": "sports_skipper", "title": "Sports Skipper"},
    {"key": "cultural_head", "title": "Cultural Head"},
    {"key": "discipline_head", "title": "Discipline Head"},
]
POST_KEYS = [p["key"] for p in POSTS]

app = FastAPI(title="SDPS Student Council Election")
api = APIRouter(prefix="/api")


# ---------- Models ----------
class Student(BaseModel):
    admission_no: str
    name: str
    father_name: str
    class_name: Optional[str] = ""

class Candidate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post: str
    name: str
    photo: str = ""           # data URI or external URL
    symbol: str = ""          # symbol name or emoji or icon key
    symbol_image: str = ""    # optional symbol image url/data uri

class CandidateCreate(BaseModel):
    post: str
    name: str
    photo: str = ""
    symbol: str = ""
    symbol_image: str = ""

class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    photo: Optional[str] = None
    symbol: Optional[str] = None
    symbol_image: Optional[str] = None
    post: Optional[str] = None

class Ballot(BaseModel):
    admission_no: str
    selections: Dict[str, str]   # { post_key: candidate_id }

class AdminLogin(BaseModel):
    username: str
    password: str


# ---------- Helpers ----------
def make_token(username: str) -> str:
    payload = {"sub": username, "exp": datetime.now(timezone.utc) + timedelta(hours=12)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def verify_admin(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        return payload["sub"]
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------- Seeding ----------
async def seed_data():
    # Admin user
    if not await db.admins.find_one({"username": "Aarav"}):
        pw_hash = bcrypt.hashpw("Krish@2026".encode(), bcrypt.gensalt()).decode()
        await db.admins.insert_one({"username": "Aarav", "password_hash": pw_hash})

    # Sample students (only if collection empty)
    if await db.students.count_documents({}) == 0:
        sample = [
            {"admission_no": "SDPS001", "name": "Aarav Sharma", "father_name": "Rajesh Sharma", "class_name": "XII-A"},
            {"admission_no": "SDPS002", "name": "Ishita Verma", "father_name": "Mahesh Verma", "class_name": "XII-A"},
            {"admission_no": "SDPS003", "name": "Krish Patel", "father_name": "Nikhil Patel", "class_name": "XII-B"},
            {"admission_no": "SDPS004", "name": "Saanvi Gupta", "father_name": "Anil Gupta", "class_name": "XI-A"},
            {"admission_no": "SDPS005", "name": "Vihaan Singh", "father_name": "Karan Singh", "class_name": "XI-B"},
            {"admission_no": "SDPS006", "name": "Ananya Iyer", "father_name": "Suresh Iyer", "class_name": "X-A"},
            {"admission_no": "SDPS007", "name": "Reyansh Mehta", "father_name": "Vivek Mehta", "class_name": "X-B"},
            {"admission_no": "SDPS008", "name": "Diya Joshi", "father_name": "Manoj Joshi", "class_name": "IX-A"},
        ]
        await db.students.insert_many(sample)

    # Demo candidates (4 per post) only if empty
    if await db.candidates.count_documents({}) == 0:
        photos = [
            "https://images.unsplash.com/photo-1693162274256-6bfe792b05e2?w=400&h=400&fit=crop",
            "https://images.unsplash.com/photo-1514960919797-5ff58c52e5ba?w=400&h=400&fit=crop",
            "https://images.unsplash.com/photo-1578390431312-f9ffd91de51b?w=400&h=400&fit=crop",
            "https://images.unsplash.com/photo-1596875422535-4267bf9495e0?w=400&h=400&fit=crop",
        ]
        symbols = ["Star", "Sun", "Book", "Tree"]
        seed_names = {
            "head_boy": ["Arjun Rao", "Kabir Khanna", "Dev Malhotra", "Yash Bhatt"],
            "head_girl": ["Riya Kapoor", "Meera Nair", "Tara Bose", "Nyra Shah"],
            "sports_skipper": ["Aditya Reddy", "Rohan Das", "Veer Sinha", "Ayaan Pillai"],
            "cultural_head": ["Aaradhya Jain", "Pari Mishra", "Zoya Ali", "Ira Chawla"],
            "discipline_head": ["Vivaan Bhatia", "Aarush Sethi", "Kian Roy", "Atharv Pandey"],
        }
        docs = []
        for pkey, names in seed_names.items():
            for i, nm in enumerate(names):
                docs.append({
                    "id": str(uuid.uuid4()),
                    "post": pkey,
                    "name": nm,
                    "photo": photos[i],
                    "symbol": symbols[i],
                    "symbol_image": "",
                })
        await db.candidates.insert_many(docs)


# ---------- Public/Student Routes ----------
@api.get("/")
async def root():
    return {"message": "SDPS Election API", "posts": POSTS}

@api.get("/posts")
async def list_posts():
    return POSTS

@api.get("/students/{admission_no}")
async def get_student(admission_no: str):
    s = await db.students.find_one({"admission_no": admission_no.strip()}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    voted = await db.votes.find_one({"admission_no": admission_no.strip()}, {"_id": 0})
    return {**s, "has_voted": bool(voted)}

@api.get("/votes/check/{admission_no}")
async def check_voted(admission_no: str):
    voted = await db.votes.find_one({"admission_no": admission_no.strip()}, {"_id": 0})
    return {"has_voted": bool(voted)}

@api.get("/candidates")
async def get_candidates(post: Optional[str] = None):
    q = {"post": post} if post else {}
    docs = await db.candidates.find(q, {"_id": 0}).to_list(1000)
    return docs

@api.post("/votes")
async def cast_vote(ballot: Ballot):
    adm = ballot.admission_no.strip()
    student = await db.students.find_one({"admission_no": adm}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    existing = await db.votes.find_one({"admission_no": adm})
    if existing:
        raise HTTPException(status_code=400, detail="Student has already voted")
    # Validate selections cover all posts
    missing = [p for p in POST_KEYS if p not in ballot.selections]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing votes for: {', '.join(missing)}")
    # Validate candidate ids
    for pkey, cid in ballot.selections.items():
        c = await db.candidates.find_one({"id": cid, "post": pkey})
        if not c:
            raise HTTPException(status_code=400, detail=f"Invalid candidate for {pkey}")
    doc = {
        "id": str(uuid.uuid4()),
        "admission_no": adm,
        "student_name": student["name"],
        "selections": ballot.selections,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.votes.insert_one(doc)
    doc.pop("_id", None)
    return {"ok": True, "vote_id": doc["id"]}


# ---------- Admin Routes ----------
@api.post("/admin/login")
async def admin_login(body: AdminLogin):
    user = await db.admins.find_one({"username": body.username})
    if not user or not bcrypt.checkpw(body.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": make_token(body.username), "username": body.username}

@api.get("/admin/students")
async def list_students(_: str = Depends(verify_admin)):
    docs = await db.students.find({}, {"_id": 0}).to_list(5000)
    voted_set = set()
    async for v in db.votes.find({}, {"_id": 0, "admission_no": 1}):
        voted_set.add(v["admission_no"])
    for d in docs:
        d["has_voted"] = d["admission_no"] in voted_set
    return docs

@api.post("/admin/students/upload")
async def upload_students(file: UploadFile = File(...), _: str = Depends(verify_admin)):
    content = await file.read()
    try:
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel file: {e}")
    if not rows:
        raise HTTPException(status_code=400, detail="Empty file")
    header = [str(c).strip().lower() if c else "" for c in rows[0]]
    # Find column indexes
    def idx(*names):
        for n in names:
            if n in header:
                return header.index(n)
        return -1
    i_adm = idx("admission_no", "admission no", "admission number", "adm_no", "adm no")
    i_name = idx("name", "student name", "student_name")
    i_father = idx("father_name", "father name", "father's name", "fathers name", "father")
    i_class = idx("class_name", "class", "class name")
    if i_adm < 0 or i_name < 0 or i_father < 0:
        raise HTTPException(status_code=400, detail="Header must include: admission_no, name, father_name (class_name optional)")
    inserted = 0
    updated = 0
    for r in rows[1:]:
        if not r or not r[i_adm]:
            continue
        adm = str(r[i_adm]).strip()
        doc = {
            "admission_no": adm,
            "name": str(r[i_name]).strip() if r[i_name] else "",
            "father_name": str(r[i_father]).strip() if r[i_father] else "",
            "class_name": str(r[i_class]).strip() if i_class >= 0 and r[i_class] else "",
        }
        res = await db.students.update_one({"admission_no": adm}, {"$set": doc}, upsert=True)
        if res.upserted_id:
            inserted += 1
        else:
            updated += 1
    return {"inserted": inserted, "updated": updated}

@api.delete("/admin/students/{admission_no}")
async def delete_student(admission_no: str, _: str = Depends(verify_admin)):
    res = await db.students.delete_one({"admission_no": admission_no})
    if not res.deleted_count:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}

@api.post("/admin/candidates")
async def create_candidate(body: CandidateCreate, _: str = Depends(verify_admin)):
    if body.post not in POST_KEYS:
        raise HTTPException(status_code=400, detail="Invalid post")
    cand = Candidate(**body.model_dump())
    await db.candidates.insert_one(cand.model_dump())
    return cand.model_dump()

@api.put("/admin/candidates/{cid}")
async def update_candidate(cid: str, body: CandidateUpdate, _: str = Depends(verify_admin)):
    upd = {k: v for k, v in body.model_dump().items() if v is not None}
    if "post" in upd and upd["post"] not in POST_KEYS:
        raise HTTPException(status_code=400, detail="Invalid post")
    res = await db.candidates.update_one({"id": cid}, {"$set": upd})
    if not res.matched_count:
        raise HTTPException(status_code=404, detail="Not found")
    doc = await db.candidates.find_one({"id": cid}, {"_id": 0})
    return doc

@api.delete("/admin/candidates/{cid}")
async def delete_candidate(cid: str, _: str = Depends(verify_admin)):
    res = await db.candidates.delete_one({"id": cid})
    if not res.deleted_count:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}

@api.get("/admin/stats")
async def stats(_: str = Depends(verify_admin)):
    candidates = await db.candidates.find({}, {"_id": 0}).to_list(2000)
    cand_map = {c["id"]: c for c in candidates}
    votes = await db.votes.find({}, {"_id": 0}).to_list(10000)
    students_total = await db.students.count_documents({})

    by_post: Dict[str, List[Dict]] = {p: [] for p in POST_KEYS}
    counts: Dict[str, int] = {}
    for v in votes:
        for pkey, cid in v.get("selections", {}).items():
            counts[cid] = counts.get(cid, 0) + 1

    for c in candidates:
        entry = {
            "candidate_id": c["id"],
            "name": c["name"],
            "photo": c.get("photo", ""),
            "symbol": c.get("symbol", ""),
            "votes": counts.get(c["id"], 0),
        }
        if c["post"] in by_post:
            by_post[c["post"]].append(entry)

    # winners (highest per post; tie -> first)
    winners = {}
    for pkey, lst in by_post.items():
        lst.sort(key=lambda x: x["votes"], reverse=True)
        winners[pkey] = lst[0] if lst else None

    return {
        "total_students": students_total,
        "total_voted": len(votes),
        "turnout_pct": round((len(votes) / students_total * 100), 1) if students_total else 0,
        "by_post": by_post,
        "winners": winners,
        "votes": [
            {
                "admission_no": v["admission_no"],
                "student_name": v.get("student_name", ""),
                "timestamp": v.get("timestamp", ""),
                "selections": {
                    pkey: cand_map.get(cid, {}).get("name", "Unknown")
                    for pkey, cid in v.get("selections", {}).items()
                },
            }
            for v in votes
        ],
    }


# Mount router
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    await seed_data()
    logger.info("SDPS Election API started; seeded data ready.")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
