import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from config import settings
import storage

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}")

    tmp_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        meta = storage.build_document_index(tmp_path, file.filename)
    except Exception as e:
        raise HTTPException(500, f"Failed to process document: {e}")

    return meta


@router.get("")
async def get_documents():
    return storage.list_documents()


@router.delete("/{doc_id}")
async def remove_document(doc_id: str):
    storage.delete_document(doc_id)
    return {"status": "deleted", "doc_id": doc_id}
