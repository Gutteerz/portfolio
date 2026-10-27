import * as THREE from 'three';

/** A small jointed wooden visitor, facing local +Z, with feet at y=0. */
export function createCharacter(scene) {
  const group = new THREE.Group();
  group.name = 'Workshop visitor';
  group.scale.setScalar(0.9);
  const body = new THREE.Group();
  group.add(body);

  const wood = new THREE.MeshStandardMaterial({ color: 0xb67e49, roughness: 0.9, flatShading: true });
  const woodLight = new THREE.MeshStandardMaterial({ color: 0xc59159, roughness: 0.9, flatShading: true });
  const jumper = new THREE.MeshStandardMaterial({ color: 0x343b3e, roughness: 1, flatShading: true });
  const rib = new THREE.MeshStandardMaterial({ color: 0x272f34, roughness: 1 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x696e4d, roughness: 1, flatShading: true });
  const bootLeather = new THREE.MeshStandardMaterial({ color: 0x543c2b, roughness: 0.93 });
  const sole = new THREE.MeshStandardMaterial({ color: 0x352c25, roughness: 1 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x3b3026, roughness: 1 });

  function mesh(geometry, material, parent, x, y, z) {
    const part = new THREE.Mesh(geometry, material);
    part.position.set(x, y, z);
    part.castShadow = true;
    part.receiveShadow = true;
    parent.add(part);
    return part;
  }

  mesh(new THREE.CylinderGeometry(0.205, 0.255, 0.52, 10), jumper, body, 0, 0.9, 0);
  mesh(new THREE.CylinderGeometry(0.257, 0.257, 0.075, 10), rib, body, 0, 0.66, 0);
  mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.08, 12), rib, body, 0, 1.19, 0);
  mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 8), wood, body, 0, 1.24, 0);

  const head = mesh(new THREE.IcosahedronGeometry(0.28, 1), wood, body, 0, 1.48, 0);
  head.scale.set(0.91, 1.08, 0.95);
  mesh(new THREE.SphereGeometry(0.045, 6, 4), woodLight, body, 0, 1.46, 0.255);
  for (const side of [-1, 1]) {
    mesh(new THREE.SphereGeometry(0.022, 6, 4), eye, body, side * 0.092, 1.515, 0.237);
    mesh(new THREE.SphereGeometry(0.051, 6, 4), woodLight, body, side * 0.252, 1.47, 0);
  }

  // Raised knitted seams follow the garment instead of adding a screen texture.
  for (let i = -2; i <= 2; i += 1) {
    const x = i * 0.075;
    const z = Math.sqrt(0.228 ** 2 - x ** 2) + 0.006;
    mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.39, 4), rib, body, x, 0.91, z);
    mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.39, 4), rib, body, x, 0.91, -z);
  }

  const arms = [];
  const legs = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.25, 1.1, 0);
    arm.rotation.z = side * 0.12;
    body.add(arm);
    mesh(new THREE.CylinderGeometry(0.105, 0.087, 0.39, 8), jumper, arm, side * 0.025, -0.17, 0);
    mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.065, 8), rib, arm, side * 0.025, -0.37, 0);
    mesh(new THREE.IcosahedronGeometry(0.087, 0), woodLight, arm, side * 0.025, -0.435, 0.005);
    arms.push(arm);

    const leg = new THREE.Group();
    leg.position.set(side * 0.132, 0.63, 0);
    body.add(leg);
    mesh(new THREE.CylinderGeometry(0.105, 0.085, 0.4, 7), trousers, leg, 0, -0.2, 0);
    mesh(new THREE.BoxGeometry(0.205, 0.18, 0.29), bootLeather, leg, 0, -0.5, 0.035);
    mesh(new THREE.BoxGeometry(0.218, 0.045, 0.3), sole, leg, 0, -0.606, 0.035);
    mesh(new THREE.BoxGeometry(0.208, 0.035, 0.21), bootLeather, leg, 0, -0.399, 0.01);
    legs.push(leg);
  }

  scene.add(group);
  let phase = 0;
  let gait = 0;
  let elapsed = 0;
  return {
    group,
    update(delta, moving, speed = 1) {
      const step = Math.min(Math.max(delta, 0), 0.1);
      elapsed += step;
      gait = THREE.MathUtils.damp(gait, moving ? Math.min(Math.max(speed, 0.5), 1.45) : 0, 12, step);
      phase += step * 10 * (moving ? Math.min(Math.max(speed, 0.6), 1.5) : 0.4);
      const swing = Math.sin(phase) * 0.52 * gait;
      legs[0].rotation.x = swing;
      legs[1].rotation.x = -swing;
      arms[0].rotation.x = -swing * 0.75;
      arms[1].rotation.x = swing * 0.75;
      body.position.y = Math.abs(Math.sin(phase)) * 0.036 * gait;
      body.rotation.z = Math.sin(phase) * 0.025 * gait;
      head.rotation.y = Math.sin(elapsed * 0.7) * 0.035 * (1 - Math.min(gait, 1));
      head.rotation.z = Math.sin(elapsed * 0.9) * 0.025 * (1 - Math.min(gait, 1));
    },
    dispose() {
      const geometries = new Set();
      const materials = new Set();
      group.traverse(part => {
        if (part.geometry) geometries.add(part.geometry);
        if (part.material) materials.add(part.material);
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      scene.remove(group);
    },
  };
}
