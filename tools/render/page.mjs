import { CLIPS, FPS, LOOP_SECONDS } from './clips.mjs'

const DT = 1 / FPS
const FIT_Y = 0.95
const byName = Object.fromEntries(CLIPS.map((clip) => [clip.name, clip]))
let renderer
let clip
let localTime = 0

async function boot() {
  globalThis.__roseLoop = LOOP_SECONDS
  renderer = new LayeredRoseRenderer(document.getElementById('c'))
  await renderer.ready
  renderer.running = false
  renderer.getFit = () => {
    const canvas = renderer.canvas
    return { x: FIT_Y * renderer.aspect * canvas.height / canvas.width, y: FIT_Y }
  }
}

function step(script, t) {
  script.at(renderer, t)
  renderer.advance(DT)
}

// Settle springs into their periodic steady state before capturing.
function warmup(script) {
  const loopFrames = LOOP_SECONDS * FPS
  for (let i = 0; i < 3 * loopFrames; i++) step(script, (i % loopFrames) / FPS)
}

window.prepareClip = (name) => {
  renderer.reset()
  renderer.autoBlink = false
  renderer.autoIdle = false
  clip = byName[name]
  warmup(byName[clip.from ?? (clip.loop ? clip.name : 'idle')])
  localTime = 0
  return Math.round(clip.seconds * FPS)
}

window.nextFrame = () => {
  step(clip, localTime)
  localTime += DT
  renderer.draw()
  return renderer.canvas.toDataURL('image/png')
}

window.rendererReady = boot().then(() => true)
