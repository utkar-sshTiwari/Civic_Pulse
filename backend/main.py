import os
import uuid

from datetime import datetime, timedelta
from enum import Enum
from math import radians, sin, cos, sqrt, atan2

from fastapi import (
    FastAPI,
    Depends,
    Query,
    HTTPException,
    UploadFile,
    File,
    Form,
)

from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from jose import JWTError, jwt

from pydantic import BaseModel

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from models import (
    ComplaintAnalysis,
    UserCreate,
    Token,
)

from priority import (
    calculate_priority,
    get_department,
)

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    SECRET_KEY,
    ALGORITHM,
)

from db_models import Complaint, User

from database import (
    get_db,
    engine,
    Base,
)

from services.ai_service import analyze


# ============================================================
# AUTHENTICATION
# ============================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="CivicPulse API",
    description="AI-powered civic complaint prioritization system",
    version="0.1.0",
)


# ============================================================
# IMAGE STORAGE
# ============================================================

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True,
)

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# ENUMS / SCHEMAS
# ============================================================

class ComplaintStatus(str, Enum):
    pending = "pending"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus


class ComplaintResponse(BaseModel):
    id: int

    text: str

    image_url: str | None

    latitude: float
    longitude: float

    category: str

    severity: float
    urgency: float
    safety_risk: float
    public_impact: float

    priority_score: float

    department: str
    status: str

    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class DashboardStatistics(BaseModel):
    total_complaints: int
    pending: int
    assigned: int
    in_progress: int
    resolved: int


class ComplaintSort(str, Enum):
    priority = "priority"
    newest = "newest"
    oldest = "oldest"


class ComplaintDepartmentUpdate(BaseModel):
    department: str


# ============================================================
# GEO / DUPLICATE DETECTION
# ============================================================

def distance_meters(
    lat1,
    lon1,
    lat2,
    lon2,
):
    R = 6371000

    lat1 = radians(lat1)
    lat2 = radians(lat2)

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    return 2 * R * atan2(
        sqrt(a),
        sqrt(1 - a),
    )


def text_similarity(
    text1,
    text2,
):
    vectorizer = TfidfVectorizer()

    vectors = vectorizer.fit_transform(
        [text1, text2]
    )

    return cosine_similarity(
        vectors[0],
        vectors[1],
    )[0][0]


# ============================================================
# AUTHENTICATION
# ============================================================

@app.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.username == user.username)
        .first()
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=400,
            detail="Username already exists",
        )

    new_user = User(
        username=user.username,
        hashed_password=hash_password(
            user.password
        ),
        role="citizen",
    )

    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Username already exists",
        )

    return {
        "id": new_user.id,
        "username": new_user.username,
        "role": new_user.role,
    }


