# Storm Selvig's portfolio

A Flask portfolio built as a freely explorable Three.js workshop. Projects, experience, education, skills, résumé, contact, and privacy all belong to the same page. The initial HTML contains the full readable content; no separate project or résumé pages are required when JavaScript or WebGL is unavailable.

## Run locally

Use Python 3.11 or newer and Node.js with npm. In PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm ci
npm run vendor
.\.venv\Scripts\python.exe run.py
```

Open `http://127.0.0.1:5000`. The vendor command copies the pinned Three.js modules and Atkinson Hyperlegible fonts, including licenses, into `app/static/vendor/`. Node prepares dependencies and runs tests; Flask serves the site. Docker remains available through `docker compose up --build` after preparing vendor files.

The contact form needs a private `SECRET_KEY`, `RECAPTCHA_PUBLIC_KEY`, `RECAPTCHA_PRIVATE_KEY`, `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS`, `MAIL_USERNAME`, `MAIL_PASSWORD`, and `MAIL_RECIPIENT` in the local `.env`. Keep credentials out of version control. Browsing works without contact configuration; direct email remains available. Only the public reCAPTCHA site key reaches the browser, and the reCAPTCHA script loads when the contact form opens.

## Explore the workshop

| Control | Action |
| --- | --- |
| WASD or arrow keys | Walk around the workshop and up ramps. |
| Drag / mouse wheel | Turn and tilt the camera / change its distance. |
| E or the interaction button | Inspect nearby projects, work records, the study notebook, or other objects. |
| Index | Reach projects, experience, education, résumé, About, and Contact without walking. |
| Escape or Close | Close a panel and resume at the same position. |
| E at the UiASub pool | Drive the ROV with WASD, arrows, or the pad. Escape / Leave controls returns to walking. |
| Reset view | Restore the camera angle and distance. |
| Settings | Reduce motion, choose graphics quality, return to the start, or **Read without 3D**. |
| Print / save PDF | Print the résumé through the browser's print window. |

Touch layouts provide a movement pad, drag-to-look, and an interaction button. The experience board holds a card for every role, the roof notebook presents education, the About & CV folder contains the profile and skills, and the mailbox opens contact. UiASub has a small ROV test tank connected to its project and team history.

The ROV has camera-relative thrust, water resistance, pool boundaries, moving propellers, and a flexible tether. About UiASub opens the team history and software project; its panel also provides a driving entry. Walking position and camera are preserved when leaving the controls. The windmill can be spun and the paper glider on the study roof can be launched; the existing marble can still be pushed. These optional toys never gate portfolio content. Reduced motion suppresses bubbles, ambient animation, and the glider's flight while retaining ROV steering.

Read without 3D reveals the full HTML on the same page. This content also remains available when the scene cannot load. Legacy GET routes redirect permanently into workshop fragments: `/about` → `/#experience`, `/resume` → `/#resume`, `/contact` → `/#contact`, `/privacy` → `/#privacy`, `/portfolio` → `/#index`, and project URLs → `/#project=<id>`. Unknown projects return 404. Old templates and their unused CSS/JavaScript have been removed.

## Content sources

- `app/data/resume.json` is the canonical profile: nine experience entries, two degrees, skills, public contact details, and project IDs. `app/profile.py` validates IDs and formats dates for every presentation.
- `app/data/projects.json` contains eight projects, including the UiA RAG system. It supplies physical exhibits, dialogs, the index, printable project summaries, and readable HTML.
- The latest supplied CV resolves the thesis to Jan–Jun 2025 and teaching assistance to Aug–Dec 2024. It adds Oceaneering in Jun–Aug 2026 and separates UiASub software development, Sep 2024–Mar 2026, from deputy leadership beginning Mar 2026. The master's degree remains in progress, with expected completion in Jun 2027.
- The supplied application supports the UiA RAG, multi-agent, and self-hosted-model experience. Elite Foto and Rema 1000 remain from the earlier site. New private personal fields and the source PDFs are not published; the existing public email and profile links are retained.

## Add a project

Add an entry to `app/data/projects.json`; existing object kinds and zones need no new route or scene code:

```json
{
  "id": "new-project",
  "title": "New Project",
  "summary": "A short description.",
  "description": "What the project does.",
  "technologies": ["Python"],
  "highlights": ["A concrete feature or result."],
  "image": null,
  "detailUrl": null,
  "world": {"kind": "terminal", "zone": "study"},
  "links": []
}
```

IDs use lowercase letters, numbers, and single hyphens. Image paths are relative to `app/static` and must match the filename's case. Leave `detailUrl` as `null`: the generated `/projects/<id>` URL redirects into the workshop. Use `links` for verified HTTPS or site-relative destinations; do not add placeholder demos.

Kinds are `clock`, `rov`, `camera`, `arcade`, `phone`, `cards`, and `terminal`; zones are `workshop`, `study`, and `games`. An optional non-negative `slot` selects a placement preference and must be unique within its zone. Omitted slots receive the first unused number. Three bays per zone lead to ten shared perimeter bays, then books on shared tables for larger collections. UiASub's exhibit is placed at its dedicated test tank. Every project stays reachable through the index and readable content.

The loader checks text, IDs, placement, image paths, and URL schemes on each request. New geometry or zones require scene changes. Add a project's ID to the profile's `projectIds` when it should appear in the printable résumé.

## Check changes

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"
npm test
```

Verified on 2026-10-27: **28 Python and 22 JavaScript tests passed**. They cover canonical content, CV date migration, redirects and fallback anchors, catalog growth, placement, furniture footprints, movement, ROV wall clearance, steering/coasting across frame rates, and contact validation. Contact tests use an isolated app with mocked mail delivery and no external requests; missing CSRF and reCAPTCHA are rejected. They do not verify live email delivery or CAPTCHA service operation.

Browser checks covered walking to the UiASub pool, its roles-to-project interaction, experience/education panels, contact rendering with lazy CAPTCHA, reading mode and browser Back, plus desktop and 390px layouts. A general visual reviewer accepted the new props and panels. Physical touch devices, print output, and live email delivery have not been tested. Scene objects and animated screens are illustrative.

The play update was checked in the browser with keyboard steering, pointer-driven pad steering, Escape and settings exits, reduced motion, windmill activation, glider launch, and 390px pool framing. A source review caught and resolved held-pointer input carrying across mode transitions. These checks do not replace testing on physical touch hardware.

## Source layout and checkpoint

- `app/templates/home.html`: workshop shell, native dialogs, complete HTML fallback, and printable résumé.
- `app/static/js/world/`: scene, movement, story stations, profile panels, and contact behavior.
- `app/static/css/world.css`: scene UI, reading mode, responsive layout, and print styles.
- `app/routes.py`: workshop rendering, legacy redirects, and protected contact POST handling.

Commit `66365f5` preserves the initial workshop; `b6d7350` contains the complete portfolio and UiASub pool. The play update adds ROV driving, the windmill, and the paper glider. No deployment is included.
