import test from 'node:test';
import assert from 'node:assert/strict';
import { groundHeight, movePlayer, movementVector, nearestItem } from '../app/static/js/world/physics.js';
import { layoutProjects } from '../app/static/js/world/layout.js';

const world = {
  bounds: { minX: -18, maxX: 18, minZ: -13, maxZ: 13 },
  colliders: [{ minX: 2, maxX: 3, minZ: -2, maxZ: 2, maxY: 3 }],
  surfaces: [
    { minX: -2, maxX: 2, minZ: -6, maxZ: 0, axis: 'z', from: 1.6, to: 0 },
    { minX: 6, maxX: 13, minZ: -9, maxZ: -3, height: 3.6, roof: true },
  ],
};
test('ramps interpolate; characters remain below an accessible roof', () => {
  assert.equal(groundHeight(0, -3, world.surfaces), 0.8);
  assert.equal(groundHeight(8, -6, world.surfaces, 0.32), 0);
  assert.equal(groundHeight(8, -6, world.surfaces, 3.92), 3.6);
});
test('movement slides beside walls and cannot leave the tabletop', () => {
  const moved = movePlayer({ x: 1.6, y: 0, z: 0 }, 0.4, 0.4, world);
  assert.equal(moved.x, 1.6); assert.equal(moved.z, 0.4);
  assert.ok(movePlayer({ x: 17.6, y: 0, z: 12.6 }, 1, 1, world).x < 18);
});
test('walking over a wall on a roof is allowed', () => {
  assert.equal(movePlayer({ x: 1.6, y: 3.6, z: 0 }, 0.4, 0, world).x, 2);
});
test('diagonals do not move faster and direction follows camera yaw', () => {
  const diagonal = movementVector(1, -1, 0);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.z) - 1) < 1e-8);
  assert.ok(Math.abs(movementVector(0, -1, Math.PI / 2).x + 1) < 1e-8);
});
test('project proximity is spatial, including height, and unordered', () => {
  const items = [{ id: 'far', position: { x: 8, y: 0, z: 8 } }, { id: 'close', position: { x: 0, y: 0, z: 1 } }];
  assert.equal(nearestItem({ x: 0, y: 0, z: 0 }, items).id, 'close');
  assert.equal(nearestItem({ x: 0, y: 4, z: 0 }, items), null);
});
test('future catalog projects receive a location without scene source changes', () => {
  const projects = Array.from({ length: 30 }, (_, i) => ({ id: 'p' + i, world: { zone: 'workshop', kind: 'terminal', slot: i } }));
  const layout = layoutProjects(projects);
  assert.equal(layout.length, 30);
  assert.deepEqual(layoutProjects(projects), layout);
});
