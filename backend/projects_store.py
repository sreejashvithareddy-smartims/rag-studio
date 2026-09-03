import os
import json
import uuid
import time
from config import settings

PROJECTS_PATH = os.path.join(settings.DATA_DIR, "projects.json")


def _load() -> dict:
    if os.path.exists(PROJECTS_PATH):
        with open(PROJECTS_PATH, "r") as f:
            return json.load(f)
    return {}


def _save(data: dict):
    with open(PROJECTS_PATH, "w") as f:
        json.dump(data, f, indent=2)


def create_project(name: str) -> dict:
    projects = _load()
    project_id = str(uuid.uuid4())[:8]
    project = {"project_id": project_id, "name": name, "created_at": time.time()}
    projects[project_id] = project
    _save(projects)
    return project


def list_projects() -> list[dict]:
    return sorted(_load().values(), key=lambda p: p["created_at"], reverse=True)


def get_project(project_id: str) -> dict | None:
    return _load().get(project_id)


def delete_project(project_id: str):
    projects = _load()
    projects.pop(project_id, None)
    _save(projects)