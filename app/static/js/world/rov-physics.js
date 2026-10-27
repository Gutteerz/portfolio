// Center limits leave room for the ROV's full footprint at every heading.
export const ROV_LIMITS = Object.freeze({ minX: -0.90, maxX: 0.90, minZ: -0.66, maxZ: 0.66 });

export function createROVState() {
  return { x: -0.14, z: 0.01, yaw: -0.13, vx: 0, vz: 0 };
}

export function stopROV(state) {
  state.vx = 0;
  state.vz = 0;
  return state;
}

/** Camera-relative thrust with a little water resistance after releasing a key. */
export function stepROV(state, input, delta) {
  const dt = Math.max(0, Math.min(delta, 0.05));
  if (!dt) return state;
  const length = Math.max(1, Math.hypot(input.x, input.y));
  const x = input.x / length, y = input.y / length;
  const cos = Math.cos(input.yaw), sin = Math.sin(input.yaw);
  const targetX = (x * cos + y * sin) * 0.7;
  const targetZ = (-x * sin + y * cos) * 0.7;
  const resistance = Math.hypot(x, y) > 0.01 ? 8 : 3;
  const decay = Math.exp(-resistance * dt);

  // Integrating the damped velocity keeps travel consistent across frame rates.
  state.x += targetX * dt + (state.vx - targetX) * (1 - decay) / resistance;
  state.z += targetZ * dt + (state.vz - targetZ) * (1 - decay) / resistance;
  state.vx = targetX + (state.vx - targetX) * decay;
  state.vz = targetZ + (state.vz - targetZ) * decay;

  if (state.x <= ROV_LIMITS.minX) { state.x = ROV_LIMITS.minX; state.vx = Math.max(0, state.vx); }
  if (state.x >= ROV_LIMITS.maxX) { state.x = ROV_LIMITS.maxX; state.vx = Math.min(0, state.vx); }
  if (state.z <= ROV_LIMITS.minZ) { state.z = ROV_LIMITS.minZ; state.vz = Math.max(0, state.vz); }
  if (state.z >= ROV_LIMITS.maxZ) { state.z = ROV_LIMITS.maxZ; state.vz = Math.min(0, state.vz); }

  if (Math.hypot(state.vx, state.vz) > 0.01) {
    const heading = Math.atan2(state.vx, state.vz);
    const turn = Math.atan2(Math.sin(heading - state.yaw), Math.cos(heading - state.yaw));
    state.yaw += turn * (1 - Math.exp(-dt * 7));
  }
  return state;
}
