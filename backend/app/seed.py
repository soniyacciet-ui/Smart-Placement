from sqlalchemy.orm import Session
from . import models


STUDENTS = [
    {"name": "Alice Smith",   "cgpa": 8.5, "skills": "SQL,Python,Aptitude,Communication"},
    {"name": "Bob Jones",     "cgpa": 7.2, "skills": "Python,Communication"},
    {"name": "Charlie Brown", "cgpa": 6.5, "skills": "SQL"},
    {"name": "Diana Prince",  "cgpa": 9.0, "skills": "SQL,Python,Aptitude"},
    {"name": "Ethan Hunt",    "cgpa": 8.0, "skills": "Aptitude,Communication"},
]

INTERVENTIONS = [
    {"name": "SQL Training",           "target_skill": "SQL",           "impact": 25, "duration": 5, "cost": 10, "trainers_needed": 1},
    {"name": "Aptitude Training",      "target_skill": "Aptitude",      "impact": 20, "duration": 3, "cost": 8,  "trainers_needed": 1},
    {"name": "Python Bootcamp",        "target_skill": "Python",        "impact": 30, "duration": 7, "cost": 15, "trainers_needed": 2},
    {"name": "Communication Workshop", "target_skill": "Communication", "impact": 15, "duration": 2, "cost": 5,  "trainers_needed": 1},
]


def seed_database(db: Session):
    # Only seed if empty
    if db.query(models.Student).count() == 0:
        for s in STUDENTS:
            db.add(models.Student(**s))
        print("✅ Seeded 5 students")

    if db.query(models.Intervention).count() == 0:
        for i in INTERVENTIONS:
            db.add(models.Intervention(**i))
        print("✅ Seeded 4 interventions")

    db.commit()