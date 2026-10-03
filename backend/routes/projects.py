from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import projects_store
import history_store
import storage

router = APIRouter(prefix="/api/projects", tags=["projects"])


class CreateProjectRequest(BaseModel):
    name: str


@router.post("")
async def create_project(req: CreateProjectRequest):
    if not req.name.strip():
        raise HTTPException(400, "Project name cannot be empty.")
    return projects_store.create_project(req.name.strip())


@router.get("")
async def list_projects():
    projects = projects_store.list_projects()
    for p in projects:
        docs = storage.list_documents(p["project_id"])
        p["doc_count"] = len(docs)
        p["building_count"] = sum(1 for d in docs if d.get("status") == "building")
        p["ready_count"] = sum(1 for d in docs if d.get("status") == "ready")
        p["error_count"] = sum(1 for d in docs if d.get("status") == "error")
        if p["building_count"] > 0:
            p["overall_status"] = "building"
        elif p["error_count"] > 0 and p["ready_count"] == 0:
            p["overall_status"] = "error"
        elif docs:
            p["overall_status"] = "ready"
        else:
            p["overall_status"] = "empty"
    return projects


@router.get("/{project_id}")
async def get_project(project_id: str):
    project = projects_store.get_project(project_id)
    if not project:
        raise HTTPException(404, f"Project '{project_id}' not found.")
    return project


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    projects_store.delete_project(project_id)
    return {"status": "deleted", "project_id": project_id}


@router.get("/{project_id}/history")
async def get_project_history(project_id: str):
    return history_store.get_history(project_id)