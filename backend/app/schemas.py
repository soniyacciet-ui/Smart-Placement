from pydantic import BaseModel, EmailStr
from typing import Optional, List


class LoginRequest(BaseModel):
    email: str
    password: str
    role: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int


class StudentOut(BaseModel):
    id: int
    name: str
    cgpa: float
    skills: List[str]
    department: Optional[str] = "CSE"
    batch: Optional[str] = "2026"

    class Config:
        from_attributes = True


class JDCreate(BaseModel):
    company_name: str
    role: str
    hard_eligibility: Optional[str] = ""
    actionable_skills: str
    preferred_skills: Optional[str] = ""
    deadline: Optional[str] = ""


class JDOut(BaseModel):
    id: int
    company_name: str
    role: str
    hard_eligibility: str
    actionable_skills: str
    preferred_skills: str
    deadline: str

    class Config:
        from_attributes = True


class MatchResultOut(BaseModel):
    id: int
    student_id: int
    jd_id: int
    student_name: str
    cgpa: float
    skills: List[str]
    status: str
    missing_skills: List[str]
    readiness_score: float


class InterventionOut(BaseModel):
    id: int
    name: str
    target_skill: str
    impact: int
    duration: int
    cost: int
    trainers_needed: int

    class Config:
        from_attributes = True


class SimulatorRequest(BaseModel):
    jd_id: int
    selected_intervention_ids: List[int]


class OptimizerRequest(BaseModel):
    jd_id: int
    max_budget: int
    max_trainers: int