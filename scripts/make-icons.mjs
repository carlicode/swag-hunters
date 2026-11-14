// Genera los PNG del ícono desde public/icons/icon.svg
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync('public/icons/icon.svg');
const out = (name, size, pad = 0) =>
  sharp(svg, { density: 384 })
    .resize(size - pad * 2, size - pad * 2)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#0a0b0d' })
    .png()
    .toFile(`public/icons/${name}`);

await out('icon-192.png', 192);
await out('icon-512.png', 512);
await out('icon-maskable-512.png', 512, 64);
await out('apple-touch-icon.png', 180);
console.log('Íconos listos');
