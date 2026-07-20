# Capstone Project Defect & Technical Debt Report
**System Audited:** OBE-TRACKING-SYSTEM (Frontend: React + Bootstrap, Backend: Django REST Framework + SQLite/PostgreSQL, Auth: JWT)  
**Original Development Team:** Farheen Shaikh, Gayatri Deore, Khushi Nigal, Saloni Hande (SP, TYCO, 2025-26, G10)  
**Project Status:** Concluded / Archived  

> **Notice for Continuing Team:** We have compiled this comprehensive report detailing 15 functional defects, structural architectural limitations, and scaling constraints. These issues must be handled on your repository fork before deploying the system to a multi-user or multi-class environment.
---
## 1. Environment & Configuration Defects
### 🔴 DEF-01: Production URL Hardcoded in Frontend API Client
* **Location:** `frontend/webapp/src/utils/axios.js`
* **Severity:** High
* **Description:** The primary API client (`axios.js`) hardcodes `baseURL: "https://onrender.com"` instead of using environment variables (`process.env.REACT_APP_API_URL`). When running the React application locally for development, all API calls are routed directly to the live production server on Render instead of your local Django backend.
* **Trigger Conditions:** Run `npm start` locally and interact with any dashboard or functional module.
* **Suggested Fix:** Replace the hardcoded string with `process.env.REACT_APP_API_URL || 'http://127.0.0'`. Create `.env.development` and `.env.production` files.

### 🔴 DEF-02: Localhost URL Hardcoded in Password Reset Modules
* **Location:** `frontend/webapp/src/api.js`
* **Severity:** High
* **Description:** `api.js` hardcodes `API_BASE_URL = 'http://127.0.0'`. This file is imported exclusively by `ForgotPassword.js` and `ResetPassword.js`. In production deployments, password reset requests attempt to hit the end-user's local port 8000, causing network errors and making password resets fail on live domains.
* **Trigger Conditions:** Click "Forgot Password" or attempt to reset a password on the deployed application.
* **Suggested Fix:** Remove `api.js` entirely and update password reset components to import the unified API client from `utils/axios.js`.

---
## 2. Core Functional & Logical Defect
### 🔴 DEF-03: Student Carry-Forward Feature Fails Silently
* **Location:** Student Management Module (Frontend / Backend API) 
* **Severity:** High 
* **Description:** The "Carry Forward" button is intended to transition a batch of students from Semester $N$ to Semester $M$. Instead, it fails silently mid-execution. The operation terminates incorrectly, causing students from Semester $N$ to completely disappear from active views rather than migrating forward.
* **Trigger Conditions:** Trigger the "Carry Forward" action for a class batch from the student dashboard.
* **Suggested Fix:** Inspect the backend migration transaction logic. Ensure queries are wrapped in an atomic transaction (`transaction.atomic()`) and fix database mapping mismatches during batch updates.

### 🔴 DEF-04: Mark Entry Page Fetches Unfiltered Global Student Array
* **Location:** Mark Entry Component / Student Fetch API
* **Severity:** High
* **Description:** The student fetching query on the Mark Entry page is broken. Instead of loading students filtered strictly by a specific **Semester** and **Class**, it falls back to fetching either every single student enrolled in that academic year or the entire database. 
* **Scaling Warning:** This was verified via semester/class differences. It was tested with only one class division's data and a maximum of 2 semesters. If scaled department-wide or division-wise, this query will throw massive payloads, slow down DOM rendering, and crash.
* **Trigger Conditions:** Navigate to the Mark Entry screen and pull student lists for a specific class section.
* **Suggested Fix:** Rewrite the backend view queryset to enforce strict `filter()` constraints using incoming query parameters (`semester_id`, `class_id`, `division_id`).

