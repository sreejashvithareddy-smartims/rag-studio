import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form
from config import settings
import storage

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}


@router.post("/upload")
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...), project_id: str = Form(None)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}")

    tmp_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    placeholder = storage.create_placeholder(file.filename, project_id=project_id)
    background_tasks.add_task(storage.populate_document_index, placeholder["doc_id"], tmp_path, file.filename)

    return placeholder


@router.get("")
async def get_documents(project_id: str = None):
    return storage.list_documents(project_id=project_id)


@router.delete("/{doc_id}")
async def remove_document(doc_id: str):
    storage.delete_document(doc_id)
    return {"status": "deleted", "doc_id": doc_id}