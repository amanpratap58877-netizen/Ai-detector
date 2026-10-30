import os
import json
import sqlite3
import datetime
import hashlib
import secrets
import uuid
import hmac
from typing import Optional, Dict, Any, Tuple
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "ai_detector")

DB_DRIVER = "sqlite" # 'mysql' or 'sqlite'
# Store SQLite DB outside OneDrive sync folder to prevent Windows file locking contention
_local_appdata = os.environ.get("LOCALAPPDATA")
if _local_appdata:
    DB_DIR = os.path.join(_local_appdata, "ai_detector_db")
else:
    DB_DIR = os.path.join(os.path.dirname(__file__), "storage")
os.makedirs(DB_DIR, exist_ok=True)
SQLITE_PATH = os.path.join(DB_DIR, "ai_detector.db")


class DuplicateEmailError(Exception):
    """Raised when registering an email that already exists."""


def _ph():
    """SQL placeholder for the active driver."""
    return "%s" if DB_DRIVER == "mysql" else "?"


def _mysql_column_exists(cursor, table, column):
    cursor.execute(
        "SELECT COUNT(*) FROM information_schema.columns "
        "WHERE table_schema = DATABASE() AND table_name = %s AND column_name = %s",
        (table, column),
    )
    return cursor.fetchone()[0] > 0


def _mysql_ensure_column(cursor, table, column, ddl):
    if not _mysql_column_exists(cursor, table, column):
        print(f"[Database Migration] Adding missing column {table}.{column}")
        cursor.execute(f"ALTER TABLE `{table}` ADD COLUMN `{column}` {ddl}")


