"""The profile shared by the workshop, experience board, and printable resume."""

import json
import re
from datetime import date
from pathlib import Path

from app.projects import APP_ROOT


MONTHS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")


def format_date(value):
    """Format recorded year/month precision without inventing missing dates."""
    if value == "Present":
        return value
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}(?:-\d{2})?", value):
        raise ValueError("Profile dates must be YYYY, YYYY-MM, or Present.")
    if len(value) == 4:
        date(int(value), 1, 1)
        return value
    parsed = date.fromisoformat(value + "-01")
    return f"{MONTHS[parsed.month - 1]} {parsed.year}"


def load_profile(path=None):
    path = Path(path) if path is not None else APP_ROOT / "data" / "resume.json"
    profile = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(profile, dict) or not isinstance(profile.get("basics"), dict):
        raise ValueError("The profile must contain basics and profile sections.")
    for field in ("name", "label", "email", "summary"):
        if not isinstance(profile["basics"].get(field), str) or not profile["basics"][field].strip():
            raise ValueError(f"Profile basics.{field} must be non-empty text.")

    ids = set()
    for section in ("work", "education"):
        if not isinstance(profile.get(section), list):
            raise ValueError(f"Profile {section} must be an array.")
        for entry in profile[section]:
            entry_id = entry.get("id") if isinstance(entry, dict) else None
            if not isinstance(entry_id, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", entry_id):
                raise ValueError("Profile IDs must use lowercase words separated by single hyphens.")
            if entry_id in ids:
                raise ValueError(f"Duplicate profile ID: {entry_id}")
            ids.add(entry_id)
            start = format_date(entry.get("startDate"))
            end = format_date(entry.get("endDate"))
            default_label = start if start == end else f"{start} – {end}"
            if entry.get("expectedEndDate"):
                default_label += f" · expected {format_date(entry['expectedEndDate'])}"
            entry.setdefault("dateLabel", default_label)
            if not isinstance(entry["dateLabel"], str) or not entry["dateLabel"].strip():
                raise ValueError(f"{entry_id}: dateLabel must be non-empty text.")
            if section == "work" and entry.get("kind") not in {"employment", "student-organization", "thesis"}:
                raise ValueError(f"{entry_id}: work needs an employment, student-organization, or thesis kind.")

    if not isinstance(profile.get("skills"), list):
        raise ValueError("Profile skills must be an array.")
    for group in profile["skills"]:
        if not isinstance(group, dict) or not isinstance(group.get("name"), str) or not isinstance(group.get("keywords"), list):
            raise ValueError("Each skill group needs a name and keywords.")
        if any(not isinstance(keyword, str) or not keyword.strip() for keyword in group["keywords"]):
            raise ValueError("Skill keywords must be non-empty text.")
    return profile
