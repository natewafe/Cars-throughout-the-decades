# PowerShell equivalent of serve.bat.
# Usage: right-click this file and choose "Run with PowerShell".
# Required: Python 3 on PATH. The 3D models only render over http://, not file://.
Set-Location -Path $PSScriptRoot
Start-Process "http://localhost:8765/index.html"
python -m http.server 8765 --bind 127.0.0.1
