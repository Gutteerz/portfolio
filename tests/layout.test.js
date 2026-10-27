import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { layoutProjects } from '../app/static/js/world/layout.js';

const catalog = JSON.parse(readFileSync(new URL('../app/data/projects.json', import.meta.url), 'utf8'));

test('an additional project gets a station without changing scene code', () => {
  const addition = { ...catalog[0], id: 'another-clock', world: { kind: 'clock', zone: 'workshop', slot: 3 } };
  const result = layoutProjects([...catalog, addition]);
  assert.equal(result.length, catalog.length + 1);
  assert.deepEqual(result.map(entry => entry.id), [...catalog.map(project => project.id), addition.id]);
  assert.equal(new Set(result.map(entry => `${entry.x}:${entry.z}`)).size, catalog.length + 1);
  assert.ok(result.every(entry => !entry.compact));
});

test('prepending an overflow project preserves existing explicit station assignments', () => {
  const addition = { ...catalog[0], id: 'prepended-clock', world: { kind: 'clock', zone: 'workshop', slot: 3 } };
  const before = layoutProjects(catalog);
  const after = layoutProjects([addition, ...catalog]);
  assert.equal(after.length, catalog.length + 1);
  for (const original of before) {
    const preserved = after.find(entry => entry.id === original.id);
    assert.equal(preserved.stationKey, original.stationKey);
    assert.deepEqual([preserved.x, preserved.z, preserved.rotation], [original.x, original.z, original.rotation]);
  }
  assert.ok(after[0].stationKey.startsWith('perimeter:'));
});

test('duplicate and sparse slot preferences never overlap or lose records', () => {
  const projects = Array.from({ length: 9 }, (_, index) => ({
    id: `project-${index}`, world: { zone: 'workshop', slot: index % 2 ? 999 : 0 },
  }));
  const result = layoutProjects(projects);
  assert.equal(result.length, projects.length);
  assert.equal(new Set(result.map(entry => entry.stationKey)).size, 9);
  assert.equal(new Set(result.map(entry => `${entry.x}:${entry.z}`)).size, 9);
  assert.deepEqual(layoutProjects(projects), result);
});

test('a large catalog retains unique physical book anchors within perimeter tables', () => {
  const projects = Array.from({ length: 40 }, (_, index) => ({
    id: `project-${index}`, world: { zone: ['workshop', 'study', 'games'][index % 3], slot: index },
  }));
  const result = layoutProjects(projects);
  assert.equal(result.length, 40);
  assert.equal(new Set(result.map(entry => entry.id)).size, 40);
  const anchors = result.map(entry => {
    assert.ok(Math.abs(entry.x) <= 16 && Math.abs(entry.z) <= 11);
    if (!entry.compact) return `${entry.x}:${entry.z}`;
    const columns = Math.ceil(Math.sqrt(entry.displayCount * 2));
    const rows = Math.ceil(entry.displayCount / columns);
    const localX = -0.91 + 1.82 / columns * (entry.displayIndex % columns + 0.5);
    const localZ = -0.425 + 0.85 / rows * (Math.floor(entry.displayIndex / columns) + 0.5);
    assert.ok(Math.abs(localX) < 0.91 && Math.abs(localZ) < 0.425);
    const x = entry.x + localX * Math.cos(entry.rotation) + localZ * Math.sin(entry.rotation);
    const z = entry.z - localX * Math.sin(entry.rotation) + localZ * Math.cos(entry.rotation);
    return `${x.toFixed(5)}:${z.toFixed(5)}`;
  });
  assert.equal(new Set(anchors).size, 40);
});
