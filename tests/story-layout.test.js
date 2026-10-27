import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { createStoryStations } from '../app/static/js/world/story-stations.js';
import { createEnvironment } from '../app/static/js/world/environment.js';
import { createExhibits } from '../app/static/js/world/exhibits.js';
import { collides, groundHeight } from '../app/static/js/world/physics.js';

const profile = JSON.parse(readFileSync(new URL('../app/data/resume.json', import.meta.url), 'utf8'));
const catalog = JSON.parse(readFileSync(new URL('../app/data/projects.json', import.meta.url), 'utf8'));

// Canvas drawing is not under test: this stand-in lets Three build real geometry
// and world-space bounds without a GPU. Browser rendering is checked separately.
globalThis.document = {
  createElement() {
    const context = new Proxy({
      font: '16px sans-serif',
      measureText(text) { return { width: String(text).length * (Number(this.font.match(/\d+(?=px)/)?.[0]) || 16) * 0.55 }; },
    }, { get(target, key) { return key in target ? target[key] : () => {}; } });
    return { width: 0, height: 0, getContext: () => context };
  },
};

function overlaps(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ
    && a.minY < b.maxY && a.maxY > b.minY;
}

test('story furniture and approaches fit the world, ramps and every future project bay', () => {
  const scene = new THREE.Scene();
  const environment = createEnvironment(scene);
  const future = Array.from({ length: 40 }, (_, index) => ({
    ...catalog[index % catalog.length], id: `future-${index}`,
    world: { kind: 'cards', zone: ['workshop', 'study', 'games'][index % 3], slot: index },
  }));
  const exhibits = createExhibits(scene, future);
  const story = createStoryStations(scene, profile);
  try {
    assert.deepEqual(story.items.map(item => item.action), ['experience', 'education', 'about', 'contact', 'uiasub']);
    const existing = [...environment.colliders, ...exhibits.colliders];
    for (const bounds of story.colliders) {
      assert.ok(bounds.minX > environment.bounds.minX && bounds.maxX < environment.bounds.maxX, bounds.stationKey);
      assert.ok(bounds.minZ > environment.bounds.minZ && bounds.maxZ < environment.bounds.maxZ, bounds.stationKey);
      assert.ok(!existing.some(other => overlaps(bounds, other)), `${bounds.stationKey} overlaps existing furniture`);
      assert.ok(!story.colliders.some(other => other !== bounds && overlaps(bounds, other)), `${bounds.stationKey} overlaps another story prop`);
      for (const ramp of environment.surfaces.filter(surface => surface.axis)) {
        assert.ok(!overlaps(bounds, { ...ramp, minY: Math.min(ramp.from, ramp.to), maxY: Math.max(ramp.from, ramp.to) + 1.55 }), `${bounds.stationKey} obstructs a ramp`);
      }
    }
    for (const item of story.items) {
      const { x, y, z } = item.approach;
      assert.ok(!collides(x, y, z, [...existing, ...story.colliders]), `${item.id} has an obstructed approach`);
      assert.equal(groundHeight(x, z, environment.surfaces, y + 0.32), y, `${item.id} approach is not on its walking surface`);
    }
    for (const item of exhibits.items) {
      const { x, y, z } = item.approach;
      assert.ok(!collides(x, y, z, story.colliders), `${item.stationKey} approach is obstructed by a story prop`);
    }
  } finally { story.dispose(); exhibits.dispose(); environment.dispose(); }
});

test('roof notebook blocks roof walking only and follows the room cutaway', () => {
  const scene = new THREE.Scene();
  const story = createStoryStations(scene, profile);
  try {
    const item = story.items.find(entry => entry.action === 'education');
    assert.equal(collides(8.3, 0, -6.5, story.colliders), false);
    assert.equal(collides(8.3, 3.64, -6.5, story.colliders), true);
    story.update(0, 0, new THREE.Vector3(8.3, 0, -6.5));
    assert.equal(item.object.visible, false);
    story.update(0, 0, new THREE.Vector3(8.3, 3.64, -6.5));
    assert.equal(item.object.visible, true);
    story.update(0, 0, new THREE.Vector3(0, 0, 10));
    assert.equal(item.object.visible, true);
  } finally { story.dispose(); }
});

test('adding work records creates a physical card for each without expanding the board footprint', () => {
  const scene = new THREE.Scene();
  const original = createStoryStations(scene, profile);
  const extendedProfile = { ...profile, work: Array.from({ length: 17 }, (_, index) => ({
    ...profile.work[index % profile.work.length], id: `work-${index}`,
  })) };
  const extended = createStoryStations(scene, extendedProfile);
  try {
    const board = extended.items.find(item => item.action === 'experience').object;
    const cards = board.children.filter(child => child.name.startsWith('Work record:'));
    assert.equal(cards.length, extendedProfile.work.length);
    assert.equal(new Set(cards.map(card => card.userData.recordId)).size, extendedProfile.work.length);
    assert.deepEqual(extended.colliders[0], original.colliders[0]);
  } finally { original.dispose(); extended.dispose(); }
});

test('every prop mesh lies inside its collision footprint, including the test tank and mailbox flag', () => {
  const scene = new THREE.Scene();
  const story = createStoryStations(scene, profile);
  try {
    for (const item of story.items) {
      const bounds = new THREE.Box3().setFromObject(item.object);
      const collider = story.colliders.find(entry => entry.stationKey === item.stationKey);
      assert.ok(collider.minX <= bounds.min.x && collider.maxX >= bounds.max.x);
      assert.ok(collider.minZ <= bounds.min.z && collider.maxZ >= bounds.max.z);
      assert.ok(collider.maxY >= bounds.max.y);
    }
  } finally { story.dispose(); }
  assert.equal(scene.children.length, 0);
});
