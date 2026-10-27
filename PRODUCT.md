# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Purpose and Approved Direction

Storm Selvig's portfolio presents projects and professional history inside a freely explorable miniature workshop. Visitors move a small character through warm wood and muted green buildings, choose objects to inspect, and return to the same position after reading. The world fills the viewport; navigation stays compact.

The visual authority remains the user-approved `.impeccable/mocks/free-roam/overview.png` and `.impeccable/mocks/free-roam/player-view.png` from 2026-10-27. The later instruction extends this workshop with all portfolio content and removes the old standalone pages. Do not add promotional taglines, forced tours, automatic travel, or automatic project opening.

## Implemented Scope

The Flask home page contains the Three.js world and all readable content. The project catalog has eight entries: Smart Clock, UiASub RTOS, AI Dashcam, Mario Game, Studak, GodforsakenPlace, Portfolio Website, and UiA RAG System. The profile contains nine experience entries, two degrees, skills, public contacts, and résumé project references.

Content belongs to physical objects: work records on a noticeboard, education in the open notebook on the study roof, About/skills/résumé in a folder, contact in the mailbox, and UiASub's ROV in a small test tank. The UiASub panel connects its project to software development and deputy leadership. Existing project bays and overflow books keep catalog additions possible.

WASD/arrows, camera drag, wheel distance, E interaction, touch movement, and reset controls remain. Panels pause movement. The Index reaches every portfolio section; settings include reduced motion, graphics quality, return to start, and **Read without 3D**. The résumé supports browser printing or saving as PDF.

The full profile and project content is server-rendered in the same page for reading mode or JavaScript/WebGL failure. Old experience, résumé, contact, privacy, index, and project GET URLs return permanent redirects to workshop fragments; there are no independent detail pages. The old templates, unused styles/scripts, and old public CV PDF have been removed.

Contact retains Flask-WTF validation, CSRF, reCAPTCHA, and configured SMTP delivery. reCAPTCHA loads only when the form opens; direct email remains available. The workshop does not load analytics. Graphics preferences stay in local storage. No deployment is included.

## Source Facts and Asset Boundaries

`app/data/resume.json` and `app/data/projects.json` are the canonical sources. The latest supplied CV takes precedence for dates: Telenor thesis Jan–Jun 2025, teaching assistant Aug–Dec 2024, Oceaneering internship Jun–Aug 2026, UiASub developer Sep 2024–Mar 2026, and deputy leader from Mar 2026. The master's degree starts Aug 2025 and is expected to finish Jun 2027; the bachelor ran Aug 2022–Jun 2025. Earlier Elite Foto and Rema 1000 work is retained from the previous site.

The supplied application supports RAG work for UiA, retrieval/indexing/chunking, multi-agent systems, self-hosted models, and participation in NM in AI and hackathons. No unsupported stack, award, performance result, or project date is inferred. New private personal fields and the source PDFs are not public assets; established public contact links are retained.

Project descriptions preserve supported details from the old site. Existing photographs/screenshots retain exact filename case. Low-poly objects and screen animations are illustrative, not verified hardware geometry or live model/game output. Approved mockups are design references, not implementation screenshots; shipping rasters must retain provenance.

## Validation and Checkpoint

On 2026-10-27, **28 Python tests and 14 JavaScript tests passed**. Coverage includes content migration, legacy redirects, missing CSRF/reCAPTCHA rejection, mocked email results, catalog expansion, story-station placement and footprints, and movement. Tests do not load local credentials or send email.

Browser checks verified walking to the pool, opening UiASub roles and its ROV project, experience and education panels, contact-form rendering with lazy CAPTCHA, text mode and browser Back, and layouts at desktop and 390px phone width. Captures are in `.impeccable/review/world-content/`. A fresh general review agent returned a visual ship verdict for the new props and panels. Physical touch-device behavior, print output, and live email delivery remain untested; no contact messages were sent.

Commit `66365f5` preserves the workshop before the expansion. Subsequent changes remain uncommitted for review.

## Reference History

Kinetic Circuit, Object Playground, Signal Space, and the abandoned swimming-hall direction are superseded. They must not guide further work. Earlier inspiration included [Meilan's pop-up book](https://meilanunicorn.com/), [Henry Loiv's portfolio](https://dsgnbyhl.com/en/), and [Felix Rieseberg's site](https://felixrieseberg.com/): physical navigation, connected spaces, and content placed inside a scene. The approved workshop images and later user instructions take precedence; references do not authorize copying scenes or branding.
