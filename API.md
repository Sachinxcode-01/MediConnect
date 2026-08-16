# MediConnect API v1 Specification

Base Endpoint: `/api/v1` (with `/api` legacy aliases)

---

## 1. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | Register patient or doctor account |
| `POST` | `/login` | Public | Authenticate user & return JWT token |
| `GET` | `/me` | Private | Retrieve current user profile & role |
| `POST` | `/send-otp` | Public | Send 6-digit verification code to email |
| `POST` | `/verify-otp` | Public | Verify OTP code |

---

## 2. AI Symptom Triage Endpoints (`/api/v1/triage`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Patient | Submit symptoms for AI triage evaluation |
| `GET` | `/queue` | Doctor/Admin | Fetch real-time active triage queue |
| `PUT` | `/:id/assign` | Doctor | Claim case to doctor workspace |
| `POST` | `/:id/notes` | Doctor | Add clinical note to triage case |
| `POST` | `/analyze` | Doctor | Run secondary AI analysis on case |

---

## 3. Appointment Endpoints (`/api/v1/appointments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Patient | Request new appointment with slot conflict check |
| `GET` | `/patient` | Patient | Get patient appointment ledger |
| `GET` | `/doctor` | Doctor | Get doctor appointment ledger |
| `PUT` | `/:id/status` | Doctor/Patient | Update state (`scheduled`, `confirmed`, `completed`) |
| `GET` | `/:id/join` | Participant | Authenticate WebRTC room entry |

---

## 4. Notifications Endpoints (`/api/v1/notifications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Private | Get user notifications list |
| `PUT` | `/:id/read` | Private | Mark single notification as read |
| `PUT` | `/read-all` | Private | Mark all notifications as read |
