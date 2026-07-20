# OBE Tracking System: Architectural Overview

This document provides a technical deep-dive into the architecture of the OBE Tracking System, designed for presentation and technical discussion purposes.

---

## 1. Overall System Architecture

The system follows a classic **Decoupled Client-Server Architecture** using a modern web stack.

- **Frontend:** React-based Single Page Application (SPA).
- **Backend:** Django with Django REST Framework (DRF).
- **Database:** Relational Database (SQLite for development, typically PostgreSQL/MySQL for production).
- **Authentication:** Stateless JSON Web Tokens (JWT).

### Request Flow Example
1. **User Action:** User clicks "Calculate Attainment" in a React component.
2. **React Component:** Calls a service function which uses the global `FilterContext` for parameters.
3. **Axios:** Sends an authenticated POST request to `/api/attainment/calculate/`.
4. **API Endpoint:** Django URL dispatcher routes the request to the specific `APIView`.
5. **Django View:** Performs permission checks (`IsAuthenticated`, `IsFaculty`).
6. **Business Logic:** Triggers a background thread (`threading.Thread`) for heavy calculations.
7. **Serializer:** Formats the immediate "Success" response or the resulting data.
8. **Database:** Updates attainment records.
9. **Response:** Backend returns a JSON response to the frontend.
10. **UI Update:** React updates the local state, triggering a re-render to show calculated values.

---

## 2. Frontend Architecture (React)

Located in: `frontend/webapp/src/`

### Core Concepts
- **React Context (FilterContext):** Implemented in [FilterContext.js](OBE-TRACKING-SYSTEM/frontend/webapp/src/context/FilterContext.js), this serves as the "Global Brain" of the UI. It stores selected Departments, Schemes, and Batches, persisting them across page refreshes via `localStorage`.
- **React Hooks:** 
    - `useState` is used for local component state (e.g., form inputs).
    - `useEffect` handles side-effects like fetching data when a filter changes.
    - Custom hooks like `useFilters` provide easy access to the global context.
- **Axios API Services:** Centralized in [api.js](OBE-TRACKING-SYSTEM/frontend/webapp/src/api.js). It includes a **Request Interceptor** that automatically attaches the JWT `access` token to every outgoing request.
- **Component Structure:**
    - `pages/`: Full-page views (Dashboard, Reports, Surveys).
    - `components/`: Reusable UI elements (Sidebar, Header, Tables).
    - `utils/`: Logic helpers (Auth, formatting).

---

## 3. Backend Architecture (Django + DRF)

Located in: `backend/`

### Processing Layers
- **API Views / ViewSets:** Using Class-Based Views (CBV) like `APIView` in [views.py](OBE-TRACKING-SYSTEM/backend/users/views.py) to handle logic. 
- **Serializers:** Handle the conversion between Django Model instances and JSON. They also validate incoming data.
- **Models:** Define the database schema using Django's ORM.
- **Permissions:** Custom classes like `IsAdmin` or `IsAuditor` in `permissions.py` (and individual view checks) ensure RBAC.
- **Query Filtering:** Views use `Q` objects and `filter()` logic to restrict data based on the logged-in user's role and selected academic context.

---

## 4. Authentication and Security

- **JWT Tokens:** Uses `rest_framework_simplejwt`. On login, the server returns an `access` (short-lived) and `refresh` (long-lived) token.
- **Token Storage:** Injected into `localStorage` by the frontend.
- **Verification:** The backend verifies the `Authorization: Bearer <token>` header for every request using the `JWTAuthentication` class defined in `settings.py`.

---

## 5. Role Based Access Control (RBAC)

### Definition
Roles are defined in the `UserRole` model (Admin, HOD, Coordinator, Faculty, Auditor, Student).

### Enforcement
- **Backend:** Views check `request.user.role_id.role_name`. For example, a Faculty member cannot access the `/users/` list API.
- **Frontend:** Components like [FacultySide.js](OBE-TRACKING-SYSTEM/frontend/webapp/src/components/sidebar/FacultySide.js) or `CoordinatorSide.js` are conditionally rendered based on the user's role stored in the Auth state.

---

## 6. Logging System (Audit)

### Implementation
- **Model:** `AuditLog` in [audit/models.py](OBE-TRACKING-SYSTEM/backend/audit/models.py).
- **Data Captured:** User, Action (CREATE/UPDATE/LOGIN), Entity Name, Entity ID, `old_value` (JSON), `new_value` (JSON), Remark, and IP Address.
- **Retention:** Currently stored indefinitely in the database. 
- **Best Practices:** 
    - Logs should ideally be moved to an archive (e.g., S3 or a CSV backup) after 6-12 months.
    - For high-traffic systems, a cleanup script or a database partition might be necessary to prevent query slowdowns on the `audit_log` table.

---

## 7. Performance Considerations

- **Threading:** Heavy operations like Attainment Calculation or Batch Aggregation are offloaded to background threads. This prevents the server from timing out during complex math.
    - *Example:* See `threading.Thread(target=run_attainment_calc, ...)` in [attainment/signals.py](OBE-TRACKING-SYSTEM/backend/attainment/signals.py).
- **Database Load:** Large `AuditLog` and `Student` tables benefit from the efficient indexing provided by the Django ORM.
- **Frontend Context:** The `FilterContext` fetch logic is wrapped in `useCallback` and limited by `useEffect` dependencies to avoid redundant API calls.

---

## 8. Possible Improvements

- **Architecture:** Transition from raw `threading.Thread` to a dedicated task queue like **Celery** with **Redis**. This allows for task monitoring, retries, and better resource management.
- **Security:** Implement **Token Rotation** and **IP Whitelisting** for sensitive administrative actions.
- **Scalability:** Move to a more robust database like **PostgreSQL** to handle concurrent writes better than SQLite.
- **Maintainability:** Standardize all API views into `ViewSet` structures to reduce boilerplate code.
