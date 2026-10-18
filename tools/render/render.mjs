// Render Lanjiang clips to transparent WebP frames and write assets/pet-manifest.json.
import { createServer } from 'node:http'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { extname, join, resolve, dirname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import sharp from 'sharp'
import { CANVAS, CLIPS, FPS, FRAME_MS, LOOP_SECONDS, MANIFEST_MAPS } from './clips.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '..', '..')
const petRoot = join(repo, 'assets', 'pet')
const only = process.argv.slice(2)
const TYPES = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.png': 'image/png' }

// WebGL refuses textures from file:// URLs, so serve this folder over loopback.
const server = createServer(async (req, res) => {
  const path = resolve(here, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!path.startsWith(here + sep)) { res.writeHead(403).end(); return }
  try {
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(await readFile(path))
  } catch { res.writeHead(404).end() }
})
await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
const url = `http://127.0.0.1:${server.address().port}/page.html`

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 520, height: 740 }, deviceScaleFactor: 1 })
page.on('pageerror', (error) => { console.error(error); process.exitCode = 1 })
await page.goto(url)
await page.evaluate(() => window.rendererReady)

// The character must never touch the canvas edge, or a pose is being clipped.
async function assertNotClipped(png, label) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const alpha = (x, y) => data[(y * width + x) * channels + 3]
  for (let x = 0; x < width; x++) {
    if (alpha(x, 0) > 8 || alpha(x, height - 1) > 8) throw new Error(`${label}: character touches top/bottom edge`)
  }
  for (let y = 0; y < height; y++) {
    if (alpha(0, y) > 8 || alpha(width - 1, y) > 8) throw new Error(`${label}: character touches left/right edge`)
  }
}

// Source art is cropped at the shins, so fade the bottom edge out instead of leaving a hard cut.
function fadeBottom(data, width, height) {
  const y0 = Math.round(0.9 * height)
  const y1 = height - 1
  for (let y = y0; y < height; y++) {
    const t = Math.min(1, (y - y0) / (y1 - y0))
    const factor = 1 - t * t * (3 - 2 * t)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4 + 3
      data[i] = Math.round(data[i] * factor)
    }
  }
}

const clips = {}
try {
  for (const clip of CLIPS) {
    if (only.length && !only.includes(clip.name)) continue
    const count = await page.evaluate((name) => window.prepareClip(name), clip.name)
    const dir = join(petRoot, clip.name)
    await rm(dir, { recursive: true, force: true })
    await mkdir(dir, { recursive: true })
    const frames = []
    for (let i = 0; i < count; i++) {
      const dataUrl = await page.evaluate(() => window.nextFrame())
      const png = Buffer.from(dataUrl.split(',')[1], 'base64')
      await assertNotClipped(png, `${clip.name}#${i + 1}`)
      const file = `${clip.name}/${clip.name}_${String(i + 1).padStart(3, '0')}.webp`
      const { data, info } = await sharp(png)
        .resize(CANVAS.width, CANVAS.height, { kernel: 'lanczos3' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
      fadeBottom(data, info.width, info.height)
      await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
        .webp({ quality: 65, alphaQuality: 90, effort: 6 })
        .toFile(join(petRoot, file))
      frames.push(file)
    }
    clips[clip.name] = { frames, frameMs: FRAME_MS, loop: clip.loop }
    console.log(`${clip.name}: ${frames.length} frames`)
  }
} finally {
  await browser.close()
  server.close()
}

if (only.length) {
  console.log('Partial render: manifest not rewritten')
} else {
  const manifest = {
    formatVersion: 1,
    characterId: 'lanjiang',
    baseSize: CANVAS.width,
    maxFrameWidth: CANVAS.width,
    maxFrameHeight: CANVAS.height,
    assetSource: {
      renderer: 'cutelans rose-layers-v3 (tools/render/vendor)',
      fps: FPS,
      loopSeconds: LOOP_SECONDS,
      supersample: CANVAS.supersample,
      webpQuality: 65,
    },
    clips,
    ...MANIFEST_MAPS,
  }
  await writeFile(join(repo, 'assets', 'pet-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log('Wrote assets/pet-manifest.json')
}
