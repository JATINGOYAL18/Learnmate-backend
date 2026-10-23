# LearnMate Backend 🎓🤖

The backend API service for **LearnMate** — an AI-powered personalized learning companion for students.

This repository features:
- **Milestone 1**: Clean, production-conscious TypeScript Express backend foundation.
- **Milestone 2**: Gemini AI integration powered by Google's official `@google/genai` SDK with strict grounding and zero hallucinations.

---

## 🏗️ Project Architecture

```
Learnmate-backend/
├── .env.example            # Environment variables template (placeholders only)
├── .env                    # Local environment variables (ignored by Git)
├── .gitignore              # Excludes node_modules, dist, .env, and logs
├── package.json            # Scripts & dependencies
├── tsconfig.json           # Strict TypeScript configuration
├── README.md               # Setup and usage guide
├── test/
│   ├── ai.routes.test.ts   # AI routes tested with mock Gemini (runs offline)
│   ├── ai.validation.test.ts # Input limits & schema validation tests
│   ├── gemini.service.test.ts# Secret redaction & initialization tests
│   └── health.test.ts      # Health check and root tests
└── src/
    ├── app.ts              # Express application factory & middleware chain
    ├── server.ts           # Server entrypoint (listens on 0.0.0.0:PORT)
    ├── config/
    │   └── env.ts          # Zod-validated environment configuration
    ├── middleware/
    │   ├── errorHandler.ts # Centralized JSON error handler with secret redaction
    │   ├── notFound.ts     # Consistent JSON 404 handler for unknown routes
    │   └── validate.ts     # Generic Zod request validation middleware
    ├── routes/
    │   ├── index.ts        # Main router mounting /api/health and /api/ai
    │   ├── health.ts       # Health check router (/api/health)
    │   └── ai.ts           # AI endpoints (/explain, /quiz, /practice)
    ├── services/
    │   ├── ai.schemas.ts   # Zod request & response schemas for AI operations
    │   └── gemini.service.ts # Gemini SDK service with strict grounding & retries
    └── utils/
        └── errors.ts       # AppError class for predictable operational errors
```

---

## 📋 Prerequisites

- **Node.js**: v18.x, v20.x, v22+, or v24.x
- **npm**: v9+ (or higher)
- **Windows PowerShell**

Verify in PowerShell:
```powershell
node -v
npm -v
```

---

## 🚀 Quick Start (Windows PowerShell)

### Step 1: Install Dependencies
```powershell
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to create your local `.env` file:
```powershell
Copy-Item .env.example .env
```

Edit `.env` and provide your Google Gemini API key:
```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

> **Security Note**: Never commit `.env` or hardcode API keys. The backend automatically masks and redacts API keys from logs and error responses.

### Step 3: Run the Automated Test Suite
Runs unit and integration tests (tests run 100% offline without needing a real API key):
```powershell
npm test
```

### Step 4: Verify TypeScript Types
```powershell
npm run typecheck
```

### Step 5: Start in Development Mode
Starts the server with live file reloading via `tsx`:
```powershell
npm run dev
```

### Step 6: Build and Run in Production
```powershell
# Build into dist/
npm run build

# Start the compiled production server
npm start
```

---

## 🧠 Strict Grounding & Academic Integrity

All AI features enforce strict grounding rules:
1. **Material-Only Grounding**: The AI is instructed to answer, generate quizzes, or build practice flashcards **exclusively** from the user's provided `studyMaterial`.
2. **Zero Hallucination**: The AI will never invent facts, citations, quotes, or page numbers.
3. **Absence Handling**: If a topic is not in the study material, `foundInMaterial` is set to `false`, references state `"Not present in provided material"`, and the AI explains why without fabricating facts.
4. **Resilience**: Features automatic retry on transient `503` demand spikes and input limits (10 to 50,000 characters).

---

## 📡 API Endpoints & PowerShell Examples

### 1. Root & Health Check
```powershell
# Root service message
Invoke-RestMethod -Uri "http://localhost:3000/" -Method Get

# Health status
Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get
```

### 2. POST /api/ai/explain
Explains a concept strictly grounded in the provided text.

```powershell
$body = @{
  studyMaterial = "Mitochondria are membrane-bound cell organelles that generate most of the chemical energy needed to power the cell's biochemical reactions. Chemical energy produced by the mitochondria is stored in a small molecule called adenosine triphosphate (ATP)."
  topic = "Mitochondria"
  level = "beginner"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/ai/explain" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
```

### 3. POST /api/ai/quiz
Generates a grounded multiple-choice quiz with verbatim citations and explanation.

```powershell
$body = @{
  studyMaterial = "Mitochondria are membrane-bound cell organelles that generate most of the chemical energy needed to power the cell's biochemical reactions. Chemical energy produced by the mitochondria is stored in a small molecule called adenosine triphosphate (ATP)."
  numQuestions = 2
  difficulty = "easy"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/ai/quiz" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
```

### 4. POST /api/ai/practice
Generates practice items (flashcards or exercises) grounded in the text.

```powershell
$body = @{
  studyMaterial = "Mitochondria are membrane-bound cell organelles that generate most of the chemical energy needed to power the cell's biochemical reactions. Chemical energy produced by the mitochondria is stored in a small molecule called adenosine triphosphate (ATP)."
  type = "flashcards"
  numItems = 2
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/ai/practice" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
```

---

## ☁️ Google Cloud Run Compatibility

- **Port Binding**: Binds to `0.0.0.0` and dynamic `process.env.PORT` (defaults to `3000`).
- **Stateless**: The server maintains no in-memory state between requests.
- **Graceful Shutdown**: Traps `SIGTERM` and `SIGINT` signals for zero-downtime container updates.

---

## 🔮 Upcoming Milestones
- **Milestone 3**: Connect the backend to the existing React + Vite frontend.
- **Milestone 4**: Google Cloud Run automated deployment and production CI/CD.
