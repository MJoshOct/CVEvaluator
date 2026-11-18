#!/bin/bash
# Railway build script - builds React frontend then bundles it into the Django backend image
# Railway runs this via: bash railway-build.sh
set -e

echo "--- Building React frontend ---"
cd frontend
npm ci
npm run build
cd ..

echo "--- Copying React dist to backend/frontend_dist ---"
rm -rf backend/frontend_dist
cp -r frontend/dist backend/frontend_dist

echo "--- Build complete. backend/frontend_dist is ready. ---"
