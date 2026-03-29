# build-and-copy.ps1

# Navigate to frontend folder
cd frontend/webapp

Write-Host "Installing dependencies..."
npm install

Write-Host "Building React app for production..."
npm run build

# Remove old frontend_build in backend
Write-Host "Removing old frontend_build..."
Remove-Item -Recurse -Force ../../backend/frontend_build -ErrorAction SilentlyContinue

# Copy new build to backend/frontend_build
Write-Host "Copying new build..."
Copy-Item -Recurse -Force build ../../backend/frontend_build

Write-Host "Frontend build copied successfully!"