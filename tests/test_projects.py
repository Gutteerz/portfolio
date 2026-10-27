import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from flask import Flask

from app import limiter
from app.projects import APP_ROOT, load_projects
from app.routes import LEGACY_PROJECTS, main


class ProjectCatalogTests(unittest.TestCase):
    def setUp(self):
        self.projects = json.loads((APP_ROOT / "data" / "projects.json").read_text(encoding="utf-8"))
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.catalog_path = Path(self.directory.name) / "projects.json"

    def load(self, projects):
        self.catalog_path.write_text(json.dumps(projects), encoding="utf-8")
        return load_projects(self.catalog_path)

    def test_existing_catalog_has_unique_project_pages_and_positions(self):
        projects = load_projects()
        self.assertEqual(len(projects), 8)
        self.assertEqual(len({project["id"] for project in projects}), 8)
        self.assertEqual(len({(project["world"]["zone"], project["world"]["slot"]) for project in projects}), 8)
        self.assertTrue(all(project["detailUrl"] for project in projects))

    def test_new_project_gets_a_page_and_first_unused_zone_slot(self):
        addition = copy.deepcopy(self.projects[0])
        addition.update(id="new-project", title="New project", detailUrl=None, image=None)
        addition["world"] = {"kind": "terminal", "zone": "workshop"}
        self.projects.insert(0, addition)
        loaded = self.load(self.projects)
        self.assertEqual(loaded[0]["detailUrl"], "/projects/new-project")
        self.assertEqual(loaded[0]["world"]["slot"], 3)
        self.assertEqual(loaded[1]["world"]["slot"], 0)

    def test_duplicate_ids_are_rejected(self):
        self.projects.append(copy.deepcopy(self.projects[0]))
        with self.assertRaisesRegex(ValueError, "Duplicate project ID"):
            self.load(self.projects)

    def test_invalid_world_metadata_is_rejected(self):
        cases = [
            {"kind": "spaceship", "zone": "workshop"},
            {"kind": "clock", "zone": "unknown"},
            {"kind": "clock", "zone": "workshop", "slot": -1},
            {"kind": "clock", "zone": "workshop", "slot": True},
            {"kind": "clock", "zone": "workshop", "slot": 1},
        ]
        for world in cases:
            with self.subTest(world=world):
                projects = copy.deepcopy(self.projects)
                projects[0]["world"] = world
                with self.assertRaises(ValueError):
                    self.load(projects)

    def test_missing_or_escaping_images_are_rejected(self):
        for image in ("images/missing.png", "../data/resume.json", str(APP_ROOT / "static" / "favicon.ico")):
            with self.subTest(image=image):
                self.projects[0]["image"] = image
                with self.assertRaisesRegex(ValueError, "image"):
                    self.load(self.projects)

    def test_unsafe_urls_are_rejected(self):
        for url in ("javascript:alert(1)", "//example.com", "http://example.com", "/\\example.com", "https://user:password@example.com"):
            with self.subTest(url=url):
                self.projects[0]["detailUrl"] = url
                with self.assertRaisesRegex(ValueError, "detailUrl"):
                    self.load(self.projects)
        self.projects[0]["detailUrl"] = None
        self.projects[0]["links"] = [{"label": "Source", "url": "javascript:alert(1)"}]
        with self.assertRaisesRegex(ValueError, "link"):
            self.load(self.projects)


class ProjectPageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Avoid loading local credentials or connecting to mail, Redis, or Celery.
        cls.app = Flask(__name__, template_folder=str(APP_ROOT / "templates"), static_folder=str(APP_ROOT / "static"))
        cls.app.config.update(TESTING=True, SECRET_KEY="test-only", RATELIMIT_ENABLED=False, WTF_CSRF_ENABLED=False)
        limiter.init_app(cls.app)
        cls.app.register_blueprint(main)

    def setUp(self):
        self.client = self.app.test_client()

    def test_project_index_redirects_into_the_workshop(self):
        response = self.client.get("/portfolio")
        self.assertEqual(response.status_code, 301)
        self.assertEqual(response.location, "/#index")

    def test_existing_and_generic_project_routes_work(self):
        for project in load_projects():
            with self.subTest(project=project["id"]):
                response = self.client.get(project["detailUrl"])
                self.assertEqual(response.status_code, 301)
                self.assertEqual(response.location, f"/#project={project['id']}")
        for slug, project_id in LEGACY_PROJECTS.items():
            with self.subTest(legacy=slug):
                response = self.client.get(f"/portfolio/{slug}")
                self.assertEqual(response.status_code, 301)
                self.assertEqual(response.location, f"/#project={project_id}")
        self.assertEqual(self.client.get("/projects/does-not-exist").status_code, 404)
        self.assertEqual(self.client.get("/portfolio/does-not-exist").status_code, 404)

    def test_catalog_images_exist_with_exact_filename_case(self):
        static_root = APP_ROOT / "static"
        assets = {path.relative_to(static_root).as_posix() for path in static_root.rglob("*") if path.is_file()}
        for project in load_projects():
            if project["image"]:
                with self.subTest(project=project["id"]):
                    self.assertIn(project["image"], assets)

    def test_additional_project_gets_a_workshop_redirect_without_a_new_route(self):
        projects = load_projects()
        addition = copy.deepcopy(projects[0])
        addition.update(id="new-project", title="Ninth project", detailUrl="/projects/new-project", image=None)
        projects.append(addition)
        with patch("app.routes.load_projects", return_value=projects):
            detail = self.client.get("/projects/new-project")
        self.assertEqual(detail.status_code, 301)
        self.assertEqual(detail.location, "/#project=new-project")

    def test_home_receives_the_same_catalog(self):
        with patch("app.routes.render_template", return_value="rendered") as render:
            self.assertEqual(self.client.get("/").status_code, 200)
        self.assertEqual(render.call_args.args, ("home.html",))
        self.assertEqual(render.call_args.kwargs["projects"], load_projects())


if __name__ == "__main__":
    unittest.main()
