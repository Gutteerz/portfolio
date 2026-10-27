import * as THREE from 'three';
import { createEnvironment } from './environment.js';
import { createExhibits } from './exhibits.js';
import { createCharacter } from './character.js';
import { createStoryStations } from './story-stations.js';
import { createUI } from './ui.js';
import { groundHeight, movePlayer, movementVector, nearestItem, STEP_HEIGHT } from './physics.js';

const canvas = document.getElementById('world-canvas');
const projects = JSON.parse(document.getElementById('project-data').textContent);
const profile = JSON.parse(document.getElementById('profile-data').textContent);
const coarse = matchMedia('(pointer: coarse)').matches;
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const settings = { reducedMotion: motionPreference.matches, quality: coarse ? 'low' : 'high' };
try { Object.assign(settings, JSON.parse(localStorage.getItem('workshop-settings') || '{}')); } catch { /* Storage is optional. */ }
const saveSettings = () => { try { localStorage.setItem('workshop-settings', JSON.stringify(settings)); } catch { /* Private browsing. */ } };

let paused = false;
let nearest = null;
let marbleNear = false;
let marbleVelocity = 0;
let marbleAngle = 0;
let verticalVelocity = 0;
const keys = new Set();
const joystick = { x: 0, y: 0 };
const player = { x: 0, y: 0, z: 10 };
const orbit = { yaw: 0.12, pitch: 0.42, distance: coarse ? 19 : 15 };
const target = new THREE.Vector3(0, 1, 4);
const wantedTarget = new THREE.Vector3();
const cameraOffset = new THREE.Vector3();
let character, environment, exhibits, stories, renderer;
let interactiveItems = [];

function clearInput() { keys.clear(); joystick.x = 0; joystick.y = 0; document.getElementById('joystick-knob').style.transform = ''; }
function resetCamera() { orbit.yaw = 0.12; orbit.pitch = 0.42; orbit.distance = coarse ? 19 : 15; }
function interact() {
  if (paused) return;
  if (nearest) {
    if (nearest.action) { ui.showPanel(nearest.action); return; }
    const sameTable = exhibits.items.filter(item => item.stationKey === nearest.stationKey);
    if (sameTable.length > 1) ui.showIndex(sameTable.map(item => item.project));
    else ui.showProject(nearest.project);
  } else if (marbleNear) {
    marbleVelocity = Math.min(marbleVelocity + 2.8, 8);
    ui.announce('You pushed the marble.');
  }
}
const ui = createUI(projects, profile, {
  onPause() { paused = true; clearInput(); },
  onResume() { paused = false; },
  onResetCamera: resetCamera,
  onResetPosition() { Object.assign(player, { x: 0, y: 0, z: 10 }); verticalVelocity = 0; resetCamera(); },
  onInteract: interact,
  onReducedMotion(value) { settings.reducedMotion = value; saveSettings(); },
  onQuality(value) { settings.quality = value; applyQuality(); saveSettings(); },
});
ui.setSettings(settings);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#b4b9b0');
scene.fog = new THREE.Fog('#b4b9b0', 54, 115);
const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, 0.1, 180);
renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.type = THREE.PCFShadowMap;
scene.add(new THREE.HemisphereLight('#e0edff', '#af8656', 1.7));
const sunlight = new THREE.DirectionalLight('#fff0ce', 3.5);
sunlight.position.set(-18, 28, 17);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);
Object.assign(sunlight.shadow.camera, { left: -30, right: 30, top: 26, bottom: -26, near: 1, far: 80 });
sunlight.shadow.bias = -0.0004;
sunlight.shadow.normalBias = 0.04;
sunlight.shadow.radius = 3;
sunlight.target.position.set(0, 0, -2);
scene.add(sunlight, sunlight.target);
const fill = new THREE.DirectionalLight('#e2eeff', 0.7);
fill.position.set(10, 10, -12); scene.add(fill);

// Canvas-painted signs use the same local lettering as the HTML panels.
await Promise.all([document.fonts.load('400 16px "Atkinson Hyperlegible"'), document.fonts.load('700 16px "Atkinson Hyperlegible"')]);
environment = createEnvironment(scene, { quality: settings.quality });
// UiASub's software now lives with the ROV in its test pool.
exhibits = createExhibits(scene, projects.filter(project => project.id !== 'uiasub-rtos'));
stories = createStoryStations(scene, profile);
interactiveItems = [...exhibits.items, ...stories.items];
character = createCharacter(scene);
character.group.rotation.y = Math.PI;
const world = {
  bounds: environment.bounds,
  surfaces: environment.surfaces,
  colliders: [...environment.colliders, ...exhibits.colliders, ...stories.colliders],
};
// Floating bridge and roofs have rooms/walking space below them.
world.surfaces.forEach(surface => {
  if (surface.height >= 3 || (surface.axis === 'x' && surface.from >= 1.5)) surface.roof = true;
});

const playerShadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.46, 24),
  new THREE.MeshBasicMaterial({ color: '#443020', transparent: true, opacity: 0.14, depthWrite: false })
);
playerShadow.rotation.x = -Math.PI / 2; scene.add(playerShadow);
const highlight = new THREE.Mesh(
  new THREE.RingGeometry(0.66, 0.70, 40),
  new THREE.MeshBasicMaterial({ color: '#ffefc2', transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })
);
highlight.rotation.x = -Math.PI / 2; highlight.visible = false; scene.add(highlight);

function applyQuality() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, settings.quality === 'low' ? 1.2 : 1.7));
  renderer.shadowMap.enabled = settings.quality !== 'low';
  renderer.shadowMap.needsUpdate = true;
  resize();
}
function resize() {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  camera.aspect = width / Math.max(1, height);
  // On a portrait screen preserve a useful width of the miniature world.
  camera.fov = camera.aspect < 1 ? 58 : 43;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
applyQuality();
addEventListener('resize', resize);

const walkKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
addEventListener('keydown', event => {
  if (paused || event.ctrlKey || event.metaKey || event.altKey) return;
  const tag = document.activeElement?.tagName;
  if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(tag)) return;
  if (walkKeys.has(event.code)) { event.preventDefault(); keys.add(event.code); }
  if (event.code === 'KeyE' && !event.repeat) { event.preventDefault(); interact(); }
  if (event.code === 'Escape') { clearInput(); canvas.blur(); }
});
addEventListener('keyup', event => keys.delete(event.code));
addEventListener('blur', clearInput);
document.addEventListener('visibilitychange', clearInput);

let pointer = null;
const raycaster = new THREE.Raycaster();
const pointerVector = new THREE.Vector2();
canvas.addEventListener('pointerdown', event => {
  if (paused || event.button > 0) return;
  canvas.focus({ preventScroll: true });
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, distance: 0 };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (!pointer || pointer.id !== event.pointerId || paused) return;
  const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
  pointer.distance += Math.abs(dx) + Math.abs(dy);
  orbit.yaw -= dx * 0.005;
  orbit.pitch = THREE.MathUtils.clamp(orbit.pitch + dy * 0.003, 0.28, 1.12);
  pointer.x = event.clientX; pointer.y = event.clientY;
});
canvas.addEventListener('pointerup', event => {
  if (!pointer || pointer.id !== event.pointerId) return;
  const wasClick = pointer.distance < 7;
  pointer = null;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  if (!wasClick || paused) return;
  const rect = canvas.getBoundingClientRect();
  pointerVector.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
  raycaster.setFromCamera(pointerVector, camera);
  const hits = raycaster.intersectObjects(interactiveItems.map(item => item.object), true);
  if (hits.length) {
    let object = hits[0].object, item;
    while (object && !item) { item = interactiveItems.find(candidate => candidate.object === object); object = object.parent; }
    if (item && nearestItem(player, [item])) {
      if (item.action) ui.showPanel(item.action);
      else ui.showProject(item.project);
    } else if (item) ui.announce(`Walk closer to ${item.action ? item.label.toLowerCase() : 'inspect ' + item.project.title}.`);
  } else if (marbleNear && raycaster.intersectObject(environment.marble.mesh, true).length) interact();
});
canvas.addEventListener('pointercancel', () => { pointer = null; });
canvas.addEventListener('wheel', event => {
  if (paused) return;
  event.preventDefault();
  orbit.distance = THREE.MathUtils.clamp(orbit.distance + event.deltaY * 0.015, 12, 36);
}, { passive: false });

const joystickElement = document.getElementById('joystick');
const knob = document.getElementById('joystick-knob');
let joystickPointer = null;
function updateJoystick(event) {
  const rect = joystickElement.getBoundingClientRect();
  let x = (event.clientX - rect.left - rect.width / 2) / 35;
  let y = (event.clientY - rect.top - rect.height / 2) / 35;
  const length = Math.max(1, Math.hypot(x, y)); x /= length; y /= length;
  joystick.x = x; joystick.y = y;
  knob.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
}
joystickElement.addEventListener('pointerdown', event => {
  if (paused) return;
  event.preventDefault(); joystickPointer = event.pointerId;
  joystickElement.setPointerCapture(event.pointerId); updateJoystick(event);
});
joystickElement.addEventListener('pointermove', event => { if (event.pointerId === joystickPointer) updateJoystick(event); });
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) joystickElement.addEventListener(name, () => { joystickPointer = null; joystick.x = 0; joystick.y = 0; knob.style.transform = ''; });

