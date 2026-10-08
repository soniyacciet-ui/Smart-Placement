from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from passlib.context import CryptContext

from . import models, schemas
from .database import engine, get_db, SessionLocal
from .seed import seed_database
from . import excel_handler

# Create tables
models.Base.metadata.create_all(bind=engine)

# Seed initial data
db = SessionLocal()
seed_database(db)
db.close()

app = FastAPI(title="DRIVE-X API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


# ======================================================
# HEALTH
# ======================================================
@app.get("/")
def root():
    return {"message": "DRIVE-X Backend is running!", "version": "2.0.0"}


@app.get("/api/health")
def health():
    return {"status": "healthy", "backend": "DRIVE-X", "version": "2.0.0"}


# ======================================================
# AUTH — LOGIN
# Supports: email, login_id, register_number (for students)
# ======================================================
@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login(user: schemas.LoginRequest, db: Session = Depends(get_db)):
    # -------- STUDENT LOGIN (via Register Number) --------
    if user.role == "Student" and user.register_number:
        student = db.query(models.Student).filter(
            models.Student.register_number == user.register_number
        ).first()
        if not student:
            raise HTTPException(status_code=401, detail="Register number not found")

        # If student has no password yet, allow first login with any password
        # (In production, you'd enforce a password policy)
        return {
            "access_token": f"student-{student.id}-token",
            "token_type": "bearer",
            "role": "Student",
            "user_id": student.id,
            "department": student.department,
            "name": student.name,
        }

    # -------- STAFF / HOD / PO / ADMIN LOGIN --------
    # Try login_id first, then email
    db_user = None
    if user.login_id:
        db_user = db.query(models.User).filter(models.User.login_id == user.login_id).first()
    if not db_user and user.email:
        db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user:
        # Fallback: create a demo user on-the-fly (preserves existing behavior)
        email = user.email or user.login_id or "demo@drivex.com"
        db_user = models.User(
            email=email,
            login_id=user.login_id or email,
            hashed_password=hash_password(user.password),
            role=user.role,
            name=user.role,
            status="Active",
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    else:
        # Verify password only if user has a real hash
        if db_user.hashed_password and db_user.hashed_password != "dummy":
            if not verify_password(user.password, db_user.hashed_password):
                raise HTTPException(status_code=401, detail="Invalid password")

        # Check account status
        if db_user.status == "Inactive":
            raise HTTPException(status_code=403, detail="Account is deactivated")

    return {
        "access_token": f"token-{db_user.id}",
        "token_type": "bearer",
        "role": db_user.role,
        "user_id": db_user.id,
        "department": db_user.department,
        "name": db_user.name,
    }


# ======================================================
# STUDENTS (existing — unchanged)
# ======================================================
@app.get("/api/students")
def list_students(db: Session = Depends(get_db)):
    students = db.query(models.Student).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "cgpa": s.cgpa,
            "skills": (s.skills or "").split(",") if s.skills else [],
            "register_number": s.register_number,
            "email": s.email,
            "department": s.department,
            "batch": s.batch,
            "status": s.status,
        }
        for s in students
    ]


# ======================================================
# INTERVENTIONS (existing — unchanged)
# ======================================================
@app.get("/api/interventions", response_model=List[schemas.InterventionOut])
def list_interventions(db: Session = Depends(get_db)):
    return db.query(models.Intervention).all()


# ======================================================
# JOB DESCRIPTIONS (existing — unchanged)
# ======================================================
@app.post("/api/jd/upload", response_model=schemas.JDOut)
def upload_jd(jd: schemas.JDCreate, db: Session = Depends(get_db)):
    db_jd = models.JobDescription(**jd.dict())
    db.add(db_jd)
    db.commit()
    db.refresh(db_jd)
    return db_jd


@app.get("/api/jd/{jd_id}", response_model=schemas.JDOut)
def get_jd(jd_id: int, db: Session = Depends(get_db)):
    jd = db.query(models.JobDescription).filter(models.JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="JD not found")
    return jd


