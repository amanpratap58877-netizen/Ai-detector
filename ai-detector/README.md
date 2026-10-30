# AI Content Detector — Enterprise Document Intelligence & Authenticity Studio

A production-grade AI content detection platform combining a calibrated Python 3-Model ML Ensemble, asynchronous FastAPI backend, MySQL Server 8.0 relational persistence, Firebase Authentication with Google Login, and a modern React 18 / Tailwind CSS interface.

---

## 🚀 Key Features

### 1. Multi-Tier Machine Learning Ensemble Engine
- **Calibrated 3-Model Soft-Voting Meta-Detector**:
  - **Model 1 (N-Gram / Lexical Classifier)**: Word (1-2) + Character (3-5) TF-IDF n-grams with Calibrated Logistic Regression.
  - **Model 2 (Deep Stylometrics & Burstiness)**: 28-dimensional linguistic features (variance, Shannon entropy, burstiness CV, syntax density, punctuation patterns).
  - **Model 3 (Sequence Context & Transition Dynamics)**: 18-dimensional sequential cohesion features (inter-sentence delta, Markov punctuation transitions, opener repetition).
- **Trained on Real Open-License Datasets**: 4,978 balanced passages from RAID Benchmark 2024 (MIT), Hello-SimpleAI HC3 (CC-BY-SA 4.0), Persuade 2.0 / dmitva (CC-BY 4.0), NoaiGPT Paraphrased (Apache-2.0), and silentone0725 (Apache-2.0).
- **Honest Cross-Domain Held-Out Evaluation (Group-KFold)**:
  - 3-Model Ensemble: 64.01% Accuracy, 70.41% ROC-AUC on completely unseen domains.
  - N-Gram Model: 65.17% Accuracy, 75.01% ROC-AUC.
  - Stylometric Model: 59.38% Accuracy, 60.94% ROC-AUC.
  - Sequence Context Model: 55.42% Accuracy, 55.67% ROC-AUC (lowest human false-positive rate: 47.49%).
- **Linguistic Metrics**: Computes coefficient of variation (burstiness CV), delta sentence jump, cliché density, pronoun frequency, and Shannon token entropy in real time.

### 2. Dual Input Analysis Modalities
- **Document File Upload**: Direct byte-stream extraction for `.PDF`, `.DOCX`, `.DOC`, `.TXT`, `.RTF`, `.PPT`, and `.PPTX` files up to 10 MB.
- **Direct Text Inspection**: Real-time interactive word gauge supporting **50 to 1,000 words** with live boundary validation, dynamic meter progress bars, and one-click benchmark samples.

### 3. Sentence-Level Contextual Attribution & Diagnostics
- **Color-Coded Document Inspection**:
  - 🟨 **Amber**: Potentially AI-like (uniform clause rhythm, low perplexity, repetitive discourse connectors).
  - 🟩 **Green**: Likely human-written (high burstiness, natural rhythm, personal voice).
  - ⬜ **Gray**: Uncertain / hybrid syntactic signals.
- **Sentence Inspector Drawer**: Detailed per-sentence breakdown including confidence percentage, linguistic explanations, and navigation controls.
- **Section-by-Section Breakdown**: Recharts horizontal breakdown charts detailing AI percentage across individual document sections.

### 4. Enterprise Storage & Authentication
- **MySQL 8.0 Relational Persistence**: Complete schema for documents, batch sentence vectors (`cursor.executemany`), and session audit logs with SQLite fallback.
- **Dual Authentication**: Real MySQL email/password authentication combined with Google Sign-In via Firebase Cloud Auth.
- **Google SMTP Password Reset**: Dispatches secure tokens with automated password reset links via Google App Passwords over TLS/SSL.
- **Interactive Three.js 3D Quantum Sphere**: High-performance interactive WebGL particle sphere on the authentication page.

### 5. Export & Reporting Suite
- One-click export in **.TXT**, **.CSV**, and **.JSON** formats with printable PDF stylesheet.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, Three.js, Lucide Icons, Recharts 2 |
| **Backend** | Python 3.12, FastAPI, Uvicorn, Scikit-Learn, Joblib, PyPDF, python-docx |
| **Database** | MySQL Server 8.0 (InnoDB utf8mb4) & SQLite (Fallback) |
| **Authentication** | Firebase Auth (Google Sign-In) + MySQL User Accounts |
| **Email Service** | Google SMTP (`smtp.gmail.com`) with TLS/SSL |

---

## 📦 Getting Started

### Prerequisites
- **Node.js** (v18 or higher) & **npm**
- **Python** (v3.10 or higher)
- **MySQL Server 8.0** (optional, SQLite fallback automatically available)

### 1. Clone the Repository
```bash
git clone https://github.com/anuj12jnv-del/ai-detector.git
cd ai-detector
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in both the root and `backend/` directory:
```bash
cp .env.example .env
cp .env.example backend/.env
```
Edit `.env` with your MySQL credentials and optional Google SMTP configuration.

### 3. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend will run on `http://localhost:5173`.

### 4. Backend Setup
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Start FastAPI backend server
python backend/app.py
```
The API server will listen on `http://127.0.0.1:8000`.

### 5. Retraining the Models & Updating the Corpus (Optional)
The repository comes pre-packaged with trained model weights in `backend/models/` and the curated 4,978-sample corpus in `backend/data/`. To download fresh data or retrain models:
```bash
# 1. Download real open-license benchmark text (RAID, HC3, Persuade, NoaiGPT)
python backend/download_real_corpus.py

# 2. Retrain all 3 models with held-out Group-KFold cross validation
python backend/train_ensemble.py
```
This updates `backend/models/detector_v2.joblib`, individual models, and `backend/models/model_meta.json`.

---

## 🔒 Security & Privacy

- All `.env` secret files and database credentials are excluded via `.gitignore`.
- Authentication supports hashed credentials (PBKDF2/SHA-256) and secure session tokens.
- Documents and sentence vectors are securely stored in MySQL with foreign key cascade integrity.

---

## 📄 License
This project is licensed under the MIT License.
