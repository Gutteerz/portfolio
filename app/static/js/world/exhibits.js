import * as THREE from 'three';
import { layoutProjects } from './layout.js';

export { layoutProjects } from './layout.js';

/** Build the catalog as working objects on furniture within the world. */
export function createExhibits(scene, projects) {
  const root = new THREE.Group();
  root.name = 'Project workbenches';
  scene.add(root);
  const animations = [];
  const resources = new Set();
  const sharedStations = new Map();
  const items = [];
  const colliders = [];

  const material = (color, options = {}) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...options });
    resources.add(value);
    return value;
  };
  const materials = {
    timber: material(0xbe8a51), edge: material(0x936334), pale: material(0xe1b97b),
    green: material(0x697b48), teal: material(0x588083), blue: material(0x597785),
    cream: material(0xeaddbd), dark: material(0x293638), black: material(0x1e282b),
    metal: material(0x7b827e, { metalness: 0.45, roughness: 0.5 }),
    orange: material(0xcb8042), red: material(0xac5c49), paper: material(0xe9dbc0),
    lens: material(0x304c59, { metalness: 0.35, roughness: 0.18 }),
  };

  function mesh(geometry, mat, parent, x = 0, y = 0, z = 0) {
    resources.add(geometry);
    const part = new THREE.Mesh(geometry, mat);
    part.position.set(x, y, z);
    part.castShadow = true;
    part.receiveShadow = true;
    parent.add(part);
    return part;
  }
  const box = (parent, w, h, d, x, y, z, mat = materials.timber) => mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z);
  const cylinder = (parent, radius, height, x, y, z, mat, segments = 12) => mesh(new THREE.CylinderGeometry(radius, radius, height, segments), mat, parent, x, y, z);
  function rod(parent, from, to, radius, mat) {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const part = cylinder(parent, radius, a.distanceTo(b), 0, 0, 0, mat, 7);
    part.position.copy(a).add(b).multiplyScalar(0.5);
    part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
    return part;
  }
  function canvas(width, height, paint) {
    const element = document.createElement('canvas');
    element.width = width;
    element.height = height;
    const context = element.getContext('2d');
    paint(context, width, height);
    const texture = new THREE.CanvasTexture(element);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    resources.add(texture);
    return { element, context, texture };
  }
  function screen(parent, width, height, x, y, z, texture) {
    const mat = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    resources.add(mat);
    const plane = mesh(new THREE.PlaneGeometry(width, height), mat, parent, x, y, z);
    plane.castShadow = false;
    return plane;
  }
  function lettering(text, subtitle = '') {
    return canvas(768, 160, (ctx, width, height) => {
      ctx.fillStyle = '#dfc595';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#423a2b';
      ctx.textAlign = 'center';
      let size = subtitle ? 53 : 58;
      do {
        ctx.font = `600 ${size}px "Atkinson Hyperlegible", sans-serif`;
        size -= 1;
      } while (ctx.measureText(text).width > width - 70 && size > 18);
      ctx.fillText(text, width / 2, subtitle ? 71 : 99);
      if (subtitle) {
        ctx.font = '27px "Atkinson Hyperlegible", sans-serif';
        ctx.fillStyle = '#675a40';
        ctx.fillText(subtitle, width / 2, 122);
      }
    }).texture;
  }
  function plaque(parent, text, x, y, z, width = 1.7, subtitle = '') {
    box(parent, width + 0.06, 0.34, 0.045, x, y, z, materials.edge);
    screen(parent, width, 0.31, x, y, z + 0.025, lettering(text, subtitle));
  }
  function paper(parent) {
    const blueprint = canvas(256, 160, (ctx, w, h) => {
      ctx.fillStyle = '#ded5b4';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#8c9477';
      ctx.lineWidth = 3;
      ctx.strokeRect(32, 33, 104, 78);
      ctx.strokeRect(48, 49, 72, 47);
      ctx.beginPath();
      ctx.moveTo(145, 45); ctx.lineTo(221, 45);
      ctx.moveTo(145, 62); ctx.lineTo(205, 62);
      ctx.moveTo(145, 80); ctx.lineTo(217, 80);
      ctx.moveTo(35, 134); ctx.lineTo(180, 134);
      ctx.stroke();
    });
    const page = screen(parent, 0.67, 0.42, -0.56, 0.982, 0.15, blueprint.texture);
    page.rotation.x = -Math.PI / 2;
    page.rotation.z = -0.15;
  }
  function table(parent, zone, title) {
    const painted = zone === 'study' ? materials.teal : zone === 'games' ? materials.green : materials.edge;
    for (const z of [-0.37, 0, 0.37]) box(parent, 2.08, 0.105, 0.355, 0, 0.92, z, z === 0 ? materials.pale : materials.timber);
    box(parent, 2.04, 0.18, 0.08, 0, 0.79, 0.45, painted);
    box(parent, 2.04, 0.18, 0.08, 0, 0.79, -0.45, painted);
    for (const x of [-0.83, 0.83]) {
      for (const z of [-0.36, 0.36]) box(parent, 0.13, 0.84, 0.13, x, 0.42, z, painted);
      box(parent, 0.11, 0.12, 0.78, x, 0.22, 0, materials.edge);
    }
    box(parent, 1.8, 0.09, 0.1, 0, 0.25, -0.2, materials.edge);
    plaque(parent, title, 0, 0.73, 0.535);
    paper(parent);
  }
  function monitor(parent, width, height, x, y, z, texture) {
    box(parent, width + 0.1, height + 0.1, 0.13, x, y, z, materials.dark);
    screen(parent, width, height, x, y, z + 0.071, texture);
    box(parent, 0.1, 0.21, 0.09, x, y - height / 2 - 0.1, z, materials.metal);
    box(parent, width * 0.5, 0.035, 0.3, x, y - height / 2 - 0.21, z + 0.02, materials.dark);
  }
  function keyboard(parent, x, y, z, width = 0.72) {
    box(parent, width, 0.035, 0.24, x, y, z, materials.dark);
    for (let row = 0; row < 3; row += 1) box(parent, width - 0.07, 0.012, 0.022, x, y + 0.021, z - 0.07 + row * 0.065, materials.metal);
  }
  function tag(parent, text, x, y, z, width = 0.53) {
    box(parent, width, 0.14, 0.02, x, y, z, materials.cream);
    screen(parent, width - 0.018, 0.125, x, y, z + 0.012, lettering(text));
  }

  function clock(parent) {
    box(parent, 1.45, 0.73, 0.29, 0, 0.43, -0.06, materials.dark);
    box(parent, 1.55, 0.075, 0.32, 0, 0.055, -0.06, materials.edge);
    box(parent, 1.56, 0.065, 0.33, 0, 0.81, -0.06, materials.timber);
    box(parent, 0.065, 0.71, 0.33, -0.75, 0.43, -0.06, materials.timber);
    box(parent, 0.065, 0.71, 0.33, 0.75, 0.43, -0.06, materials.timber);
    const display = canvas(512, 224, () => {});
    screen(parent, 1.28, 0.56, 0, 0.46, 0.091, display.texture);
    let lastSecond = -1;
    const updateClock = () => {
      const now = new Date();
      const second = Math.floor(now.getTime() / 1000);
      if (second === lastSecond) return;
      lastSecond = second;
      const ctx = display.context;
      ctx.fillStyle = '#a9bd8a'; ctx.fillRect(0, 0, 512, 224);
      ctx.fillStyle = '#374b37'; ctx.font = '19px monospace';
      ctx.fillText('LOCAL TIME', 26, 35);
      ctx.font = '74px monospace';
      ctx.fillText(now.toLocaleTimeString('en-GB', { hour12: false }), 25, 131);
      ctx.font = '21px monospace';
      ctx.fillText(now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase(), 26, 190);
      ctx.fillText('STM32', 391, 190);
      display.texture.needsUpdate = true;
    };
    updateClock();
    animations.push(updateClock);
    for (let i = 0; i < 3; i += 1) cylinder(parent, 0.041, 0.025, 0.39 + i * 0.12, 0.855, -0.02, materials.metal);
  }

  function rov(parent) {
    box(parent, 1.5, 0.045, 0.8, 0, 0.05, 0, materials.blue);
    for (const x of [-0.6, 0.6]) {
      for (const z of [-0.33, 0.33]) box(parent, 0.055, 0.58, 0.055, x, 0.37, z, materials.orange);
      for (const y of [0.11, 0.65]) box(parent, 0.055, 0.055, 0.71, x, y, 0, materials.orange);
    }
    for (const z of [-0.33, 0.33]) {
      for (const y of [0.11, 0.65]) box(parent, 1.25, 0.055, 0.055, 0, y, z, materials.orange);
    }
    const hull = cylinder(parent, 0.19, 0.75, 0, 0.4, 0, materials.cream);
    hull.rotation.z = Math.PI / 2;
    box(parent, 0.4, 0.21, 0.35, 0, 0.44, 0, materials.dark);
    for (const x of [-0.58, 0.58]) {
      const thruster = cylinder(parent, 0.19, 0.25, x, 0.39, 0.18, materials.dark);
      thruster.rotation.x = Math.PI / 2;
      const fan = new THREE.Group();
      fan.position.set(x, 0.39, 0.312);
      parent.add(fan);
      for (const angle of [0, Math.PI / 3, Math.PI * 2 / 3]) {
        const blade = box(fan, 0.28, 0.045, 0.018, 0, 0, 0, materials.metal);
        blade.rotation.z = angle;
      }
      const cap = cylinder(fan, 0.052, 0.035, 0, 0, 0.016, materials.orange);
      cap.rotation.x = Math.PI / 2;
    }
    const sensor = cylinder(parent, 0.08, 0.045, 0, 0.48, 0.205, materials.lens);
    sensor.rotation.x = Math.PI / 2;
    const cable = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 0.55, -0.05), new THREE.Vector3(0.12, 0.95, -0.14),
      new THREE.Vector3(0.5, 0.91, -0.21), new THREE.Vector3(0.77, 0.12, -0.2),
    ]);
    mesh(new THREE.TubeGeometry(cable, 20, 0.018, 5, false), materials.dark, parent);
    tag(parent, 'Model', 0.39, 0.12, 0.43, 0.55);
  }

  function camera(parent) {
    rod(parent, [-0.55, 0.05, -0.2], [-0.55, 0.63, -0.05], 0.025, materials.metal);
    rod(parent, [-0.86, 0.03, 0.2], [-0.55, 0.63, -0.05], 0.025, materials.metal);
    rod(parent, [-0.27, 0.03, 0.2], [-0.55, 0.63, -0.05], 0.025, materials.metal);
    box(parent, 0.43, 0.29, 0.3, -0.55, 0.73, -0.05, materials.dark);
    const lens = cylinder(parent, 0.11, 0.12, -0.55, 0.73, 0.15, materials.black);
    lens.rotation.x = Math.PI / 2;
    const glass = cylinder(parent, 0.083, 0.012, -0.55, 0.73, 0.216, materials.lens);
    glass.rotation.x = Math.PI / 2;
    const display = canvas(360, 220, () => {});
    monitor(parent, 0.89, 0.55, 0.43, 0.52, -0.1, display.texture);
    let previousFrame = -1;
    const draw = time => {
      const frame = Math.floor(time * 10);
      if (frame === previousFrame) return;
      previousFrame = frame;
      const ctx = display.context;
      ctx.fillStyle = '#a4c3c5'; ctx.fillRect(0, 0, 360, 220);
      ctx.fillStyle = '#6a8057'; ctx.fillRect(0, 85, 360, 135);
      ctx.fillStyle = '#586064';
      ctx.beginPath(); ctx.moveTo(150, 85); ctx.lineTo(210, 85); ctx.lineTo(325, 220); ctx.lineTo(35, 220); ctx.fill();
      ctx.strokeStyle = '#d9d9b2'; ctx.lineWidth = 5;
      ctx.setLineDash([16, 15]); ctx.lineDashOffset = -frame * 4;
      ctx.beginPath(); ctx.moveTo(180, 90); ctx.lineTo(180, 220); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#d9d0b0'; ctx.fillRect(279, 83, 5, 57);
      ctx.beginPath(); ctx.arc(281, 78, 20, 0, Math.PI * 2); ctx.fillStyle = '#b65745'; ctx.fill();
      ctx.beginPath(); ctx.arc(281, 78, 14, 0, Math.PI * 2); ctx.fillStyle = '#eee6c9'; ctx.fill();
      ctx.fillStyle = '#353c38'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('50', 271, 84);
      ctx.strokeStyle = '#d6ed91'; ctx.lineWidth = 2; ctx.strokeRect(253, 49, 57, 57);
      ctx.fillStyle = '#283d34'; ctx.fillRect(241, 27, 98, 21);
      ctx.fillStyle = '#e7edc7'; ctx.font = '13px monospace'; ctx.fillText('speed sign', 247, 42);
      ctx.fillStyle = '#25362f'; ctx.fillRect(0, 194, 360, 26);
      ctx.fillStyle = '#e7dec0'; ctx.font = '14px sans-serif'; ctx.fillText('DEMO · illustrative detection', 12, 212);
      display.texture.needsUpdate = true;
    };
    draw(0);
    animations.push(draw);
    tag(parent, 'Demo', 0.45, 0.08, 0.32, 0.65);
  }

  function game(parent, project) {
    box(parent, 1.13, 0.95, 0.66, 0, 0.51, -0.07, materials.green);
    box(parent, 0.08, 1.02, 0.71, -0.57, 0.53, -0.07, materials.timber);
    box(parent, 0.08, 1.02, 0.71, 0.57, 0.53, -0.07, materials.timber);
    box(parent, 1.22, 0.09, 0.76, 0, 1.065, -0.07, materials.pale);
    box(parent, 1.2, 0.11, 0.38, 0, 0.26, 0.39, materials.edge);
    const display = canvas(384, 256, () => {});
    screen(parent, 0.96, 0.64, 0, 0.68, 0.268, display.texture);
    cylinder(parent, 0.027, 0.15, -0.32, 0.39, 0.44, materials.metal);
    mesh(new THREE.SphereGeometry(0.065, 8, 6), materials.red, parent, -0.32, 0.49, 0.44);
    cylinder(parent, 0.055, 0.025, 0.25, 0.33, 0.42, materials.red);
    cylinder(parent, 0.055, 0.025, 0.41, 0.33, 0.39, materials.cream);
    const darkGame = /godforsaken/i.test(project.id);
    let previousFrame = -1;
    const draw = time => {
      const frame = Math.floor(time * 12);
      if (frame === previousFrame) return;
      previousFrame = frame;
      const ctx = display.context;
      ctx.fillStyle = darkGame ? '#3b525b' : '#8fbac4'; ctx.fillRect(0, 0, 384, 256);
      for (let i = 0; i < 5; i += 1) {
        const x = i * 103 - (time * 6) % 103;
        ctx.fillStyle = darkGame ? '#485f61' : '#768d6b';
        ctx.beginPath(); ctx.moveTo(x, 169); ctx.lineTo(x + 65, 64); ctx.lineTo(x + 130, 169); ctx.fill();
      }
      ctx.fillStyle = '#c8ad73'; ctx.fillRect(0, 204, 384, 52);
      ctx.fillStyle = '#648457'; ctx.fillRect(0, 197, 384, 9);
      ctx.fillStyle = '#8c724f'; ctx.fillRect(172, 158, 78, 12); ctx.fillRect(290, 123, 61, 12);
      ctx.fillStyle = '#84915d'; ctx.fillRect(172, 153, 78, 5); ctx.fillRect(290, 118, 61, 5);
      const x = 63 + ((time * 20) % 225);
      const y = 179 - Math.max(0, Math.sin(time * 2.2)) * 48;
      ctx.fillStyle = '#cc914d'; ctx.fillRect(x, y, 18, 18);
      ctx.fillStyle = '#343e3c'; ctx.fillRect(x + 3, y + 18, 5, 9); ctx.fillRect(x + 12, y + 18, 5, 9);
      ctx.fillStyle = '#e8d9b6'; ctx.fillRect(x + 12, y + 4, 3, 3);
      ctx.fillStyle = '#e8dfc5'; ctx.font = '15px monospace'; ctx.fillText('DEMO', 14, 25);
      ctx.fillStyle = '#2f3e35'; ctx.fillRect(0, 230, 384, 26);
      ctx.fillStyle = '#e8dfc5'; ctx.font = '13px sans-serif'; ctx.fillText('Illustrative game preview', 14, 248);
      display.texture.needsUpdate = true;
    };
    draw(0);
    animations.push(draw);
  }

  function phone(parent) {
    box(parent, 0.57, 0.035, 0.4, 0.1, 0.035, 0, materials.edge);
    const handset = new THREE.Group();
    handset.position.set(0.1, 0.5, -0.05);
    handset.rotation.x = -0.13;
    parent.add(handset);
    box(handset, 0.44, 0.85, 0.065, 0, 0, 0, materials.dark);
    const display = canvas(200, 360, (ctx, w, h) => {
      ctx.fillStyle = '#ece4ce'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#54736c'; ctx.fillRect(0, 0, w, 66);
      ctx.fillStyle = '#f2ead5'; ctx.font = 'bold 23px sans-serif'; ctx.fillText('Studak', 18, 42);
      ctx.fillStyle = '#3f5147'; ctx.font = '17px sans-serif'; ctx.fillText('Find something', 16, 98); ctx.fillText('to do together.', 16, 121);
      const names = ['Outdoors', 'Board games', 'Coffee'];
      names.forEach((name, i) => {
        ctx.fillStyle = ['#93a371', '#bf905c', '#6c9590'][i];
        ctx.beginPath(); ctx.arc(28, 160 + i * 56, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3f5147'; ctx.font = '16px sans-serif'; ctx.fillText(name, 49, 166 + i * 56);
        ctx.strokeStyle = '#c7bfa6'; ctx.beginPath(); ctx.moveTo(16, 187 + i * 56); ctx.lineTo(184, 187 + i * 56); ctx.stroke();
      });
      ctx.fillStyle = '#756c58'; ctx.font = '14px sans-serif'; ctx.fillText('Illustrative demo', 43, 339);
    });
    screen(handset, 0.391, 0.705, 0, -0.015, 0.035, display.texture);
    box(handset, 0.1, 0.012, 0.007, 0, 0.38, 0.036, materials.metal);
    const dots = [];
    for (let i = 0; i < 3; i += 1) {
      const dot = cylinder(parent, 0.065, 0.018, -0.57 + i * 0.18, 0.04, 0.28, [materials.green, materials.orange, materials.teal][i]);
      dots.push(dot);
    }
    tag(parent, 'Demo', 0.57, 0.11, 0.34, 0.53);
  }

  function terminal(parent) {
    const display = canvas(512, 320, (ctx, w, h) => {
      ctx.fillStyle = '#293b3c'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#c7d4b1'; ctx.font = '20px monospace'; ctx.fillText('storm / portfolio', 27, 39);
      ctx.fillStyle = '#455857'; ctx.fillRect(0, 59, w, 2);
      const rows = [
        ['#a2bc91', 'from flask import Flask'], ['', ''],
        ['#d1b687', 'app = Flask(__name__)'], ['', ''],
        ['#90b2b3', "@app.route('/')"], ['#c7d4b1', 'def home():'],
        ['#d1b687', "    return render_template('home.html')"],
      ];
      rows.forEach(([color, text], index) => {
        ctx.fillStyle = '#82928b'; ctx.font = '16px monospace'; ctx.fillText(String(index + 1), 18, 92 + index * 27);
        ctx.fillStyle = color || '#c7d4b1'; ctx.font = '17px monospace'; ctx.fillText(text, 48, 92 + index * 27);
      });
      ctx.fillStyle = '#a9b78b'; ctx.fillRect(44, 285, 9, 19);
    });
    monitor(parent, 1.3, 0.81, 0.1, 0.68, -0.18, display.texture);
    keyboard(parent, 0.03, 0.045, 0.33, 1.0);
    mesh(new THREE.SphereGeometry(0.085, 8, 6), materials.dark, parent, 0.76, 0.066, 0.3).scale.set(0.75, 0.5, 1.1);
  }

  function cards(parent, project) {
    const palette = [materials.teal, materials.green, materials.orange];
    for (let i = 0; i < 3; i += 1) {
      const card = new THREE.Group();
      card.position.set(-0.43 + i * 0.42, 0.08 + i * 0.025, 0.07 - i * 0.06);
      card.rotation.y = (i - 1) * 0.19;
      card.rotation.x = -Math.PI / 2;
      parent.add(card);
      box(card, 0.53, 0.72, 0.025, 0, 0, 0, palette[i]);
      const texture = canvas(256, 352, (ctx, w, h) => {
        ctx.fillStyle = '#e6dbc1'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = ['#54776f', '#737d52', '#bb824b'][i]; ctx.fillRect(20, 22, w - 40, 111);
        ctx.fillStyle = '#4b5146'; ctx.font = 'bold 25px sans-serif';
        ctx.fillText((project.technologies?.[i] || 'Project').slice(0, 14), 22, 178);
        for (let j = 0; j < 4; j += 1) ctx.fillRect(22, 210 + j * 24, j === 3 ? 121 : 205, 5);
      });
      screen(card, 0.5, 0.69, 0, 0, 0.015, texture.texture);
    }
    const pencil = cylinder(parent, 0.018, 0.65, 0.62, 0.05, 0.25, materials.orange, 6);
    pencil.rotation.z = Math.PI / 2;
    pencil.rotation.y = -0.4;
  }

  const builders = { clock, rov, camera, arcade: game, phone, cards, terminal };
  layoutProjects(projects).forEach(entry => {
    let station = sharedStations.get(entry.stationKey);
    if (!station) {
      station = new THREE.Group();
      station.name = `Project station ${entry.stationKey}`;
      station.position.set(entry.x, 0, entry.z);
      station.rotation.y = entry.rotation;
      root.add(station);
      table(station, entry.zone, entry.compact ? 'Project library' : entry.project.title);
      sharedStations.set(entry.stationKey, station);
      const across = Math.abs(Math.cos(entry.rotation));
      const along = Math.abs(Math.sin(entry.rotation));
      const halfX = 1.04 * across + 0.56 * along;
      const halfZ = 0.56 * across + 1.04 * along;
      colliders.push({
        minX: entry.x - halfX, maxX: entry.x + halfX,
        minZ: entry.z - halfZ, maxZ: entry.z + halfZ,
        minY: 0, maxY: 1.05, stationKey: entry.stationKey,
      });
    }

    const object = new THREE.Group();
    object.name = entry.project.title;
    object.position.y = 0.985;
    station.add(object);
    if (entry.compact) {
      // Books have individual bounds and labels; the project index supplies a
      // comfortable full-size reading surface even for a very large catalog.
      const columns = Math.max(1, Math.ceil(Math.sqrt(entry.displayCount * 2)));
      const rows = Math.ceil(entry.displayCount / columns);
      const width = 1.82 / columns;
      const depth = 0.85 / rows;
      object.position.x = -0.91 + width * (entry.displayIndex % columns + 0.5);
      object.position.z = -0.425 + depth * (Math.floor(entry.displayIndex / columns) + 0.5);
      box(object, width * 0.9, 0.08, depth * 0.9, 0, 0.045, 0, materials.green);
      const cover = screen(object, width * 0.87, depth * 0.87, 0, 0.088, 0, lettering(entry.project.title));
      cover.rotation.x = -Math.PI / 2;
    } else {
      (builders[entry.project.world?.kind] || terminal)(object, entry.project);
    }
    station.updateMatrixWorld(true);
    const position = object.getWorldPosition(new THREE.Vector3());
    position.y = 0;
    const labelAnchor = object.localToWorld(new THREE.Vector3(0, 1.13, 0));
    const approach = station.localToWorld(new THREE.Vector3(0, 0, 1.6));
    items.push({
      id: entry.id, project: entry.project, object, position,
      interactionRadius: 2.35, labelAnchor, approach,
      stationKey: entry.stationKey,
    });
  });

  return {
    items,
    colliders,
    update(time, delta) {
      animations.forEach(animate => animate(time, delta));
    },
    dispose() {
      resources.forEach(resource => resource.dispose());
      scene.remove(root);
    },
  };
}
