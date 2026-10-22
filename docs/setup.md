# Setup & Installation Guide

## Prerequisites

- **Python:** 3.12 or compatible (verified on Python 3.14.3)
- **Node.js:** v20.x or v22.x LTS (verified on Node.js v20.18.0)
- **npm:** v10.x or above
- **Docker & Docker Compose:** Optional for containerized deployment

---

## 1. Quick Local Execution

### Backend Setup

1. Open PowerShell or Terminal and navigate to the project root:
```bash
cd Scratch
```

2. Install Python dependencies:
```bash
pip install -r backend/requirements.txt
```

3. Launch the FastAPI backend server:
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend starts at `http://127.0.0.1:8000`.  
API documentation is available at `http://127.0.0.1:8000/docs`.

### Frontend Setup

1. In a new terminal window:
```bash
cd Scratch/frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Start the Vite development server:
```bash
npm run dev
```
The interactive frontend will be live at `http://localhost:5173`.

---

## 2. Docker Deployment

To launch both frontend and backend using Docker Compose:

```bash
docker compose up --build
```

- **Frontend:** `http://localhost:5173`
- **Backend API & Swagger:** `http://localhost:8000/docs`

---

## 3. Running Automated Tests

### Backend Unit & Integration Tests (Pytest)
```bash
python -m pytest backend/app/tests -v
```

### Frontend Tests (Vitest)
```bash
cd frontend
npm test
```

### Production Build Verification
```bash
cd frontend
npm run build
```