### 🔴 DEF-05: Calculation Heavyweight Blocks and Drops Email Notifications
* **Location:** Notification Engine / Course Allotment / Attainment Signal handlers
* **Severity:** High
* **Description:** When critical triggers occur—such as entering marks, allocating a course to a faculty member, or when an HOD/Coordinator requests an Action Taken Report (ATR)—the heavy attainment calculation engine fires synchronously on the same thread. This processing load causes the SMTP email notification connection to time out. The notification is successfully logged inside the web app database, but the physical email (e.g., "Course Assigned to You") never reaches the user's inbox.
* **Trigger Conditions:** Assign a course to a faculty member or request an ATR under load.
* **Suggested Fix:** Offload the massive attainment calculations and SMTP email loops completely from the HTTP request-response cycle by integrating a Redis message broker paired with Celery task queues.
---
## 3. Input Validation, Unhandled Exceptions & Application Crash Bugs
### 🔴 DEF-06: NameError on Unbound `user` Variable in ATR Submission
* **Location:** `backend/cis_master/views.py`
* **Severity:** High
* **Description:** In `SubmitATRView.post()`, a background thread `bg_calc()` invokes `AttainmentService.check_and_generate_report(course_id, academic_year, user)`. However, the variable `user` is not defined anywhere in the `post()` method scope. This causes a `NameError: name 'user' is not defined` inside the thread, preventing automatic report generation upon ATR submission.
* **Trigger Conditions:** Post an Action Taken Report (ATR) via `/api/cis/submit-atr/`.
* **Suggested Fix:** Define `user = request.user if request.user and not request.user.is_anonymous else None` inside `SubmitATRView.post()` prior to spawning `bg_calc`.

### 🔴 DEF-07: Invalid Model Field `'entered_by'` in CSV/Excel Marks Upload
* **Location:** `backend/bulk_upload/views.py`
* **Severity:** High
* **Description:** `BulkMarksUploadView.post()` attempts to update or create `MarksEntry` objects with `defaults={'marks_obtained': marks_obtained, 'entered_by': set_by}`. The `MarksEntry` model (`backend/assessments/models.py`) has a field named `user_id`, not `entered_by`. The request crashes out with `TypeError: Field 'entered_by' does not exist`.
* **Trigger Conditions:** Upload a CSV/Excel file via `/api/bulk/marks/`.
* **Suggested Fix:** Change `'entered_by': set_by` to `'user_id': set_by` inside the `defaults` configuration dictionary.

### 🟡 DEF-08: Unreachable Code Blocks Attainment Result Caching
* **Location:** `backend/attainment/attainment_service.py`
* **Severity:** Medium
* **Description:** In `AttainmentService.calculate_attainment()`, an inline dictionary `return` statement is executed early. The caching configuration logic (`cache.set(cache_key, results, 1800)`) is located completely after the return statement and is dead code. Consequently, attainment calculations are never cached.
* **Trigger Conditions:** Invoke standard `AttainmentService.calculate_attainment()`.
* **Suggested Fix:** Assign the dictionary to a local `results` variable, run `cache.set(cache_key, results, 1800)`, and then `return results`.
---
## 4. Security Gaps, Open Permissions & Role Access Gaps
### 🔴 DEF-09: Unauthenticated Data Modification on Academic Models
* **Location:** `backend/academics/views.py` (Multiple classes)
* **Severity:** High
* **Description:** Classes `CourseCOListCreateAPIView`, `POListCreateAPIView`, and `PSOListCreateAPIView` declare `permission_classes = [AllowAny]`. Anonymous public users can send POST requests to modify or delete Course Outcomes (COs), Program Outcomes (POs), and Program Specific Outcomes (PSOs). In `CourseCOListCreateAPIView.post()`, missing CO numbers are deleted automatically, allowing unauthenticated deletion of records.
* **Trigger Conditions:** Send unauthenticated POST HTTP requests to `/api/academics/courses/<course_id>/cos/`, `/api/academics/pos/`, or `/api/academics/psos/`.
* **Suggested Fix:** Implement a dynamic `get_permissions()` hook to allow `AllowAny` strictly for `GET` requests and enforce `[IsAuthenticated]` or role checks for state-changing operations.

