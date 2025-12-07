#!/bin/sh
set -e
echo "Current directory: $(pwd)"
echo "Listing files:"
ls -la
echo "Creating backend/public directory if it doesn't exist..."
mkdir -p backend/public
echo "Changing to frontend directory..."
cd frontend || exit 1
echo "Current directory: $(pwd)"
echo "Installing dependencies..."
npm install
echo "Building..."
npm run build
echo "Build completed. Checking output..."
ls -la ../backend/public || echo "Output directory not found"

