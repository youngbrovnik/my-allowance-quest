const fs = require("fs");
const zlib = require("zlib");

const [input, output] = process.argv.slice(2);
const png = fs.readFileSync(input);
let offset = 8;
let width;
let height;
const idat = [];

while (offset < png.length) {
  const length = png.readUInt32BE(offset);
  const type = png.toString("ascii", offset + 4, offset + 8);
  const data = png.subarray(offset + 8, offset + 8 + length);
  if (type === "IHDR") {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
    if (data[8] !== 8 || data[9] !== 6) throw new Error("Expected 8-bit RGBA PNG");
  }
  if (type === "IDAT") idat.push(data);
  offset += length + 12;
}

const packed = zlib.inflateSync(Buffer.concat(idat));
const stride = width * 4;
const pixels = Buffer.alloc(stride * height);
let source = 0;

for (let y = 0; y < height; y += 1) {
  const filter = packed[source++];
  for (let x = 0; x < stride; x += 1) {
    const raw = packed[source++];
    const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
    const up = y ? pixels[(y - 1) * stride + x] : 0;
    const upperLeft = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
    let value = raw;
    if (filter === 1) value += left;
    if (filter === 2) value += up;
    if (filter === 3) value += Math.floor((left + up) / 2);
    if (filter === 4) {
      const estimate = left + up - upperLeft;
      const distances = [Math.abs(estimate - left), Math.abs(estimate - up), Math.abs(estimate - upperLeft)];
      value += distances[0] <= distances[1] && distances[0] <= distances[2] ? left : distances[1] <= distances[2] ? up : upperLeft;
    }
    pixels[y * stride + x] = value & 255;
  }
}

const centerX = width / 2;
const centerY = height / 2;
const radius = width * 208 / 512;
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const distance = Math.hypot(x + 0.5 - centerX, y + 0.5 - centerY);
    const alpha = Math.max(0, Math.min(1, radius + 0.5 - distance));
    const index = (y * width + x) * 4;
    if (alpha < 1) {
      pixels[index] = 0x33;
      pixels[index + 1] = 0xcc;
      pixels[index + 2] = 0x00;
      pixels[index + 3] = Math.round(alpha * 255);
    }
  }
}

const rows = Buffer.alloc((stride + 1) * height);
for (let y = 0; y < height; y += 1) {
  rows[y * (stride + 1)] = 0;
  pixels.copy(rows, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  name.copy(result, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([name, data])), data.length + 8);
  return result;
}

const header = Buffer.alloc(13);
header.writeUInt32BE(width, 0);
header.writeUInt32BE(height, 4);
header.set([8, 6, 0, 0, 0], 8);
fs.writeFileSync(output, Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", header),
  chunk("IDAT", zlib.deflateSync(rows, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]));
