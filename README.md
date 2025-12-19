# OBE Tracking System

A full-stack web application to automate CO/PO/PSO mapping, attainment calculations, and student stress analysis. The system includes role-based dashboards, anonymous stress surveys, and accreditation-ready reports.

## Team Members & Roles

- Khushi – Frontend Lead
- Gayatri – Backend Lead
- Saloni – Documentation, Research, Testing & QA Lead
- Farheen – Team Lead, Backend Support & Integration

## Project Structure

Root Directory

- backend

  - core
  - db.sqlite3
  - manage.py
  - requirements.txt

- frontend/webapp

  - public
  - src
  - package.json
  - package-lock.json

- .gitignore
- README.md

## Setup Instructions

### Backend (Django)

```
cd backend
python -m venv venv
```

Activate venv:

```
Windows PowerShell: .\venv\Scripts\Activate.ps1
Windows CMD: .\venv\Scripts\activate
macOS/Linux: source venv/bin/activate
```

Install dependencies:

```
pip install -r requirements.txt
```

Run server:

```
python manage.py runserver
```

### Frontend (React)

```
cd frontend/webapp
npm install
npm start
```

### Git Workflow Commands

```
git clone <repo-url>
cd OBE-TRACKING-SYSTEM
git branch
git checkout -b your-name/feature-name
git push -u origin your-name/feature-name

git checkout main
git pull origin main

git checkout your-name/feature-name
git merge main
```

### Pushing Changes

```
git status
git add .
git commit -m "your message here"
git push
```

## Notes

- Do not push venv or node_modules folders to GitHub.
- These are ignored using .gitignore.
