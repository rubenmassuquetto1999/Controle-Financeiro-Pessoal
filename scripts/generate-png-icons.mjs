import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height, isMaskable = false) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  // Precompute CRC table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function calcCrc(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(typeStr, dataBuf) {
    const typeBuf = Buffer.from(typeStr, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(dataBuf.length, 0);

    const toCrc = Buffer.concat([typeBuf, dataBuf]);
    const crc = calcCrc(toCrc);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf]);
  }

  // Draw icon pixels
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter 0

    const ny = y / height; // 0..1

    for (let x = 0; x < width; x++) {
      const nx = x / width; // 0..1
      const pxOffset = rowOffset + 1 + x * 4;

      // Base background: #09090b
      let r = 9, g = 9, b = 11, a = 255;

      // Inner box bounds (scale down slightly if maskable for safe-zone)
      const boxMin = isMaskable ? 0.22 : 0.16;
      const boxMax = isMaskable ? 0.78 : 0.84;
      const radius = isMaskable ? 0.12 : 0.15;

      // Distance to rounded box
      const dx = Math.max(0, Math.max(boxMin + radius - nx, nx - (boxMax - radius)));
      const dy = Math.max(0, Math.max(boxMin + radius - ny, ny - (boxMax - radius)));
      const inBox = (nx >= boxMin && nx <= boxMax && ny >= boxMin && ny <= boxMax);
      const inCorner = (dx > 0 && dy > 0);
      const isInsideRoundedBox = inBox && (!inCorner || (dx * dx + dy * dy <= radius * radius));

      if (isInsideRoundedBox) {
        // Blue Gradient: #2563eb to #1d4ed8
        const gradT = (nx + ny) / 2;
        r = Math.round(37 * (1 - gradT) + 29 * gradT);
        g = Math.round(99 * (1 - gradT) + 78 * gradT);
        b = Math.round(235 * (1 - gradT) + 216 * gradT);

        // Center Phi Symbol
        const cx = 0.5;
        const cy = 0.5;

        // Vertical line: |nx - 0.5| < 0.035 and ny between 0.26 and 0.74
        const lineThick = isMaskable ? 0.03 : 0.034;
        const lineTop = isMaskable ? 0.30 : 0.27;
        const lineBottom = isMaskable ? 0.70 : 0.73;
        const inVerticalLine = Math.abs(nx - cx) <= lineThick && ny >= lineTop && ny <= lineBottom;

        // Ellipse ring: (nx - cx)^2 / rx^2 + (ny - cy)^2 / ry^2 between inner and outer radius
        const rx = isMaskable ? 0.14 : 0.17;
        const ry = isMaskable ? 0.11 : 0.13;
        const dist = Math.pow((nx - cx) / rx, 2) + Math.pow((ny - cy) / ry, 2);
        const ringThick = isMaskable ? 0.28 : 0.30;
        const inEllipse = dist >= (1 - ringThick) && dist <= (1 + ringThick);

        if (inVerticalLine || inEllipse) {
          r = 255;
          g = 255;
          b = 255;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. 192x192 PNG
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
console.log('Created pwa-192x192.png');

// 2. 512x512 PNG
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
console.log('Created pwa-512x512.png');

// 3. Maskable 512x512 PNG (with safe-zone margins)
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
console.log('Created pwa-maskable-512x512.png');

// 4. Apple Touch Icon 180x180 PNG
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
console.log('Created apple-touch-icon.png');
