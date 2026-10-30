import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = str(Path(__file__).resolve().parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from database import (
    save_document,
    get_documents,
    get_document_by_id,
    delete_document,
    get_stats,
    get_status,
    try_init_mysql,
    create_user,
    get_user_by_email,
    get_user_by_id,
    get_user_by_session_token,
    delete_session,
    authenticate_email_user,
    authenticate_or_create_google_user,
    create_session,
    create_password_reset,
    verify_password_reset,
    update_user_password,
    DuplicateEmailError
)
import re
import math
from mailer import send_password_reset_email
from parser import extract_text_from_file
from detector import analyze_document_content, split_into_sentences

app = FastAPI(
    title="AI Content Detector Backend API",
    description="Python & MySQL AI Heuristic Analysis Engine for Document Intelligence",
    version="2.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import traceback


def _extract_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    if authorization.startswith("Bearer "):
        return authorization[7:].strip()
    return authorization.strip()


def require_user(authorization: Optional[str] = Header(None)):
    """Dependency: resolves the signed-in user from the session token or returns 401."""
    token = _extract_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required. Please sign in.")
    user = get_user_by_session_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please sign in again.")
    return user


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Print the full traceback in the backend terminal (this is what was missing when sign-up returned a bare 500)
    print(f"\n[ERROR] {request.method} {request.url.path} -> {type(exc).__name__}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server error: {type(exc).__name__}: {exc}"},
    )


class TextAnalysisRequest(BaseModel):
    title: Optional[str] = "Pasted Text Draft"
    text: str

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str
    organization: Optional[str] = "Independent Auditor"
    role: Optional[str] = "Auditor"

class GoogleLoginRequest(BaseModel):
    email: str
    name: Optional[str] = None
    avatar: Optional[str] = None
    organization: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

# ==========================================
# Real Authentication Endpoints (MySQL / SQLite)
# ==========================================

@app.post("/api/auth/login")
def login(payload: LoginRequest):
    email = payload.email.strip()
    password = payload.password
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    result = authenticate_email_user(email, password)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid email or password. Please verify your credentials.")

    user, token = result
    return {
        "success": True,
        "token": token,
        "user": user,
        "message": f"Successfully authenticated as {user['name']}"
    }

@app.post("/api/auth/register")
def register(payload: RegisterRequest):
    email = payload.email.strip().lower()
    name = payload.name.strip()
    password = payload.password

    if not email or not name or not password:
        raise HTTPException(status_code=400, detail="Name, email, and password are required.")

    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    existing = get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email address already exists. Please sign in instead.")

    try:
        user = create_user(
            email=email,
            name=name,
            password=password,
            provider="gmail" if email.endswith("@gmail.com") else "email",
            role=payload.role or "Auditor",
            organization=payload.organization or "Independent Auditor"
        )
    except DuplicateEmailError:
        raise HTTPException(status_code=409, detail="An account with this email address already exists. Please sign in instead.")
    token = create_session(user["id"])
    return {
        "success": True,
        "token": token,
        "user": user,
        "message": "Account created successfully."
    }

@app.post("/api/auth/google")
@app.post("/api/auth/gmail")
def google_login(payload: GoogleLoginRequest):
    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email address is required.")

    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Please provide a valid Gmail/Google email address.")

    user, token = authenticate_or_create_google_user(
        email=email,
        name=payload.name,
        avatar=payload.avatar,
        organization=payload.organization
    )
    return {
        "success": True,
        "token": token,
        "user": user,
        "provider": "gmail",
        "message": f"Welcome, {user['name']}! Signed in with Gmail ({user['email']})."
    }

@app.get("/api/auth/me")
def get_current_user(authorization: Optional[str] = Header(None)):
    token = _extract_token(authorization)

    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required.")

    user = get_user_by_session_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please sign in again.")

    return {
        "authenticated": True,
        "user": user
    }

@app.post("/api/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    token = None
    if authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:].strip()
        else:
            token = authorization.strip()

    if token:
        delete_session(token)

    return {
        "success": True,
        "message": "Successfully logged out."
    }

@app.post("/api/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")

    user = get_user_by_email(email)
    if not user:
        return {
            "success": True,
            "message": "If an account exists with this email, password reset instructions have been sent."
        }

    token = create_password_reset(email)
    sent = send_password_reset_email(to_email=email, reset_token=token)

    return {
        "success": True,
        "deliveredVia": "google_smtp" if sent else "firebase_or_local",
        "message": f"Password reset instructions dispatched to {email}."
    }

@app.post("/api/auth/reset-password")
def reset_password(payload: ResetPasswordRequest):
    token = payload.token.strip()
    new_pwd = payload.password
    if not token or not new_pwd:
        raise HTTPException(status_code=400, detail="Token and new password are required.")

    if len(new_pwd) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    email = verify_password_reset(token)
    if not email:
        raise HTTPException(status_code=400, detail="Reset token is invalid or has expired. Please request a new link.")

    update_user_password(email, new_pwd)
    return {
        "success": True,
        "message": "Password updated successfully. You can now sign in with your new password."
    }

@app.get("/api/health")
def health_check():
    db_status = get_status()
    return {
        "status": "healthy",
        "service": "AI Content Detector Heuristics Core",
        "database": db_status
    }

@app.get("/api/stats")
def fetch_stats(user: dict = Depends(require_user)):
    return get_stats(user["id"])

@app.get("/api/models")
def get_model_benchmarks():
    import json
    meta_path = os.path.join(os.path.dirname(__file__), "models", "model_meta.json")
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"status": "untrained", "comparison": []}

