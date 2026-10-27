import { mkdir, copyFile } from 'node:fs/promises';

const destination = new URL('../app/static/vendor/three/', import.meta.url);
await mkdir(destination, { recursive: true });
for (const file of ['three.module.js', 'three.core.js']) {
  await copyFile(new URL(`../node_modules/three/build/${file}`, import.meta.url), new URL(file, destination));
}
await copyFile(new URL('../node_modules/three/LICENSE', import.meta.url), new URL('LICENSE', destination));
console.log('Three.js runtime and license copied to app/static/vendor/three.');

const fonts = new URL('../app/static/vendor/fonts/', import.meta.url);
await mkdir(fonts, { recursive: true });
for (const weight of [400, 700]) {
  const file = `atkinson-hyperlegible-latin-${weight}-normal.woff2`;
  await copyFile(new URL(`../node_modules/@fontsource/atkinson-hyperlegible/files/${file}`, import.meta.url), new URL(file, fonts));
}
await copyFile(new URL('../node_modules/@fontsource/atkinson-hyperlegible/LICENSE', import.meta.url), new URL('LICENSE', fonts));
console.log('Atkinson Hyperlegible fonts and license copied to app/static/vendor/fonts.');
