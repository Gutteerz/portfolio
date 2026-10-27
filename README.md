# Storm Selvig's portfolio

A Flask portfolio with a stylized, freely explorable workshop built with Three.js. Projects live in one JSON catalog shared by the world, the project index, and individual HTML pages. The index and detail pages work without JavaScript or WebGL.

## Run locally

Use Python 3.11 or newer and Node.js with npm. In PowerShell, from this directory:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm ci
npm run vendor
.\.venv\Scripts\python.exe run.py
```

Open `http://127.0.0.1:5000`. The vendor command copies the pinned Three.js browser modules and Atkinson Hyperlegible fonts, including their licenses, into `app/static/vendor/`; the browser loads these local files. Node is used for dependency preparation and tests, not the Flask server.

For a new checkout, create a local `.env` containing a private `SECRET_KEY`. The contact form additionally needs `RECAPTCHA_PUBLIC_KEY`, `RECAPTCHA_PRIVATE_KEY`, `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS`, `MAIL_USERNAME`, `MAIL_PASSWORD`, and `MAIL_RECIPIENT`. Keep credentials out of version control. These integrations are separate from browsing the projects.

The existing Docker setup can be run with `docker compose up --build` after preparing the vendor files. It serves the site on port 5000 and reads `.env`.

## Explore the workshop

| Control | Action |
| --- | --- |
| WASD or arrow keys | Walk around the workshop and up ramps. |
| Drag the scene | Turn and tilt the camera. |
| Mouse wheel | Move the camera closer or farther away. |
| E or the interaction button | Inspect a nearby project or interact with the marble. |
| Index | Open any project directly, without walking to its display. |
| Escape or a panel's close button | Close the panel and resume at the same position. |
| Reset view | Restore the camera angle and distance. |
| Settings | Reduce motion, change graphics quality, or return to the starting position. |

On touch devices, use the movement pad at the lower left, drag elsewhere to look, and tap the nearby interaction button. About and Contact remain in the top navigation. The ordinary project index is available from the Index panel and settings; it also appears automatically when the world cannot load.

## Add a project

Add an object to `app/data/projects.json`. No Flask route, template, or JavaScript change is needed to add another project using an existing world object type.

```json
{
  "id": "new-project",
  "title": "New Project",
  "summary": "A short description for the world and project index.",
  "description": "A fuller explanation for the project page.",
  "technologies": ["Python"],
  "highlights": ["Describe a feature or a concrete result."],
  "image": null,
  "detailUrl": null,
  "world": {"kind": "terminal", "zone": "study"},
  "links": []
}
```

Each `id` must be unique and use lowercase letters, numbers, and single hyphens. `title`, `summary`, and `description` are plain text. `technologies` and `highlights` are arrays of text; either can be empty.

`image` is either `null` or a file path relative to `app/static`, such as `images/projects/my-project.png`. Match the filename's capitalization so it also works on Linux. Add real screenshots or photographs when available; an image is not required.

Leave `detailUrl` as `null` to use the automatic page at `/projects/new-project`. An existing site path or HTTPS URL can be supplied instead. Every catalog entry has an automatic page even when another detail URL is selected. Existing `/portfolio/...` routes remain available.

World fields:

| Field | Values | Purpose |
| --- | --- | --- |
| `kind` | `clock`, `rov`, `camera`, `arcade`, `phone`, `cards`, `terminal` | Selects a stylized display object. Reuse these for new projects. |
| `zone` | `workshop`, `study`, `games` | Selects the area of the world. |
| `slot` | Optional integer, starting at `0` | Sets a placement preference within that area. Each area has its own slots. |

Omit `slot` to receive the first unused slot number after all explicit slots have been reserved. Each zone has three full-size display bays, preferred by slots `0`, `1`, and `2`. Higher slot numbers use another free bay in that zone when available, then overflow to the shared perimeter. For example, `{"kind": "camera", "zone": "workshop", "slot": 3}` goes to a perimeter display when the three workshop bays are occupied; it does not create a fourth bay inside the workshop.

There are ten shared perimeter bays. When more than ten projects overflow their zones, the overflow displays become physical books on shared perimeter tables. The layout retains an interaction target for every project and stays within the walkable tabletop. All projects also remain available in the index and on their automatic detail pages.

Do not reuse a slot number within the same zone. New object geometry or a new zone requires changes to the world code; adding projects with existing kinds and zones only requires the catalog.

`links` may contain verified links such as `{"label": "Source code", "url": "https://github.com/owner/repository"}`. Keep it empty when no public link exists. Only site-relative paths beginning with `/` and HTTPS URLs are accepted. Do not add placeholder demo links.

The loader checks IDs, text fields, object types, zones, duplicate positions, image files, and URL schemes. Invalid catalog entries produce an explanatory error rather than silently disappearing. The catalog is read on each request, so edits appear on the next page load.

## Check changes

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py" -v
npm test
```

Verified on 2026-10-27: all 21 tests passed (11 Python and 10 JavaScript). The Python tests validate catalog loading, automatic positioning, unsafe input rejection, project routes, image filenames, and adding an eighth project without a new route or template. They use a local test app without loading `.env` or connecting to mail, Redis, or Celery. JavaScript tests cover movement, ramps, collisions, proximity, and catalog expansion through perimeter displays and shared books. These checks do not replace checking the rendered world, keyboard and touch controls, or WebGL fallback in a browser.

## Source layout

- `app/data/projects.json`: project content and world placement.
- `app/projects.py`: catalog loading and validation.
- `app/templates/home.html`: world shell and project data.
- `app/static/js/world/`: world construction and interaction.
- `app/templates/portfolio.html`: server-rendered project index.
- `app/templates/projects/catalog_detail.html`: automatic project pages.
- `app/data/resume.json`: resume content.

The display objects are illustrative low-poly models. They do not claim to reproduce the exact geometry of the original projects. Existing project descriptions supply the project facts; interactive scene effects are demonstrations, not live hardware or model output.