### 🟡 DEF-10: Sensitive User Information Exposure via Unauthenticated User/Student Endpoints
* **Location:** `backend/users/views.py`* **Severity:** Medium
* **Description:** `UserListCreateAPIView` and `StudentListCreateAPIView` mistakenly allow unauthenticated (`AllowAny`) `GET` requests. Any external entity can query these endpoints to completely scrape user and student profiles—including full names, email addresses, phone numbers, and department mappings.
* **Trigger Conditions:** Send a `GET` request to `/api/users/` or `/api/users/students/` without token auth headers.
* **Suggested Fix:** Restrict `GET` access on these user-listing views to `[IsAuthenticated]` paired with Admin/HOD access validation.

### 🔴 DEF-11: Auth Bypass and Identity Spoofing in Marks Entry
* **Location:** `backend/assessments/views.py`
* **Severity:** High
* **Description:** `SaveAssessmentMarksView` defines `authentication_classes = []` and `permission_classes = [permissions.AllowAny]`. Because JWT token parsing is bypassed entirely, `request.user` defaults to an anonymous profile. The backend script introduces a dangerous fallback: `user = User.objects.first()`. This auto-assigns the first system user (the Admin) to the entries, allowing unauthenticated users to save grades under the administrator's account.
* **Trigger Conditions:** Send a `POST` request to `/api/assessments/marks/save/` without authentication headers.
* **Suggested Fix:** Re-enable standard token authentication arrays and set the explicit permission class to `[IsAuthenticated]`.

### 🔴 DEF-12: Public Exposure of Emergency Database Cleanup View
* **Location:** `backend/surveys/views.py`
* **Severity:** High
* **Description:** EmergencyCleanupView mistakenly specifies permission_classes = [permissions.AllowAny]. Any unauthenticated browser client or bot can issue a POST request to /api/surveys/emergency-cleanup/ to instantly and permanently wipe out all SurveyQuestion and SurveyAnswer records matching specific text patterns.
* **Trigger Conditions:** Send an unauthorized POST request directly to /api/surveys/emergency-cleanup/.
* **Suggested Fix:** Restrict the view permission classes to [IsAuthenticated, IsAdmin].

---
## 5. Architecture, Threading & UI Quality Defects
## 🔵 DEF-13: UI/UX Component Inconsistencies
* **Location:** Global Frontend Components
* **Severity:** Low
* **Description:** The user interface displays high visual and design debt. Interactive components like buttons, input fields, and search bars are not uniform across modules. Each dashboard page implements distinct paddings, styling variations, and customized non-reusable layout implementations.
* **Suggested Fix:** Refactor frontend components using a unified Design System or component global standard wrappers (e.g., standardizing Tailwind classes or consolidating Material-UI themes).

## 🔵 DEF-14: Dead Schema Models in indirect_attainment Module
* **Location:** `backend/indirect_attainment/models.py`
* **Severity:** Low
* **Description:** CourseIndirectAttainment and ActivityIndirectAttainment models are fully defined, migrated, and registered in admin views, but are completely bypassed by the core calculation engine (AttainmentService._calculate_indirect_co_attainment), which calculates indirect metrics straight from SurveyMaster and SurveyAnswer tables.
* **Trigger Conditions:** System database schema inspection and cleanup.
* **Suggested Fix:** Deprecate or drop unused models and views in indirect_attainment or re-engineer the AttainmentService to explicitly rely on activity-based database entries.

