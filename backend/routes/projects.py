from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import projects_store
import history_store

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
    return projects_store.list_projects()


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