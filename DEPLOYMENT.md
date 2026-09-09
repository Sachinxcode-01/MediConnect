# MediConnect Production Deployment Guide

This guide details deployment of MediConnect to production cloud infrastructure and turnkey containerized deployments.

---

## 1. Quickstart: Turnkey Docker Compose Deployment

The fastest way to deploy the complete MediConnect stack (Client + Server + MongoDB + Reverse Proxy) with a single command:

```bash
# 1. Clone the repository
git clone https://github.com/Sachinxcode-01/MediConnect.git
cd MediConnect

# 2. Configure production secrets in .env
cp .env.example .env

# 3. Launch container fleet with health checks
docker compose up --build -d

# 4. Check cluster status & health
docker compose ps
curl http://localhost/health
```

- **Frontend Client (Nginx SPA):** `http://localhost:80`
- **Backend API & WebSockets:** `http://localhost:5000` (also reverse proxied via `http://localhost/api/`)
- **Database:** MongoDB container on port `27017` with persistent volume `mongo-data`

---

## 2. Cloud Platform Deployment

### Prerequisites & Managed Services

- **Database & Auth:** MongoDB Atlas or Supabase PostgreSQL Project
- **Backend Service:** Render / Railway / AWS App Runner / Fly.io (Node.js 20+)
- **Frontend Service:** Vercel / Netlify / Cloudflare Pages (React 19 + Vite)
- **Media Storage:** Cloudinary
- **AI Triage:** OpenRouter API key (`openrouter.ai`) or Google Gemini API key

---

## 3. Production Environment Variables

### Backend (`server/.env`)

```bash
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-mediconnect-app.vercel.app
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/mediconnect
JWT_SECRET=your-secure-jwt-secret-min-32-chars
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend (`client/.env`)

```bash
VITE_API_URL=https://your-backend.onrender.com
```

---

## 4. Production Verification & Health Probes

Verify deployment health using the built-in system probes:

- **Liveness Probe:** `GET /health/live` (Expect `200 OK`, process uptime)
- **Readiness Probe:** `GET /health/ready` (Expect `200 OK`, database latency status)
- **Deep Metrics:** `GET /health/metrics` (Expect `200 OK`, memory, sockets, process telemetry)
- **Aggregated Health:** `GET /api/health` (Full diagnostics for administrative HUD)
