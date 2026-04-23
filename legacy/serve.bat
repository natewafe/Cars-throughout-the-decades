@echo off
REM Double-click this file to start a local server for the legacy/ museum pages.
REM Required: Python 3 must be installed and on PATH.
REM The 3D models (.glb) only render when served over http://, never file://.

pushd "%~dp0"
start "" http://localhost:8765/index.html
python -m http.server 8765 --bind 127.0.0.1
popd
