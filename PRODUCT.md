# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Purpose and Approved Direction

Storm Selvig's personal portfolio presents actual project work inside a freely explorable miniature workshop. The visitor moves a small character through a warm wooden, painted low-poly landscape, chooses what to inspect, and returns to the same position when closing a project.

On 2026-10-27 the user approved `.impeccable/mocks/free-roam/overview.png` and `.impeccable/mocks/free-roam/player-view.png`:

> This looks perfect. Make the different project a part of this world, make it so more projects can be added in the future

These images are the visual authority: warm wood, muted green, workshop buildings, ramps, an accessible roof, open walking space, and compact navigation around a world that fills the viewport. The interface should recede. Do not add promotional taglines, a forced project sequence, automatic travel between destinations, or automatic project opening.

## Current Implementation

Implementation is complete. Browser checks covered movement, ramp climbing, camera control, project inspection, index navigation, settings, and desktop/phone-width layouts. An independent review scored all four requested visual and documentation fixes resolved. Physical touch-device testing remains outstanding. The home page is a standalone Three.js world served by Flask, with locally served modules, fonts, and procedural geometry. Existing experience, resume, contact, privacy, and legacy project routes remain available; no deployment was requested.

The visitor can walk with WASD or arrow keys, drag to orbit the camera, use the wheel to adjust distance, and press E or the interaction button near an object. Touch devices have a movement pad and drag-to-look controls. Project information opens in native dialogs; movement pauses while a dialog is open. Index, About, Contact, settings, reduced motion, graphics quality, camera reset, and return-to-start controls remain directly accessible.

`app/data/projects.json` is the shared catalog for physical exhibits, the in-world index, the ordinary project index, and automatic `/projects/<id>` pages. Seven current entries cover Smart Clock, UiASub RTOS, AI Dashcam, Mario Game, Studak, GodforsakenPlace, and this portfolio. Adding a project with an existing kind and zone requires only a catalog entry. Three full-size bays per zone are followed by shared perimeter bays; larger overflow collections use physical books on shared tables. Every project remains in the index and has a page.

The initial HTML includes an immediately usable project list. It stays available if JavaScript or WebGL fails, and ordinary project pages require neither. No project facts or external demo links are invented to fill the scene.

## Source Facts and Asset Boundaries

- Owner information and experience: `app/data/resume.json` and the existing templates. Current roles and dates have not been independently refreshed.
- Smart Clock: STM32, DFRobot LCD, alarms, weather, and RSS headlines; photograph at `app/static/images/projects/smart_clock.png`.
- UiASub RTOS: C, ZephyrOS, Nucleo F767zi, Ethernet, and sensor/joystick communication. No original hardware model or photograph was supplied.
- AI Dashcam: custom fine-tuned YOLOv11, FastAPI, and Label Studio; screenshot at `app/static/images/projects/autoticket.png`.
- Studak, GodforsakenPlace, and the C++ platformer: existing project templates supply their descriptions. Catalog images use the existing assets with their exact filename capitalization.
- World objects are illustrative low-poly representations, not verified hardware geometry. Miniature screen effects are demonstrations, not live hardware or execution of the original projects.
- The approved concept images are design references, not screenshots of the implemented world. Generated or sourced shipping rasters must retain provenance.

## Validation Status

On 2026-10-27, 11 Python tests and 10 JavaScript tests passed. They cover catalog validation and rendering, preserved routes and image references, project expansion, placement, proximity, and movement logic. Browser interaction checks and the final visual review are separate evidence; automated tests do not establish visual fidelity, touch-device behavior, or physical hardware behavior. The build finishes with the final review verdict and documentation of the implemented design in `DESIGN.md`.

## Reference History

The Kinetic Circuit, Object Playground, and Signal Space concepts were rejected. A subsequent swimming-hall environment offered closer exploration but was rejected as a random venue with an unwanted photorealistic abandoned-building appearance. Those concepts are superseded and must not guide this implementation.

The user asked for an original experience in the spirit of these references:

- https://mesh3d.gallery/website/iron0re-pop-up-book-personal-site — https://meilanunicorn.com/
- https://mesh3d.gallery/website/henry-loiv-a-playful-3d-portfolio — https://dsgnbyhl.com/en/
- https://mesh3d.gallery/website/felix-rieseberg — https://felixrieseberg.com/

Observed reference qualities were physical page navigation, connected environments, and content that belongs inside the scene. They informed the direction without authorizing copied scenes, branding, or interaction details. The approved workshop images and the user's later instructions take precedence over earlier proposals.
