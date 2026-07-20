# Handover Notes, Insider Guidelines & Architectural Intent

**Project Name:** OBE-TRACKING-SYSTEM  

**From:** Foundational Engineering Team (Farheen, Gayatri, Khushi, Saloni) 

**To:** Junior Engineering Team (Continuing Batch)  

This document outlines the operational reality, performance benchmarks, core design choices, and support boundaries for the Outcome Based Education Tracking System. Read this document completely before modifying any backend modules or frontend components.

---

## 1. Base Integrity, Presentation Proof & Calculation Accuracy

Our system has been rigorously tested and verified to work **end-to-end correctly** under the specified control variables and evaluation scale designed for our CPE.

* **Verified Calculations**: The core attainment calculation engine was cross-verified multiple times against manual structural records for absolute mathematical precision. The outputs and reports are 100% accurate under our test boundaries.
* **No Temporary Patches**: Whenever an inconsistency or computational discrepancy was found during development, we resolved the root cause of the logic. We explicitly avoided temporary patches, hardcoded shortcuts, or "staged" scripts.
* **100% Live Working**: During our evaluations, we demonstrated the actual, real-time working execution of the codebase (often running on localhost). Nothing shown was a mock demo, a pre-rendered video, or fake data.
* **Operational Scale**: The baseline system was validated using dataset parameters scaled to **one class division and a maximum of two concurrent semesters**. 

> ⚠️ **CRITICAL NOTE ON REGRESSIONS:** Because the core engine leaves our hands working flawlessly, if you encounter mathematically incorrect data, broken application endpoints, or fatal system crashes (apart from the 15 documented bugs in `DEFECT_REPORT.md`), **know that the bug originates from changes or modifications made by your team**. We are handing over an accurate, reliable attainment engine.

---

## 2. Crucial Advice: Do Not Trust Manual Reference Reports Blindly

Based on our direct experience, **do not assume that the manual Excel reports or reference sheets provided by faculty members are 100% accurate.** 

* **The Reality of Manual Work**: During development, we analyzed two reference sheets provided for the 3rd and 4th semesters. One sheet contained an outright manual calculation error, and the other consisted entirely of dummy data. 
* **The Project's Core Purpose**: This is the exact problem our capstone project was built to solve. Large, manual, complex calculations naturally introduce human error and place an immense cognitive workload on teachers. 
* **Your Strategy**: When testing your code, do not stress yourself out if your automated engine's output doesn't match a faculty member's manual sheet. Double-check your code logic first—the manual sheet itself might be mathematically flawed (but not always, doubt your code first).

---

## 3. Architectural Intent Behind Key Modules

To prevent your team from making incorrect design assumptions, here is why we built specific modules the way we did:

### A. The Student Stress Survey Module (Diagnostic, Not Medical)
* **The "Why"**: Our foundational thesis was that student stress (which is not always academic) directly degrades outcome attainment levels. 
* **The Design**: We kept this module completely **anonymous**. It was designed strictly for **diagnostic purposes**, not medical tracking. 
* **The Goal**: The system analyzes aggregated stress trends and surfaces them to authorized user roles. The goal is to allow administrators to conclude whether a drop in course attainment was driven by extreme student stress patterns, allowing them to take corrective institutional actions.

### B. Faculty Feedback Module & ERP Integration Warning
* **The "Why"**: Sometimes, students simply do not adapt well to a specific teacher's methodology, causing lower attainment even if the students are not stressed. 
* **ERP Integration Note**: If the department plans to merge this project with our institute's main ERP system, **this custom feedback module will no longer be necessary**. You will need to deprecate our custom feedback scripts and interface directly with the official feedback data arrays used by the institutional ERP.

### C. The Auditor Role & Scanned Document Uploads
* **The "Why"**: This role was custom-designed for external inspectors during NBA accreditation audits. The goal is to provide a single, unified platform where an auditor can access all proof instantly without forcing teachers to dig through physical files.
* **Read-Only Enforcements**: The Auditor has **read-only access and remark privileges** across the system. They have zero direct write permissions (verify the exact access grids inside our `rbac/user roles` documentation).
* **⚠️ Storage Defect Warning**: On the Mark Entry page, faculty can upload supporting documents. Currently, due to development limitations, these files are converted to **Base64 strings and stored inside the browser's LocalStorage**. In a production environment, this is highly insecure and inefficient. **You must modify this logic to stream and store these documents directly into a dedicated database binary field or cloud storage instance.**

---

## 4. Communication & Debugging Boundaries

As we transition into our higher education, our time is highly limited, but we want to see this project succeed.

* **Ownership Transferred**: Your batch is now the primary owner and engineer of this codebase. Tracking stack traces and resolving syntax errors is entirely your responsibility.
* **No Live Debugging Sessions**: We will not be available to join debug calls, read server logs, or write code fixes for your bugs.
* **Direct Messages (DMs) Allowed**: If you don't understand *why* we made a certain design decision or structured a model a certain way, **feel free to DM us directly**. 
* **Ask Before You Code**: We highly recommend asking us about our design choices *before* writing new modules on top of our code. This prevents you from making incorrect assumptions that could lead to a major architectural crash later.

Good luck! Treat this foundation carefully, read the documentation, and you will build a highly impressive system.