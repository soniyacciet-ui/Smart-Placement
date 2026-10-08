from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False, default="dummy")
    role = Column(String, nullable=False)
    # NEW FIELDS:
    name = Column(String, nullable=True)
    login_id = Column(String, unique=True, nullable=True, index=True)
    department = Column(String, nullable=True)       # AIDS, CSE, ECE, etc.
    employee_id = Column(String, nullable=True)
    status = Column(String, default="Active")        # Active / Inactive
    created_at = Column(DateTime, default=datetime.utcnow)


class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    cgpa = Column(Float, nullable=False)
    skills = Column(String, nullable=False)          # comma-separated
    # NEW FIELDS:
    register_number = Column(String, unique=True, nullable=True, index=True)
    email = Column(String, nullable=True)
    department = Column(String, nullable=True, index=True)   # NEW
    batch = Column(String, default="2026")
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)


class JobDescription(Base):
    __tablename__ = "job_descriptions"
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    hard_eligibility = Column(String, default="")
    actionable_skills = Column(String, nullable=False)
    preferred_skills = Column(String, default="")
    deadline = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class MatchResult(Base):
    __tablename__ = "match_results"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    jd_id = Column(Integer, ForeignKey("job_descriptions.id"))
    status = Column(String)
    missing_skills = Column(String, default="")
    readiness_score = Column(Float, default=0.0)


class Intervention(Base):
    __tablename__ = "interventions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    target_skill = Column(String, nullable=False)
    impact = Column(Integer, nullable=False)
    duration = Column(Integer, nullable=False)
    cost = Column(Integer, nullable=False)
    trainers_needed = Column(Integer, default=1)


# ============================================
# NEW MODEL — Import History
# ============================================
class ImportHistory(Base):
    __tablename__ = "import_history"
    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, nullable=False)
    uploaded_by = Column(String, nullable=False)     # Login ID
    role = Column(String, nullable=False)
    department = Column(String, nullable=False)
    total_rows = Column(Integer, default=0)
    new_students = Column(Integer, default=0)
    updated_students = Column(Integer, default=0)
    failed_rows = Column(Integer, default=0)
    status = Column(String, default="Completed")
    uploaded_at = Column(DateTime, default=datetime.utcnow)