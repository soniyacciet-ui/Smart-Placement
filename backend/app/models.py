from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False, default="dummy")
    role = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    cgpa = Column(Float, nullable=False)
    skills = Column(String, nullable=False)  # comma-separated: "SQL,Python"
    department = Column(String, default="CSE")
    batch = Column(String, default="2026")


class JobDescription(Base):
    __tablename__ = "job_descriptions"
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    hard_eligibility = Column(String, default="")
    actionable_skills = Column(String, nullable=False)  # "SQL,Python,Aptitude"
    preferred_skills = Column(String, default="")
    deadline = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class MatchResult(Base):
    __tablename__ = "match_results"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    jd_id = Column(Integer, ForeignKey("job_descriptions.id"))
    status = Column(String)         # Ready / Recoverable / Blocked
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