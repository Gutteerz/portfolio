---
name: Storm Selvig Portfolio
description: A freely explorable miniature workshop containing real project work.
colors:
  paper: "#f3ead8"
  paper-light: "#fbf6ea"
  ink: "#302a21"
  muted: "#746651"
  green: "#3e5944"
  line: "#d6c9af"
  focus: "#31573a"
  navigation-hover: "#e7dcc6"
  inspect-hover: "#304a35"
  control-hover: "#e9dfcd"
  index-hover: "#f0e8d7"
  control-border: "#ad9d80"
  wood: "#d7a566"
  wood-light: "#e5bc7e"
  wood-dark: "#95704a"
  paint-green: "#698364"
typography:
  headline:
    fontFamily: '"Atkinson Hyperlegible", "Segoe UI", sans-serif'
    fontSize: "clamp(26px, 5vw, 34px)"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: '"Atkinson Hyperlegible", "Segoe UI", sans-serif'
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: '"Atkinson Hyperlegible", "Segoe UI", sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: '"Atkinson Hyperlegible", "Segoe UI", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  key: "4px"
  control: "5px"
  navigation: "6px"
  inspect: "7px"
  panel-mobile: "10px"
  panel: "12px"
spacing:
  compact: "8px"
  control: "12px"
  standard: "16px"
  content: "20px"
  section: "24px"
components:
  inspect-button:
    backgroundColor: "{colors.green}"
    textColor: "{colors.paper-light}"
    rounded: "{rounded.inspect}"
    padding: "11px 19px 11px 12px"
  inspect-button-hover:
    backgroundColor: "{colors.inspect-hover}"
    textColor: "{colors.paper-light}"
  secondary-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 16px"
  navigation-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.key}"
    padding: "8px 12px"
  panel:
    backgroundColor: "{colors.paper-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "30px 32px"
    width: "min(640px, calc(100vw - 40px))"
  quality-select:
    backgroundColor: "{colors.paper-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
---

# Design System: Storm Selvig Portfolio

## Overview

**Creative North Star: "Miniature workshop"**

Warm timber, muted green paint, small buildings, and a jointed wooden visitor make the projects part of an explorable scene. Beveled pieces, screws, slats, grain, and restrained painted wear establish the miniature scale. The interface stays compact so the world remains visible.

This records the complete portfolio world and its HTML reading panels. Experience, education, resume, contact, privacy, and projects are part of the same home document; old URLs redirect into these panels. The approved workshop direction and later expansion are recorded in `PRODUCT.md`. Sources are `app/templates/home.html`, `app/static/css/world.css`, `app/static/js/world/`, and the project/profile catalogs.

**Key Characteristics:**

- Real projects appear as inspectable objects with plain descriptive labels.
- Timber and painted geometry supply the visual detail; cream HTML panels support reading.
- Movement is visitor-controlled, and opening a panel preserves the current position.
- The project index and HTML fallback provide direct access to the same catalog.

## Colors

The UI uses a small paper-and-green palette; the world gets its variation from materials and lighting.

### Primary

- **Green** supplies inspection actions, links, technology labels, and the touch pad. **Inspect hover** darkens the inspection action; **focus** marks keyboard focus.

### Secondary

- **Wood**, **wood light**, and **wood dark** are the base colors of generated timber textures. **Paint green** is the generated painted texture shared across buildings and props. They are material inputs, not a promise of identical rendered pixels under the scene lighting.

### Neutral

- **Paper** underlies the page and translucent navigation. **Paper light** carries reading panels and light button text.
- **Ink** is primary text; **muted** supports summaries and metadata. **Line** separates rows and panel footers; **control border** outlines the select and secondary action.
- The named hover colors provide quiet background changes for navigation, controls, and index rows.

**The Material Rule.** Reuse the scene's generated wood and paint materials for new exhibits. Keep project-specific prop colors local to those objects.

## Typography

Atkinson Hyperlegible serves the HTML interface and canvas-painted signs. The locally served WOFF2 files provide regular (400) and bold (700); the CSS also requests semibold (600) for selected titles and labels, which resolves through the available faces. The fallback stack is Segoe UI, then sans-serif.

Project headings use the fluid **headline** role. Dialog titles use **title**, reducing to 25px on small screens. Index titles are 18px with a 1.35 line height, reducing to 17px; their metadata is 13px, reducing to 12px. Project summaries use 18px/1.5, reducing to the body size on small screens. Body paragraphs stay within 65–68 characters where constrained.

**The Shared Lettering Rule.** Use the locally served face in both scene labels and HTML. Scene texture creation waits for the font to load.

## Layout

The home world fills the viewport. The owner link sits at the upper left, navigation at the upper right, movement help at the lower left, and location/reset at the lower right. These controls respect safe-area insets. Desktop edge spacing is generally 20px; the small-screen layout uses 12px and then 8px around the header at the narrowest breakpoint.

The initial camera follows the visitor at distance 15, yaw 0.12, and pitch 0.42; coarse-pointer devices start at distance 19. Landscape field of view is 43 degrees, portrait is 58. The initial view places the visitor before the broad ramp. Ramps connect the central platform and study roof; open aisles remain between project tables.

Dialogs center over the retained scene and scroll internally. Project dialogs widen to 700px; settings narrow to 480px. At 640px and below, all dialogs use viewport width minus 24px, 22px padding, and a viewport-height allowance of 32px. The 380px breakpoint compacts the header and touch pad. Coarse-pointer landscape screens below 500px height move controls inward.

