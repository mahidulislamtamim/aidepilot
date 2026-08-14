import fs from 'fs';
import path from 'path';
import { Jimp } from 'jimp';
import pngToIco from 'png-to-ico';

const ROOT = path.resolve('build');
const SOURCE = path.join(ROOT, 'icon.png');
const SIZES = [16, 24, 32, 48, 64, 128, 256];

const image = await Jimp.read(SOURCE);
const tmpDir = path.join(ROOT, '.icon-sizes');
fs.mkdirSync(tmpDir, { recursive: true });

const files = [];
for (const size of SIZES) {
  const clone = image.clone().resize({ w: size, h: size });
  const out = path.join(tmpDir, `${size}.png`);
  await clone.write(out);
  files.push(out);
}

const ico = await pngToIco(files);
fs.writeFileSync(path.join(ROOT, 'icon.ico'), ico);
console.log(`Wrote build/icon.ico (${ico.length} bytes) with sizes ${SIZES.join(', ')}`);