# ======================================================
# MATCHING ENGINE (existing — unchanged)
# ======================================================
@app.post("/api/match/run/{jd_id}")
def run_matching(jd_id: int, db: Session = Depends(get_db)):
    jd = db.query(models.JobDescription).filter(models.JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="JD not found")

    db.query(models.MatchResult).filter(models.MatchResult.jd_id == jd_id).delete()

    students = db.query(models.Student).all()
    jd_skills = [s.strip() for s in jd.actionable_skills.split(",") if s.strip()]
    results = []

    for student in students:
        student_skills = [s.strip() for s in (student.skills or "").split(",") if s.strip()]
        missing = [skill for skill in jd_skills if skill not in student_skills]

        if len(missing) == 0:
            status = "Ready"
        elif len(missing) <= 2:
            status = "Recoverable"
        else:
            status = "Blocked"

        readiness = max(0, 100 - (len(missing) * 20))

        match = models.MatchResult(
            student_id=student.id,
            jd_id=jd.id,
            status=status,
            missing_skills=",".join(missing),
            readiness_score=readiness,
        )
        db.add(match)
        results.append(match)

    db.commit()
    return {"message": "Matching complete", "results_count": len(results)}


@app.get("/api/match/{jd_id}/segments")
def get_segments(jd_id: int, db: Session = Depends(get_db)):
    matches = db.query(models.MatchResult).filter(models.MatchResult.jd_id == jd_id).all()
    output = []
    for m in matches:
        student = db.query(models.Student).filter(models.Student.id == m.student_id).first()
        if not student:
            continue
        output.append({
            "id": m.id,
            "student_id": student.id,
            "student_name": student.name,
            "name": student.name,
            "cgpa": student.cgpa,
            "skills": (student.skills or "").split(",") if student.skills else [],
            "status": m.status,
            "missing_skills": [s for s in (m.missing_skills or "").split(",") if s],
            "readiness_score": m.readiness_score,
        })
    return output


# ======================================================
# RECOVERY ENGINE (existing — unchanged)
# ======================================================
@app.post("/api/recovery/run/{jd_id}")
def run_recovery(jd_id: int, db: Session = Depends(get_db)):
    matches = db.query(models.MatchResult).filter(models.MatchResult.jd_id == jd_id).all()
    recovered_count = 0
    results = []

    for m in matches:
        student = db.query(models.Student).filter(models.Student.id == m.student_id).first()
        original_status = m.status

        if m.status == "Recoverable":
            new_score = min(100.0, m.readiness_score + 25)
            new_status = "Ready" if new_score >= 80 else "Recoverable"
            m.readiness_score = new_score
            m.status = new_status
            if new_status == "Ready":
                recovered_count += 1

        results.append({
            "id": m.id,
            "student_name": student.name if student else "Unknown",
            "original_status": original_status,
            "status": m.status,
            "readiness_score": m.readiness_score,
            "recovered": original_status == "Recoverable" and m.status == "Ready",
        })

    db.commit()
    return {"message": "Recovery complete", "recovered_count": recovered_count, "results": results}


# ======================================================
# SIMULATOR (existing — unchanged)
# ======================================================
@app.post("/api/simulator/run")
def run_simulator(payload: schemas.SimulatorRequest, db: Session = Depends(get_db)):
    matches = db.query(models.MatchResult).filter(models.MatchResult.jd_id == payload.jd_id).all()
    interventions = db.query(models.Intervention).filter(
        models.Intervention.id.in_(payload.selected_intervention_ids)
    ).all()

    simulated = []
    total_moved = 0

    for m in matches:
        student = db.query(models.Student).filter(models.Student.id == m.student_id).first()
        if not student:
            continue

        if m.status != "Recoverable":
            simulated.append({
                "id": m.id,
                "student_name": student.name,
                "current_status": m.status,
                "simulated_score": m.readiness_score,
                "move_to_ready": False,
            })
            continue

        new_score = m.readiness_score
        missing = set(s for s in (m.missing_skills or "").split(",") if s)

        for i in interventions:
            if i.target_skill in missing:
                new_score = min(100.0, new_score + i.impact)
                missing.discard(i.target_skill)

        move_to_ready = new_score >= 80
        if move_to_ready:
            total_moved += 1

        simulated.append({
            "id": m.id,
            "student_name": student.name,
            "current_status": m.status,
            "simulated_score": new_score,
            "move_to_ready": move_to_ready,
        })

    return {"total_moved": total_moved, "results": simulated}