function updateCamera(delta, immediate = false) {
  wantedTarget.set(player.x - Math.sin(orbit.yaw) * 3.7, player.y + 1.05, player.z - Math.cos(orbit.yaw) * 3.7);
  const blend = immediate || settings.reducedMotion ? 1 : 1 - Math.exp(-delta * 5);
  target.lerp(wantedTarget, blend);
  cameraOffset.set(Math.sin(orbit.yaw) * Math.cos(orbit.pitch), Math.sin(orbit.pitch), Math.cos(orbit.yaw) * Math.cos(orbit.pitch)).multiplyScalar(orbit.distance);
  camera.position.copy(target).add(cameraOffset);
  camera.lookAt(target);
}

let lastTime = performance.now(), elapsed = 0, frames = 0, framesSinceCheck = 0, frameTime = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const delta = Math.min((now - lastTime) / 1000, 0.05); lastTime = now;
  if (document.hidden || document.body.classList.contains('text-view')) return;
  if (!paused) {
    elapsed += delta;
    const inputX = joystick.x + Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
    const inputY = joystick.y + Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'));
    const direction = movementVector(inputX, inputY, orbit.yaw);
    const moving = Math.hypot(direction.x, direction.z) > 0.05;
    const speed = 4.2;
    const next = movePlayer(player, direction.x * delta * speed, direction.z * delta * speed, world);
    player.x = next.x; player.z = next.z;
    const floor = groundHeight(player.x, player.z, world.surfaces, player.y + STEP_HEIGHT);
    if (player.y > floor + 0.05) { verticalVelocity -= delta * 18; player.y = Math.max(floor, player.y + verticalVelocity * delta); }
    else { player.y = floor; verticalVelocity = 0; }
    if (player.y === floor) verticalVelocity = 0;
    character.group.position.set(player.x, player.y, player.z);
    if (moving) {
      const heading = Math.atan2(direction.x, direction.z);
      const difference = Math.atan2(Math.sin(heading - character.group.rotation.y), Math.cos(heading - character.group.rotation.y));
      character.group.rotation.y += difference * Math.min(1, delta * 12);
    }
    character.update(delta, moving, 1);
    environment.update(settings.reducedMotion ? 0 : elapsed, delta, player);
    stories.update(settings.reducedMotion ? 0 : elapsed, settings.reducedMotion ? 0 : delta, player);
    exhibits.update(settings.reducedMotion ? 0 : elapsed, settings.reducedMotion ? 0 : delta);
    const marble = environment.marble;
    marbleNear = Math.hypot(player.x - marble.center.x, player.z - marble.center.z) < marble.radius + 1.5;
    if (marbleVelocity > 0.01) {
      marbleAngle += marbleVelocity * delta;
      marbleVelocity *= Math.exp(-delta * 0.6);
      const radius = marble.radius;
      marble.mesh.position.x = marble.center.x + Math.cos(marbleAngle) * radius;
      marble.mesh.position.z = marble.center.z + Math.sin(marbleAngle) * radius;
      marble.mesh.rotation.x += marbleVelocity * delta * 2;
    }
    nearest = nearestItem(player, interactiveItems);
    const groupSize = nearest && !nearest.action ? exhibits.items.filter(item => item.stationKey === nearest.stationKey).length : 0;
    ui.setInteraction(nearest ? (nearest.label || (groupSize > 1 ? `Browse ${groupSize} projects` : `Inspect ${nearest.project.title}`)) : marbleNear ? 'Push the marble' : '');
    ui.setLocation(player.y > 2.8 ? 'Above the workbench' : player.z < -2 && player.x < -5 ? 'The workshop' : player.z < -2 && player.x > 5 ? 'The study' : player.z > 5 && player.x > 5 ? 'The games corner' : 'The workbench');
    highlight.visible = !!nearest;
    if (nearest) highlight.position.set(nearest.approach.x, nearest.approach.y + 0.02, nearest.approach.z);
    playerShadow.position.set(player.x, floor + 0.015, player.z);
    updateCamera(delta);
    framesSinceCheck++; frameTime += delta;
    if (framesSinceCheck === 240 && frameTime > 8 && settings.quality === 'high') { settings.quality = 'low'; applyQuality(); ui.setSettings(settings); }
  }
  // A stationary dialog should not burn a full GPU frame every animation tick.
  if (!paused || frames % 8 === 0) renderer.render(scene, camera);
  frames++;
}
character.group.position.set(player.x, player.y, player.z);
updateCamera(0, true);
renderer.render(scene, camera);
ui.ready();
requestAnimationFrame(frame);

canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault(); paused = true;
  document.body.classList.remove('world-ready');
  document.getElementById('world-ui').hidden = true;
  document.getElementById('load-status').textContent = 'The 3D view was interrupted. Reload to explore, or open a project below.';
});
addEventListener('pagehide', () => { clearInput(); });
