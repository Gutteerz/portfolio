export const PLAYER_RADIUS = 0.32;
export const PLAYER_HEIGHT = 1.55;
export const STEP_HEIGHT = 0.32;

export function surfaceHeight(surface, x, z) {
  if ('radius' in surface) return Math.hypot(x - surface.x, z - surface.z) <= surface.radius ? surface.height : null;
  if (x < surface.minX || x > surface.maxX || z < surface.minZ || z > surface.maxZ) return null;
  if (!surface.axis) return surface.height;
  const amount = surface.axis === 'x' ? (x - surface.minX) / (surface.maxX - surface.minX) : (z - surface.minZ) / (surface.maxZ - surface.minZ);
  return surface.from + amount * (surface.to - surface.from);
}

// Roofs are walkable above rooms, but should never teleport a visitor upward.
export function groundHeight(x, z, surfaces, ceiling = Infinity) {
  let height = 0;
  for (const surface of surfaces) {
    const candidate = surfaceHeight(surface, x, z);
    if (candidate !== null && candidate <= ceiling && candidate > height) height = candidate;
  }
  return height;
}

export function collides(x, y, z, colliders, radius = PLAYER_RADIUS) {
  return colliders.some(box => {
    if (y >= (box.maxY ?? Infinity) - 0.04 || y + PLAYER_HEIGHT <= (box.minY ?? 0) + 0.04) return false;
    const nearestX = Math.max(box.minX, Math.min(x, box.maxX));
    const nearestZ = Math.max(box.minZ, Math.min(z, box.maxZ));
    return (x - nearestX) ** 2 + (z - nearestZ) ** 2 < radius ** 2;
  });
}

export function movePlayer(position, dx, dz, world) {
  const result = { ...position };
  const radius = PLAYER_RADIUS;
  const canMove = (x, z) => {
    if (collides(x, result.y, z, world.colliders)) return false;
    return !world.surfaces.some(surface => {
      if (surface.roof || surface.height >= 3) return false;
      const h = surfaceHeight(surface, x, z);
      const previous = surfaceHeight(surface, result.x, result.z);
      return h !== null && h > result.y + STEP_HEIGHT && (previous === null || h > previous + STEP_HEIGHT);
    });
  };
  const x = Math.max(world.bounds.minX + radius, Math.min(result.x + dx, world.bounds.maxX - radius));
  if (canMove(x, result.z)) result.x = x;
  const z = Math.max(world.bounds.minZ + radius, Math.min(result.z + dz, world.bounds.maxZ - radius));
  if (canMove(result.x, z)) result.z = z;
  return result;
}

export function movementVector(inputX, inputY, yaw) {
  const length = Math.max(1, Math.hypot(inputX, inputY));
  const x = inputX / length, y = inputY / length;
  return { x: x * Math.cos(yaw) + y * Math.sin(yaw), z: -x * Math.sin(yaw) + y * Math.cos(yaw) };
}

export function nearestItem(position, items) {
  let match = null, distance = Infinity;
  for (const item of items) {
    const point = item.approach ?? item.position;
    const d = Math.hypot(position.x - point.x, position.z - point.z);
    if (d < (item.interactionRadius ?? 2.3) && Math.abs(position.y - point.y) < 2 && d < distance) { match = item; distance = d; }
  }
  return match;
}
