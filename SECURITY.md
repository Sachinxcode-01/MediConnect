# MediConnect Security & Governance Policy

## 1. Authentication & JWT Architecture
- MediConnect issues signed JSON Web Tokens (JWT) using `HS256` or `RS256` encryption containing user identity (`id`, `email`, `role`).
- Tokens expire in 30 days and are transmitted via HTTP Authorization headers (`Bearer <token>`) or secure HTTP-only cookies.

---

## 2. Role-Based Access Control (RBAC)
Server-side authorization middleware (`protect`, `authorize('patient', 'doctor', 'admin')`) strictly validates every request:

- **Patient:** Access restricted to own medical records, prescriptions, triage history, and booked appointments.
- **Doctor:** Access restricted to assigned triage queue cases, confirmed patient consultations, and professional availability.
- **Admin:** Access restricted to system user status management, doctor verification approvals, and audit trails.

---

## 3. IDOR & Data Leakage Prevention
- Object-level ownership validation prevents Patients from accessing records or appointments belonging to other users.
- Error payloads are sanitized in production (`success: false, error: { code, message }`) to prevent database schema exposure.

---

## 4. Audit Trail & Logging
- Security-relevant events (`LOGIN`, `VERIFY_DOCTOR`, `CREATE_PRESCRIPTION`, `ACCESS_RECORD`) write to an immutable `audit_logs` table via `AuditLog.js`.
