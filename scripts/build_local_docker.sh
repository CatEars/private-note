#!/bin/bash
cd frontend
npm run build:styles
if [ "$?" -ne "0" ]; then
    exit 1;
fi
npm run build
if [ "$?" -ne "0" ]; then
    exit 1;
fi
cd ..
rm -rf backend/static
cp -r frontend/build backend/static
cd backend
npm run build
if [ "$?" -ne "0" ]; then
    exit 1;
fi
docker build . -t private-note -f dockerfile-private-note
if [ "$?" -ne "0" ]; then
    exit 1;
fi
cd ..
