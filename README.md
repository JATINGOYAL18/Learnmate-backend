# LearnMate Backend 🎓🤖

The backend API service for **LearnMate** — an AI-powered personalized learning companion for students.

This is **Milestone 1**: the production-conscious TypeScript Express backend foundation.

---

## 🏗️ Project Architecture

```
Learnmate-backend/
├── .env.example            # Environment variables template (placeholders only)
├── .env                    # Local environment variables (ignored by Git)
├── .gitignore              # Ignores node_modules, dist, .env, and logs
├── package.json            # Scripts & dependencies
├── tsconfig.json           # Strict TypeScript configuration
├── README.md               # Setup and usage guide (this file)
└── src/
    ├── app.ts              # Express application factory & middleware chain
    ├── server.ts           # Server entrypoint (listens on 0.0.0.0:PORT)
    ├── config/
    │   └── env.ts          # Type-safe environment variable parsing with Zod
    ├── middleware/
    │   ├── errorHandler.ts # Centralized JSON error handler
    │   ├── notFound.ts     # Consistent JSON 404 handler for unknown routes
    │   └── validate.ts     # Reusable request validation middleware with Zod
    ├── routes/
    │   ├── index.ts        # Main router (root endpoint & /api mounting)
    │   └── health.ts       # Health check router (/api/health)
    └── utils/
        └── errors.ts       # AppError class for predictable operational errors
```

---

## 📋 Prerequisites

- **Node.js**: v18.x or v20.x or v22+ (v24.x also supported)
- **npm**: v9+ (or higher)
- **Windows PowerShell**

Verify your installations in PowerShell:
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

Default configuration in `.env`:
```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```
> **Note**: Vite's default dev server runs at `http://localhost:5173`. If your React frontend uses a different port, update `CORS_ORIGIN` accordingly.

### Step 3: Run in Development Mode
Starts the server with live file reloading via `tsx`:
```powershell
npm run dev
```

### Step 4: Verify TypeScript Types
Run the TypeScript compiler in check-only mode (no files emitted):
```powershell
npm run typecheck
```

### Step 5: Build for Production
Compiles TypeScript into clean JavaScript inside the `dist/` folder:
```powershell
npm run build
```

### Step 6: Run Production Build
Starts the compiled JavaScript server:
```powershell
npm start
```

---

## 📡 API Endpoints & Testing

You can test endpoints using Windows PowerShell with `Invoke-RestMethod` or `curl.exe`:

### 1. Root Welcome Endpoint
- **Method**: `GET /`
- **Command**:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:3000/" -Method Get
  ```
- **Response**:
  ```json
  {
    "service": "LearnMate API",
    "status": "running",
    "version": "1.0.0",
    "description": "AI-powered personalized learning companion for students",
    "endpoints": {
      "health": "/api/health"
    }
  }
  ```

### 2. Health Check Endpoint
- **Method**: `GET /api/health`
- **Command**:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get
  ```
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "learnmate-backend",
    "timestamp": "2026-10-23T14:20:00.000Z",
    "uptimeSeconds": 15,
    "environment": "development"
  }
  ```

### 3. Health Check with Diagnostics (Zod Query Validation)
- **Method**: `GET /api/health?verbose=true`
- **Command**:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:3000/api/health?verbose=true" -Method Get
  ```
- If you pass an invalid value (e.g., `?verbose=invalid`), Zod automatically rejects the request with a `400 Bad Request` and structured validation errors:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:3000/api/health?verbose=invalid" -Method Get
  ```

### 4. 404 Unknown Route Handling
- Any unrecognized route returns a standardized JSON 404 response:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:3000/api/non-existent" -Method Get
  ```
- **Response**:
  ```json
  {
    "success": false,
    "error": {
      "code": "ROUTE_NOT_FOUND",
      "message": "The requested resource 'GET /api/non-existent' does not exist on this server."
    }
  }
  ```

---

## ☁️ Google Cloud Run Compatibility

This backend is architected to be directly deployable to Google Cloud Run:
- **Port Binding**: Binds to `process.env.PORT` (Cloud Run dynamically sets this) and falls back to `3000` locally.
- **Host Binding**: Binds to `0.0.0.0` (required for containerized environments to route traffic).
- **Stateless**: Does not store session state in memory or rely on local disk persistence.
- **Graceful Shutdown**: Listens for `SIGTERM` and `SIGINT` signals to allow active requests to finish before container termination.

---

## 🔮 Next Steps (Milestone 2+)

1. **Google AI Studio / Gemini API Integration**: Add structured prompt services and SDK integration.
2. **Frontend Connection**: Connect the existing React + Vite frontend to this backend.
3. **Google Cloud Run Deployment**: Deploy the service to Google Cloud.