# ======================================================
# OPTIMIZER (existing — unchanged)
# ======================================================
@app.post("/api/optimizer/run")
def run_optimizer(payload: schemas.OptimizerRequest, db: Session = Depends(get_db)):
    interventions = db.query(models.Intervention).all()
    sorted_int = sorted(interventions, key=lambda i: (i.impact / i.cost) if i.cost else 0, reverse=True)

    current_budget = 0
    current_trainers = 0
    recommended = []

    for i in sorted_int:
        if current_budget + i.cost <= payload.max_budget and current_trainers + i.trainers_needed <= payload.max_trainers:
            recommended.append({
                "id": i.id,
                "name": i.name,
                "target_skill": i.target_skill,
                "impact": i.impact,
                "cost": i.cost,
                "trainers_needed": i.trainers_needed,
            })
            current_budget += i.cost
            current_trainers += i.trainers_needed

    return {
        "recommended_plan": recommended,
        "total_cost": current_budget,
        "total_trainers": current_trainers,
    }


# ======================================================
# 🆕 ADMIN — USER MANAGEMENT
# ======================================================

def _require_admin(x_user_role: Optional[str]):
    """Simple role check. In production, verify JWT."""
    if x_user_role != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")


@app.post("/api/admin/users", response_model=schemas.UserOut)
def create_user(
    payload: schemas.CreateUserRequest,
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None),
):
    _require_admin(x_user_role)

    # Duplicate checks
    if db.query(models.User).filter(models.User.login_id == payload.login_id).first():
        raise HTTPException(status_code=400, detail="Login ID already exists")
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = models.User(
        name=payload.name,
        login_id=payload.login_id,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        department=payload.department,
        employee_id=payload.employee_id,
        status="Active",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get("/api/admin/users", response_model=List[schemas.UserOut])
def list_users(
    role: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None),
):
    _require_admin(x_user_role)
    q = db.query(models.User)
    if role:
        q = q.filter(models.User.role == role)
    if department:
        q = q.filter(models.User.department == department)
    if status:
        q = q.filter(models.User.status == status)
    return q.order_by(models.User.created_at.desc()).all()


@app.patch("/api/admin/users/{user_id}/status", response_model=schemas.UserOut)
def toggle_user_status(
    user_id: int,
    payload: schemas.ToggleStatusRequest,
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None),
):
    _require_admin(x_user_role)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = payload.status
    db.commit()
    db.refresh(user)
    return user


@app.patch("/api/admin/users/{user_id}/reset-password")
def reset_password(
    user_id: int,
    payload: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None),
):
    _require_admin(x_user_role)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password reset successfully"}


# ======================================================
# 🆕 ADMIN — DASHBOARD STATS
# ======================================================
@app.get("/api/admin/stats")
def admin_stats(
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None),
):
    _require_admin(x_user_role)

    total_students = db.query(models.Student).count()
    total_staff = db.query(models.User).filter(models.User.role == "Faculty/Trainer").count()
    total_hods = db.query(models.User).filter(models.User.role == "HOD/Admin").count()
    total_pos = db.query(models.User).filter(models.User.role == "Placement Officer").count()
    active_users = db.query(models.User).filter(models.User.status == "Active").count()
    inactive_users = db.query(models.User).filter(models.User.status == "Inactive").count()

    # Department-wise student count
    dept_counts = {}
    for s in db.query(models.Student).all():
        d = s.department or "Unknown"
        dept_counts[d] = dept_counts.get(d, 0) + 1

    # All distinct departments
    all_depts = set(dept_counts.keys())
    for u in db.query(models.User).all():
        if u.department:
            all_depts.add(u.department)

    return {
        "total_students": total_students,
        "total_staff": total_staff,
        "total_hods": total_hods,
        "total_placement_officers": total_pos,
        "total_departments": len(all_depts),
        "active_users": active_users,
        "inactive_users": inactive_users,
        "department_counts": dept_counts,
    }