@app.post(
    "/login",
    response_model=Token,
)
def login(
    from_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    db_user = (
        db.query(User)
        .filter(
            User.username == from_data.username
        )
        .first()
    )

    if db_user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    if not verify_password(
        from_data.password,
        db_user.hashed_password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    token = create_access_token(
        db_user.id,
        db_user.role,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }


def get_current_user(
    token: str = Depends(oauth2_scheme),
):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")
        role = payload.get("role")

        if user_id is None or role is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

        return {
            "id": int(user_id),
            "role": role,
        }

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
        )


def get_current_admin(
    current_user: dict = Depends(
        get_current_user
    ),
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return current_user


# ============================================================
# ROOT / HEALTH
# ============================================================

@app.get("/")
def root():
    return {
        "message": "CivicPulse API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# ============================================================
# CREATE COMPLAINT
# ============================================================

@app.post(
    "/complaints",
    response_model=ComplaintResponse,
)
async def create_complaint(
    text: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),

    image: UploadFile | None = File(None),

    db: Session = Depends(get_db),

    current_user: dict = Depends(
        get_current_user
    ),
):

    # ========================================================
    # IMAGE UPLOAD
    # ========================================================

    image_url = None

    if image is not None:

        extension = os.path.splitext(
            image.filename
        )[1]

        filename = (
            f"{uuid.uuid4()}{extension}"
        )

        file_path = os.path.join(
            UPLOAD_DIR,
            filename,
        )

        with open(
            file_path,
            "wb",
        ) as buffer:

            buffer.write(
                await image.read()
            )

        image_url = (
            f"/uploads/{filename}"
        )

    # ========================================================
    # AI ANALYSIS
    # ========================================================

    analysis_data = analyze(text)

    analysis = ComplaintAnalysis(
        **analysis_data
    )

    category = analysis.category

    severity = analysis.severity
    urgency = analysis.urgency
    safety_risk = analysis.safety_risk
    public_impact = analysis.public_impact

    # ========================================================
    # PRIORITY
    # ========================================================

    priority_score = calculate_priority(
        severity=severity,
        urgency=urgency,
        safety_risk=safety_risk,
        public_impact=public_impact,
    )

    # ========================================================
    # DEPARTMENT
    # ========================================================

    department = get_department(
        category
    )

    # ========================================================
    # DUPLICATE DETECTION
    # ========================================================

    duplicate_id = None

    cutoff = (
        datetime.utcnow()
        - timedelta(days=30)
    )

    recent_complaints = (
        db.query(Complaint)
        .filter(
            Complaint.category == category,
            Complaint.created_at >= cutoff,
        )
        .all()
    )

    print(
        "\n========== DUPLICATE CHECK =========="
    )

    print(
        "New complaint:",
        text,
    )

    print(
        "New category:",
        category,
    )

    print(
        "Candidates:",
        len(recent_complaints),
    )

    for existing in recent_complaints:

        distance = distance_meters(
            latitude,
            longitude,
            existing.latitude,
            existing.longitude,
        )

        similarity = text_similarity(
            text,
            existing.text,
        )

        print(
            "\nExisting ID:",
            existing.id,
        )

        print(
            "Existing text:",
            existing.text,
        )

        print(
            "Existing category:",
            existing.category,
        )

        print(
            "Distance:",
            distance,
        )

        print(
            "Similarity:",
            similarity,
        )

        if (
            distance <= 100
            and similarity >= 0.6
        ):

            duplicate_id = existing.id

            print(
                ">>> DUPLICATE FOUND:",
                existing.id,
            )

            break

    print(
        "FINAL duplicate_id:",
        duplicate_id,
    )

    print(
        "=====================================\n"
    )

    # ========================================================
    # CREATE DATABASE OBJECT
    # ========================================================

    db_complaint = Complaint(

        # Authenticated user
        user_id=current_user["id"],

        # Complaint information
        text=text,

        # Image
        image_url=image_url,

        latitude=latitude,
        longitude=longitude,

        # AI analysis
        category=category,

        severity=severity,
        urgency=urgency,
        safety_risk=safety_risk,
        public_impact=public_impact,

        # Priority
        priority_score=priority_score,

        # Department
        department=department,

        # Workflow
        status="pending",

        # Duplicate
        duplicate_of=duplicate_id,
    )

    # ========================================================
    # SAVE
    # ========================================================

    db.add(db_complaint)

    db.commit()

    db.refresh(db_complaint)

    return db_complaint


# ============================================================
# GET ALL COMPLAINTS
# ============================================================

@app.get(
    "/complaints",
    response_model=list[ComplaintResponse],
)
def get_complaints(
    status: ComplaintStatus | None = None,

    department: str | None = None,

    category: str | None = None,

    sort: str | None = None,

    limit: int = Query(
        20,
        ge=1,
        le=100,
    ),

    offset: int = Query(
        0,
        ge=0,
    ),

    db: Session = Depends(get_db),
):

    query = db.query(Complaint)

    if status is not None:

        query = query.filter(
            Complaint.status == status
        )

    if department is not None:

        query = query.filter(
            Complaint.department
            == department
        )

    if category is not None:

        query = query.filter(
            Complaint.category
            == category
        )

    if sort == ComplaintSort.priority:

        query = query.order_by(
            Complaint.priority_score.desc()
        )

    elif sort == ComplaintSort.newest:

        query = query.order_by(
            Complaint.created_at.desc()
        )

    elif sort == ComplaintSort.oldest:

        query = query.order_by(
            Complaint.created_at.asc()
        )

    complaints = (
        query
        .offset(offset)
        .limit(limit)
        .all()
    )

    return complaints


# ============================================================
# GET SINGLE COMPLAINT
# ============================================================

@app.get(
    "/complaints/{complaint_id}",
    response_model=ComplaintResponse,
)
def get_complaint(
    complaint_id: int,

    db: Session = Depends(get_db),
):

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.id == complaint_id
        )
        .first()
    )

    if complaint is None:

        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    return complaint


# ============================================================
# DASHBOARD STATISTICS
# ============================================================

@app.get(
    "/dashboard/statistics",
    response_model=DashboardStatistics,
)
def get_dashboard_statistics(
    db: Session = Depends(get_db),
):

    total = (
        db.query(Complaint)
        .count()
    )

    pending = (
        db.query(Complaint)
        .filter(
            Complaint.status == "pending"
        )
        .count()
    )

    assigned = (
        db.query(Complaint)
        .filter(
            Complaint.status == "assigned"
        )
        .count()
    )

    in_progress = (
        db.query(Complaint)
        .filter(
            Complaint.status == "in_progress"
        )
        .count()
    )

    resolved = (
        db.query(Complaint)
        .filter(
            Complaint.status == "resolved"
        )
        .count()
    )

    return {
        "total_complaints": total,
        "pending": pending,
        "assigned": assigned,
        "in_progress": in_progress,
        "resolved": resolved,
    }


# ============================================================
# UPDATE COMPLAINT STATUS
# ============================================================

@app.patch(
    "/complaints/{complaint_id}/status",
    response_model=ComplaintResponse,
)
def update_complaint_status(
    complaint_id: int,

    status_update: ComplaintStatusUpdate,

    db: Session = Depends(get_db),

    current_user: dict = Depends(
        get_current_admin
    ),
):

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.id == complaint_id
        )
        .first()
    )

    if complaint is None:

        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    print(
        "\n========== STATUS UPDATE =========="
    )

    print(
        "Updating complaint:",
        complaint.id,
    )

    print(
        "New status:",
        status_update.status,
    )

    # Update original
    complaint.status = (
        status_update.status
    )

    # Find duplicates
    duplicates = (
        db.query(Complaint)
        .filter(
            Complaint.duplicate_of
            == complaint.id
        )
        .all()
    )

    print(
        "Duplicates found:",
        len(duplicates),
    )

    # Update duplicates
    for duplicate in duplicates:

        print(
            f"Duplicate {duplicate.id}: "
            f"{duplicate.status} -> "
            f"{status_update.status}"
        )

        duplicate.status = (
            status_update.status
        )

    db.commit()

    db.refresh(complaint)

    print(
        "===================================\n"
    )

    return complaint
