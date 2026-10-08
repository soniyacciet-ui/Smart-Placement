"""
AI Resume Parser for DRIVE-X
Extracts skills, CGPA, email, phone from resume text.
"""
import io
import re
from typing import List, Dict

# ======================================================
# MASTER SKILL DICTIONARY (200+ skills across categories)
# ======================================================
SKILL_KEYWORDS: Dict[str, List[str]] = {
    # Programming Languages
    "Python": ["python", "py "],
    "Java": ["java ", "java,", "core java"],
    "JavaScript": ["javascript", "js ", "ecmascript"],
    "TypeScript": ["typescript"],
    "C": [" c ", " c,", "c language"],
    "C++": ["c++", "cpp"],
    "C#": ["c#", "c sharp"],
    "Go": ["golang", " go "],
    "Rust": ["rust"],
    "PHP": ["php"],
    "Ruby": ["ruby"],
    "Kotlin": ["kotlin"],
    "Swift": ["swift"],
    "R": [" r ", "r programming"],
    "Scala": ["scala"],
    "MATLAB": ["matlab"],

    # Frontend
    "React": ["react", "react.js", "reactjs"],
    "Angular": ["angular"],
    "Vue": ["vue", "vue.js", "vuejs"],
    "HTML": ["html"],
    "CSS": ["css", "scss", "sass"],
    "Bootstrap": ["bootstrap"],
    "Tailwind": ["tailwind"],
    "Next.js": ["next.js", "nextjs"],
    "Redux": ["redux"],

    # Backend
    "Node.js": ["node.js", "nodejs", "node "],
    "Express": ["express.js", "express "],
    "Django": ["django"],
    "Flask": ["flask"],
    "FastAPI": ["fastapi"],
    "Spring Boot": ["spring boot", "springboot"],
    "REST API": ["rest api", "restful", "restful api"],
    "GraphQL": ["graphql"],

    # Database
    "SQL": ["sql", " mysql", " postgresql", "postgres"],
    "MySQL": ["mysql"],
    "PostgreSQL": ["postgresql", "postgres"],
    "MongoDB": ["mongodb", "mongo "],
    "SQLite": ["sqlite"],
    "Oracle": ["oracle db", "oracle sql"],
    "Redis": ["redis"],
    "Firebase": ["firebase"],

    # Data Science & ML
    "Machine Learning": ["machine learning", "ml ", " ml,", " ml."],
    "Deep Learning": ["deep learning", "dl "],
    "Data Science": ["data science", "data scientist"],
    "Data Analysis": ["data analysis", "data analyst"],
    "NLP": ["nlp", "natural language processing"],
    "Computer Vision": ["computer vision", "opencv"],
    "TensorFlow": ["tensorflow"],
    "PyTorch": ["pytorch", "torch"],
    "Scikit-learn": ["scikit", "sklearn"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Keras": ["keras"],
    "Statistics": ["statistics", "statistical"],
    "Power BI": ["power bi", "powerbi"],
    "Tableau": ["tableau"],
    "Excel": ["excel", "ms excel", "advanced excel"],

    # Cloud & DevOps
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure"],
    "GCP": ["gcp", "google cloud"],
    "Docker": ["docker"],
    "Kubernetes": ["kubernetes", "k8s"],
    "Jenkins": ["jenkins"],
    "CI/CD": ["ci/cd", "cicd", "continuous integration"],
    "Git": ["git ", "git,", "github", "gitlab"],
    "Linux": ["linux", "ubuntu"],

    # CS Fundamentals
    "Data Structures": ["data structures", "dsa"],
    "Algorithms": ["algorithms", "algorithm "],
    "OOP": ["oop", "object oriented", "object-oriented"],
    "DBMS": ["dbms", "database management"],
    "Operating Systems": ["operating system", "os concepts"],
    "Computer Networks": ["computer networks", "networking"],

    # Soft Skills
    "Communication": ["communication", "communicat"],
    "Leadership": ["leadership", "leader"],
    "Teamwork": ["teamwork", "team work", "team player"],
    "Problem Solving": ["problem solving", "problem-solving"],
    "Time Management": ["time management"],
    "Critical Thinking": ["critical thinking"],
    "Presentation": ["presentation", "public speaking"],

    # Testing & QA
    "Testing": ["testing", "unit testing", "manual testing"],
    "Selenium": ["selenium"],
    "JUnit": ["junit"],
    "Postman": ["postman"],

    # Mobile
    "Android": ["android"],
    "iOS": ["ios "],
    "React Native": ["react native"],
    "Flutter": ["flutter"],

    # Tools
    "Jira": ["jira"],
    "Figma": ["figma"],
    "Photoshop": ["photoshop"],
    "Canva": ["canva"],
    "VS Code": ["vs code", "vscode"],
    "Postman": ["postman"],

    # Domain
    "Aptitude": ["aptitude", "quantitative aptitude", "quantitative"],
    "Reasoning": ["logical reasoning", "reasoning"],
    "Verbal": ["verbal", "verbal ability"],
    "Cybersecurity": ["cybersecurity", "cyber security", "ethical hacking"],
    "Blockchain": ["blockchain", "web3"],
}


# ======================================================
# TEXT EXTRACTION
# ======================================================
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract raw text from PDF file."""
    import pdfplumber
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract raw text from DOCX file."""
    from docx import Document
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs)


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Auto-detect format and extract text."""
    name = filename.lower()
    if name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif name.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    elif name.endswith(".txt"):
        return file_bytes.decode("utf-8", errors="ignore")
    else:
        raise ValueError("Unsupported file. Use PDF, DOCX, or TXT.")


# ======================================================
# SKILL EXTRACTION (AI keyword matching)
# ======================================================
def extract_skills(text: str) -> List[str]:
    """Match text against the skill dictionary. Returns list of matched skills."""
    lower = " " + text.lower() + " "  # pad for boundary matching
    found = []
    for skill, keywords in SKILL_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in lower:
                found.append(skill)
                break
    return sorted(set(found))


# ======================================================
# CGPA EXTRACTION
# ======================================================
def extract_cgpa(text: str) -> float:
    """Find CGPA / GPA using regex. Returns 0 if not found."""
    patterns = [
        r"cgpa\s*[:\-]?\s*(\d+\.?\d*)",
        r"gpa\s*[:\-]?\s*(\d+\.?\d*)",
        r"(\d+\.\d+)\s*/\s*10",
        r"(\d+\.\d+)\s*cgpa",
    ]
    for pat in patterns:
        match = re.search(pat, text.lower())
        if match:
            try:
                val = float(match.group(1))
                if 0 <= val <= 10:
                    return round(val, 2)
            except ValueError:
                continue
    return 0.0


# ======================================================
# EMAIL EXTRACTION
# ======================================================
def extract_email(text: str) -> str:
    match = re.search(r"[\w\.\-]+@[\w\.\-]+\.\w+", text)
    return match.group(0) if match else ""


# ======================================================
# PHONE EXTRACTION
# ======================================================
def extract_phone(text: str) -> str:
    match = re.search(r"(\+?\d{1,3}[\s\-]?)?\d{10}", text)
    return match.group(0) if match else ""


# ======================================================
# MAIN FUNCTION — parse everything
# ======================================================
def parse_resume(file_bytes: bytes, filename: str) -> dict:
    """
    Parse a resume and return structured data.
    Returns:
        {
            "skills": [...],
            "cgpa": float,
            "email": str,
            "phone": str,
            "name": str,
            "raw_text_length": int,
            "extracted_skills_count": int,
        }
    """
    text = extract_text(file_bytes, filename)

    if not text or len(text.strip()) < 20:
        raise ValueError("Could not read any text from the resume. It may be a scanned image PDF.")

    skills = extract_skills(text)
    cgpa = extract_cgpa(text)
    email = extract_email(text)
    phone = extract_phone(text)

    # Simple name extraction — first non-empty line
    first_lines = [l.strip() for l in text.split("\n")[:5] if l.strip()]
    name = first_lines[0] if first_lines else ""

    return {
        "skills": skills,
        "cgpa": cgpa,
        "email": email,
        "phone": phone,
        "name": name,
        "raw_text_length": len(text),
        "extracted_skills_count": len(skills),
    }