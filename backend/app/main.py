from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from passlib.context import CryptContext
from datetime import datetime

from . import models, schemas
from .database import engine, get_db, SessionLocal
from .seed import seed_database
from . import excel_handler
from . import resume_parser
from .auth import create_access_token, create_student_token, get_current_user, require_roles

# Create tables
models.Base.metadata.create_all(bind=engine)

# Seed initial data
db = SessionLocal()
seed_database(db)
db.close()

app = FastAPI(title="DRIVE-X API", version="2.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return {"message": "DRIVE-X Backend is running!", "version": "2.1.0"}


@app.get("/api/health")
def health():
    return {"status": "healthy", "backend": "DRIVE-X", "version": "2.1.0"}


# ======================================================
# AUTH — LOGIN
# ======================================================
@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login(user: schemas.LoginRequest, db: Session = Depends(get_db)):
    # ---------- STUDENT LOGIN ----------
    if user.role == "Student" and user.register_number:
        student = db.query(models.Student).filter(
            models.Student.register_number == user.register_number
        ).first()
        if not student:
            raise HTTPException(status_code=401, detail="Register number not found")

        token = create_student_token(student)
        return {
            "access_token": token,
            "token_type": "bearer",
            "role": "Student",
            "user_id": student.id,
            "department": student.department,
            "name": student.name,
            "register_number": student.register_number,
            "expires_in": 28800,
        }

    # ---------- STAFF / HOD / PO / ADMIN LOGIN ----------
    db_user = None
    if user.login_id:
        db_user = db.query(models.User).filter(models.User.login_id == user.login_id).first()
    if not db_user and user.email:
        db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if db_user.hashed_password and db_user.hashed_password != "dummy":
        if not verify_password(user.password, db_user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid password")

    if db_user.status == "Inactive":
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token(db_user)
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": db_user.role,
        "user_id": db_user.id,
        "department": db_user.department,
        "name": db_user.name,
        "register_number": None,
        "expires_in": 28800,
    }


# ======================================================
# STUDENTS
# ======================================================
@app.get("/api/students")
def list_students(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
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


@app.get("/api/students/me/{register_number}")
def get_my_profile(
    register_number: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    student = db.query(models.Student).filter(
        models.Student.register_number == register_number
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Students can only view their own profile
    if current_user["role"] == "Student":
        if current_user.get("register_number") != register_number:
            raise HTTPException(status_code=403, detail="You can only view your own profile")

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
# INTERVENTIONS
# ======================================================
@app.get("/api/interventions", response_model=List[schemas.InterventionOut])
def list_interventions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return db.query(models.Intervention).all()


# ======================================================
# JOB DESCRIPTIONS
# ======================================================
@app.post("/api/jd/upload", response_model=schemas.JDOut)
def upload_jd(
    jd: schemas.JDCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Placement Officer", "Admin"])),
):
    db_jd = models.JobDescription(**jd.dict())
    db.add(db_jd)
    db.commit()
    db.refresh(db_jd)
    return db_jd


@app.get("/api/jd/{jd_id}", response_model=schemas.JDOut)
def get_jd(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    jd = db.query(models.JobDescription).filter(models.JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="JD not found")
    return jd


# ======================================================
# MATCHING ENGINE
# ======================================================
@app.post("/api/match/run/{jd_id}")
def run_matching(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Placement Officer", "Admin", "Faculty/Trainer"])),
):
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
def get_segments(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
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
# RECOVERY
# ======================================================
@app.post("/api/recovery/run/{jd_id}")
def run_recovery(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Placement Officer", "Admin"])),
):
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
# SIMULATOR
# ======================================================
@app.post("/api/simulator/run")
def run_simulator(
    payload: schemas.SimulatorRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Placement Officer", "Admin", "Faculty/Trainer"])),
):
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
# OPTIMIZER
# ======================================================
@app.post("/api/optimizer/run")
def run_optimizer(
    payload: schemas.OptimizerRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Placement Officer", "Admin", "Faculty/Trainer"])),
):
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
# ADMIN — USER MANAGEMENT
# ======================================================
@app.post("/api/admin/users", response_model=schemas.UserOut)
def create_user(
    payload: schemas.CreateUserRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Admin"])),
):
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
    current_user: dict = Depends(require_roles(["Admin"])),
):
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
    current_user: dict = Depends(require_roles(["Admin"])),
):
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
    current_user: dict = Depends(require_roles(["Admin"])),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password reset successfully"}


# ======================================================
# ADMIN — DASHBOARD STATS
# ======================================================
@app.get("/api/admin/stats")
def admin_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Admin"])),
):
    total_students = db.query(models.Student).count()
    total_staff = db.query(models.User).filter(models.User.role == "Faculty/Trainer").count()
    total_hods = db.query(models.User).filter(models.User.role == "HOD/Admin").count()
    total_pos = db.query(models.User).filter(models.User.role == "Placement Officer").count()
    active_users = db.query(models.User).filter(models.User.status == "Active").count()
    inactive_users = db.query(models.User).filter(models.User.status == "Inactive").count()

    dept_counts = {}
    for s in db.query(models.Student).all():
        d = s.department or "Unknown"
        dept_counts[d] = dept_counts.get(d, 0) + 1

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
# EXCEL IMPORT — PREVIEW
# ======================================================
@app.post("/api/import/preview", response_model=schemas.ImportPreviewResponse)
async def preview_import(
    file: UploadFile = File(...),
    department: str = Form(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Faculty/Trainer", "HOD/Admin", "Placement Officer", "Admin"])),
):
    # Department enforcement
    if current_user["role"] != "Admin" and current_user.get("department"):
        if department.upper() != current_user["department"].upper():
            raise HTTPException(
                status_code=403,
                detail=f"You can only import for {current_user['department']}, not {department}"
            )

    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    try:
        result = excel_handler.parse_and_validate(contents, department.upper(), db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ======================================================
# EXCEL IMPORT — CONFIRM
# ======================================================
@app.post("/api/import/confirm", response_model=schemas.ImportResultResponse)
def confirm_import(
    payload: schemas.ImportConfirmRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Faculty/Trainer", "HOD/Admin", "Placement Officer", "Admin"])),
):
    try:
        result = excel_handler.commit_import(payload.token, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Record import history
    history = models.ImportHistory(
        file_name=payload.file_name,
        uploaded_by=current_user.get("login_id") or current_user.get("name") or "unknown",
        role=current_user["role"],
        department=current_user.get("department") or "unknown",
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
# IMPORT HISTORY
# ======================================================
@app.get("/api/import/history")
def import_history(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Faculty/Trainer", "HOD/Admin", "Placement Officer", "Admin"])),
):
    q = db.query(models.ImportHistory)
    if current_user["role"] != "Admin" and current_user.get("department"):
        q = q.filter(models.ImportHistory.department == current_user["department"])

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
# IMPORT — CLEAR DEPARTMENT
# ======================================================
@app.delete("/api/import/clear-department/{department}")
def clear_department_students(
    department: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Faculty/Trainer", "HOD/Admin", "Placement Officer", "Admin"])),
):
    if current_user["role"] != "Admin":
        if not current_user.get("department") or department.upper() != current_user["department"].upper():
            raise HTTPException(
                status_code=403,
                detail=f"You can only clear students from {current_user.get('department')}"
            )

    deleted = db.query(models.Student).filter(
        models.Student.department == department.upper()
    ).delete()
    db.commit()
    return {
        "message": f"Deleted {deleted} students from {department.upper()}",
        "deleted_count": deleted,
    }


# ======================================================
# IMPORT — DELETE HISTORY RECORD
# ======================================================
@app.delete("/api/import/history/{history_id}")
def delete_import_history_record(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Faculty/Trainer", "HOD/Admin", "Placement Officer", "Admin"])),
):
    record = db.query(models.ImportHistory).filter(models.ImportHistory.id == history_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Import history record not found")

    if current_user["role"] != "Admin" and current_user.get("department"):
        if record.department != current_user["department"]:
            raise HTTPException(status_code=403, detail="Not authorized for this department")

    db.delete(record)
    db.commit()
    return {"message": "Import history record deleted"}


# ======================================================
# GLOBAL SEARCH
# ======================================================
@app.get("/api/search")
def global_search(
    q: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if not q or len(q.strip()) < 2:
        return {"students": [], "users": [], "jds": []}

    term = f"%{q.strip()}%"

    students = db.query(models.Student).filter(
        (models.Student.name.ilike(term)) |
        (models.Student.register_number.ilike(term))
    ).limit(5).all()

    users = db.query(models.User).filter(
        (models.User.name.ilike(term)) |
        (models.User.login_id.ilike(term)) |
        (models.User.email.ilike(term))
    ).limit(5).all()

    jds = db.query(models.JobDescription).filter(
        (models.JobDescription.company_name.ilike(term)) |
        (models.JobDescription.role.ilike(term))
    ).limit(5).all()

    return {
        "students": [
            {"id": s.id, "name": s.name, "register_number": s.register_number, "department": s.department}
            for s in students
        ],
        "users": [
            {"id": u.id, "name": u.name, "login_id": u.login_id, "role": u.role, "department": u.department}
            for u in users
        ],
        "jds": [
            {"id": j.id, "company_name": j.company_name, "role": j.role, "deadline": j.deadline}
            for j in jds
        ],
    }


# ======================================================
# RESUME UPLOAD + AI PARSING
# ======================================================
@app.post("/api/resume/upload/{register_number}")
async def upload_resume(
    register_number: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Students can only upload their own resume
    if current_user["role"] == "Student":
        if current_user.get("register_number") != register_number:
            raise HTTPException(status_code=403, detail="You can only upload your own resume")

    student = db.query(models.Student).filter(
        models.Student.register_number == register_number
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if not file.filename.lower().endswith((".pdf", ".docx", ".txt")):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, or TXT supported")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    try:
        parsed = resume_parser.parse_resume(contents, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    existing_skills = set()
    if student.skills:
        existing_skills = set(s.strip() for s in student.skills.split(",") if s.strip())
    new_skills = set(parsed["skills"])
    all_skills = sorted(existing_skills | new_skills)
    student.skills = ",".join(all_skills)

    if parsed["cgpa"] > 0:
        student.cgpa = parsed["cgpa"]
    if parsed["email"] and not student.email:
        student.email = parsed["email"]

    db.commit()
    db.refresh(student)

    return {
        "message": "Resume parsed successfully",
        "student_name": student.name,
        "register_number": student.register_number,
        "skills_found": parsed["skills"],
        "total_skills_after_merge": all_skills,
        "cgpa": student.cgpa,
        "email": student.email,
        "phone": parsed["phone"],
        "skills_added_count": len(new_skills - existing_skills),
        "raw_text_length": parsed["raw_text_length"],
    }


# ======================================================
# AI SHORTLISTING
# ======================================================
@app.post("/api/match/ai-shortlist/{jd_id}")
def ai_shortlist(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Placement Officer", "Admin", "Recruiter"])),
):
    jd = db.query(models.JobDescription).filter(models.JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="JD not found")

    jd_skills = [s.strip().lower() for s in jd.actionable_skills.split(",") if s.strip()]
    if not jd_skills:
        return {"jd": jd.company_name, "recommended": [], "all_ranked": []}

    students = db.query(models.Student).all()
    ranked = []

    for student in students:
        student_skills = [s.strip().lower() for s in (student.skills or "").split(",") if s.strip()]

        matched = [s for s in jd_skills if s in student_skills]
        missing = [s for s in jd_skills if s not in student_skills]
        skill_match_pct = (len(matched) / len(jd_skills)) * 100 if jd_skills else 0
        skill_score = (skill_match_pct / 100) * 60

        cgpa = student.cgpa or 0
        cgpa_score = min(25, (cgpa / 10) * 25)

        readiness = max(0, 100 - (len(missing) * 20))
        readiness_score = (readiness / 100) * 15

        total = round(skill_score + cgpa_score + readiness_score, 1)

        if total >= 80 and len(missing) == 0:
            tier = "Strongly Recommended"
        elif total >= 65:
            tier = "Recommended"
        elif total >= 50:
            tier = "Consider"
        else:
            tier = "Not Recommended"

        ranked.append({
            "student_id": student.id,
            "name": student.name,
            "register_number": student.register_number,
            "department": student.department,
            "cgpa": cgpa,
            "skills": [s.strip() for s in (student.skills or "").split(",") if s.strip()],
            "matched_skills": [s.strip() for s in matched],
            "missing_skills": [s.strip() for s in missing],
            "skill_match_pct": round(skill_match_pct, 1),
            "ai_score": total,
            "tier": tier,
        })

    ranked.sort(key=lambda x: x["ai_score"], reverse=True)
    recommended = [r for r in ranked if r["tier"] in ("Strongly Recommended", "Recommended")]

    return {
        "jd_id": jd.id,
        "company_name": jd.company_name,
        "role": jd.role,
        "required_skills": jd_skills,
        "total_students": len(students),
        "recommended_count": len(recommended),
        "recommended": recommended,
        "all_ranked": ranked,
    }


# ======================================================
# RECRUITER SHORTLIST — Pipeline
# ======================================================
VALID_STAGES = ["Shortlisted", "Assessment", "Interview", "Selected", "Rejected"]


@app.post("/api/recruiter/shortlist", response_model=schemas.ShortlistOut)
def add_to_shortlist(
    payload: schemas.ShortlistCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Recruiter", "Placement Officer", "Admin", "HOD/Admin"])),
):
    student = db.query(models.Student).filter(models.Student.id == payload.student_id).first()
    jd = db.query(models.JobDescription).filter(models.JobDescription.id == payload.jd_id).first()
    if not student or not jd:
        raise HTTPException(status_code=404, detail="Student or JD not found")

    existing = db.query(models.Shortlist).filter(
        models.Shortlist.student_id == payload.student_id,
        models.Shortlist.jd_id == payload.jd_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student already in shortlist for this JD")

    entry = models.Shortlist(
        student_id=payload.student_id,
        jd_id=payload.jd_id,
        recruiter_id=current_user["id"],
        stage="Shortlisted",
        notes=payload.notes or "",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    skills = [s.strip() for s in (student.skills or "").split(",") if s.strip()]

    return {
        "id": entry.id,
        "student_id": student.id,
        "student_name": student.name,
        "register_number": student.register_number,
        "department": student.department,
        "cgpa": student.cgpa,
        "skills": skills,
        "jd_id": entry.jd_id,
        "stage": entry.stage,
        "notes": entry.notes,
        "created_at": entry.created_at,
    }


@app.get("/api/recruiter/shortlist/{jd_id}")
def get_shortlist(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Recruiter", "Placement Officer", "Admin", "HOD/Admin"])),
):
    entries = db.query(models.Shortlist).filter(models.Shortlist.jd_id == jd_id).all()

    result = []
    for e in entries:
        student = db.query(models.Student).filter(models.Student.id == e.student_id).first()
        if not student:
            continue
        result.append({
            "id": e.id,
            "student_id": student.id,
            "student_name": student.name,
            "register_number": student.register_number,
            "department": student.department,
            "cgpa": student.cgpa,
            "skills": [s.strip() for s in (student.skills or "").split(",") if s.strip()],
            "jd_id": e.jd_id,
            "stage": e.stage,
            "notes": e.notes,
            "created_at": e.created_at,
        })

    grouped = {stage: [] for stage in VALID_STAGES}
    for item in result:
        if item["stage"] in grouped:
            grouped[item["stage"]].append(item)

    return {"jd_id": jd_id, "total": len(result), "grouped": grouped, "all": result}


@app.patch("/api/recruiter/shortlist/{shortlist_id}")
def update_shortlist(
    shortlist_id: int,
    payload: schemas.ShortlistUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Recruiter", "Placement Officer", "Admin", "HOD/Admin"])),
):
    entry = db.query(models.Shortlist).filter(models.Shortlist.id == shortlist_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Shortlist entry not found")

    if payload.stage:
        if payload.stage not in VALID_STAGES:
            raise HTTPException(status_code=400, detail=f"Invalid stage. Use: {', '.join(VALID_STAGES)}")
        entry.stage = payload.stage
    if payload.notes is not None:
        entry.notes = payload.notes

    entry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return {"message": "Updated", "stage": entry.stage}


@app.delete("/api/recruiter/shortlist/{shortlist_id}")
def remove_from_shortlist(
    shortlist_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Recruiter", "Placement Officer", "Admin", "HOD/Admin"])),
):
    entry = db.query(models.Shortlist).filter(models.Shortlist.id == shortlist_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")

    db.delete(entry)
    db.commit()
    return {"message": "Removed from shortlist"}


@app.get("/api/recruiter/shortlist-available/{jd_id}")
def available_candidates(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Recruiter", "Placement Officer", "Admin", "HOD/Admin"])),
):
    shortlisted_ids = {
        s.student_id for s in
        db.query(models.Shortlist).filter(models.Shortlist.jd_id == jd_id).all()
    }

    jd = db.query(models.JobDescription).filter(models.JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="JD not found")

    jd_skills = [s.strip().lower() for s in jd.actionable_skills.split(",") if s.strip()]

    students = db.query(models.Student).all()
    available = []

    for s in students:
        if s.id in shortlisted_ids:
            continue
        student_skills = [sk.strip().lower() for sk in (s.skills or "").split(",") if sk.strip()]
        matched = [sk for sk in jd_skills if sk in student_skills]
        missing = [sk for sk in jd_skills if sk not in student_skills]
        match_pct = (len(matched) / len(jd_skills) * 100) if jd_skills else 0
        ai_score = round(
            (match_pct / 100) * 60 +
            min(25, ((s.cgpa or 0) / 10) * 25) +
            (max(0, 100 - len(missing) * 20) / 100) * 15,
            1
        )
        available.append({
            "student_id": s.id,
            "name": s.name,
            "register_number": s.register_number,
            "department": s.department,
            "cgpa": s.cgpa,
            "skills": [x.strip() for x in (s.skills or "").split(",") if x.strip()],
            "ai_score": ai_score,
            "match_pct": round(match_pct, 1),
        })

    available.sort(key=lambda x: x["ai_score"], reverse=True)
    return {"jd_id": jd_id, "available": available}


# ======================================================
# HOD DEPARTMENT DASHBOARD
# ======================================================
@app.get("/api/hod/department-stats")
def hod_department_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["HOD/Admin", "Admin", "Faculty/Trainer", "Placement Officer"])),
):
    x_user_role = current_user["role"]
    x_user_department = current_user.get("department")

    if not x_user_department and x_user_role != "Admin":
        raise HTTPException(status_code=400, detail="No department assigned to your account")

    dept = (x_user_department or "").upper()

    if x_user_role == "Admin":
        students = db.query(models.Student).all()
    else:
        students = db.query(models.Student).filter(
            models.Student.department == dept
        ).all()

    total_students = len(students)

    all_skills = {}
    for s in students:
        for skill in (s.skills or "").split(","):
            skill = skill.strip()
            if skill:
                all_skills[skill] = all_skills.get(skill, 0) + 1

    top_skills = sorted(all_skills.items(), key=lambda x: x[1], reverse=True)[:10]
    no_skills_count = sum(1 for s in students if not s.skills or not s.skills.strip())

    recent_imports_q = db.query(models.ImportHistory).filter(
        models.ImportHistory.department == dept
    ).order_by(models.ImportHistory.uploaded_at.desc()).limit(5).all()

    recent_imports = [
        {
            "id": h.id,
            "file_name": h.file_name,
            "uploaded_by": h.uploaded_by,
            "new_students": h.new_students,
            "updated_students": h.updated_students,
            "failed_rows": h.failed_rows,
            "uploaded_at": h.uploaded_at,
        }
        for h in recent_imports_q
    ]

    cgpa_ranges = {"9-10": 0, "8-9": 0, "7-8": 0, "6-7": 0, "<6": 0}
    for s in students:
        c = s.cgpa or 0
        if c >= 9: cgpa_ranges["9-10"] += 1
        elif c >= 8: cgpa_ranges["8-9"] += 1
        elif c >= 7: cgpa_ranges["7-8"] += 1
        elif c >= 6: cgpa_ranges["6-7"] += 1
        else: cgpa_ranges["<6"] += 1

    batch_dist = {}
    for s in students:
        b = s.batch or "Unknown"
        batch_dist[b] = batch_dist.get(b, 0) + 1

    return {
        "department": dept or "All",
        "total_students": total_students,
        "no_skills_count": no_skills_count,
        "skills_coverage_pct": round(
            ((total_students - no_skills_count) / total_students * 100) if total_students else 0,
            1
        ),
        "top_skills": [{"skill": k, "count": v} for k, v in top_skills],
        "cgpa_distribution": cgpa_ranges,
        "batch_distribution": batch_dist,
        "recent_imports": recent_imports,
    }


# ======================================================
# TEMPLATE INFO
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