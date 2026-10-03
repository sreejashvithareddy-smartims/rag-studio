@echo off
cd /d D:\rag-studio\backend
call venv\Scripts\activate.bat
uvicorn main:app --reload --port 8000
pause