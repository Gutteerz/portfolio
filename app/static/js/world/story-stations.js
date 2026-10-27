import * as THREE from 'three';
import { createMaterials, makeSignTexture } from './materials.js';

/** Personal history belongs on the workshop's furniture, alongside its projects. */
export function createStoryStations(scene, profile) {
  const root = new THREE.Group();
  root.name = 'Personal story';
  scene.add(root);
  const materials = createMaterials();
  const resources = new Set();
  const geometries = new Map();
  const items = [];
  const colliders = [];
  let testROV;

  function geometry(key, build) {
    if (!geometries.has(key)) geometries.set(key, build());
    return geometries.get(key);
  }
  const timber = geometry('timber', () => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.44, -0.44); shape.lineTo(0.44, -0.44);
    shape.lineTo(0.44, 0.44); shape.lineTo(-0.44, 0.44); shape.closePath();
    const value = new THREE.ExtrudeGeometry(shape, {
      depth: 0.88, bevelEnabled: true, bevelSize: 0.06,
      bevelThickness: 0.06, bevelSegments: 1, steps: 1,
    });
    value.translate(0, 0, -0.44);
    return value;
  });
  const plain = geometry('box', () => new THREE.BoxGeometry(1, 1, 1));
  const flat = geometry('paper', () => new THREE.PlaneGeometry(1, 1));

  function mesh(parent, shape, material, x, y, z) {
    const part = new THREE.Mesh(shape, material);
    part.position.set(x, y, z);
    part.castShadow = true;
    part.receiveShadow = true;
    parent.add(part);
    return part;
  }
  function box(parent, x, y, z, width, height, depth, material = materials.wood, soft = true) {
    const part = mesh(parent, soft ? timber : plain, material, x, y, z);
    part.scale.set(width, height, depth);
    return part;
  }
  function cylinder(parent, x, y, z, radius, height, material, sides = 8) {
    const shape = geometry(`cylinder-${sides}`, () => new THREE.CylinderGeometry(1, 1, 1, sides));
    const part = mesh(parent, shape, material, x, y, z);
    part.scale.set(radius, height, radius);
    return part;
  }
  function bolt(parent, x, y, z, radius = 0.035) {
    const part = cylinder(parent, x, y, z, radius, 0.025, materials.darkMetal);
    part.rotation.x = Math.PI / 2;
    return part;
  }
  function rod(parent, start, end, radius, material) {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
    const part = cylinder(parent, 0, 0, 0, radius, a.distanceTo(b), material, 6);
    part.position.copy(a).add(b).multiplyScalar(0.5);
    part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
    return part;
  }
  function canvas(width, height, draw) {
    const element = document.createElement('canvas');
    element.width = width; element.height = height;
    draw(element.getContext('2d'), width, height);
    const texture = new THREE.CanvasTexture(element);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    resources.add(texture);
    return texture;
  }
  function face(parent, x, y, z, width, height, texture) {
    const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 1 });
    resources.add(material); resources.add(texture);
    const part = mesh(parent, flat, material, x, y, z);
    part.scale.set(width, height, 1);
    part.castShadow = false;
    return part;
  }
  function sign(parent, text, x, y, z, width, height) {
    box(parent, x, y, z, width, height, 0.07, materials.woodLight);
    face(parent, x, y, z + 0.037, width * 0.97, height * 0.91, makeSignTexture(text));
    bolt(parent, x - width * 0.43, y, z + 0.052, 0.023);
    bolt(parent, x + width * 0.43, y, z + 0.052, 0.023);
  }
  function fitLine(ctx, text, x, y, width, size, weight = 400) {
    do { ctx.font = `${weight} ${size}px "Atkinson Hyperlegible", sans-serif`; size -= 1; }
    while (ctx.measureText(text).width > width && size > 12);
    ctx.fillText(text, x, y);
  }
  function lines(ctx, text, x, y, width, size, maxLines = 3, weight = 400) {
    const words = String(text ?? '').split(/\s+/);
    let rows;
    do {
      ctx.font = `${weight} ${size}px "Atkinson Hyperlegible", sans-serif`;
      rows = [''];
      for (const word of words) {
        const index = rows.length - 1, next = `${rows[index]} ${word}`.trim();
        if (rows[index] && ctx.measureText(next).width > width) rows.push(word);
        else rows[index] = next;
      }
      if (rows.length <= maxLines || size <= 12) break;
      size -= 1;
    } while (true);
    rows.forEach((row, index) => ctx.fillText(row, x, y + index * size * 1.17));
  }
  const dateLabel = entry => entry.dateLabel || [entry.startDate, entry.endDate].filter(Boolean).join(' – ');

  function station(action, label, position, rotation, build, anchorHeight, approachDistance = 1.65) {
    const object = new THREE.Group();
    object.name = label;
    object.position.set(...position);
    object.rotation.y = rotation;
    object.userData.storyAction = action;
    root.add(object);
    build(object);
    object.updateMatrixWorld(true);
    // Bounds come from the complete prop, including braces, feet and mailbox flag.
    const bounds = new THREE.Box3().setFromObject(object);
    const stationKey = `story:${action}`;
    colliders.push({
      minX: bounds.min.x, maxX: bounds.max.x, minZ: bounds.min.z, maxZ: bounds.max.z,
      minY: position[1], maxY: bounds.max.y, stationKey,
    });
    const item = {
      id: stationKey, stationKey, action, label, object,
      position: new THREE.Vector3(...position), interactionRadius: 2.35,
      approach: object.localToWorld(new THREE.Vector3(0, 0, approachDistance)),
      labelAnchor: object.localToWorld(new THREE.Vector3(0, anchorHeight, 0)),
    };
    items.push(item);
    return object;
  }

  function experience(parent) {
    // A freestanding, braced timber noticeboard; all of its cards share one action.
    for (const x of [-1.77, 1.77]) {
      box(parent, x, 1.66, -0.12, 0.18, 3.32, 0.22, materials.paintGreen);
      box(parent, x, 0.09, -0.13, 0.38, 0.18, 1.24, materials.woodDark);
      rod(parent, [x, 0.2, -0.65], [x, 1.45, -0.12], 0.055, materials.wood);
      bolt(parent, x, 0.32, 0.01); bolt(parent, x, 0.77, 0.01);
    }
    box(parent, 0, 2.22, 0, 4.3, 2.4, 0.17, materials.woodDark);
    for (let row = 0; row < 6; row += 1) {
      box(parent, 0, 1.24 + row * 0.39, 0.1, 4.12, 0.37, 0.06,
        row % 2 ? materials.paintGreen : materials.paintGreenDark);
    }
    for (const x of [-2.12, 2.12]) box(parent, x, 2.22, 0.15, 0.12, 2.43, 0.15, materials.wood);
    for (const y of [1.05, 3.4]) box(parent, 0, y, 0.15, 4.34, 0.12, 0.15, materials.woodLight);
    sign(parent, 'Work experience', 0, 3.12, 0.19, 2.45, 0.35);
    const work = profile.work ?? [];
    const columns = Math.min(4, Math.max(1, work.length));
    const rows = Math.max(1, Math.ceil(work.length / columns));
    const cellWidth = 3.9 / columns, cellHeight = 1.75 / rows;
    const cardWidth = cellWidth * 0.91, cardHeight = cellHeight * 0.84;
    work.forEach((entry, index) => {
      const card = new THREE.Group();
      card.name = `Work record: ${entry.name}`;
      card.userData.recordId = entry.id;
      card.position.set(-1.95 + cellWidth * (index % columns + 0.5), 2.91 - cellHeight * (Math.floor(index / columns) + 0.5), 0.2);
      card.rotation.z = (index % 3 - 1) * 0.024;
      parent.add(card);
      box(card, 0, 0, 0, cardWidth, cardHeight, 0.027, materials.paper, false);
      const texture = canvas(512, 352, (ctx, width, height) => {
        ctx.fillStyle = '#eee2bd'; ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#3e5944'; ctx.fillRect(25, 24, 60, 7);
        ctx.fillStyle = '#302a21';
        lines(ctx, entry.name, 25, 77, width - 50, 38, 2, 700);
        lines(ctx, entry.position, 25, 176, width - 50, 26, 3);
        ctx.fillStyle = '#65553c';
        fitLine(ctx, dateLabel(entry), 25, height - 27, width - 50, 25);
      });
      face(card, 0, 0, 0.016, cardWidth * 0.98, cardHeight * 0.98, texture);
      const pin = cylinder(card, 0, cardHeight * 0.43, 0.038, 0.027, 0.036,
        index % 3 === 1 ? materials.red : materials.darkMetal);
      pin.rotation.x = Math.PI / 2;
    });
    box(parent, 0, 0.67, -0.18, 3.65, 0.13, 0.16, materials.wood);
    // A little tray gives the board a useful, physical edge.
    box(parent, 0, 1.0, 0.24, 4.34, 0.1, 0.36, materials.woodLight);
    box(parent, 1.56, 1.07, 0.3, 0.39, 0.035, 0.035, materials.red);
  }

  function desk(parent, width, depth, height = 0.92) {
    for (let i = 0; i < 3; i += 1) {
      box(parent, 0, height, -depth / 2 + depth / 3 * (i + 0.5), width, 0.12, depth / 3 - 0.02,
        i === 1 ? materials.woodLight : materials.wood);
    }
    for (const x of [-width * 0.39, width * 0.39]) {
      for (const z of [-depth * 0.36, depth * 0.36]) box(parent, x, height / 2, z, 0.13, height, 0.13, materials.paintGreen);
      box(parent, x, 0.22, 0, 0.13, 0.12, depth * 0.86, materials.woodDark);
    }
    box(parent, 0, height - 0.15, depth / 2 - 0.05, width * 0.94, 0.19, 0.09, materials.paintGreen);
  }

  function education(parent) {
    desk(parent, 2.68, 1.52);
    sign(parent, 'Education', 0, 0.73, 0.78, 1.65, 0.28);
    // Two real, raised page blocks and wire rings make an open study notebook.
    const book = new THREE.Group();
    book.position.set(-0.1, 1.0, 0.01); book.rotation.y = -0.035;
    parent.add(book);
    box(book, 0, 0, 0, 2.18, 0.065, 1.22, materials.paintGreenDark);
    const records = profile.education ?? [];
    for (let index = 0; index < 2; index += 1) {
      const page = new THREE.Group();
      page.position.set(index === 0 ? -0.52 : 0.52, 0.075, 0);
      page.rotation.z = index === 0 ? -0.06 : 0.06;
      book.add(page);
      box(page, 0, 0, 0, 0.98, 0.09, 1.12, materials.paper, false);
      const entry = records[index];
      const texture = canvas(512, 640, (ctx, width, height) => {
        ctx.fillStyle = '#eee2bd'; ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#d1c4a3'; ctx.lineWidth = 1;
        for (let y = 58; y < height; y += 36) { ctx.beginPath(); ctx.moveTo(35, y); ctx.lineTo(width - 35, y); ctx.stroke(); }
        if (!entry) return;
        ctx.fillStyle = '#3e5944';
        lines(ctx, entry.institution, 34, 69, width - 68, 27, 2);
        ctx.fillStyle = '#302a21';
        lines(ctx, entry.studyType, 34, 190, width - 68, 49, 2, 700);
        lines(ctx, entry.area, 34, 342, width - 68, 33, 4);
        ctx.fillStyle = '#65553c';
        fitLine(ctx, dateLabel(entry), 34, height - 42, width - 68, 27);
      });
      face(page, 0, 0.047, 0, 0.96, 1.1, texture).rotation.x = -Math.PI / 2;
      for (const y of [-0.022, 0.004, 0.027]) box(page, 0, y, 0.562, 0.95, 0.006, 0.008, materials.cream, false);
    }
    for (const z of [-0.43, -0.22, 0, 0.22, 0.43]) {
      const ring = geometry('ring', () => new THREE.TorusGeometry(0.085, 0.014, 5, 12));
      mesh(book, ring, materials.darkMetal, 0, 0.11, z);
    }
    records.slice(2).forEach((entry, index) => {
      box(parent, 0.69, 1.04 + index * 0.075, -0.49, 0.88, 0.055, 0.43, index % 2 ? materials.cream : materials.paintGreen);
    });
    const pencil = cylinder(parent, 1.15, 1.05, 0.04, 0.027, 0.95, materials.red, 6);
    pencil.rotation.x = Math.PI / 2;
    const tip = mesh(parent, geometry('pencil-tip', () => new THREE.ConeGeometry(0.027, 0.12, 6)), materials.woodDark, 1.15, 1.05, 0.57);
    tip.rotation.x = Math.PI / 2;
  }

  function about(parent) {
    desk(parent, 1.68, 1.13, 0.74);
    sign(parent, 'About & CV', 0, 0.57, 0.59, 1.36, 0.29);
    const folder = new THREE.Group();
    folder.position.set(0, 0.89, 0); folder.rotation.set(0.15, -0.07, 0);
    parent.add(folder);
    box(folder, 0, 0, 0, 1.39, 0.075, 1.01, materials.paintGreen);
    box(folder, -0.41, 0, -0.53, 0.49, 0.07, 0.16, materials.paintGreen);
    box(folder, 0.04, 0.055, 0.01, 1.24, 0.035, 0.91, materials.paper, false);
    const texture = canvas(640, 480, (ctx, width, height) => {
      ctx.fillStyle = '#eee2bd'; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#302a21';
      fitLine(ctx, profile.basics?.name || 'About', 38, 91, width - 76, 57, 700);
      lines(ctx, profile.basics?.label || '', 38, 160, width - 76, 30, 3);
      ctx.fillStyle = '#a49371';
      for (let row = 0; row < 4; row += 1) ctx.fillRect(38, 307 + row * 24, row === 3 ? 340 : 553, 3);
      ctx.fillStyle = '#3e5944'; ctx.font = '700 25px "Atkinson Hyperlegible", sans-serif';
      ctx.fillText('About / Skills / CV', 38, height - 26);
    });
    face(folder, 0.04, 0.075, 0.01, 1.21, 0.89, texture).rotation.x = -Math.PI / 2;
    // A stamped green folder, with the two actual jaws of a binder clip.
    box(folder, -0.46, 0.098, -0.4, 0.18, 0.06, 0.15, materials.darkMetal);
    for (const x of [-0.51, -0.41]) rod(folder, [x, 0.11, -0.41], [x, 0.16, -0.28], 0.012, materials.metal);
    rod(folder, [-0.51, 0.16, -0.28], [-0.41, 0.16, -0.28], 0.012, materials.metal);
  }

  function contact(parent) {
    // A faceted rural mailbox on a timber post; a letter waits in the open tray.
    box(parent, 0, 0.08, 0, 0.78, 0.16, 0.7, materials.woodDark);
    box(parent, 0, 0.75, -0.1, 0.18, 1.5, 0.2, materials.wood);
    box(parent, 0, 1.38, 0, 0.95, 0.12, 0.89, materials.woodLight);
    const shape = new THREE.Shape();
    shape.moveTo(-0.47, 0); shape.lineTo(0.47, 0); shape.lineTo(0.47, 0.39);
    shape.lineTo(0.32, 0.64); shape.lineTo(0, 0.75); shape.lineTo(-0.32, 0.64);
    shape.lineTo(-0.47, 0.39); shape.closePath();
    const shell = geometry('mailbox', () => new THREE.ExtrudeGeometry(shape, {
      depth: 0.88, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 1, steps: 1,
    }));
    mesh(parent, shell, materials.paintGreen, 0, 1.45, -0.46);
    box(parent, 0, 1.86, 0.465, 0.71, 0.062, 0.027, materials.darkMetal);
    box(parent, 0, 1.61, 0.5, 1.0, 0.075, 0.39, materials.woodLight);
    const envelope = new THREE.Group();
    envelope.position.set(-0.02, 1.66, 0.55); envelope.rotation.set(-0.35, 0, -0.07);
    parent.add(envelope);
    box(envelope, 0, 0.16, 0, 0.63, 0.4, 0.035, materials.paper, false);
    const letter = canvas(512, 320, (ctx, width, height) => {
      ctx.fillStyle = '#eee2bd'; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#ad9d80'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(width / 2, height * 0.61); ctx.lineTo(width, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, height); ctx.lineTo(width * 0.3, height * 0.48);
      ctx.moveTo(width, height); ctx.lineTo(width * 0.7, height * 0.48); ctx.stroke();
      ctx.fillStyle = '#ad5945'; ctx.fillRect(width - 89, 25, 61, 66);
    });
    face(envelope, 0, 0.16, 0.02, 0.62, 0.39, letter);
    box(parent, 0.53, 1.98, -0.15, 0.055, 0.72, 0.06, materials.red);
    box(parent, 0.64, 2.28, -0.15, 0.28, 0.15, 0.07, materials.red);
    bolt(parent, 0.53, 1.66, -0.1, 0.045);
    sign(parent, 'Contact', 0, 1.13, 0.11, 1.16, 0.31);
  }

  function uiasub(parent) {
    // A small workshop test tank, with an illustrative tethered ROV in the water.
    // The pool fits between the open workshop, future perimeter bays and marble track.
    box(parent, 0, 0.1, 0, 2.8, 0.2, 2.3, materials.woodDark);
    box(parent, 0, 0.22, 0, 2.58, 0.09, 2.08, materials.blue);
    for (const x of [-1.32, 1.32]) {
      box(parent, x, 0.36, 0, 0.16, 0.48, 2.3, materials.paintGreen);
      box(parent, x, 0.62, 0, 0.19, 0.09, 2.35, materials.woodLight);
    }
    for (const z of [-1.07, 1.07]) {
      box(parent, 0, 0.36, z, 2.62, 0.48, 0.16, materials.paintGreen);
      box(parent, 0, 0.62, z, 2.8, 0.09, 0.19, materials.woodLight);
      for (const x of [-1.2, 1.2]) bolt(parent, x, 0.4, z + 0.09, 0.035);
    }
    for (const x of [-1.29, 1.29]) for (const z of [-1.04, 1.04]) {
      box(parent, x, 0.29, z, 0.24, 0.57, 0.24, materials.wood);
    }
    const water = new THREE.MeshStandardMaterial({
      color: '#69a5ad', transparent: true, opacity: 0.74, roughness: 0.3,
      metalness: 0.08, depthWrite: false,
    });
    resources.add(water);
    const surface = mesh(parent, flat, water, 0, 0.46, 0);
    surface.scale.set(2.46, 2.0, 1); surface.rotation.x = -Math.PI / 2;
    surface.castShadow = false;
    // A few pale facets remain still, as reflections painted into this miniature.
    for (const [x, z, length] of [[-0.78, 0.56, 0.34], [0.72, -0.46, 0.39], [0.74, 0.54, 0.22]]) {
      box(parent, x, 0.463, z, length, 0.006, 0.025, materials.cream, false);
    }
    testROV = new THREE.Group();
    testROV.name = 'Illustrative UiASub ROV';
    testROV.position.set(-0.14, 0.37, 0.01); testROV.rotation.y = -0.13;
    parent.add(testROV);
    for (const y of [0, 0.4]) {
      for (const x of [-0.51, 0.51]) rod(testROV, [x, y, -0.34], [x, y, 0.34], 0.035, materials.woodLight);
      for (const z of [-0.34, 0.34]) rod(testROV, [-0.51, y, z], [0.51, y, z], 0.035, materials.woodLight);
    }
    for (const x of [-0.51, 0.51]) for (const z of [-0.34, 0.34]) {
      rod(testROV, [x, 0, z], [x, 0.4, z], 0.035, materials.woodLight);
    }
    box(testROV, 0, 0.15, 0, 0.57, 0.24, 0.43, materials.darkMetal);
    for (const x of [-0.34, 0.34]) box(testROV, x, 0.43, 0, 0.22, 0.14, 0.72, materials.cream);
    for (const x of [-0.55, 0.55]) {
      const housing = cylinder(testROV, x, 0.18, 0.04, 0.16, 0.25, materials.darkMetal, 10);
      housing.rotation.x = Math.PI / 2;
      const rim = geometry('thruster-rim', () => new THREE.TorusGeometry(0.13, 0.025, 5, 10));
      mesh(testROV, rim, materials.blue, x, 0.18, 0.18);
      for (const angle of [0, Math.PI / 2]) {
        const propeller = box(testROV, x, 0.18, 0.183, 0.18, 0.035, 0.025, materials.metal);
        propeller.rotation.z = angle;
      }
    }
    const camera = cylinder(testROV, 0, 0.17, 0.3, 0.09, 0.13, materials.dark, 10);
    camera.rotation.x = Math.PI / 2;
    box(parent, 0.89, 0.74, -0.79, 0.52, 0.23, 0.38, materials.darkMetal);
    box(parent, 0.89, 0.87, -0.79, 0.45, 0.04, 0.31, materials.woodLight);
    const tetherPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, 0.76, 0), new THREE.Vector3(0.17, 0.97, -0.2),
      new THREE.Vector3(0.61, 0.98, -0.58), new THREE.Vector3(0.9, 0.87, -0.72),
    ]);
    mesh(parent, geometry('rov-tether', () => new THREE.TubeGeometry(tetherPath, 16, 0.017, 5, false)), materials.red, 0, 0, 0);
    sign(parent, 'UiASub · ROV', 0, 0.36, 1.185, 1.78, 0.35);
  }

  station('experience', 'Read work experience', [-8.8, 0, -0.4], 0, experience, 3.7);
  const study = station('education', 'Open education notebook', [8.3, 3.64, -6.5], 0, education, 1.75);
  station('about', 'Open About & CV', [-3.6, 0, 8.9], Math.PI / 2, about, 1.6);
  station('contact', 'Open contact mailbox', [5.2, 0, 7.5], -0.7, contact, 2.65);
  station('uiasub', 'Explore UiASub', [-12.6, 0, 0.5], 0, uiasub, 1.55, 1.8);

  return {
    items, colliders,
    update(time, delta, playerPosition) {
      testROV.position.y = 0.37 + Math.sin(time * 0.9) * 0.025;
      if (playerPosition) {
        // Match the study's roof cutaway so the notebook never floats indoors.
        study.visible = !(playerPosition.x > 6.1 && playerPosition.x < 13.9
          && playerPosition.z > -9.5 && playerPosition.z < -2.2 && playerPosition.y < 3.3);
      }
    },
    dispose() {
      scene.remove(root);
      geometries.forEach(value => value.dispose());
      resources.forEach(value => value.dispose());
      materials.dispose();
    },
  };
}
