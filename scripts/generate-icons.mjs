/**
 * Generates per-site raster assets from `public/logos/<id>.webp`:
 *   public/icons/<id>/{favicon.ico,icon-32.png,icon-192.png,icon-512.png,apple-touch-icon.png}
 *   public/og/<id>.png  (1200×630 default Open Graph image)
 * Usage: node scripts/generate-icons.mjs   (needs `sharp`, shipped with Next)
 * The outputs are committed; rerun only when a logo changes.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const SITES = ['ru', 'ro'];
const BG = '#fafafa'; // --background-light

/** Single-image ICO with a PNG payload (supported by every current browser). */
function ico(png, size) {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); // reserved
  head.writeUInt16LE(1, 2); // type: icon
  head.writeUInt16LE(1, 4); // image count
  head.writeUInt8(size, 6); // width
  head.writeUInt8(size, 7); // height
  head.writeUInt16LE(1, 10); // planes
  head.writeUInt16LE(32, 12); // bit depth
  head.writeUInt32LE(png.length, 14); // size
  head.writeUInt32LE(22, 18); // offset
  return Buffer.concat([head, png]);
}

for (const id of SITES) {
  const src = `public/logos/${id}.webp`;
  const dir = `public/icons/${id}`;
  await mkdir(dir, { recursive: true });
  await mkdir('public/og', { recursive: true });

  const square = (size, background) =>
    sharp(src)
      .resize(size, size, {
        fit: 'contain',
        background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png();

  const p32 = await square(32).toBuffer();
  await writeFile(`${dir}/icon-32.png`, p32);
  await writeFile(`${dir}/favicon.ico`, ico(await square(32).toBuffer(), 32));
  await writeFile(`${dir}/icon-192.png`, await square(192).toBuffer());
  await writeFile(`${dir}/icon-512.png`, await square(512).toBuffer());
  // iOS fills transparency with black: opaque background, small padding.
  await sharp(src)
    .resize(150, 150, { fit: 'contain', background: BG })
    .extend({ top: 15, bottom: 15, left: 15, right: 15, background: BG })
    .flatten({ background: BG })
    .png()
    .toFile(`${dir}/apple-touch-icon.png`);

  const logo = await sharp(src).resize(480, 480, { fit: 'contain', background: BG }).toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: BG } })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(`public/og/${id}.png`);
  console.log(`generated ${id}`);
}