# ======================================================
# 🆕 EXCEL IMPORT — UPLOAD + PREVIEW
# ======================================================
@app.post("/api/import/preview", response_model=schemas.ImportPreviewResponse)
async def preview_import(
    file: UploadFile = File(...),
    department: str = Form(...),
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None),
    x_user_department: Optional[str] = Header(None),
):
    # Only Staff / HOD / Placement Officer / Admin can import
    allowed_roles = ["Faculty/Trainer", "HOD/Admin", "Placement Officer", "Admin"]
    if x_user_role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not authorized to import")

    # Department enforcement: non-Admin users can only import their own department
    if x_user_role != "Admin" and x_user_department:
        if department.upper() != x_user_department.upper():
            raise HTTPException(
                status_code=403,
                detail=f"You can only import for {x_user_department}, not {department}"
            )

    # Validate file extension
    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    try:
        result = excel_handler.parse_and_validate(contents, department.upper(), db)
        result["token"] = result["token"]
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ======================================================
# 🆕 EXCEL IMPORT — CONFIRM
# ======================================================
@app.post("/api/import/confirm", response_model=schemas.ImportResultResponse)
def confirm_import(
    payload: schemas.ImportConfirmRequest,
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    x_user_department: Optional[str] = Header(None),
):
    allowed_roles = ["Faculty/Trainer", "HOD/Admin", "Placement Officer", "Admin"]
    if x_user_role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not authorized to import")

    try:
        result = excel_handler.commit_import(payload.token, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Record import history
    history = models.ImportHistory(
        file_name=payload.file_name,
        uploaded_by=x_user_id or "unknown",
        role=x_user_role or "unknown",
        department=x_user_department or "unknown",
        total_rows=result["total"],
        new_students=result["new_students"],
        updated_students=result["updated_students"],
        failed_rows=result["failed"],
        status="Completed",
    )
    db.add(history)
    db.commit()

    return result


# ======================================================
# 🆕 IMPORT HISTORY
# ======================================================
@app.get("/api/import/history")
def import_history(
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(None),
    x_user_department: Optional[str] = Header(None),
):
    allowed_roles = ["Faculty/Trainer", "HOD/Admin", "Placement Officer", "Admin"]
    if x_user_role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not authorized")

    q = db.query(models.ImportHistory)
    # Non-admin only sees their department's history
    if x_user_role != "Admin" and x_user_department:
        q = q.filter(models.ImportHistory.department == x_user_department)

    return [
        {
            "id": h.id,
            "file_name": h.file_name,
            "uploaded_by": h.uploaded_by,
            "role": h.role,
            "department": h.department,
            "total_rows": h.total_rows,
            "new_students": h.new_students,
            "updated_students": h.updated_students,
            "failed_rows": h.failed_rows,
            "status": h.status,
            "uploaded_at": h.uploaded_at,
        }
        for h in q.order_by(models.ImportHistory.uploaded_at.desc()).all()
    ]


# ======================================================
# 🆕 STUDENT — VIEW OWN PROFILE (via register number)
# ======================================================
@app.get("/api/students/me/{register_number}")
def get_my_profile(register_number: str, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(
        models.Student.register_number == register_number
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {
        "id": student.id,
        "name": student.name,
        "register_number": student.register_number,
        "email": student.email,
        "cgpa": student.cgpa,
        "department": student.department,
        "skills": (student.skills or "").split(",") if student.skills else [],
        "batch": student.batch,
        "status": student.status,
    }


# ======================================================
# 🆕 ADMIN — SAMPLE EXCEL TEMPLATE INFO
# ======================================================
@app.get("/api/import/template-info")
def template_info():
    return {
        "columns": ["Name", "Register Number", "Email", "CGPA", "Department"],
        "example": {
            "Name": "Arun Kumar",
            "Register Number": "23AD001",
            "Email": "arun@college.edu",
            "CGPA": 8.2,
            "Department": "AIDS",
        },
        "supported_departments": ["AIDS", "CSE", "ECE", "MECH", "CIVIL", "IT"],
    }