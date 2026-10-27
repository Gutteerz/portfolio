import * as THREE from 'three';

// All paint and grain is generated locally. No scene image is used as scenery.
function seededRandom(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function paintedTexture(base, green = false) {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const random = seededRandom(green ? 41 : 14);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      const x = random() * w, y = random() * h;
      ctx.globalAlpha = 0.02 + random() * 0.055;
      ctx.fillStyle = i % 3 === 0 ? '#fff2c6' : '#7d512c';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 32 + random() * 180, y + random() * 3);
      ctx.lineTo(x + 40 + random() * 180, y + 3 + random() * 14);
      ctx.lineTo(x - 9, y + 6);
      ctx.fill();
    }
    ctx.globalAlpha = 0.13;
    ctx.strokeStyle = green ? '#e3ba6b' : '#ae793e';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 35; i++) {
      const y = random() * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(130, y + random() * 12, 320, y - 5, w, y + 2);
      ctx.stroke();
    }
    if (green) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#c7a264';
      for (let i = 0; i < 25; i++) {
        const x = random() * w, y = random() * h;
        ctx.fillRect(x, y, 4 + random() * 40, 1 + random() * 7);
      }
    } else {
      ctx.globalAlpha = 0.09;
      ctx.strokeStyle = '#7f512f';
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.ellipse(random() * w, random() * h, 13 + random() * 22, 2 + random() * 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  });
}

export function makeSignTexture(text, {width = 512, height = 192, color = '#393d32', background = '#e5c58b'} = {}) {
  return canvasTexture(width, height, (ctx, w, h) => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(130,82,38,.15)';
    for (let i = 0; i < 9; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * h / 9); ctx.lineTo(w, i * h / 9 + 2); ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${Math.min(h * 0.58, w / (text.length * 0.61))}px "Atkinson Hyperlegible", sans-serif`;
    ctx.translate(w / 2, h / 2 + 2);
    ctx.rotate(-0.025);
    ctx.fillText(text, 0, 0);
  });
}

export function makeSketchTexture(kind = 'trees') {
  return canvasTexture(256, 320, (ctx, w, h) => {
    ctx.fillStyle = '#eee0b9'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#968d70'; ctx.lineWidth = 3;
    const tree = (x, y, size) => {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + size); ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const top = y + i * size * 0.2, half = size * (i + 2) * 0.095;
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x - half, top + size * .4); ctx.lineTo(x + half, top + size * .4); ctx.closePath(); ctx.stroke();
      }
    };
    if (kind === 'trees') { tree(80, 54, 180); tree(181, 100, 130); }
    else if (kind === 'plan') {
      ctx.strokeRect(42, 70, 165, 150); ctx.strokeRect(65, 94, 54, 72);
      ctx.beginPath(); ctx.arc(167, 140, 28, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(27, 250); ctx.lineTo(225, 250); ctx.stroke();
      ctx.setLineDash([]); tree(172, 169, 47);
    } else {
      ctx.fillStyle = '#a5c7b8'; ctx.fillRect(22, 30, 212, 180);
      ctx.fillStyle = '#7f9860'; ctx.beginPath(); ctx.moveTo(22,210); ctx.lineTo(90,72); ctx.lineTo(140,163); ctx.lineTo(183,102); ctx.lineTo(234,210); ctx.fill();
      ctx.fillStyle = '#eee5c8'; ctx.beginPath(); ctx.moveTo(72,109); ctx.lineTo(90,72); ctx.lineTo(111,111); ctx.lineTo(90,101); ctx.fill();
    }
    ctx.strokeStyle = '#b7aa84'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(34, 276); ctx.lineTo(158, 276); ctx.moveTo(34, 288); ctx.lineTo(202, 288); ctx.stroke();
  });
}

export function makeScreenTexture(kind = 'code') {
  return canvasTexture(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#273942'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#344851'; ctx.fillRect(0, 0, w, 25);
    ['#b87b60', '#d2b46e', '#81966b'].forEach((c, i) => {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(14 + i * 15, 12, 3, 0, Math.PI * 2); ctx.fill();
    });
    if (kind === 'code') {
      const colors = ['#d7ae6b', '#90b8b9', '#c2866e', '#a9b97f'];
      for (let row = 0; row < 15; row++) {
        ctx.fillStyle = '#6a7d7f'; ctx.fillRect(17, 43 + row * 16, 9, 3);
        ctx.fillStyle = colors[row % colors.length];
        const indent = row % 5 > 1 ? 45 : 30;
        ctx.fillRect(indent, 43 + row * 16, 35 + (row * 23) % 90, 4);
        ctx.fillStyle = '#adc0b7'; ctx.fillRect(indent + 105, 43 + row * 16, 28 + (row * 19) % 95, 4);
      }
    } else {
      ctx.fillStyle = '#91bbcc'; ctx.fillRect(12, 35, w - 24, h - 47);
      ctx.fillStyle = '#a1ae6a'; ctx.fillRect(12, 230, w - 24, 78);
      [80, 190, 350, 430].forEach((x, i) => {
        ctx.fillStyle = '#536d4a'; ctx.beginPath(); ctx.moveTo(x, 65 + i * 10); ctx.lineTo(x - 50, 234); ctx.lineTo(x + 50, 234); ctx.fill();
        ctx.fillStyle = '#99774e'; ctx.fillRect(x - 6, 214, 12, 36);
      });
      ctx.fillStyle = '#f3edd5'; ctx.fillRect(220, 66, 66, 13); ctx.fillRect(207, 78, 96, 15);
    }
  });
}

export function createMaterials() {
  const textures = [paintedTexture('#d7a566'), paintedTexture('#e5bc7e'), paintedTexture('#95704a'), paintedTexture('#698364', true)];
  const material = (color, options = {}) => new THREE.MeshStandardMaterial({color, roughness: 0.91, metalness: 0, flatShading: true, ...options});
  const palette = {
    wood: material('#ffffff', {map: textures[0]}),
    woodLight: material('#ffffff', {map: textures[1]}),
    woodDark: material('#ffffff', {map: textures[2]}),
    plywood: material('#f4d296', {map: textures[1]}),
    paintGreen: material('#ffffff', {map: textures[3]}),
    paintGreenLight: material('#a0ad75', {map: textures[3]}),
    paintGreenDark: material('#65816c', {map: textures[3]}),
    leaf: material('#7d943e'), leafLight: material('#a6b24f'), leafDark: material('#486947'),
    stone: material('#8a9096'), stoneLight: material('#aeb2b2'),
    metal: material('#8b9190', {metalness: 0.45, roughness: .55}),
    darkMetal: material('#424b48', {metalness: 0.3, roughness: .68}),
    paper: material('#eee2bd'), red: material('#ad5945'), cream: material('#e8d5a3'),
    blue: material('#4b8daa'), dark: material('#30434a'),
    glass: material('#447f9d', {metalness: .25, roughness: .18, transparent: true, opacity: .87}),
    screen: material('#c0d4bf', {emissive: '#90b3bb', emissiveIntensity: .35}),
    wall: material('#747e7d'), floor: material('#a17d54', {map: textures[0]}),
    dispose() { textures.forEach(texture => texture.dispose()); Object.values(palette).forEach(value => { if (value?.isMaterial) value.dispose(); }); },
  };
  return palette;
}