def _mysql_migrate_users(cursor):
    """
    Bring an OLD users table (created by an earlier version of this project)
    up to date. CREATE TABLE IF NOT EXISTS never alters an existing table, which
    is the most common cause of HTTP 500 on sign-up (missing columns / int id).
    """
    # Make sure every column the code inserts actually exists
    _mysql_ensure_column(cursor, "users", "name", "VARCHAR(255) NOT NULL DEFAULT ''")
    _mysql_ensure_column(cursor, "users", "password_hash", "VARCHAR(255) NULL")
    _mysql_ensure_column(cursor, "users", "provider", "VARCHAR(32) DEFAULT 'email'")
    _mysql_ensure_column(cursor, "users", "avatar", "VARCHAR(512) NULL")
    _mysql_ensure_column(cursor, "users", "role", "VARCHAR(64) DEFAULT 'Auditor'")
    _mysql_ensure_column(cursor, "users", "organization", "VARCHAR(255) DEFAULT 'Enterprise Audit'")
    _mysql_ensure_column(cursor, "users", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    _mysql_ensure_column(cursor, "users", "last_login", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

    # A legacy INT / AUTO_INCREMENT id cannot hold "usr_xxxxxxxxxxxx"
    cursor.execute(
        "SELECT DATA_TYPE FROM information_schema.columns "
        "WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'id'"
    )
    row = cursor.fetchone()
    if row and str(row[0]).lower() not in ("varchar", "char"):
        print("[Database Migration] Converting users.id to VARCHAR(64)")
        # Child tables with a foreign key to users.id must go first; they are recreated below
        cursor.execute("DROP TABLE IF EXISTS user_sessions")
        cursor.execute("ALTER TABLE users MODIFY id VARCHAR(64) NOT NULL")


def _sqlite_ensure_column(cursor, table, column, ddl):
    cursor.execute(f"PRAGMA table_info({table})")
    cols = [r[1] for r in cursor.fetchall()]
    if column not in cols:
        print(f"[Database Migration] Adding missing column {table}.{column}")
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")

def try_init_mysql():
    global DB_DRIVER
    try:
        import mysql.connector
        # Connect to MySQL server first to ensure database exists
        server_conn = mysql.connector.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            connect_timeout=5
        )
        cursor = server_conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        server_conn.commit()
        cursor.close()
        server_conn.close()

        # Connect to the target database
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            connect_timeout=5
        )
        cursor = conn.cursor()

        # Create documents table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id VARCHAR(64) PRIMARY KEY,
                user_id VARCHAR(64) NULL,
                name VARCHAR(255) NOT NULL,
                file_type VARCHAR(16),
                file_size VARCHAR(32),
                upload_date VARCHAR(64),
                analysis_date VARCHAR(64),
                ai_percentage INT,
                human_percentage INT,
                flagged_sections INT,
                status VARCHAR(32),
                classification VARCHAR(64),
                risk_level VARCHAR(32),
                word_count INT,
                sentence_count INT,
                read_time VARCHAR(16),
                section_breakdown JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Create sentences table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sentences (
                id VARCHAR(64) PRIMARY KEY,
                document_id VARCHAR(64) NOT NULL,
                section_title VARCHAR(255),
                sentence_index INT,
                text TEXT,
                classification VARCHAR(32),
                confidence INT,
                explanation TEXT,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(64) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255),
                provider VARCHAR(32) DEFAULT 'email',
                avatar VARCHAR(512),
                role VARCHAR(64) DEFAULT 'Auditor',
                organization VARCHAR(255) DEFAULT 'Enterprise Audit',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # --- Migrations for databases created by older versions of the project ---
        _mysql_ensure_column(cursor, "documents", "user_id", "VARCHAR(64) NULL")
        try:
            cursor.execute("CREATE INDEX idx_documents_user ON documents (user_id)")
        except Exception:
            pass  # index already exists
        _mysql_migrate_users(cursor)

        # Create user sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                token VARCHAR(128) PRIMARY KEY,
                user_id VARCHAR(64) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Create password resets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS password_resets (
                token VARCHAR(128) PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        conn.commit()
        cursor.close()
        conn.close()
        DB_DRIVER = "mysql"
        print(f"[Database] Successfully connected to MySQL Server 8.0 on {MYSQL_HOST}:{MYSQL_PORT} (Database: {MYSQL_DATABASE})")
        return True
    except Exception as e:
        print(f"[Database Note] MySQL connection ({MYSQL_USER}@{MYSQL_HOST}:{MYSQL_PORT}): {e}")
        print("[Database] Using embedded high-performance SQLite engine with full SQL compatibility.")
        DB_DRIVER = "sqlite"
        init_sqlite()
        return False

def init_sqlite():
    conn = sqlite3.connect(SQLITE_PATH, timeout=30.0)
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA busy_timeout=30000;")
    except:
        pass
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            name TEXT NOT NULL,
            file_type TEXT,
            file_size TEXT,
            upload_date TEXT,
            analysis_date TEXT,
            ai_percentage INTEGER,
            human_percentage INTEGER,
            flagged_sections INTEGER,
            status TEXT,
            classification TEXT,
            risk_level TEXT,
            word_count INTEGER,
            sentence_count INTEGER,
            read_time TEXT,
            section_breakdown TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sentences (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            section_title TEXT,
            sentence_index INTEGER,
            text TEXT,
            classification TEXT,
            confidence INTEGER,
            explanation TEXT,
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT,
            provider TEXT DEFAULT 'email',
            avatar TEXT,
            role TEXT DEFAULT 'Auditor',
            organization TEXT DEFAULT 'Enterprise Audit',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_sessions (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS password_resets (
            token TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP
        );
    """)
    _sqlite_ensure_column(cursor, "documents", "user_id", "TEXT")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_documents_user ON documents (user_id)")
    for col, ddl in [("name", "TEXT NOT NULL DEFAULT ''"), ("password_hash", "TEXT"),
                     ("provider", "TEXT DEFAULT 'email'"), ("avatar", "TEXT"),
                     ("role", "TEXT DEFAULT 'Auditor'"), ("organization", "TEXT"),
                     ("created_at", "TIMESTAMP"), ("last_login", "TIMESTAMP")]:
        _sqlite_ensure_column(cursor, "users", col, ddl)
    conn.commit()
    conn.close()

# Try initializing database
try_init_mysql()

def get_connection():
    if DB_DRIVER == "mysql":
        import mysql.connector
        return mysql.connector.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            connect_timeout=10
        )
    else:
        conn = sqlite3.connect(SQLITE_PATH, timeout=30.0)
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA busy_timeout=30000;")
        except:
            pass
        return conn

def save_document(doc, user_id=None):
    """Persist an analysis result. It is always stored under the owning user_id."""
    conn = get_connection()
    cursor = conn.cursor()
    ph = _ph()
    doc_id = doc.get("id")
    section_breakdown_str = json.dumps(doc.get("sectionBreakdown", []))

    cols = ("id, user_id, name, file_type, file_size, upload_date, analysis_date, "
            "ai_percentage, human_percentage, flagged_sections, status, classification, "
            "risk_level, word_count, sentence_count, read_time, section_breakdown")
    values = (
        doc_id, user_id, doc.get("name"), doc.get("fileType"), doc.get("fileSize"),
        doc.get("uploadDate"), doc.get("analysisDate"), doc.get("aiPercentage", 0),
        doc.get("humanPercentage", 100), doc.get("flaggedSectionsCount", 0),
        doc.get("status", "Completed"), doc.get("classification"),
        doc.get("riskLevel"), doc.get("wordCount", 0), doc.get("sentenceCount", 0),
        doc.get("readTime", "3 min"), section_breakdown_str,
    )
    marks = ", ".join([ph] * len(values))
    if DB_DRIVER == "mysql":
        cursor.execute(
            f"INSERT INTO documents ({cols}) VALUES ({marks}) "
            "ON DUPLICATE KEY UPDATE name=VALUES(name), ai_percentage=VALUES(ai_percentage), "
            "human_percentage=VALUES(human_percentage), status=VALUES(status)",
            values,
        )
    else:
        cursor.execute(f"INSERT OR REPLACE INTO documents ({cols}) VALUES ({marks})", values)

    cursor.execute(f"DELETE FROM sentences WHERE document_id = {ph}", (doc_id,))
    for p in doc.get("paragraphs", []):
        section_title = p.get("sectionTitle", "")
        for s_idx, s in enumerate(p.get("sentences", [])):
            raw_id = s.get("id", f"s{s_idx}")
            s_id = f"{doc_id}_{raw_id}"
            row = (s_id, doc_id, section_title, s_idx, s.get("text"),
                   s.get("type"), s.get("confidence", 50), s.get("explanation", ""))
            sm = ", ".join([ph] * len(row))
            if DB_DRIVER == "mysql":
                cursor.execute(
                    "INSERT INTO sentences (id, document_id, section_title, sentence_index, text, "
                    f"classification, confidence, explanation) VALUES ({sm}) "
                    "ON DUPLICATE KEY UPDATE classification=VALUES(classification), "
                    "confidence=VALUES(confidence), explanation=VALUES(explanation)",
                    row,
                )
            else:
                cursor.execute(
                    "INSERT OR REPLACE INTO sentences (id, document_id, section_title, sentence_index, text, "
                    f"classification, confidence, explanation) VALUES ({sm})",
                    row,
                )
    conn.commit()
    cursor.close()
    conn.close()
    return doc_id

def get_documents(user_id):
    """Only the documents owned by user_id. A missing user_id returns nothing."""
    if not user_id:
        return []
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, file_type, file_size, upload_date, analysis_date, "
        "ai_percentage, human_percentage, flagged_sections, status, "
        "classification, risk_level, word_count, sentence_count "
        f"FROM documents WHERE user_id = {_ph()} ORDER BY created_at DESC",
        (user_id,),
    )
    rows = cursor.fetchall()
    if DB_DRIVER == "mysql":
        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, r)) for r in rows]
    else:
        rows = [dict(r) for r in rows]
    cursor.close()
    conn.close()
    return [{
        "id": d["id"], "name": d["name"], "fileType": d["file_type"], "fileSize": d["file_size"],
        "date": d["analysis_date"] or d["upload_date"],
        "aiPercentage": d["ai_percentage"], "humanPercentage": d["human_percentage"],
        "sectionsFlagged": d["flagged_sections"], "status": d["status"],
        "classification": d["classification"], "riskLevel": d["risk_level"],
        "wordCount": d["word_count"], "sentenceCount": d["sentence_count"],
    } for d in rows]

def get_document_by_id(doc_id, user_id=None):
    if not user_id:
        return None
    conn = get_connection()
    cursor = conn.cursor()

    if DB_DRIVER == "mysql":
        cursor.execute("SELECT * FROM documents WHERE id = %s AND user_id = %s", (doc_id, user_id))
        row = cursor.fetchone()
        if not row:
            cursor.close()
            conn.close()
            return None
        columns = [col[0] for col in cursor.description]
        d = dict(zip(columns, row))

        # Fetch sentences
        cursor.execute("SELECT * FROM sentences WHERE document_id = %s ORDER BY sentence_index ASC", (doc_id,))
        sentence_rows = cursor.fetchall()
        s_cols = [col[0] for col in cursor.description]
        sentences = [dict(zip(s_cols, sr)) for sr in sentence_rows]
    else:
        cursor.execute("SELECT * FROM documents WHERE id = ? AND user_id = ?", (doc_id, user_id))
        row = cursor.fetchone()
        if not row:
            cursor.close()
            conn.close()
            return None
        d = dict(row)

        cursor.execute("SELECT * FROM sentences WHERE document_id = ? ORDER BY sentence_index ASC", (doc_id,))
        sentences = [dict(sr) for sr in cursor.fetchall()]

    cursor.close()
    conn.close()

    # Reconstruct paragraphs grouped by section_title
    paragraphs_map = {}
    for s in sentences:
        sec_title = s.get("section_title") or "General Content"
        if sec_title not in paragraphs_map:
            paragraphs_map[sec_title] = []
        paragraphs_map[sec_title].append({
            "id": s["id"],
            "text": s["text"],
            "type": s["classification"],
            "confidence": s["confidence"],
            "explanation": s["explanation"]
        })

    paragraphs = [
        {"sectionTitle": title, "sentences": s_list}
        for title, s_list in paragraphs_map.items()
    ]

    section_breakdown = []
    if d.get("section_breakdown"):
        try:
            section_breakdown = json.loads(d["section_breakdown"]) if isinstance(d["section_breakdown"], str) else d["section_breakdown"]
        except:
            section_breakdown = []

    return {
        "id": d["id"],
        "name": d["name"],
        "fileType": d["file_type"],
        "fileSize": d["file_size"],
        "uploadDate": d["upload_date"],
        "analysisDate": d["analysis_date"],
        "aiPercentage": d["ai_percentage"],
        "humanPercentage": d["human_percentage"],
        "flaggedSectionsCount": d["flagged_sections"],
        "status": d["status"],
        "classification": d["classification"],
        "riskLevel": d["risk_level"],
        "wordCount": d["word_count"],
        "sentenceCount": d["sentence_count"],
        "readTime": d["read_time"],
        "sectionBreakdown": section_breakdown,
        "paragraphs": paragraphs
    }

def delete_document(doc_id, user_id):
    """Delete only if the document belongs to user_id. Returns True if something was deleted."""
    if not user_id:
        return False
    conn = get_connection()
    cursor = conn.cursor()
    ph = _ph()
    cursor.execute(f"SELECT id FROM documents WHERE id = {ph} AND user_id = {ph}", (doc_id, user_id))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        return False
    cursor.execute(f"DELETE FROM sentences WHERE document_id = {ph}", (doc_id,))
    cursor.execute(f"DELETE FROM documents WHERE id = {ph} AND user_id = {ph}", (doc_id, user_id))
    conn.commit()
    cursor.close()
    conn.close()
    return True

def get_stats(user_id):
    docs = get_documents(user_id)
    total_docs = len(docs)
    if total_docs == 0:
        return {
            "totalAnalyzed": 0,
            "avgAiScore": 0,
            "reportsGenerated": 0,
            "lastRecord": None
        }

    avg_ai = round(sum(d["aiPercentage"] for d in docs) / total_docs)
    completed_reports = sum(1 for d in docs if d["status"] == "Completed")
    last_record = docs[0] if docs else None

    return {
        "totalAnalyzed": total_docs,
        "avgAiScore": avg_ai,
        "reportsGenerated": completed_reports,
        "lastRecord": last_record
    }

def get_status():
    return {
        "driver": DB_DRIVER,
        "mysqlHost": MYSQL_HOST if DB_DRIVER == "mysql" else None,
        "database": MYSQL_DATABASE if DB_DRIVER == "mysql" else "SQLite (Local Embedded)",
        "active": True
    }

# =============================================================
# Real User Authentication & Session Management (MySQL / SQLite)
# =============================================================

def hash_password(password: str) -> str:
    if not password:
        return ""
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return f"{salt}${hashed}"

def verify_password(stored_password_hash: str, password: str) -> bool:
    if not stored_password_hash or "$" not in stored_password_hash or not password:
        return False
    try:
        salt, hashed = stored_password_hash.split("$", 1)
        computed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
        return hmac.compare_digest(hashed, computed)
    except Exception:
        return False

def _row_to_user_dict(row, columns=None, include_password=False):
    if not row:
        return None
    if isinstance(row, sqlite3.Row):
        d = dict(row)
    elif columns:
        d = dict(zip(columns, row))
    elif isinstance(row, dict):
        d = row
    else:
        d = {}

    user = {
        "id": d.get("id"),
        "email": d.get("email"),
        "name": d.get("name"),
        "provider": d.get("provider") or "email",
        "avatar": d.get("avatar") or f"https://api.dicebear.com/7.x/avataaars/svg?seed={str(d.get('name', 'user')).replace(' ', '')}",
        "role": d.get("role") or "Auditor",
        "organization": d.get("organization") or "Enterprise Audit",
        "createdAt": str(d.get("created_at") or ""),
        "lastLogin": str(d.get("last_login") or "")
    }
    if include_password:
        user["password_hash"] = d.get("password_hash")
    return user

def create_user(
    email: str,
    name: str,
    password: Optional[str] = None,
    provider: str = "email",
    avatar: Optional[str] = None,
    role: str = "Auditor",
    organization: str = "Enterprise Audit"
) -> Dict[str, Any]:
    email = email.strip().lower()
    name = name.strip()
    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    pwd_hash = hash_password(password) if password else None
    if not avatar:
        avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={name.replace(' ', '')}"

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_connection()
    cursor = conn.cursor()
    ph = _ph()
    sql = ("INSERT INTO users (id, email, name, password_hash, provider, avatar, role, organization, created_at, last_login) "
           f"VALUES ({', '.join([ph] * 10)})")
    try:
        cursor.execute(sql, (user_id, email, name, pwd_hash, provider, avatar, role, organization, now_str, now_str))
        conn.commit()
    except Exception as e:
        conn.rollback()
        msg = str(e).lower()
        if "duplicate" in msg or "unique" in msg:
            raise DuplicateEmailError(email) from e
        raise
    finally:
        cursor.close()
        conn.close()
    return get_user_by_id(user_id)

def get_user_by_email(email: str, include_password: bool = False) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    clean_email = email.strip().lower()
    if DB_DRIVER == "mysql":
        cursor.execute("SELECT * FROM users WHERE LOWER(email) = %s LIMIT 1", (clean_email,))
        row = cursor.fetchone()
        cols = [col[0] for col in cursor.description] if row and cursor.description else None
        res = _row_to_user_dict(row, cols, include_password)
    else:
        cursor.execute("SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1", (clean_email,))
        row = cursor.fetchone()
        res = _row_to_user_dict(row, None, include_password)
    cursor.close()
    conn.close()
    return res

def get_user_by_id(user_id: str, include_password: bool = False) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if DB_DRIVER == "mysql":
        cursor.execute("SELECT * FROM users WHERE id = %s LIMIT 1", (user_id,))
        row = cursor.fetchone()
        cols = [col[0] for col in cursor.description] if row and cursor.description else None
        res = _row_to_user_dict(row, cols, include_password)
    else:
        cursor.execute("SELECT * FROM users WHERE id = ? LIMIT 1", (user_id,))
        row = cursor.fetchone()
        res = _row_to_user_dict(row, None, include_password)
    cursor.close()
    conn.close()
    return res

def create_session(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    now = datetime.datetime.now()
    expires_at = (now + datetime.timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S")
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")

    conn = get_connection()
    cursor = conn.cursor()
    if DB_DRIVER == "mysql":
        cursor.execute(
            "INSERT INTO user_sessions (token, user_id, created_at, expires_at) VALUES (%s, %s, %s, %s)",
            (token, user_id, now_str, expires_at)
        )
        cursor.execute("UPDATE users SET last_login = %s WHERE id = %s", (now_str, user_id))
    else:
        cursor.execute(
            "INSERT INTO user_sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token, user_id, now_str, expires_at)
        )
        cursor.execute("UPDATE users SET last_login = ? WHERE id = ?", (now_str, user_id))
    conn.commit()
    cursor.close()
    conn.close()
    return token

def get_user_by_session_token(token: str) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    conn = get_connection()
    cursor = conn.cursor()
    if DB_DRIVER == "mysql":
        cursor.execute("""
            SELECT u.* FROM users u
            JOIN user_sessions s ON u.id = s.user_id
            WHERE s.token = %s AND (s.expires_at IS NULL OR s.expires_at > %s)
            LIMIT 1
        """, (token, datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        row = cursor.fetchone()
        cols = [col[0] for col in cursor.description] if row and cursor.description else None
        res = _row_to_user_dict(row, cols)
    else:
        cursor.execute("""
            SELECT u.* FROM users u
            JOIN user_sessions s ON u.id = s.user_id
            WHERE s.token = ? AND (s.expires_at IS NULL OR s.expires_at > ?)
            LIMIT 1
        """, (token, datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        row = cursor.fetchone()
        res = _row_to_user_dict(row)
    cursor.close()
    conn.close()
    return res

def delete_session(token: str) -> bool:
    if not token:
        return False
    conn = get_connection()
    cursor = conn.cursor()
    if DB_DRIVER == "mysql":
        cursor.execute("DELETE FROM user_sessions WHERE token = %s", (token,))
    else:
        cursor.execute("DELETE FROM user_sessions WHERE token = ?", (token,))
    conn.commit()
    cursor.close()
    conn.close()
    return True

def authenticate_email_user(email: str, password: str) -> Optional[Tuple[Dict[str, Any], str]]:
    user = get_user_by_email(email, include_password=True)
    if not user:
        return None
    pwd_hash = user.get("password_hash")
    if not pwd_hash or not verify_password(pwd_hash, password):
        return None
    token = create_session(user["id"])
    clean_user = get_user_by_id(user["id"])
    return clean_user, token

def authenticate_or_create_google_user(
    email: str,
    name: Optional[str] = None,
    avatar: Optional[str] = None,
    organization: Optional[str] = None
) -> Tuple[Dict[str, Any], str]:
    email = email.strip().lower()
    existing = get_user_by_email(email)
    if existing:
        token = create_session(existing["id"])
        return existing, token

    user_name = name.strip() if name and name.strip() else email.split("@")[0].replace(".", " ").title()
    user_avatar = avatar or f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_name.replace(' ', '')}"
    user_org = organization or "Apex Academic & Enterprise Auditing"

    created = create_user(
        email=email,
        name=user_name,
        password=None,
        provider="gmail",
        avatar=user_avatar,
        role="Auditor",
        organization=user_org
    )
    token = create_session(created["id"])
    return created, token

def create_password_reset(email: str) -> str:
    token = secrets.token_urlsafe(32)
    conn = get_connection()
    cursor = conn.cursor()
    if DB_DRIVER == "mysql":
        cursor.execute("DELETE FROM password_resets WHERE email = %s", (email,))
        cursor.execute("""
            INSERT INTO password_resets (token, email, expires_at)
            VALUES (%s, %s, DATE_ADD(NOW(), INTERVAL 1 HOUR))
        """, (token, email))
    else:
        cursor.execute("DELETE FROM password_resets WHERE email = ?", (email,))
        cursor.execute("""
            INSERT INTO password_resets (token, email, expires_at)
            VALUES (?, ?, datetime('now', '+1 hour'))
        """, (token, email))
    conn.commit()
    cursor.close()
    conn.close()
    return token

def verify_password_reset(token: str) -> Optional[str]:
    if not token:
        return None
    conn = get_connection()
    cursor = conn.cursor()
    if DB_DRIVER == "mysql":
        cursor.execute("""
            SELECT email FROM password_resets 
            WHERE token = %s AND (expires_at IS NULL OR expires_at > NOW())
            LIMIT 1
        """, (token,))
    else:
        cursor.execute("""
            SELECT email FROM password_resets 
            WHERE token = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
            LIMIT 1
        """, (token,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row[0] if row else None

def update_user_password(email: str, new_password: str) -> bool:
    pwd_hash = hash_password(new_password)
    conn = get_connection()
    cursor = conn.cursor()
    if DB_DRIVER == "mysql":
        cursor.execute("UPDATE users SET password_hash = %s WHERE email = %s", (pwd_hash, email))
        cursor.execute("DELETE FROM password_resets WHERE email = %s", (email,))
    else:
        cursor.execute("UPDATE users SET password_hash = ? WHERE email = ?", (pwd_hash, email))
        cursor.execute("DELETE FROM password_resets WHERE email = ?", (email,))
    conn.commit()
    cursor.close()
    conn.close()
    return True
