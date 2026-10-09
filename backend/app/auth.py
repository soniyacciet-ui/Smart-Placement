"""
JWT Authentication for DRIVE-X
Replaces the x-user-role header trust model with real signed tokens.
"""
import os
from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from .database import get_db
from . import models

# ---- Config (loaded from .env if present) ----
SECRET_KEY = os.getenv("SECRET_KEY", "drivex-dev-secret-change-in-production-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8


# ======================================================
# TOKEN CREATION
# ======================================================
def create_access_token(user: models.User) -> str:
    """Generate a JWT with user's role, department, and id encoded."""
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "department": user.department,
        "name": user.name,
        "email": user.email,
        "login_id": user.login_id,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_student_token(student: models.Student) -> str:
    """Generate a JWT for a student (they login via register_number)."""
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(student.id),
        "role": "Student",
        "department": student.department,
        "name": student.name,
        "register_number": student.register_number,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ======================================================
# TOKEN VERIFICATION
# ======================================================
def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ======================================================
# FASTAPI DEPENDENCY — extracts current user from request
# ======================================================
def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> dict:
    """
    Extracts the user from the JWT in the Authorization header.
    Returns: { id, role, department, name, email, register_number? }
    Raises: 401 if missing or invalid.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.replace("Bearer ", "").strip()
    payload = decode_token(token)

    # Students come from the Student table, staff from User table
    if payload.get("role") == "Student":
        return {
            "id": int(payload["sub"]),
            "role": "Student",
            "department": payload.get("department"),
            "name": payload.get("name"),
            "register_number": payload.get("register_number"),
        }

    # Staff — fetch fresh from DB to catch deactivated accounts
    user = db.query(models.User).filter(models.User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    if user.status == "Inactive":
        raise HTTPException(status_code=403, detail="Account is deactivated")

    return {
        "id": user.id,
        "role": user.role,
        "department": user.department,
        "name": user.name,
        "email": user.email,
        "login_id": user.login_id,
    }


# ======================================================
# ROLE GUARD — dependency factory
# ======================================================
def require_roles(allowed_roles: List[str]):
    """
    Usage:
        @app.get("/admin-only", dependencies=[Depends(require_roles(["Admin"]))])
        def admin_endpoint():
            ...
    """
    def checker(current_user: dict = Depends(get_current_user)):
        role = current_user["role"]
        # Normalize Faculty/Trainer → Trainer as we did before
        normalized = "Trainer" if role == "Faculty/Trainer" else ("Admin" if role == "HOD/Admin" else role)
        normalized_allowed = [
            "Trainer" if r == "Faculty/Trainer" else ("Admin" if r == "HOD/Admin" else r)
            for r in allowed_roles
        ]
        if normalized not in normalized_allowed:
            raise HTTPException(status_code=403, detail=f"Requires role: {', '.join(allowed_roles)}")
        return current_user
    return checker