@app.get("/api/documents")
def list_documents(user: dict = Depends(require_user)):
    return get_documents(user["id"])

@app.get("/api/documents/{doc_id}")
def get_document_details(doc_id: str, user: dict = Depends(require_user)):
    # Someone else's document is reported as 404 (does not reveal that it exists)
    doc = get_document_by_id(doc_id, user["id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@app.delete("/api/documents/{doc_id}")
def remove_document(doc_id: str, user: dict = Depends(require_user)):
    success = delete_document(doc_id, user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True, "deletedId": doc_id}

@app.post("/api/analyze/file")
async def analyze_file(file: UploadFile = File(...), user: dict = Depends(require_user)):
    try:
        file_bytes = await file.read()
        file_size_kb = len(file_bytes) / 1024
        file_size_formatted = f"{file_size_kb:.1f} KB" if file_size_kb < 1024 else f"{(file_size_kb/1024):.2f} MB"
        
        filename = file.filename or "uploaded_document"
        ext = filename.split(".")[-1].lower() if "." in filename else "txt"

        # 1. Extract text and sections from file
        sections = extract_text_from_file(file_bytes, filename)

        # 2. Run enhanced statistical & heuristic AI detection
        result = analyze_document_content(
            sections=sections,
            filename=filename,
            file_type=ext.upper(),
            file_size_formatted=file_size_formatted
        )

        # 3. Store result in MySQL database
        save_document(result, user["id"])

        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/analyze/text")
def analyze_text(payload: TextAnalysisRequest, user: dict = Depends(require_user)):
    try:
        text = payload.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Text cannot be empty.")

        # Compute word tokens
        words = re.findall(r"\b[A-Za-z0-9'-]+\b", text)
        word_count = len(words)

        # Enforce Minimum Text Length of 50 words and Maximum of 1,000 words
        if word_count < 50:
            raise HTTPException(
                status_code=400,
                detail=f"Text is too short ({word_count} words). Minimum length is 50 words to accurately calculate burstiness, sentence variance, and Shannon entropy."
            )
        if word_count > 1000:
            raise HTTPException(
                status_code=400,
                detail=f"Text exceeds the 1,000-word limit ({word_count:,} words). Direct paste supports 50 to 1,000 words. For larger documents, please upload as a document file (PDF, DOCX)."
            )

        # Intelligent sectioning for drafts (50 to 1,000 words)
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
        sections = []

        if len(paragraphs) > 1:
            for idx, p in enumerate(paragraphs):
                sections.append({
                    "sectionTitle": f"Section {idx + 1}",
                    "text": p
                })
        else:
            if word_count >= 200:
                raw_sentences = split_into_sentences(text)
                if len(raw_sentences) >= 4:
                    num_groups = min(4, max(2, len(raw_sentences) // 4))
                    chunk_size = math.ceil(len(raw_sentences) / num_groups)
                    titles = [
                        "Opening Section",
                        "Primary Analysis",
                        "Detailed Evidence",
                        "Concluding Remarks"
                    ]
                    for g_idx in range(num_groups):
                        group_sents = raw_sentences[g_idx * chunk_size : (g_idx + 1) * chunk_size]
                        if group_sents:
                            title = titles[g_idx] if g_idx < len(titles) else f"Part {g_idx + 1}"
                            sections.append({
                                "sectionTitle": title,
                                "text": " ".join(group_sents)
                            })
                else:
                    sections = [{"sectionTitle": "Draft Body", "text": text}]
            else:
                sections = [{"sectionTitle": "Draft Body", "text": text}]

        result = analyze_document_content(
            sections=sections,
            filename=f"{payload.title or 'Pasted Draft'}.txt",
            file_type="TXT",
            file_size_formatted=f"{len(text.encode('utf-8')) / 1024:.1f} KB"
        )
        save_document(result, user["id"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
