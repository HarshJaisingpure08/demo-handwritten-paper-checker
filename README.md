# Hand Written Paper Checker (VedaAI)

**Hand Written Paper Checker** is an AI-powered educational tool designed to streamline answer sheet evaluation for teachers and evaluators. It automatically processes uploaded printed **question papers** and handwritten **answer sheets**, extracts the questions, reads and OCR-maps handwritten answers to their respective questions, overlays exact bounding-box highlights, and provides intelligent AI feedback and grading.

---

## 📌 Project Overview & Key Features

Evaluating handwritten answer sheets manually is time-consuming. This system automates the matching and assessment workflow with high visual accuracy:

- 📄 **Question Extraction**: Automatically extracts printed questions preserving structure, numbering, and sub-parts.
- ✍️ **Handwriting OCR & Vision Processing**: Powered by **GPT-4o Vision** (with automatic fallback to **Google Gemini 1.5 Flash**) to read handwritten text directly without separate standard OCR engines.
- 🎯 **Smart Answer Mapping**: Automatically links handwritten answers to target question numbers (supports explicit numbering and semantic fallback).
- 🔍 **Interactive Answer Highlighting**: Highlights exact bounding boxes (with normalized coordinates) on answer sheet images when a question is clicked.
- 📊 **AI Feedback & Grading**: Generates per-question feedback, marks, and overall assessment summaries.
- 📑 **Multi-Page Support**: Handles multi-page question papers and multi-page handwritten answer sheets effortlessly.
- ⚡ **Responsive Web Interface**: Modern Next.js interface with desktop 3-panel layout and tabbed mobile view.

---

## 🏗️ Architecture Stack

- **Frontend**: Next.js 14+ (React, TypeScript, Tailwind CSS)
- **Backend**: FastAPI (Python 3.11+, Uvicorn)
- **PDF & Image Processing**: PyMuPDF (`fitz`), Pillow
- **AI Providers**: OpenAI (GPT-4o Vision API) primary provider, Google Gemini (`gemini-1.5-flash`) automatic fallback provider

---

## 📁 Repository Structure

```
.
├── backend/            # FastAPI REST backend & AI pipeline
│   ├── models/         # Pydantic data schemas
│   ├── routers/        # API endpoints
│   ├── services/       # AI providers (OpenAI, Gemini) & PDF conversion
│   ├── main.py         # App entry point & CORS configuration
│   ├── config.py       # Environment variable settings
│   ├── .env.example    # Backend environment variable template
│   └── requirements.txt
├── frontend/           # Next.js web application
│   ├── app/            # Next.js App Router pages
│   ├── components/     # UI components (Viewer, Highlight overlay, Results)
│   ├── lib/            # API client and TypeScript types
│   └── .env.example    # Frontend environment variable template
├── .gitignore          # Excludes node_modules, venvs, and .env files
└── README.md           # Documentation
```

---

## 🔐 Environment Setup (`.env`)

> ⚠️ **IMPORTANT**: Never commit your actual `.env` files containing sensitive API keys to Git/GitHub. `.env` and `.env.local` files are ignored by default via `.gitignore`.

### 1. Backend Environment Setup (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```bash
# On Windows (PowerShell)
Copy-Item backend\.env.example backend\.env

# On Mac/Linux
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in your API credentials:

```env
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:3000
```

- `OPENAI_API_KEY`: Required for primary vision processing via GPT-4o.
- `GEMINI_API_KEY`: Optional fallback key if OpenAI service fails or reaches quota.
- `FRONTEND_URL`: URL of the frontend app allowed for CORS requests (default: `http://localhost:3000`).

---

### 2. Frontend Environment Setup (`frontend/.env.local`)

Copy `frontend/.env.example` to `frontend/.env.local`:

```bash
# On Windows (PowerShell)
Copy-Item frontend\.env.example frontend\.env.local

# On Mac/Linux
cp frontend/.env.example frontend/.env.local
```

Content of `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- `NEXT_PUBLIC_API_URL`: Points to the running FastAPI backend server (default: `http://localhost:8000`).

---

## 🚀 How to Run the Project

### Prerequisites
Make sure you have installed:
- **Python** (version 3.11 or higher)
- **Node.js** (version 18 or higher) and `npm`

---

### Step 1: Run the Backend Server (FastAPI)

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **Mac/Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Ensure your `backend/.env` file is set up (see [Environment Setup](#-environment-setup-env)).

5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend API will be available at: `http://localhost:8000`  
   Interactive API docs (Swagger UI): `http://localhost:8000/docs`

---

### Step 2: Run the Frontend App (Next.js)

1. Open a new terminal window/tab and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Ensure your `frontend/.env.local` file is configured (see [Environment Setup](#-environment-setup-env)).

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

5. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🧪 Running Backend Unit Tests

To run the backend test suite:

```bash
cd backend
pytest tests/ -v
```

---

## 🤝 Contributing & Repository Deployment

When deploying to platforms like Vercel (Frontend) or Render / Railway / Fly.io (Backend), remember to add the environment variables (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `FRONTEND_URL`, and `NEXT_PUBLIC_API_URL`) in the platform's Environment Variables settings UI rather than uploading `.env` files.