The catalog, rather than a fixed card count, determines exhibits and index rows. Three primary bays per zone are followed by perimeter bays; larger overflow collections use books on shared tables. The fallback is a vertical reading layout with an 860px maximum container.

## Elevation & Depth

The world uses real mesh geometry, flat-shaded materials, warm directional light, and cast shadows. Most scene materials have roughness 0.91 and metalness 0; metal, glass, and screens have explicit local exceptions. Paint and grain are generated CanvasTextures. High quality enables scene shadows; low quality disables them and caps rendering resolution more tightly.

HTML depth is limited to functional overlays: panels use the `panel-shadow` source token, inspection uses a softer local shadow, and the joystick knob casts a small shadow. The modal backdrop dims the world with `rgba(40, 35, 25, .42)`. There is no backdrop blur.

## Shapes

HTML controls use modest rounded corners from the extracted radius set. Index entries are full-width ruled rows, not floating cards. The touch pad and knob are circles. Inline SVG strokes provide the settings, close, and row-arrow icons.

Scene forms use low-sided cylinders, faceted foliage and rocks, lightly beveled timber blocks, corrugated roofs, and layered plywood edges. Preserve these physical forms when adding content; do not replace the environment with a flat background image.

## Components

### Navigation and controls

The header has compact translucent paper backing and dark text. Navigation and close controls have at least 44px hit areas. Hover changes the local background. Interactive HTML uses a 3px focus outline with 4px offset; canvas focus is inset. Secondary actions remain outlined or textual.

### Inspection

A green button appears only near an interactive item. Desktop shows an E keycap; coarse-pointer devices hide the keycap and place the larger action opposite the movement pad. E, the button, or a nearby object click explicitly opens the project. Shared tables can open a filtered index.

**The Explicit Inspection Rule.** Proximity offers an action; it does not open content or move the visitor automatically.

### Reading panels and index

Native modal dialogs pause movement and clear held input. Closing restores focus to the canvas and resumes at the same position. Escape and the close button dismiss panels. Project content includes a title, summary, technology list, optional original image, description, highlights, and available links. Images retain their natural aspect ratio. Index rows show title and technologies with a simple arrow.

### Settings and motion

Native checkbox and select controls manage reduced motion and graphics quality. Motion preference initializes from the operating system and can be overridden locally. Reduced motion freezes environment/exhibit ambient time and removes camera interpolation; it does not disable visitor movement. Reset view resets camera orientation and distance; Return to the start also resets position.

### Pool controls and discoveries

E at the UiASub tank enters a close-up driving view. WASD, arrows, and the existing movement pad steer in camera-relative directions with gentle acceleration and coasting. The camera frames the full pool at each viewport width. A compact paper control panel contains plain instructions, About UiASub, and Leave controls; Escape also leaves. Leaving or opening a portfolio panel restores the walking camera and position and clears all held keys and pointer captures. UiASub's history panel retains access to driving and the software project.

The illustrative ROV is scaled to leave room to drive. Its full mesh stays within the tank at every heading. Its red tether follows it using reused geometry; propellers and a small bubble trail respond to movement. Reduced motion keeps direct steering but freezes propeller/bubble animation. The windmill accepts a manual push; a paper glider on the study roof completes a short flight and returns to its perch. Reduced motion replaces these with a small blade turn and a still glider plus accessible feedback. No sound, scores, unlocks, or mandatory sequences are added.

### HTML fallback

The same home document contains all projects, work experience, education, skills, contact details, privacy information, and the printable resume. It remains readable when JavaScript or WebGL is unavailable. Read without 3D opens this content while pausing the scene; Return to the workshop restores the visitor's position. Project fragments also match native HTML anchors. Old page URLs redirect into the world rather than serving a second website.

### Experience, education, and contact

The work-history board displays a card for each profile entry. The UiASub test pool contains an illustrative drivable ROV; its controls link to the student-organization roles and related software project. A notebook on the accessible roof opens education, the folder near the entrance opens About and resume, and the mailbox opens Contact. These props reuse the existing timber, paint, lettering, and explicit-inspection behavior.

Experience panels use ruled entries with an organization heading, date, role, summary, highlights, and skill list. Dates preserve the source precision. The index provides direct access to every category. Resume printing hides the scene and panel controls and prints only the canonical profile content.

The contact form uses labelled native fields and semantic error text. reCAPTCHA loads only when Contact is opened; email and profile links remain available independently. Messages are submitted only by the visitor. Privacy information describes the current form, session cookie, and local graphics preferences; the retired analytics script is not loaded.

## Do's and Don'ts

### Do:

- **Do** add project facts through the shared catalog and preserve access through both objects and index rows.
- **Do** keep clear walking aisles, readable labels, visible focus, and the existing touch controls.
- **Do** use the existing project PNGs as portfolio evidence and record provenance for any new shipping raster.
- **Do** keep generated concept images as references; the shipped scenery is procedural geometry and CanvasTextures.

### Don't:

- **Don't** add promotional taglines, forced project sequences, automatic travel, or automatic project opening.
- **Don't** describe illustrative world props or miniature screen demonstrations as verified hardware or live project execution.
- **Don't** turn individual prop colors or scene decoration into additional global UI accents.
