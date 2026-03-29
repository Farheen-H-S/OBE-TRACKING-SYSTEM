# Navigate to frontend build folder
cd frontend/webapp

# Remove old frontend_build folder in backend
Write-Host "Removing old frontend_build..."
Remove-Item -Recurse -Force ../../backend/frontend_build -ErrorAction SilentlyContinue

# Create new frontend_build folder
Write-Host "Creating frontend_build..."
New-Item -ItemType Directory -Path ../../backend/frontend_build

# Copy index.html to backend/frontend_build
Write-Host "Copying index.html..."
Copy-Item -Force build/index.html ../../backend/frontend_build/

# Copy static folder (JS, CSS, images)
Write-Host "Copying static files..."
Copy-Item -Recurse -Force build/static ../../backend/frontend_build/static

Write-Host "Frontend build copied successfully!"