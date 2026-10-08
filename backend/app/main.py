from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas
from .database import engine, get_db, SessionLocal
from .seed import seed_database

# Create tables
models.Base.metadata.create_all(bind=engine)

# Seed initial data
db = SessionLocal()
seed_database(db)
db.close()

app = FastAPI(title="DRIVE-X API", version="1.0.0")

# CORS - allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================================================
# HEALTH
# ======================================================
@app.get("/")
def root():
    return {"message": "DRIVE-X Backend is running!"}


@app.get("/api/health")
def health():
    return {"status": "healthy", "backend": "DRIVE-X", "version": "1.0.0"}


# ======================================================
# AUTH
# ======================================================
@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login(user: schemas.LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user:
        db_user = models.User(email=user.email, role=user.role)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    return {
        "access_token": "dummy-token",
        "token_type": "bearer",
        "role": db_user.role,
        "user_id": db_user.id,
    }


# ======================================================
# STUDENTS
# ======================================================
@app.get("/api/students")
def list_students(db: Session = Depends(get_db)):
    students = db.query(models.Student).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "cgpa": s.cgpa,
            "skills": s.skills.split(","),
            "department": s.department,
            "batch": s.batch,
        }
        for s in students
    ]


# ======================================================
# INTERVENTIONS
# ======================================================
@app.get("/api/interventions", response_model=List[schemas.InterventionOut])
def list_interventions(db: Session = Depends(get_db)):
    return db.query(models.Intervention).all()


# ======================================================
# JOB DESCRIPTIONS
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
# MATCHING ENGINE
# Mirrors mockRunMatching from frontend
# ======================================================
@app.post("/api/match/run/{jd_id}")
def run_matching(jd_id: int, db: Session = Depends(get_db)):
    jd = db.query(models.JobDescription).filter(models.JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="JD not found")

    # Clear old matches for this JD
    db.query(models.MatchResult).filter(models.MatchResult.jd_id == jd_id).delete()

    students = db.query(models.Student).all()
    jd_skills = [s.strip() for s in jd.actionable_skills.split(",") if s.strip()]
    results = []

    for student in students:
        student_skills = [s.strip() for s in student.skills.split(",") if s.strip()]
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
            "skills": [s.strip() for s in student.skills.split(",") if s.strip()],
            "status": m.status,
            "missing_skills": [s for s in m.missing_skills.split(",") if s],
            "readiness_score": m.readiness_score,
        })
    return output


# ======================================================
# RECOVERY ENGINE
# Mirrors mockRunRecovery
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
# WHAT-IF SIMULATOR
# Mirrors mockRunSimulator
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
        missing = set(s for s in m.missing_skills.split(",") if s)

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
# Mirrors mockRunOptimizer
# ======================================================
@app.post("/api/optimizer/run")
def run_optimizer(payload: schemas.OptimizerRequest, db: Session = Depends(get_db)):
    interventions = db.query(models.Intervention).all()

    # Sort by impact/cost ratio descending
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