from fastapi import FastAPI, Depends, Query, HTTPException

from fastapi.middleware.cors import CORSMiddleware

from models import ComplaintCreate, ComplaintAnalysis, UserCreate, Token
from priority import calculate_priority, get_department

from fastapi.middleware.cors import CORSMiddleware

from auth import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from db_models import Complaint, User

from pydantic import BaseModel, Field
from enum import Enum

from math import radians, sin, cos, sqrt, atan2
from datetime import datetime, timedelta

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db, engine, Base
from datetime import datetime

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt

from services.ai_service import analyze

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)



app = FastAPI(
    title="CivicPulse API",
    description="AI-powered civic complaint prioritization system",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

Base.metadata.create_all(bind=engine)


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




def distance_meters(lat1, lon1, lat2, lon2):
    R = 6371000  # Earth radius in meters

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

    return 2 * R * atan2(sqrt(a), sqrt(1 - a))


def text_similarity(text1, text2):
    vectorizer = TfidfVectorizer()

    vectors = vectorizer.fit_transform([text1, text2])

    return cosine_similarity(
        vectors[0],
        vectors[1]
    )[0][0]




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
        hashed_password=hash_password(user.password),
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



@app.post("/login", response_model=Token)
def login(
    from_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    db_user = (
        db.query(User)
        .filter(User.username == from_data.username)
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
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return current_user


@app.patch(
    "/complaints/{complaint_id}/status",
    response_model=ComplaintResponse,
)
def update_complaint_status(
    complaint_id: int,
    status_update: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
):
    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id)
        .first()
    )

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    print("\n========== STATUS UPDATE ==========")
    print("Updating complaint:", complaint.id)
    print("New status:", status_update.status)

    # Update the selected complaint
    complaint.status = status_update.status

    # Find complaints that directly point to this complaint
    duplicates = (
        db.query(Complaint)
        .filter(
            Complaint.duplicate_of == complaint.id
        )
        .all()
    )

    print("Duplicates found:", len(duplicates))

    for duplicate in duplicates:
        print(
            f"Duplicate {duplicate.id}: "
            f"{duplicate.status} -> {status_update.status}"
        )

        duplicate.status = status_update.status

    db.commit()

    db.refresh(complaint)

    print("===================================\n")

    return complaint




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



@app.get("/complaints", response_model=list[ComplaintResponse])
def get_complaints(
    status: ComplaintStatus | None = None,
    department: str | None = None,
    category: str | None = None,
    sort: str | None = None,
    limit: int  = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Complaint)

    if status is not None:
        query = query.filter(Complaint.status == status)

    if department is not None:
        query = query.filter(Complaint.department == department)

    if category is not None:
        query = query.filter(Complaint.category == category)

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





@app.get("/complaints/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
):
    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id)
        .first()
    )

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    return complaint


@app.get(
    "/dashboard/statistics",
    response_model=DashboardStatistics,
)
def get_dashboard_statistics(
    db: Session = Depends(get_db),
):
    total = db.query(Complaint).count()

    pending = (
        db.query(Complaint)
        .filter(Complaint.status == "pending")
        .count()
    )

    assigned = (
        db.query(Complaint)
        .filter(Complaint.status == "assigned")
        .count()
    )

    in_progress = (
        db.query(Complaint)
        .filter(Complaint.status == "in_progress")
        .count()
    )

    resolved = (
        db.query(Complaint)
        .filter(Complaint.status == "resolved")
        .count()
    )

    return {
        "total_complaints": total,
        "pending": pending,
        "assigned": assigned,
        "in_progress": in_progress,
        "resolved": resolved,
    }






@app.patch(
    "/complaints/{complaint_id}/status",
    response_model=ComplaintResponse,
)
def update_complaint_status(
    complaint_id: int,
    status_update: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
):
    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id)
        .first()
    )

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    complaint.status = status_update.status

    db.commit()
    db.refresh(complaint)

    return complaint


@app.post("/complaints", response_model=ComplaintResponse)
def create_complaint(
    complaint: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):

    # -------------------------
    # AI analysis
    # -------------------------

    analysis_data = analyze(complaint.text)
    analysis = ComplaintAnalysis(**analysis_data)

    category = analysis.category
    severity = analysis.severity
    urgency = analysis.urgency
    safety_risk = analysis.safety_risk
    public_impact = analysis.public_impact

    priority_score = calculate_priority(
        severity=severity,
        urgency=urgency,
        safety_risk=safety_risk,
        public_impact=public_impact,
    )

    department = get_department(category)

    # -------------------------
    # Duplicate detection
    # -------------------------

    duplicate_id = None

    cutoff = datetime.utcnow() - timedelta(days=30)

    recent_complaints = (
        db.query(Complaint)
        .filter(
            Complaint.category == category,
            Complaint.created_at >= cutoff,
        )
        .all()
    )

    print("\n========== DUPLICATE CHECK ==========")
    print("New complaint:", complaint.text)
    print("New category:", category)
    print("Candidates:", len(recent_complaints))

    for existing in recent_complaints:

        distance = distance_meters(
            complaint.latitude,
            complaint.longitude,
            existing.latitude,
            existing.longitude,
        )

        similarity = text_similarity(
            complaint.text,
            existing.text,
        )

        print("\nExisting ID:", existing.id)
        print("Existing text:", existing.text)
        print("Existing category:", existing.category)
        print("Distance:", distance)
        print("Similarity:", similarity)

        if distance <= 100 and similarity >= 0.6:
            duplicate_id = existing.id

            print(
                ">>> DUPLICATE FOUND:",
                existing.id
            )

            break

    print("FINAL duplicate_id:", duplicate_id)
    print("=====================================\n")

    # -------------------------
    # Create complaint
    # -------------------------

    db_complaint = Complaint(
        user_id=current_user["id"],

        text=complaint.text,
        latitude=complaint.latitude,
        longitude=complaint.longitude,

        category=category,
        department=department,

        severity=severity,
        urgency=urgency,
        safety_risk=safety_risk,
        public_impact=public_impact,

        priority_score=priority_score,

        status="pending",

        duplicate_of=duplicate_id,
    )

    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)

    return db_complaint




#    return {
#        "id": db_complaint.id,
#        "text": db_complaint.text,
#        "latitude": db_complaint.latitude,
#        "longitude": db_complaint.longitude,

#        "category": db_complaint.category,
##        "severity": db_complaint.severity,
#        "urgency": db_complaint.urgency,
#        "safety_risk": db_complaint.safety_risk,
#        "public_impact": db_complaint.public_impact,
#        "priority_score": db_complaint.priority_score,
#        "department": db_complaint.department,
#        "status": db_complaint.status,
#    }
