#!/bin/bash
cd frontend
npm run build:styles
npm run build
cd ..
rm -rf backend/static
cp -r frontend/build backend/static
cd backend
npm run build
docker build . -t private-note -f dockerfile-private-note
cd ..