## 🔴 DEF-15: Unmanaged Daemon Threads & SQLite Concurrency Limits
* **Location:** Widespread across attainment/signals.py, assessments/views.py, cis_master/views.py, and surveys/views.py.
* **Severity:** High
* Description: Background calculation routines are initiated by spawning raw, unmanaged Python threads (threading.Thread(target=..., daemon=True).start()). In production environments (such as Render worker nodes or Gunicorn containers), worker recycles can instantly kill daemon processes mid-task. Concurrently, the @receiver(post_save, sender=Student) signal spawns individual threads per student instance during imports. This forces heavy simultaneous writes onto an SQLite instance, causing fatal OperationalError: database is locked failures.
* **Trigger Conditions:** Perform a bulk data import or handle heavy concurrent multi-user interactions.
* **Suggested Fix:** Shift database storage from SQLite over to a robust relational engine like PostgreSQL to handle concurrency, and transition thread management to an active task runner like Celery or Django-Q.

---
## Architectural Constraints & Future Scope Roadmap
## 1. Multi-Institution Limitation (Current Scope: Single Institute Only)
The entire relational database model was built assuming deployment for a single isolated institution. If the department or a third party intends to scale this architecture into a Multi-Institution SaaS application, the schema will fail immediately.

* Required Change: An entire structural model overhaul is needed. They must introduce a global Institution model and inject an institution_id Foreign Key into all core organizational tables (User, Student, Course, Department) to achieve multi-tenant data isolation.

## Vital Stress-Testing Guidelines for the Continuing Team
Because the original development group handled system evaluation using constrained control variables (exactly one class division's data, max 2 semesters), the underlying query loops have not been proven against standard academic operational metrics.
We strongly urge the next development team to run Full-Scale Stress Testing using complex synthetic/dummy records across the following matrices before deploying anything live:

* Horizontal Scalability: Data mapped for all academic years, all semesters, and all class divisions simultaneously.
* Vertical Depth: Simultaneous active computations across multiple subjects tracking all attainment tools (Direct, Indirect, External, Internal).
* Department-Wide Scope: Run concurrent multi-role traffic (HODs, Coordinators, and Faculty members accessing and editing entries at the same time).
* Multi-Tenant Simulation: Simulate dataset isolation if multi-institution logic is implemented.

---
## Quick-Scan Defect Matrix

| Defect ID | Title / Vulnerability Area | Component | Severity |
|---|---|---|---|
| DEF-01 | Production URL Hardcoded in Frontend API Client | Frontend / Env | 🔴 High |
| DEF-02 | Localhost URL Hardcoded in Password Reset Modules | Frontend / Env | 🔴 High |
| DEF-03 | Student Carry-Forward Feature Fails Silently | Frontend / Logic | 🔴 High |
| DEF-04 | Mark Entry Page Fetches Unfiltered Global Array | Frontend / Backend API | 🔴 High |
| DEF-05 | Calculation Load Blocks & Drops Email Notifications | Backend / Performance | 🔴 High |
| DEF-06 | NameError on Unbound user Variable in ATR Submission | Backend / Core | 🔴 High |
| DEF-07 | Invalid Model Field 'entered_by' in CSV Marks Upload | Backend / Bulk Upload | 🔴 High |
| DEF-08 | Unreachable Code Blocks Attainment Result Caching | Backend / Engine | 🟡 Medium |
| DEF-09 | Unauthenticated Data Modification on Academic Models | Security / RBAC | 🔴 High |
| DEF-10 | PII Exposure via Unauthenticated User/Student Endpoints | Security / Privacy | 🟡 Medium |
| DEF-11 | Auth Bypass and Identity Spoofing in Marks Entry | Security / RBAC | 🔴 High |
| DEF-12 | Public Exposure of Emergency Database Cleanup View | Security / RBAC | 🔴 High |
| DEF-13 | UI/UX Component Inconsistencies | Frontend UI | 🔵 Low |
| DEF-14 | Dead Schema Models in indirect_attainment Module | Architecture | 🔵 Low |
| DEF-15 | Unmanaged Daemon Threads & SQLite Concurrency Limits | Infra / Database | 🔴 High |


---