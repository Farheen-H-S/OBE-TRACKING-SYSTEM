Remove-Item -Recurse -Force ../../backend/frontend_build -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path ../../backend/frontend_build

Copy-Item -Recurse -Force build/* ../../backend/frontend_build/