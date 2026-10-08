from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ============================================
# AUTH
# ============================================
class LoginRequest(BaseModel):
    email: Optional[str] = None
    login_id: Optional[str] = None       # NEW
    register_number: Optional[str] = None  # NEW
    password: str
    role: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    department: Optional[str] = None
    name: Optional[str] = None


# ============================================
# STUDENTS
# ============================================
class StudentOut(BaseModel):
    id: int
    name: str
    cgpa: float
    skills: List[str]
    register_number: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    batch: Optional[str] = "2026"
    status: Optional[str] = "Active"

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


# ============================================
# NEW — USER MANAGEMENT (Admin)
# ============================================
class CreateUserRequest(BaseModel):
    name: str
    login_id: str
    email: str
    password: str
    role: str                    # Staff / HOD / Placement Officer
    department: str              # AIDS / CSE / ECE / etc.
    employee_id: Optional[str] = None


class UserOut(BaseModel):
    id: int
    name: Optional[str] = None
    login_id: Optional[str] = None
    email: str
    role: str
    department: Optional[str] = None
    employee_id: Optional[str] = None
    status: Optional[str] = "Active"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ToggleStatusRequest(BaseModel):
    status: str                  # Active / Inactive


class ResetPasswordRequest(BaseModel):
    new_password: str


# ============================================
# NEW — EXCEL IMPORT
# ============================================
class ImportPreviewRow(BaseModel):
    row_number: int
    name: Optional[str] = None
    register_number: Optional[str] = None
    email: Optional[str] = None
    cgpa: Optional[float] = None
    department: Optional[str] = None
    status: str                  # Valid / Invalid / Duplicate / Update
    reason: Optional[str] = None


class ImportPreviewResponse(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    duplicate_rows: int
    new_students: int
    updated_students: int
    rows: List[ImportPreviewRow]
    token: str                   # Temporary token to identify this preview session


class ImportConfirmRequest(BaseModel):
    token: str                   # The token from preview
    file_name: str


class ImportResultResponse(BaseModel):
    total: int
    new_students: int
    updated_students: int
    failed: int
    skipped: int
    errors: List[ImportPreviewRow]