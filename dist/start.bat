@echo off

REM check if node modules are installed
if not exist "%~dp0\node_modules" (
  echo Installing node modules
  npm install --only prod
)

:start
node ./build/src/index.js