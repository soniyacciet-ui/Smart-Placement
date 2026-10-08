"""
Excel handler for DRIVE-X student data import.
Validates .xlsx files and returns structured preview data.
"""
import io
import uuid
from typing import Dict, List
from openpyxl import load_workbook
from sqlalchemy.orm import Session
from . import models


# In-memory preview cache (token → preview data)
PREVIEW_CACHE: Dict[str, dict] = {}


# Column names required in Excel (lowercase with underscores)
REQUIRED_COLUMNS = ["name", "register_number", "email", "cgpa", "department"]


def _normalize_header(h) -> str:
    """Convert 'Register Number' → 'register_number'"""
    return str(h).strip().lower().replace(" ", "_")


def parse_and_validate(file_bytes: bytes, department: str, db: Session) -> dict:
    """
    Reads Excel from bytes, validates rows, returns preview data.
    Does NOT save anything to the database.
    """
    try:
        wb = load_workbook(io.BytesIO(file_bytes), data_only=True)
        ws = wb.active
    except Exception as e:
        raise ValueError(f"Could not read Excel file: {e}")

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        raise ValueError("Excel file is empty")

    header = [_normalize_header(c) for c in rows[0]]

    missing = [c for c in REQUIRED_COLUMNS if c not in header]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")

    col_index = {name: header.index(name) for name in REQUIRED_COLUMNS}
    # Skills is optional
    skills_idx = header.index("skills") if "skills" in header else None

    # Existing students in this department
    existing = {
        s.register_number: s
        for s in db.query(models.Student).filter(models.Student.department == department).all()
        if s.register_number
    }

    # All students globally (to prevent cross-dept duplicate register numbers)
    global_existing = {
        s.register_number: s
        for s in db.query(models.Student).all()
        if s.register_number
    }

    preview_rows: List[dict] = []
    seen_in_file: set = set()

    total = 0
    valid = 0
    invalid = 0
    duplicates = 0
    new_students = 0
    updated_students = 0

    for row_idx, raw_row in enumerate(rows[1:], start=2):
        # Skip fully empty rows
        if not raw_row or all(c is None or str(c).strip() == "" for c in raw_row):
            continue

        total += 1

        def get(col_name):
            idx = col_index[col_name]
            return raw_row[idx] if idx < len(raw_row) else None

        name = str(get("name") or "").strip()
        reg_no = str(get("register_number") or "").strip()
        email = str(get("email") or "").strip()
        cgpa_raw = get("cgpa")
        dept = str(get("department") or "").strip().upper() or department.upper()

        # Skills (optional)
        skills_raw = ""
        if skills_idx is not None and skills_idx < len(raw_row):
            skills_raw = str(raw_row[skills_idx] or "").strip()
        skills_clean = ",".join([s.strip() for s in skills_raw.split(",") if s.strip()])

        # Validation
        error = None
        cgpa_val = None
        if not name:
            error = "Missing Name"
        elif not reg_no:
            error = "Missing Register Number"
        elif not email or "@" not in email:
            error = "Invalid Email"
        elif cgpa_raw is None or str(cgpa_raw).strip() == "":
            error = "Missing CGPA"
        else:
            try:
                cgpa_val = float(cgpa_raw)
                if cgpa_val < 0 or cgpa_val > 10:
                    error = "CGPA must be between 0 and 10"
            except (ValueError, TypeError):
                error = "Invalid CGPA"

        # Department check
        if not error and dept.upper() != department.upper():
            error = f"Department mismatch (row: {dept}, expected: {department})"

        # Duplicate within file
        if not error and reg_no in seen_in_file:
            error = "Duplicate Register Number in Excel"
            duplicates += 1

        # Invalid row
        if error:
            invalid += 1
            preview_rows.append({
                "row_number": row_idx,
                "name": name or None,
                "register_number": reg_no or None,
                "email": email or None,
                "cgpa": cgpa_val,
                "department": dept,
                "skills": skills_clean,
                "status": "Invalid",
                "reason": error,
            })
            continue

        # Check DB
        seen_in_file.add(reg_no)
        if reg_no in global_existing:
            # Belongs to another department
            if global_existing[reg_no].department != department:
                invalid += 1
                preview_rows.append({
                    "row_number": row_idx,
                    "name": name,
                    "register_number": reg_no,
                    "email": email,
                    "cgpa": cgpa_val,
                    "department": dept,
                    "skills": skills_clean,
                    "status": "Invalid",
                    "reason": f"Register Number belongs to {global_existing[reg_no].department}",
                })
                continue

            # Existing in this department → UPDATE
            updated_students += 1
            preview_rows.append({
                "row_number": row_idx,
                "name": name,
                "register_number": reg_no,
                "email": email,
                "cgpa": cgpa_val,
                "department": dept,
                "skills": skills_clean,
                "status": "Update",
                "reason": "Existing student will be updated",
            })
        else:
            # New student
            new_students += 1
            valid += 1
            preview_rows.append({
                "row_number": row_idx,
                "name": name,
                "register_number": reg_no,
                "email": email,
                "cgpa": cgpa_val,
                "department": dept,
                "skills": skills_clean,
                "status": "Valid",
                "reason": None,
            })

    # Cache preview for the confirm step
    token = str(uuid.uuid4())
    PREVIEW_CACHE[token] = {
        "department": department,
        "rows": preview_rows,
    }

    return {
        "total_rows": total,
        "valid_rows": valid,
        "invalid_rows": invalid,
        "duplicate_rows": duplicates,
        "new_students": new_students,
        "updated_students": updated_students,
        "rows": preview_rows,
        "token": token,
    }


def commit_import(token: str, db: Session) -> dict:
    """
    Reads the cached preview and commits all Valid + Update rows to the database.
    Runs inside a single transaction.
    """
    cached = PREVIEW_CACHE.get(token)
    if not cached:
        raise ValueError("Preview session expired or invalid")

    department = cached["department"]
    rows = cached["rows"]

    inserted = 0
    updated = 0
    failed = 0
    skipped = 0
    errors = []

    try:
        for row in rows:
            status = row["status"]

            if status == "Invalid":
                failed += 1
                errors.append(row)
                continue

            if status == "Duplicate":
                skipped += 1
                continue

            reg_no = row["register_number"]

            if status == "Valid":
                new_student = models.Student(
                    name=row["name"],
                    register_number=reg_no,
                    email=row["email"],
                    cgpa=row["cgpa"],
                    department=department,
                    skills=row.get("skills", ""),
                )
                db.add(new_student)
                inserted += 1

            elif status == "Update":
                student = db.query(models.Student).filter(
                    models.Student.register_number == reg_no
                ).first()
                if student:
                    student.name = row["name"]
                    student.email = row["email"]
                    student.cgpa = row["cgpa"]
                    student.department = department
                    student.skills = row.get("skills", "")
                    updated += 1
                else:
                    new_student = models.Student(
                        name=row["name"],
                        register_number=reg_no,
                        email=row["email"],
                        cgpa=row["cgpa"],
                        department=department,
                        skills=row.get("skills", ""),
                    )
                    db.add(new_student)
                    inserted += 1

        db.commit()
        PREVIEW_CACHE.pop(token, None)
    except Exception as e:
        db.rollback()
        raise ValueError(f"Database error during import: {e}")

    return {
        "total": len(rows),
        "new_students": inserted,
        "updated_students": updated,
        "failed": failed,
        "skipped": skipped,
        "errors": errors,
    }