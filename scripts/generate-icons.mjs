import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(publicDir, { recursive: true })

function createSVG(size) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.35
  const strokeW = size * 0.06
  const fontSize = size * 0.28

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#09090b" rx="${size * 0.22}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#10b981" stroke-width="${strokeW}"/>
  <text x="${cx}" y="${cy + fontSize * 0.35}" text-anchor="middle" fill="#10b981"
    font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${fontSize}">$</text>
</svg>`)
}

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of sizes) {
  await sharp(createSVG(size), { density: 300 })
    .png()
    .toFile(join(publicDir, name))
  console.log(`Created ${name}`)
}
