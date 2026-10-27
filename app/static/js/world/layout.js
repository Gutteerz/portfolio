/** Ground-level stations. Local +Z is the approach side of every display. */
const ZONES = {
  workshop: [[-13, -4], [-10, -4], [-7, -4]],
  study: [[7.7, -6.7], [10.1, -6.7], [12.3, -6.7]],
  games: [[8.1, 7.9], [10.3, 7.9], [12.4, 7.9]],
};

// These bays stay clear of the marble garden, buildings, and roof ramp.
const PERIMETER = [
  [-16, 0, Math.PI / 2], [-16, 2.8, Math.PI / 2], [-16, 10, Math.PI / 2],
  [-10, 11, Math.PI], [-6, 11, Math.PI], [-2, 11, Math.PI], [2, 11, Math.PI],
  [15.5, 5.5, -Math.PI / 2], [15.5, 8.2, -Math.PI / 2], [15.5, 10.8, -Math.PI / 2],
];

/**
 * Pure catalog-to-world layout, independent of Three.js and the DOM.
 * Slots are preferences, so duplicate or sparse slots never hide a project.
 * Once all full-size bays are occupied, extra projects become physical books
 * on shared perimeter tables. The world never grows beyond its walkable base.
 */
export function layoutProjects(projects) {
  const occupied = new Set();
  const reserved = new Map();
  const result = [];
  const overflow = [];

  // Honor explicit primary slots before allocating fallbacks, regardless of
  // catalog order. The first claimant wins when records request the same slot.
  projects.forEach((project, index) => {
    const zone = Object.hasOwn(ZONES, project.world?.zone) ? project.world.zone : 'workshop';
    const slot = project.world?.slot;
    const key = `${zone}:${slot}`;
    if (Number.isInteger(slot) && slot >= 0 && slot < 3 && !reserved.has(key)) {
      reserved.set(key, index);
    }
  });

  projects.forEach((project, index) => {
    const zone = Object.hasOwn(ZONES, project.world?.zone) ? project.world.zone : 'workshop';
    const requested = project.world?.slot;
    const slot = reserved.get(`${zone}:${requested}`) === index
      ? requested
      : [0, 1, 2].find(candidate => !reserved.has(`${zone}:${candidate}`) && !occupied.has(`${zone}:${candidate}`));
    const entry = { id: project.id, project, index, zone, rotation: 0, y: 0, compact: false };

    if (slot === undefined) {
      overflow.push(entry);
      return;
    }
    occupied.add(`${zone}:${slot}`);
    const [x, z] = ZONES[zone][slot];
    result.push({ ...entry, x, z, stationKey: `${zone}:${slot}`, displayIndex: 0, displayCount: 1 });
  });

  // A shared display is chosen only when the whole perimeter needs it. It is
  // deterministic and retains one interaction item for every catalog record.
  const useBooks = overflow.length > PERIMETER.length;
  const counts = PERIMETER.map((_, bay) => overflow.filter((entry, index) => index % PERIMETER.length === bay).length);
  overflow.forEach((entry, index) => {
    const bay = index % PERIMETER.length;
    const [x, z, rotation] = PERIMETER[bay];
    result.push({
      ...entry, x, z, rotation, compact: useBooks,
      stationKey: `perimeter:${bay}`,
      displayIndex: Math.floor(index / PERIMETER.length),
      displayCount: counts[bay],
    });
  });

  return result.sort((a, b) => a.index - b.index);
}
