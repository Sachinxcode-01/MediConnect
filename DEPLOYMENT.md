# MediConnect Production Deployment Guide

This guide details deployment of MediConnect to production cloud infrastructure.

---

## 1. Prerequisites & Services
- **Database & Auth:** Supabase PostgreSQL Project
- **Backend Service:** Render / Railway / AWS App Runner (Node.js 20+)
- **Frontend Service:** Vercel / Netlify / Cloudflare Pages (React 19 + Vite)
- **Media Storage:** Cloudinary

---

## 2. Environment Variables

### Backend Environment Variables
```bash
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-app.vercel.app
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secure-jwt-secret
GEMINI_API_KEY=your-gemini-key
OPENROUTER_API_KEY=your-openrouter-key
```

### Frontend Environment Variables
```bash
VITE_API_URL=https://your-backend.onrender.com
```

---

## 3. Production Verification & Health Probes

Verify deployment health using system probes:
- **Liveness Probe:** `GET /health/live` (Expect `200 OK`, process uptime)
- **Readiness Probe:** `GET /health/ready` (Expect `200 OK`, database connectivity status)
