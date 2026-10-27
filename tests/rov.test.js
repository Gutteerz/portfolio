import test from 'node:test';
import assert from 'node:assert/strict';
import { ROV_LIMITS, createROVState, stepROV, stopROV } from '../app/static/js/world/rov-physics.js';

function drive(state, input, seconds, fps = 60) {
  for (let frame = 0; frame < Math.round(seconds * fps); frame += 1) stepROV(state, input, 1 / fps);
  return state;
}
const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} should be near ${expected}`);

test('ROV remains inside every pool wall during sustained and diagonal thrust', () => {
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) {
    const state = drive(createROVState(), { x, y, yaw: 0 }, 10);
    assert.ok(state.x >= ROV_LIMITS.minX && state.x <= ROV_LIMITS.maxX);
    assert.ok(state.z >= ROV_LIMITS.minZ && state.z <= ROV_LIMITS.maxZ);
    if (x) assert.equal(state.vx, 0);
    if (y) assert.equal(state.vz, 0);
  }
});

test('ROV slides along a wall and reverses without stored outward momentum', () => {
  const state = { ...createROVState(), x: ROV_LIMITS.maxX, vx: 0.7 };
  stepROV(state, { x: 1, y: 1, yaw: 0 }, 0.05);
  assert.equal(state.x, ROV_LIMITS.maxX);
  assert.equal(state.vx, 0);
  assert.ok(state.z > 0.01);
  stepROV(state, { x: -1, y: 0, yaw: 0 }, 0.05);
  assert.ok(state.x < ROV_LIMITS.maxX);
});

test('diagonal thrust is no faster than one direction, while partial sticks stay gentle', () => {
  const straight = drive(createROVState(), { x: 1, y: 0, yaw: 0 }, 0.5);
  const diagonal = drive(createROVState(), { x: 1, y: -1, yaw: 0 }, 0.5);
  const gentle = drive(createROVState(), { x: 0.5, y: 0, yaw: 0 }, 0.5);
  near(Math.hypot(diagonal.vx, diagonal.vz), straight.vx);
  near(gentle.vx, straight.vx / 2);
  assert.ok(straight.vx <= 0.7);
});

test('thrust follows the same camera directions as walking', () => {
  const state = drive(createROVState(), { x: 0, y: -1, yaw: Math.PI / 2 }, 0.5);
  assert.ok(state.x < -0.14);
  near(state.z, 0.01);
  assert.ok(state.yaw < -0.13);
});

test('acceleration and coasting travel agree at 30, 60 and 120 fps', () => {
  const states = [30, 60, 120].map(fps => {
    const state = drive(createROVState(), { x: 0.4, y: -0.7, yaw: 0.3 }, 0.6, fps);
    return drive(state, { x: 0, y: 0, yaw: 0.3 }, 0.8, fps);
  });
  for (const state of states.slice(1)) {
    for (const key of ['x', 'z', 'vx', 'vz']) near(state[key], states[0][key]);
  }
});

test('release coasts to rest, while stop preserves pose and clears motion immediately', () => {
  const state = drive(createROVState(), { x: 1, y: 0, yaw: 0 }, 0.3);
  const before = { ...state };
  stepROV(state, { x: 0, y: 0, yaw: 0 }, 0.05);
  assert.ok(state.x > before.x);
  assert.ok(state.vx > 0 && state.vx < before.vx);
  const pose = { x: state.x, z: state.z, yaw: state.yaw };
  assert.equal(stopROV(state), state);
  assert.equal(state.vx, 0);
  assert.equal(state.vz, 0);
  stepROV(state, { x: 0, y: 0, yaw: 0 }, 0.05);
  assert.deepEqual({ x: state.x, z: state.z, yaw: state.yaw }, pose);
});

test('long frames are bounded and nonpositive frame times do not move the ROV', () => {
  const state = createROVState(), bounded = createROVState();
  const input = { x: 1, y: 0, yaw: 0 };
  stepROV(state, input, 5);
  stepROV(bounded, input, 0.05);
  assert.deepEqual(state, bounded);
  stepROV(state, input, -1);
  stepROV(state, input, 0);
  assert.deepEqual(state, bounded);
});
