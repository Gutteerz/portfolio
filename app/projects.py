"""Load the shared project catalog used by the world and ordinary HTML pages."""

import json
import re
from pathlib import Path
from urllib.parse import urlsplit


APP_ROOT = Path(__file__).resolve().parent
PROJECT_KINDS = {"clock", "rov", "camera", "arcade", "phone", "cards", "terminal"}
PROJECT_ZONES = {"workshop", "study", "games"}


def _valid_url(value):
    if not isinstance(value, str) or not value or "\\" in value:
        return False
    if any(character.isspace() or ord(character) < 32 for character in value):
        return False
    if value.startswith("/") and not value.startswith("//"):
        return True
    parsed = urlsplit(value)
    return parsed.scheme == "https" and bool(parsed.netloc) and not parsed.username


def load_projects(path=None, static_root=None):
    """Read and validate projects; assign a page URL and unused slot when omitted."""
    path = Path(path) if path is not None else APP_ROOT / "data" / "projects.json"
    static_root = Path(static_root) if static_root is not None else APP_ROOT / "static"
    projects = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(projects, list):
        raise ValueError("The project catalog must be a JSON array.")

    ids = set()
    slots = {zone: set() for zone in PROJECT_ZONES}
    for project in projects:
        if not isinstance(project, dict):
            raise ValueError("Each project must be a JSON object.")
        project_id = project.get("id")
        if not isinstance(project_id, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", project_id):
            raise ValueError("Project IDs must use lowercase letters, numbers, and single hyphens.")
        if project_id in ids:
            raise ValueError(f"Duplicate project ID: {project_id}")
        ids.add(project_id)

        for field in ("title", "summary", "description"):
            if not isinstance(project.get(field), str) or not project[field].strip():
                raise ValueError(f"{project_id}: {field} must be non-empty text.")
        for field in ("technologies", "highlights"):
            values = project.get(field)
            if not isinstance(values, list) or any(not isinstance(item, str) or not item.strip() for item in values):
                raise ValueError(f"{project_id}: {field} must be an array of text.")

        image = project.setdefault("image", None)
        if image is not None:
            if not isinstance(image, str) or "\\" in image or Path(image).is_absolute() or ".." in Path(image).parts:
                raise ValueError(f"{project_id}: image must be a path relative to app/static.")
            image_path = (static_root / image).resolve()
            if not image_path.is_relative_to(static_root.resolve()) or not image_path.is_file():
                raise ValueError(f"{project_id}: image must name an existing file inside app/static.")

        if project.get("detailUrl") is None:
            project["detailUrl"] = f"/projects/{project_id}"
        if not _valid_url(project["detailUrl"]):
            raise ValueError(f"{project_id}: detailUrl must be a site path or HTTPS URL.")
        links = project.setdefault("links", [])
        if not isinstance(links, list):
            raise ValueError(f"{project_id}: links must be an array.")
        for link in links:
            if not isinstance(link, dict) or not isinstance(link.get("label"), str) or not link["label"].strip() or not _valid_url(link.get("url")):
                raise ValueError(f"{project_id}: each link needs a label and a site path or HTTPS URL.")

        world = project.get("world")
        if not isinstance(world, dict) or not isinstance(world.get("kind"), str) or not isinstance(world.get("zone"), str) or world["kind"] not in PROJECT_KINDS or world["zone"] not in PROJECT_ZONES:
            raise ValueError(f"{project_id}: world needs a supported kind and zone.")
        if "slot" in world:
            slot = world["slot"]
            if type(slot) is not int or slot < 0:
                raise ValueError(f"{project_id}: world.slot must be a non-negative integer.")
            if slot in slots[world["zone"]]:
                raise ValueError(f"{project_id}: world.slot is already used in {world['zone']}.")
            slots[world["zone"]].add(slot)

    # Reserve explicit positions first, then place additions in the first free slot.
    for project in projects:
        world = project["world"]
        if "slot" not in world:
            used = slots[world["zone"]]
            slot = 0
            while slot in used:
                slot += 1
            world["slot"] = slot
            used.add(slot)
    return projects
