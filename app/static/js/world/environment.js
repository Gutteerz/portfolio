import * as THREE from 'three';
import {createMaterials, makeSignTexture, makeSketchTexture} from './materials.js';

export const WORLD_BOUNDS = {minX: -18, maxX: 18, minZ: -13, maxZ: 13};
const TAU = Math.PI * 2;

function randomGenerator(seed = 67) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

function roundedBoxGeometry() {
  const shape = new THREE.Shape();
  const r = .055, a = -.445, b = .445;
  shape.moveTo(a + r, a); shape.lineTo(b - r, a); shape.quadraticCurveTo(b, a, b, a + r);
  shape.lineTo(b, b - r); shape.quadraticCurveTo(b, b, b - r, b);
  shape.lineTo(a + r, b); shape.quadraticCurveTo(a, b, a, b - r);
  shape.lineTo(a, a + r); shape.quadraticCurveTo(a, a, a + r, a);
  const geometry = new THREE.ExtrudeGeometry(shape, {depth: .89, bevelEnabled: true, bevelSize: .055, bevelThickness: .055, bevelSegments: 1, steps: 1, curveSegments: 2});
  geometry.translate(0, 0, -.445);
  return geometry;
}

/** A handcrafted miniature, with static details instanced by geometry/material. */
export function createEnvironment(scene, {quality = 'high'} = {}) {
  const root = new THREE.Group(); root.name = 'handmade-workshop-world'; scene.add(root);
  const materials = createMaterials();
  const random = randomGenerator();
  const batches = new Map(), geometries = new Map(), textures = [], extraMaterials = [];
  const colliders = [], surfaces = [], animations = [], rooms = [], playItems = [];
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3(), euler = new THREE.Euler();
  const rounded = roundedBoxGeometry(); geometries.set('rounded', rounded);
  const plain = new THREE.BoxGeometry(1, 1, 1); geometries.set('box', plain);

  function geometry(key, create) { if (!geometries.has(key)) geometries.set(key, create()); return geometries.get(key); }
  function instance(geo, mat, x, y, z, sx = 1, sy = 1, sz = 1, rotation = [0, 0, 0], cast = true) {
    position.set(x, y, z); scale.set(sx, sy, sz); euler.set(...rotation); quaternion.setFromEuler(euler);
    matrix.compose(position, quaternion, scale);
    const key = `${geo.uuid}:${mat.uuid}:${cast}`;
    if (!batches.has(key)) batches.set(key, {geo, mat, cast, matrices: []});
    batches.get(key).matrices.push(matrix.clone());
  }
  function box(x, y, z, w, h, d, mat = materials.wood, rotation = [0, 0, 0], cast = true, soft = true) {
    instance(soft ? rounded : plain, mat, x, y, z, w, h, d, rotation, cast);
  }
  function groupBox(group, x, y, z, w, h, d, mat = materials.wood) {
    const mesh = new THREE.Mesh(rounded, mat); mesh.position.set(x,y,z); mesh.scale.set(w,h,d);
    mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
  }
  function cylinder(x, y, z, r, h, mat, segments = 12, rotation = [0, 0, 0], topRatio = 1, cast = true) {
    const key = `cylinder-${segments}-${topRatio}`;
    instance(geometry(key, () => new THREE.CylinderGeometry(topRatio, 1, 1, segments)), mat, x, y, z, r, h, r, rotation, cast);
  }
  function ball(x, y, z, radius, mat, squish = [1, 1, 1], detail = 0, cast = true) {
    instance(geometry(`ico-${detail}`, () => new THREE.IcosahedronGeometry(1, detail)), mat, x, y, z, radius * squish[0], radius * squish[1], radius * squish[2], [0, random() * TAU, 0], cast);
  }
  function beam(a, b, radius, mat, segments = 6, cast = true) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = end.clone().sub(start);
    position.copy(start).add(end).multiplyScalar(.5); scale.set(radius, direction.length(), radius);
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()); matrix.compose(position, quaternion, scale);
    const geo = geometry(`cylinder-${segments}-1`, () => new THREE.CylinderGeometry(1, 1, 1, segments));
    const key = `${geo.uuid}:${mat.uuid}:${cast}`;
    if (!batches.has(key)) batches.set(key, {geo, mat, cast, matrices: []});
    batches.get(key).matrices.push(matrix.clone());
  }
  function bolt(x, y, z, size = .065, rotation = [Math.PI / 2, 0, 0]) {
    cylinder(x, y, z, size, .035, materials.darkMetal, 8, rotation, 1, false);
  }
  function collider(minX, maxX, minZ, maxZ, minY = 0, maxY = 4) {
    colliders.push({minX, maxX, minZ, maxZ, minY, maxY});
  }
  function textureMaterial(texture, options = {}) {
    textures.push(texture);
    const mat = new THREE.MeshStandardMaterial({map: texture, roughness: 1, ...options});
    extraMaterials.push(mat); return mat;
  }
  function flatPanel(x, y, z, w, h, mat, rotation = [0, 0, 0]) {
    instance(geometry('plane', () => new THREE.PlaneGeometry(1, 1)), mat, x, y, z, w, h, 1, rotation, false);
  }
  function sign(text, x, y, z, w, h, rotation = [0, 0, 0]) {
    box(x, y, z, w, h, .1, materials.woodLight, rotation);
    flatPanel(x, y, z + .057, w * .97, h * .94, textureMaterial(makeSignTexture(text)), rotation);
    bolt(x - w * .4, y + h * .32, z + .08, .035);
    bolt(x + w * .4, y + h * .32, z + .08, .035);
  }
  const sketchMaterials = ['trees', 'plan', 'landscape'].map(kind => textureMaterial(makeSketchTexture(kind)));
  function sketch(x, y, z, w = .68, kind = 0, rotation = [0, 0, 0]) {
    flatPanel(x, y, z, w, w * 1.25, sketchMaterials[kind % 3], rotation);
    if (!rotation[0]) box(x, y + w * .6, z + .015, .12, .13, .016, materials.cream, [0, 0, -.07], false);
  }

  function plant(x, y, z, size = 1, pot = true) {
    if (pot) {
      cylinder(x, y + size * .19, z, size * .22, size * .38, materials.woodDark, 7, [0, 0, 0], 1.17);
      cylinder(x, y + size * .39, z, size * .27, size * .07, materials.woodLight, 7);
      cylinder(x, y + size * .405, z, size * .21, size * .035, materials.woodDark, 7);
    }
    const base = y + (pot ? .37 : 0) * size;
    for (let i = 0; i < 5; i++) {
      const angle = i * TAU / 5 + .3;
      const leaf = geometry('leaf', () => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0, -.18,.48,.1, 0,1,0, 0,0,0, 0,1,0, .18,.48,.1, 0,0,0, .18,.48,.1, -.18,.48,.1, 0,1,0, -.18,.48,.1, .18,.48,.1], 3));
        g.computeVertexNormals(); return g;
      });
      instance(leaf, i % 2 ? materials.leaf : materials.leafLight, x, base, z, size, size * (.63 + i * .06), size, [Math.sin(angle) * .65, angle, Math.cos(angle) * .65]);
    }
  }
  function tree(x, z, size = 1, y = 0, palette = materials.leafDark, solid = true) {
    cylinder(x, y + .64 * size, z, .11 * size, 1.28 * size, materials.woodDark, 7);
    for (let i = 0; i < 3; i++) cylinder(x, y + (1.05 + i * .48) * size, z, (1.0 - i * .22) * size, 1.42 * size, i === 2 ? materials.leaf : palette, 5, [0, i * .26, 0], 0);
    if (solid) collider(x - .3 * size, x + .3 * size, z - .3 * size, z + .3 * size, y, y + 2.6 * size);
  }
  function rock(x, z, size = 1, y = 0) {
    ball(x, y + size * .42, z, size, materials.stone, [.86, .7, .77]);
    collider(x - size * .56, x + size * .56, z - size * .5, z + size * .5, y, y + size * 1.1);
  }
  function grassCluster(x, z, size = .6, y = 0) {
    for (let i = 0; i < 3; i++) ball(x + (random() - .5) * size, y + size * .32, z + (random() - .5) * size, size * .48, i % 2 ? materials.leaf : materials.leafLight, [.7, 1.2, .7]);
  }
  function crate(x, y, z, size = .85, rotation = 0) {
    box(x, y + size / 2, z, size, size, size, materials.woodDark, [0, rotation, 0]);
    for (let i = 0; i < 3; i++) box(x, y + size * (.19 + i * .3), z + size * .51, size * .93, size * .26, .065, materials.wood, [0, rotation, 0]);
    box(x, y + size * .5, z + size * .56, size * .11, size * .94, .07, materials.woodLight, [0, rotation, -.7]);
    collider(x-size*.52,x+size*.52,z-size*.52,z+size*.58,y,y+size);
  }

  // The island has a shaped plywood edge and a single uninterrupted top surface.
  const outline = [[-17.7,-11.7],[-15.8,-13],[-6,-12.8],[1.2,-13],[10.7,-12.9],[17.5,-11.8],[18,-8],[17.6,1],[18,8.8],[16.4,12],[8.2,12.8],[-1,12.6],[-10.8,13],[-17.2,11.6],[-18,7],[-17.7,-2]];
  const platformShape = new THREE.Shape();
  outline.forEach(([x,z], i) => i ? platformShape.lineTo(x,-z) : platformShape.moveTo(x,-z)); platformShape.closePath();
  const platformGeometry = new THREE.ExtrudeGeometry(platformShape, {depth: .86, bevelEnabled: true, bevelSize: .13, bevelThickness: .07, bevelSegments: 1, curveSegments: 1, steps: 1});
  platformGeometry.rotateX(-Math.PI / 2); platformGeometry.translate(0, -.94, 0); geometries.set('platform', platformGeometry);
  const platform = new THREE.Mesh(platformGeometry, materials.wood); platform.receiveShadow = true; platform.castShadow = true; root.add(platform);
  const topGeometry = new THREE.ShapeGeometry(platformShape); topGeometry.rotateX(-Math.PI / 2); geometries.set('platform-top', topGeometry);
  const top = new THREE.Mesh(topGeometry, materials.plywood); top.position.y = .005; top.receiveShadow = true; root.add(top);
  const uv = topGeometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 9, uv.getY(i) / 9);
  materials.plywood.map.wrapS = materials.plywood.map.wrapT = THREE.RepeatWrapping;
  // Clip the small chamfered corners as well as the rectangular world bounds.
  collider(-18,-16.9,11.65,13.1,0,8);collider(16.5,18.1,11.7,13.1,0,8);
  collider(-18,-16.6,-13.1,-11.8,0,8);collider(17.1,18.1,-13.1,-11.4,0,8);
  // Edge laminations, corner cleats and inset screw heads give the board its scale.
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), angle = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    box((a[0] + b[0]) / 2, -.57, (a[1] + b[1]) / 2, len, .055, .07, materials.woodDark, [0, angle, 0], false);
    bolt(a[0] * .98, .026, a[1] * .98, .095, [0, 0, 0]);
  }
  [-12, -3, 6, 14].forEach((x, i) => {
    box(x, -.45, 12.62, .68, .99, .18, i % 2 ? materials.paintGreen : materials.woodLight);
    box(x, .015, 12.35, .68, .04, .75, i % 2 ? materials.paintGreen : materials.woodLight, [0, 0, 0], false);
    bolt(x, .054, 12.25, .075, [0,0,0]);
  });
  // Subtle drawn plans and lightly inset plank joins remain part of the floor.
  [[-7,9,1],[-5,-1,0],[5,7,0],[-11,0,1],[12,3,1],[1,10,0]].forEach(([x,z,kind], i) => sketch(x,.017,z,1.3 + i * .1,kind,[-Math.PI/2,0,.08 * (i-3)]));
  for (let i = 0; i < 22; i++) {
    const x = -16 + random() * 32, z = -11 + random() * 22;
    bolt(x,.024,z,.042 + random() * .02,[0,0,0]);
  }

  // Central, stepped garden: the broad ramp is the intended route to its summit.
  cylinder(0,.12,-.5,5.15,.24,materials.wood,32);
  cylinder(0,.4,-.5,4.72,.54,materials.leaf,24);
  cylinder(0,.72,-.5,4.5,.2,materials.woodLight,32);
  cylinder(0,1.02,-.5,4.23,.5,materials.leafLight,24);
  cylinder(0,1.3,-.5,4.07,.16,materials.wood,32);
  cylinder(0,1.51,-.5,4,.2,materials.woodLight,32);
  // Match every solid tier so visitors step onto the low timber rim, rather
  // than passing through the grass. The taller risers still require the ramp.
  for(const [radius,height] of [[5.15,.24],[4.72,.67],[4.5,.82],[4.23,1.27],[4.07,1.38],[4,1.6]]) {
    surfaces.push({x:0,z:-.5,radius,height});
  }
  for (let i=0;i<29;i++) {
    const angle=i*TAU/29;
    if ((angle>.35 && angle<2.8) || (angle>5.25 && angle<5.85)) continue;
    const radius=4.55+random()*.35;
    grassCluster(Math.cos(angle)*radius, -.5+Math.sin(angle)*radius, .48+random()*.45, .27);
  }
  [[-3.6,2.5,1.05],[3.6,2.2,.9],[-4.5,-1,.65],[4.5,.4,.7]].forEach(([x,z,s])=>rock(x,z,s));
  // Accessible ramps are slatted on top and underpinned with triangular supports.
  function ramp(minX,maxX,minZ,maxZ,axis,from,to,mat=materials.woodLight,slats=10) {
    surfaces.push({minX,maxX,minZ,maxZ,axis,from,to});
    const length=axis==='z'?maxZ-minZ:maxX-minX, rise=to-from;
    const angle=Math.atan2(rise,length), slopeLength=Math.hypot(length,rise);
    const cx=(minX+maxX)/2,cz=(minZ+maxZ)/2,cy=(from+to)/2-.11;
    box(cx,cy,cz,axis==='z'?maxX-minX:slopeLength,.18,axis==='z'?slopeLength:maxZ-minZ,mat,axis==='z'?[-angle,0,0]:[0,0,angle]);
    for(let i=0;i<slats;i++) {
      const t=(i+.5)/slats,y=from+rise*t-.025;
      const x=axis==='x'?minX+length*t:cx,z=axis==='z'?minZ+length*t:cz;
      box(x,y,z,axis==='z'?maxX-minX-.03:slopeLength/slats-.035,.065,axis==='z'?slopeLength/slats-.035:maxZ-minZ-.03,i%3?mat:materials.wood,axis==='z'?[-angle,0,0]:[0,0,angle]);
      if(i%2===0) {
        if(axis==='z') {bolt(minX+.18,y+.045,z,.055,[0,0,0]);bolt(maxX-.18,y+.045,z,.055,[0,0,0]);}
        else {bolt(x,y+.045,minZ+.14,.043,[0,0,0]);bolt(x,y+.045,maxZ-.14,.043,[0,0,0]);}
      }
    }
    return {cx,cy,cz};
  }
  ramp(-1.95,1.95,2.7,8.8,'z',1.6,0,materials.woodLight,12);
  ramp(2.5,6.35,-3.9,-2.5,'x',1.6,3.64,materials.wood,11);
  // The bridge is held up by visible timber trestles and small edge strips.
  for(const x of [3.6,5.2]) {
    const y=1.6+(x-2.5)/3.85*2.04;
    for(const z of [-3.72,-2.68]) box(x,y/2,z,.16,y,.16,materials.woodDark);
    beam([x-.35,.3,-3.72],[x+.35,y-.2,-2.68],.07,materials.wood,6);
  }
  const railingPoints = [[-3.1,1.9],[-3.8,-.4],[-2.8,-2.7],[-.5,-3.9],[1.4,-3.6],[3.3,.5],[2.8,2.0]];
  railingPoints.forEach(([x,z])=>{box(x,1.99,z,.18,.76,.18,materials.wood);bolt(x,2.13,z+.1,.04);});
  for(let i=0;i<railingPoints.length-1;i++) {
    if(i===4) continue;
    const a=railingPoints[i],b=railingPoints[i+1];
    const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(a[0],2.12,a[1]),new THREE.Vector3((a[0]+b[0])/2,1.89,(a[1]+b[1])/2),new THREE.Vector3(b[0],2.12,b[1]));
    const geo=new THREE.TubeGeometry(curve,8,.035,5,false);geometries.set(`rope-${i}`,geo);
    const rope=new THREE.Mesh(geo,materials.red);root.add(rope);
  }
  // A tiny bench at the foot of the hill.
  box(3.3,.54,3.5,1.5,.16,.62,materials.wood);
  [[2.75,3.29],[3.85,3.29],[2.75,3.72],[3.85,3.72]].forEach(([x,z])=>box(x,.26,z,.16,.53,.16,materials.woodDark,[0,0,x<3.3?-.1:.1]));
  collider(2.5,4.1,3.1,3.95,0,.7);
  tree(-1.55,-1.7,.67,1.6,materials.leafDark);
  tree(1.2,-1.8,.43,1.6,materials.leaf);

  // A wind-powered desktop toy, deliberately kept on the back of the hill.
  box(-.35,2.8,-2.1,.16,2.4,.18,materials.wood);
  collider(-.45,-.25,-2.21,-1.99,1.6,4);
  cylinder(-.35,1.7,-2.1,.7,.17,materials.leafLight,12);
  const windmill=new THREE.Group();windmill.position.set(-.35,3.95,-1.98);root.add(windmill);
  for(let i=0;i<6;i++) {
    const blade=new THREE.Mesh(rounded,materials.woodLight);blade.scale.set(.23,1.12,.055);blade.rotation.z=i*TAU/6;blade.position.set(-Math.sin(i*TAU/6)*.65,Math.cos(i*TAU/6)*.65,0);blade.castShadow=true;windmill.add(blade);
  }
  const hub=new THREE.Mesh(geometry('hub',()=>new THREE.CylinderGeometry(.11,.11,.11,10)),materials.darkMetal);hub.rotation.x=Math.PI/2;hub.position.z=.06;windmill.add(hub);
  windmill.name='Wooden windmill';
  let windmillPush=0, windmillTurn=0;
  playItems.push({
    id:'toy:windmill', action:'play:windmill', label:'Spin the windmill', object:windmill,
    position:new THREE.Vector3(-.35,1.6,-2.1), approach:new THREE.Vector3(-.35,1.6,-.9), interactionRadius:1.45,
  });

  function roof(x,z,width,depth,y,green=true) {
    // Each sheet has a real folded cross-section, with alternating raised ribs.
    const ribs=Math.round(width/.36), ribWidth=width/ribs;
    const vertices=[],indices=[];
    for(let i=0;i<=ribs*2;i++) {
      const xx=-width/2+i*ribWidth/2,yy=i%2?.065:0;
      vertices.push(xx,yy,-depth/2,xx,yy,depth/2);
      if(i<ribs*2){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();geometries.set(`roof-${x}-${z}`,geo);
    const mat=green?materials.paintGreen:materials.woodLight;
    const roofGroup=new THREE.Group();roofGroup.name=`roof-${x}-${z}`;root.add(roofGroup);
    const roofMesh=new THREE.Mesh(geo,mat);roofMesh.position.set(x,y,z);roofMesh.castShadow=true;roofMesh.receiveShadow=true;roofGroup.add(roofMesh);
    groupBox(roofGroup,x,y-.09,z+depth/2,width+.12,.22,.2,materials.wood);
    groupBox(roofGroup,x,y-.09,z-depth/2,width+.12,.22,.2,materials.wood);
    groupBox(roofGroup,x-width/2,y-.1,z,.17,.25,depth,materials.wood);
    groupBox(roofGroup,x+width/2,y-.1,z,.17,.25,depth,materials.wood);
    for(let i=0;i<6;i++) bolt(x-width/2+.25+i*(width-.5)/5,y+.03,z+depth/2,.06,[0,0,0]);
    return roofGroup;
  }
  function posts(x,z,width,depth,height) {
    for(const xx of [x-width/2,x+width/2]) for(const zz of [z-depth/2,z+depth/2]) {
      box(xx,height/2,zz,.26,height,.3,materials.wood);
      box(xx,height-.23,zz+.17,.36,.45,.07,materials.woodLight);
      bolt(xx,height-.18,zz+.22,.055);bolt(xx,height-.37,zz+.22,.045);
      collider(xx-.18,xx+.18,zz-.19,zz+.19,0,height);
    }
  }
  function sidePlanks(x,z,depth,height,green=true) {
    const count=Math.ceil(depth/.55);
    for(let i=0;i<count;i++)box(x,height/2,z-depth/2+(i+.5)*depth/count,.16,height-.04,depth/count-.025,green?(i%3?materials.paintGreen:materials.paintGreenLight):materials.wood);
    box(x+.09,.5,z,.13,.15,depth,materials.woodDark);box(x+.09,height-.45,z,.13,.15,depth,materials.wood);
  }
  function rug(x,z,w=2.2,d=1) {
    box(x,.026,z,w,.03,d,materials.red,[0,0,0],false);
    for(let row=0;row<3;row++)for(let col=0;col<7;col++) {
      const mat=(col+row)%3===0?materials.blue:((col+row)%3===1?materials.woodDark:materials.cream);
      box(x-w/2+(col+.5)*w/7,.047,z-d/2+(row+.5)*d/3,w/7-.04,.013,d/3-.04,mat,[0,0,0],false);
    }
  }

  // WORKSHOP. All project tables are supplied separately by the exhibit module.
  posts(-10,-6,9,6,3.95);
  for(let i=0;i<8;i++)box(-10,.24+i*.48,-9,9,.46,.18,i%3?materials.wood:materials.woodLight);
  sidePlanks(-14.5,-6,6,3.8);sidePlanks(-5.5,-6.8,4.4,3.8);
  collider(-14.65,-14.35,-9,-3,0,3.95);collider(-14.5,-5.5,-9.15,-8.85,0,3.95);collider(-5.65,-5.35,-9,-4.6,0,3.95);
  const workshopRoof=roof(-10,-6,9.8,6.6,4.0,true);
  rooms.push({minX:-14.75,maxX:-5.25,minZ:-9.25,maxZ:-2.4,ceiling:3.9,roof:workshopRoof});
  // A sun-faded patch of replacement roof panels.
  groupBox(workshopRoof,-8.75,4.055,-6.05,2.3,.035,6.5,materials.woodLight);
  box(-10,3.72,-2.94,9,.26,.25,materials.wood);
  sign('Work',-10.4,3.03,-2.76,2.35,.75,[0,0,-.025]);
  beam([-11.1,3.79,-2.77],[-11.1,3.36,-2.77],.023,materials.darkMetal,5,false);
  beam([-9.65,3.79,-2.77],[-9.65,3.36,-2.77],.023,materials.darkMetal,5,false);
  // The open green door doubles as a pinboard.
  for(let i=0;i<4;i++)box(-15.45+i*.45,1.63,-2.88,.43,3.2,.15,i%2?materials.paintGreen:materials.paintGreenLight,[0,0,0]);
  box(-14.78,.33,-2.76,1.8,.18,.08,materials.wood);box(-14.78,2.94,-2.76,1.8,.18,.08,materials.wood);
  sketch(-15.12,2.08,-2.77,.62,0);sketch(-14.35,2.04,-2.77,.6,1);sketch(-14.83,.93,-2.77,.6,1);
  for(const y of [.55,2.55]){box(-13.94,y,-2.71,.19,.33,.08,materials.darkMetal);bolt(-13.94,y,-2.65,.042);}
  collider(-15.7,-13.75,-2.98,-2.7,0,3.25);
  // Useful clutter lives on the rear shelves, leaving a walking aisle in front.
  for(const y of [1.4,2.6]) {
    box(-10.2,y,-8.58,7.7,.13,.68,materials.woodLight);
    for(const x of [-13,-10.5,-8]) beam([x,y-.05,-8.82],[x,y-.4,-8.36],.045,materials.darkMetal);
    for(let i=0;i<10;i++) {
      const x=-13.55+i*.7;
      if(i%3===0) {box(x,y+.3,-8.58,.38,.5,.37,i%2?materials.blue:materials.cream);box(x,y+.58,-8.58,.4,.06,.39,materials.woodDark);}
      else if(i%3===1){cylinder(x,y+.26,-8.58,.15,.38,materials.blue,8);cylinder(x,y+.48,-8.58,.11,.08,materials.darkMetal,8);}
      else {for(let k=0;k<3;k++)box(x+k*.12,y+.25,-8.58,.1,.4+k*.06,.35,k%2?materials.red:materials.paintGreen);}
    }
  }
  box(-10,.67,-8.3,7.5,1.25,.65,materials.woodDark);
  for(let i=0;i<6;i++){box(-13.05+i*1.22,.68,-7.94,1.15,1.05,.08,materials.wood);box(-13.05+i*1.22,.82,-7.87,.33,.07,.08,materials.darkMetal);}
  collider(-13.8,-6.2,-8.85,-7.8,0,1.45);
  // Pegboard and a few recognisable hand tools.
  box(-6.95,2.32,-8.82,1.8,1.4,.07,materials.woodLight);
  for(let row=0;row<4;row++)for(let col=0;col<5;col++)bolt(-7.65+col*.33,1.85+row*.3,-8.75,.023);
  for(let i=0;i<3;i++) {
    box(-7.5+i*.52,2.2,-8.66,.085,.66,.08,i%2?materials.red:materials.woodDark,[0,0,.06-i*.04]);
    box(-7.5+i*.52,2.55,-8.66,i===1?.42:.17,.16,.12,materials.metal);
  }
  crate(-13.5,0,-6.5,.72);crate(-12.75,0,-6.5,.61);
  plant(-5.15,0,-3.4,1.15);plant(-6.4,1.43,-8.5,.75);
  rug(-10,-2.03,3,1.05);
  // Oversized pencil resting on the workshop roof.
  cylinder(-11.5,4.22,-7.1,.12,2.55,materials.cream,8,[0,0,Math.PI/2]);
  cylinder(-12.92,4.22,-7.1,.13,.32,materials.darkMetal,8,[0,0,Math.PI/2]);
  cylinder(-10.11,4.22,-7.1,.12,.3,materials.woodLight,8,[0,0,-Math.PI/2],0);

  // STUDY. A genuine hole in the facade reveals the room through a round window.
  posts(10,-6,7,6,3.45);
  sidePlanks(13.5,-6,6,3.4);sidePlanks(6.5,-6.6,4.8,3.4);
  for(let i=0;i<7;i++)box(10,.24+i*.48,-9,7,.46,.16,materials.wood);
  collider(13.4,13.65,-9,-3,0,3.55);collider(6.35,6.6,-9,-4.2,0,3.55);collider(6.5,13.5,-9.15,-8.85,0,3.55);
  box(6.76,1.65,-2.97,.5,3.3,.18,materials.paintGreen);
  box(8.15,3.05,-2.97,2.25,.65,.18,materials.woodLight);
  const facadeShape=new THREE.Shape();facadeShape.moveTo(9.26,0);facadeShape.lineTo(13.5,0);facadeShape.lineTo(13.5,3.37);facadeShape.lineTo(9.26,3.37);facadeShape.closePath();
  const windowHole=new THREE.Path();windowHole.absarc(11.25,1.68,1.22,0,TAU,true);facadeShape.holes.push(windowHole);
  const facadeGeometry=new THREE.ExtrudeGeometry(facadeShape,{depth:.16,bevelEnabled:false,curveSegments:24});geometries.set('study-facade',facadeGeometry);
  const facade=new THREE.Mesh(facadeGeometry,materials.woodLight);facade.position.z=-3.06;facade.castShadow=true;facade.receiveShadow=true;root.add(facade);
  const trimGeometry=new THREE.TorusGeometry(1.245,.085,5,40);geometries.set('window-trim',trimGeometry);
  instance(trimGeometry,materials.wood,11.25,1.68,-2.84);
  collider(6.45,7.05,-3.15,-2.8,0,3.45);collider(9.25,13.6,-3.15,-2.8,0,3.45);
  // Door is swung against the side, keeping its opening completely clear.
  box(6.8,1.23,-2.16,.14,2.45,1.65,materials.paintGreen,[0,.13,0]);
  collider(6.65,6.97,-2.98,-1.33,0,2.45);
  box(6.91,1.28,-1.61,.08,.1,.15,materials.metal);
  sketch(9.65,2.6,-2.84,.47,2);sketch(9.65,1.8,-2.84,.43,0);
  const studyRoof=new THREE.Group();studyRoof.name='study-roof';root.add(studyRoof);
  rooms.push({minX:6.1,maxX:13.9,minZ:-9.5,maxZ:-2.2,ceiling:3.3,roof:studyRoof});
  groupBox(studyRoof,10,3.48,-6,7.6,.24,6.7,materials.wood);
  for(let i=0;i<15;i++)groupBox(studyRoof,6.3+(i+.5)*7.4/15,3.61,-6,7.4/15-.025,.045,6.7,materials.woodLight);
  groupBox(studyRoof,10,3.47,-2.61,7.8,.21,.18,materials.paintGreen);
  surfaces.push({minX:6.15,maxX:13.85,minZ:-9.5,maxZ:-2.5,height:3.64});
  ramp(14,17,-8.5,3,'z',3.6,0,materials.woodLight,16);
  box(13.95,3.53,-7.75,1.1,.2,1.5,materials.woodLight);
  surfaces.push({minX:13.5,maxX:14.5,minZ:-8.5,maxZ:-7,height:3.6});
  for(let i=0;i<3;i++)box(15.5,(2.9-i*.7)/2,-6+i*2.3,.2,2.9-i*.7,2.7,materials.woodDark);
  for(const x of [7.1,12.9]) {box(x,3.91,-9.15,.13,.58,.13,materials.wood);box(x,3.91,-4.6,.13,.58,.13,materials.wood);}
  beam([7.1,4.08,-9.15],[12.9,4.08,-9.15],.045,materials.darkMetal);
  plant(12.5,3.65,-7.6,1.65);crate(12.5,3.65,-7.6,.64);
  crate(13.95,0,-2.4,.85);plant(13.12,0,-2.3,.8);plant(7.25,0,-2.2,.6);
  // Desk lamp and stacked books visible through the circular opening.
  cylinder(11.18,1.13,-4.5,.23,.07,materials.blue,12);cylinder(11.18,1.48,-4.5,.045,.66,materials.darkMetal,8);
  cylinder(11.18,1.94,-4.5,.36,.47,materials.cream,9,[0,0,0],.55);
  ball(11.18,1.76,-4.5,.12,materials.screen,[1,.8,1],1,false);
  box(11.25,1.03,-4.6,2.4,.12,.72,materials.wood);box(10.35,.5,-4.6,.12,1,.5,materials.woodDark);box(12.15,.5,-4.6,.12,1,.5,materials.woodDark);
  for(let i=0;i<4;i++)box(12,1.17+i*.12,-4.6,.48,.1,.4,i%2?materials.red:materials.paintGreen,[0,.03*i,0]);
  const lamp=new THREE.PointLight('#ffd69a',1.15,3.1,2);lamp.position.set(11.18,1.75,-4.5);root.add(lamp);
  collider(10,12.6,-5,-4.2,0,1.25);
  // Tiny wooden bird on the accessible roof.
  const bird=new THREE.Group();bird.position.set(9.7,3.68,-4.45);root.add(bird);
  const birdPart=(geo,mat,pos,scl,rot=0)=>{const mesh=new THREE.Mesh(geo,mat);mesh.position.set(...pos);mesh.scale.set(...scl);mesh.rotation.z=rot;mesh.castShadow=true;bird.add(mesh);return mesh;};
  birdPart(geometry('ico-1',()=>new THREE.IcosahedronGeometry(1,1)),materials.blue,[0,.48,0],[.4,.4,.23]);
  birdPart(geometry('ico-0',()=>new THREE.IcosahedronGeometry(1,0)),materials.cream,[-.25,.76,.01],[.25,.29,.22]);
  birdPart(geometry('bird-beak',()=>new THREE.ConeGeometry(.105,.25,4)),materials.woodLight,[-.51,.76,.02],[1,1,1],Math.PI/2);
  birdPart(geometry('ico-0',()=>new THREE.IcosahedronGeometry(1,0)),materials.darkMetal,[-.32,.83,.208],[.035,.035,.025]);
  birdPart(plain,materials.darkMetal,[-.1,.14,0],[.045,.3,.045]);birdPart(plain,materials.darkMetal,[.13,.14,0],[.045,.3,.045]);
  birdPart(plain,materials.darkMetal,[-.13,.02,.05],[.14,.035,.16]);birdPart(plain,materials.darkMetal,[.1,.02,.05],[.14,.035,.16]);
  birdPart(geometry('bird-tail',()=>new THREE.ConeGeometry(.17,.47,4)),materials.blue,[.4,.48,0],[1,1,1],-.9);
  animations.push(time=>{bird.rotation.y=Math.sin(time*.35)*.11;});

  // A folded paper glider rests on the roof lip, away from the bridge and notebook.
  // It is a toy visitors can launch; its route never changes the walking surface.
  const gliderHome=new THREE.Vector3(11.7,3.87,-3.4);
  const glider=new THREE.Group();glider.name='Paper glider';glider.position.copy(gliderHome);root.add(glider);
  const gliderGeometry=new THREE.BufferGeometry();
  gliderGeometry.setAttribute('position',new THREE.Float32BufferAttribute([
    0,0,-.7, -.58,.1,.4, -.08,-.08,.32,
    0,0,-.7, -.08,-.08,.32, 0,-.2,.42,
    0,0,-.7, 0,-.2,.42, .08,-.08,.32,
    0,0,-.7, .08,-.08,.32, .58,.1,.4,
  ],3));
  gliderGeometry.computeVertexNormals();geometries.set('paper-glider',gliderGeometry);
  const paperMaterial=materials.paper.clone();paperMaterial.side=THREE.DoubleSide;extraMaterials.push(paperMaterial);
  const foldedPaper=new THREE.Mesh(gliderGeometry,paperMaterial);foldedPaper.castShadow=true;glider.add(foldedPaper);
  const foldGeometry=new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0,0,-.7),new THREE.Vector3(-.08,-.08,.32),
    new THREE.Vector3(0,0,-.7),new THREE.Vector3(.08,-.08,.32),
  ]);
  geometries.set('glider-folds',foldGeometry);
  const foldMaterial=new THREE.LineBasicMaterial({color:'#ad9d80'});extraMaterials.push(foldMaterial);
  glider.add(new THREE.LineSegments(foldGeometry,foldMaterial));
  const gliderRoute=new THREE.CatmullRomCurve3([
    gliderHome.clone(),new THREE.Vector3(11.7,4.8,-5.4),new THREE.Vector3(10,5.4,-5.1),
    new THREE.Vector3(7.1,5.6,-2.1),new THREE.Vector3(7.5,4.9,.9),
    new THREE.Vector3(11.2,4.4,.2),new THREE.Vector3(11.7,4.2,-1.7),gliderHome.clone(),
  ]);
  const flightDirection=new THREE.Vector3();
  let gliderFlight=null;
  playItems.push({
    id:'toy:glider', action:'play:glider', label:'Launch the paper glider', object:glider,
    position:new THREE.Vector3(11.7,3.64,-3.4), approach:new THREE.Vector3(11.65,3.64,-4.45), interactionRadius:1.2,
  });
  function landGlider() {
    gliderFlight=null;glider.position.copy(gliderHome);glider.rotation.set(0,0,0);
  }

  // GAMES SHED, kept open toward the main square.
  posts(10.3,7,6.6,4,3.05);
  for(let i=0;i<6;i++)box(10.3,.25+i*.46,5,6.6,.44,.16,i%2?materials.wood:materials.paintGreen);
  sidePlanks(13.6,7,4,2.95);sidePlanks(7,6,2,2.95);
  collider(6.85,7.15,5,7,0,3.1);collider(13.45,13.75,5,9,0,3.1);collider(7,13.6,4.85,5.15,0,3.1);
  const gamesRoof=roof(10.3,7,7.15,4.5,3.12,true);
  rooms.push({minX:6.65,maxX:13.95,minZ:4.65,maxZ:9.5,ceiling:3,roof:gamesRoof});
  sign('Play',11.95,2.52,9.1,1.5,.51);
  sketch(13.6,1.6,9.18,.68,0);plant(7.25,0,8.9,.75);plant(13.8,0,9.45,.7);
  rug(10.3,9.7,2.6,.92);

  // Marble track: wood rails bent around a small landscaped centre.
  const marbleCenter={x:-11,z:5.7},marbleRadius=2.45;
  cylinder(-11,.08,5.7,3.45,.16,materials.woodLight,32);
  cylinder(-11,.17,5.7,1.9,.19,materials.leafLight,20);
  function arcWall(radius,start,end,height) {
    const shape=new THREE.Shape();shape.absarc(0,0,radius+.11,start,end,false);shape.absarc(0,0,radius-.11,end,start,true);shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:1,curveSegments:36,steps:1});geo.rotateX(-Math.PI/2);geometries.set(`track-${radius}-${start}`,geo);
    const wall=new THREE.Mesh(geo,materials.wood);wall.position.set(-11,.18,5.7);wall.castShadow=true;wall.receiveShadow=true;root.add(wall);
  }
  arcWall(3.25,.14,TAU-.14,.35);arcWall(1.98,.2,TAU-.2,.28);
  tree(-11.5,5.3,.8,.24,materials.leafDark,false);tree(-10.3,5.9,.45,.24,materials.leaf,false);
  rock(-11.5,6.4,.65,.22);grassCluster(-10.3,4.8,.85,.22);
  box(-13.45,.55,4.15,1.3,.3,.35,materials.woodLight,[0,-.5,0]);
  box(-13.8,.4,4.35,.27,.8,.45,materials.wood);box(-13,.4,3.97,.27,.8,.45,materials.wood);
  collider(-13.1,-8.9,3.6,7.8,0,2.4);
  const marble=new THREE.Mesh(geometry('marble',()=>new THREE.IcosahedronGeometry(.36,1)),materials.glass);marble.position.set(-11+marbleRadius,.55,5.7);marble.castShadow=true;root.add(marble);
  const stripe=new THREE.Mesh(geometry('marble-stripe',()=>new THREE.TorusGeometry(.345,.028,5,20)),materials.blue);stripe.rotation.set(.4,.3,.7);marble.add(stripe);

  // Faceted planting, each cluster deliberately placed outside the main routes.
  [[-16,-7,1.2],[-15.6,7.4,1.15],[-6,-10.6,.85],[3.4,-10.2,1.1],[15,-10.8,.9],[-16.2,-10.9,.7],[-6.8,7.2,.6],[4.8,10.2,.6]].forEach(([x,z,s])=>tree(x,z,s));
  [[-14.2,8.5,.9],[-6.2,-4.2,.8],[5.8,-8.7,.7],[14.8,4.3,.6],[-15.7,-4.1,.65]].forEach(([x,z,s])=>rock(x,z,s));
  [[-15,-7],[-16.5,6.5],[-6,-10],[3.1,-9.7],[14.5,-10.2],[-6,7.5],[5.1,9.7],[-14.2,8.7],[-5.8,-4.7],[6,-8.5],[14.4,4.3],[-14.7,-.7]].forEach(([x,z])=>{grassCluster(x,z,.75);grassCluster(x+.45,z+.35,.45);});

  // The larger room establishes that the entire landscape sits on a workbench.
  // All backdrop forms are real geometry: window, mountains, shelving and tools.
  box(0,-1.55,0,68,1.1,54,materials.floor,[0,0,0],false);
  for(let i=-3;i<=3;i++)box(i*9,-.982,0,.035,.012,50,materials.woodDark,[0,0,0],false,false);
  box(0,8,-24.5,66,20,.5,materials.wall,[0,0,0],false);
  box(-31,7.5,-4,1,21,42,materials.wall,[0,0,0],false);
  const skyMaterial=new THREE.MeshBasicMaterial({color:'#a6ced3'});extraMaterials.push(skyMaterial);
  box(0,10.4,-23.98,20,16,.15,skyMaterial,[0,0,0],false,false);
  // Layered silhouettes behind the pane retain the paper-craft look.
  const mountainMaterial=new THREE.MeshBasicMaterial({color:'#8aa9a4'}),farTreeMaterial=new THREE.MeshBasicMaterial({color:'#6b8c7c'});extraMaterials.push(mountainMaterial,farTreeMaterial);
  for(let i=0;i<8;i++)cylinder(-9.2+i*2.7,6.4,-23.73,2.7,7+(i%3),mountainMaterial,3,[0,Math.PI/2,0],0,false);
  for(let i=0;i<13;i++)cylinder(-9.5+i*1.6,4.6+(i%2)*.4,-23.4,1.3,4.6+(i%3)*.8,farTreeMaterial,3,[0,Math.PI/2,0],0,false);
  for(const x of [-10.5,-3.55,3.55,10.5])box(x,10.3,-22.95,.42,17,.6,materials.wood,[0,0,0],false);
  for(const y of [2.2,10.5,18.4])box(0,y,-22.95,21.5,.42,.6,materials.wood,[0,0,0],false);
  box(0,2.07,-22.3,23,.4,1.6,materials.woodLight,[0,0,0],false);
  function shelf(x) {
    for(const xx of [x-5.5,x+5.5])box(xx,7,-23,.45,17.5,1.5,materials.wood,[0,0,0],false);
    for(const y of [1.7,6.3,10.8,15.4]) {
      box(x,y,-22,11.7,.3,3.8,materials.wood,[0,0,0],false);
      for(let i=0;i<4;i++) {
        const xx=x-4.2+i*2.6, h=1+random()*1.2;
        box(xx,y+h/2+.2,-22,1.8,h,2.1,i%3===0?materials.red:i%3===1?materials.woodDark:materials.stone,[0,0,0],false);
        box(xx,y+h*.65,-20.92,.6,.17,.03,materials.darkMetal,[0,0,0],false);
        if(i===2)box(xx,y+h+.29,-22,2,.14,2.3,materials.cream,[0,0,0],false);
      }
    }
  }
  shelf(-18.7);shelf(19.1);
  // Pencil cups, a red tool tray and giant ruler outside the traversable board.
  cylinder(-21,1.2,6.4,1.2,4.2,materials.metal,12,[0,0,0],1,false);
  cylinder(-21,3.31,6.4,1.24,.13,materials.darkMetal,12,[0,0,0],1,false);
  for(let i=0;i<7;i++) {
    const x=-21+(random()-.5)*1.5,z=6.4+(random()-.5)*1.5,angle=(random()-.5)*.2;
    cylinder(x,4.3,z,.16,4.3,i%3===0?materials.red:i%3===1?materials.woodLight:materials.darkMetal,6,[angle,0,angle],1,false);
    cylinder(x+Math.sin(angle)*2.2,6.55,z,.16,.6,materials.woodLight,6,[angle,0,angle],0,false);
  }
  box(21,.1,8.5,5,.22,3.5,materials.red,[0,0,0],false);
  for(const x of [18.5,23.5])box(x,.85,8.5,.18,1.7,3.5,materials.red,[0,0,0],false);
  for(const z of [6.75,10.25])box(21,.85,z,5,1.7,.18,materials.red,[0,0,0],false);
  cylinder(20.5,1.8,8.5,.18,3.7,materials.darkMetal,8,[0,0,Math.PI/2],1,false);
  box(22.3,1.8,8.5,1.2,.7,.8,materials.metal,[0,0,.12],false);
  box(-4,-.9,17.4,19,.16,1.5,materials.woodLight,[0,.08,0],false);
  for(let i=0;i<42;i++)box(-13+i*.43,-.806,16.95,.025,.015,i%5===0?.55:.3,materials.woodDark,[0,.08,0],false,false);

  // One draw call per shared geometry/material, rather than one per nail or leaf.
  for(const batch of batches.values()) {
    const mesh=new THREE.InstancedMesh(batch.geo,batch.mat,batch.matrices.length);
    batch.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));
    mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=batch.cast;mesh.receiveShadow=true;
    mesh.computeBoundingSphere();root.add(mesh);
  }
  return {
    root, bounds: {...WORLD_BOUNDS}, colliders, surfaces, rooms, playItems,
    stations: [
      ...[-13,-10,-7].map(x=>({zone:'workshop',position:[x,0,-4],rotation:0})),
      ...[7.7,10.1,12.3].map(x=>({zone:'study',position:[x,0,-6.7],rotation:0})),
      ...[8.1,10.3,12.4].map(x=>({zone:'games',position:[x,0,7.9],rotation:0})),
    ],
    marble:{mesh:marble,center:marbleCenter,radius:marbleRadius},
    play(action, {reducedMotion=false} = {}) {
      if(action==='play:windmill') {
        if(reducedMotion) {windmillTurn+=Math.PI/6;windmillPush=0;}
        else windmillPush=Math.min(windmillPush+4.8,9);
        return 'You spun the windmill.';
      }
      if(action==='play:glider') {
        if(reducedMotion) {landGlider();return 'The glider stays on its perch with reduced motion enabled.';}
        if(gliderFlight!==null) return 'The paper glider is already in flight.';
        gliderFlight=0;
        return 'You launched the paper glider.';
      }
      return '';
    },
    update(time, delta, playerPosition, {reducedMotion=false} = {}) {
      if(quality!=='reduced') animations.forEach(animate=>animate(time,delta));
      if(reducedMotion) {windmillPush=0;landGlider();}
      else {
        // A push adds energy, then the blades coast back to their ambient speed.
        windmillTurn+=windmillPush*delta;
        windmillPush*=Math.exp(-delta*1.05);
        if(gliderFlight!==null) {
          gliderFlight+=delta;
          const progress=Math.min(gliderFlight/4.8,1);
          if(progress===1) landGlider();
          else {
            gliderRoute.getPointAt(progress,glider.position);
            gliderRoute.getTangentAt(progress,flightDirection);
            glider.rotation.set(
              Math.asin(THREE.MathUtils.clamp(flightDirection.y,-1,1)),
              Math.atan2(-flightDirection.x,-flightDirection.z),
              -Math.sin(progress*Math.PI)*.3,
              'YXZ'
            );
          }
        }
      }
      windmill.rotation.z=-(reducedMotion?0:time*.17)-windmillTurn;
      if(playerPosition) for(const room of rooms) {
        const inside=playerPosition.x>room.minX&&playerPosition.x<room.maxX&&playerPosition.z>room.minZ&&playerPosition.z<room.maxZ&&playerPosition.y<room.ceiling;
        room.roof.visible=!inside;
      }
      glider.visible=studyRoof.visible||gliderFlight!==null;
    },
    dispose() { scene.remove(root);geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());extraMaterials.forEach(m=>m.dispose());materials.dispose(); },
  };
}
