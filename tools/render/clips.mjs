// Clip timelines for the Lanjiang renderer. Shared by the browser page and the Node driver.
export const FPS = 24
export const FRAME_MS = 42
export const LOOP_SECONDS = 8
export const CANVAS = { width: 256, height: 352, supersample: 2 }

const TAU = Math.PI * 2
const clamp = (n, a, b) => Math.max(a, Math.min(b, n))
const ease = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }
const env = (t, a, b, c, d) => ease(a, b, t) * (1 - ease(c, d, t))
const near = (t, at) => Math.abs(t - at) < 0.5 / FPS

function base(r) {
  Object.assign(r.params, {
    headX: 0, headY: 0, headZ: 0, armLeft: 0, armRight: 0, expression: 'neutral',
    mouthOpen: 0, eyeOpen: 1, breath: 1, hair: 1, wings: 1, follow: true, flap: 0,
  })
  r.target = { x: 0, y: 0 }
  r.activity = 'idle'
  r.audioMouth = null
}

function blinks(r, t, times) {
  if (times.some((at) => near(t, at))) r.blinkStart = r.time
}

function once(t, at, action) {
  if (near(t, at)) action()
}

export const CLIPS = [
  {
    name: 'idle', loop: true, seconds: LOOP_SECONDS,
    at(r, t) {
      base(r)
      r.target = { x: 0.12 * Math.sin(TAU * t / LOOP_SECONDS), y: 0.05 * Math.sin(2 * TAU * t / LOOP_SECONDS) }
      blinks(r, t, [1.2, 4.1, 4.45, 6.6])
    },
  },
  {
    name: 'thinking', loop: true, seconds: LOOP_SECONDS,
    at(r, t) {
      base(r)
      r.activity = 'thinking'
      r.params.expression = 'thinking'
      r.params.headZ = 0.35
      r.target = { x: 0.55 + 0.08 * Math.sin(TAU * t / LOOP_SECONDS), y: -0.45 }
      blinks(r, t, [2.0, 6.0])
    },
  },
  {
    name: 'working', loop: true, seconds: LOOP_SECONDS,
    at(r, t) {
      base(r)
      r.params.headY = 0.25
      r.target = { x: -0.1 + 0.06 * Math.sin(2 * TAU * t / LOOP_SECONDS), y: 0.55 }
      blinks(r, t, [1.5, 3.9, 6.8])
    },
  },
  {
    name: 'working_search', loop: true, seconds: LOOP_SECONDS,
    at(r, t) {
      base(r)
      r.target = { x: 0.7 * Math.sin(2 * TAU * t / LOOP_SECONDS), y: 0.3 }
      blinks(r, t, [2.0, 6.0])
    },
  },
  {
    name: 'working_command', loop: true, seconds: LOOP_SECONDS,
    at(r, t) {
      base(r)
      r.params.headY = 0.15 + 0.3 * Math.max(0, Math.sin(6 * TAU * t / LOOP_SECONDS)) ** 2
      r.target = { x: 0, y: 0.45 }
      blinks(r, t, [2.6, 5.9])
    },
  },
  {
    name: 'waiting', loop: true, seconds: LOOP_SECONDS,
    at(r, t) {
      base(r)
      r.params.mouthOpen = 0.18
      once(t, 0.4, () => r.wave())
      once(t, 4.4, () => r.wave())
      blinks(r, t, [3.8, 7.6])
    },
  },
  {
    name: 'dragging', loop: true, seconds: LOOP_SECONDS,
    at(r, t) {
      base(r)
      const w = TAU * 2 / LOOP_SECONDS
      r.params.flap = 0.5
      r.params.mouthOpen = 0.12
      r.setDrag({ active: true, x: 0.3 * Math.sin(w * t), y: -0.2, vx: 0.5 * Math.cos(w * t), vy: 0.2 * Math.sin(2 * w * t) })
    },
  },
  {
    name: 'dragging_release', loop: false, seconds: 1.5, from: 'dragging',
    at(r, t) {
      base(r)
      once(t, 0, () => r.setDrag({ active: false }))
    },
  },
  {
    name: 'success', loop: false, seconds: 4,
    at(r, t) {
      base(r)
      r.params.expression = t < 3.3 ? 'happy' : 'neutral'
      r.params.flap = env(t, 0.2, 0.5, 2.2, 3.0)
      once(t, 0.2, () => r.wave())
      once(t, 0.3, () => r.nod())
    },
  },
  {
    name: 'error', loop: false, seconds: 3,
    at(r, t) {
      base(r)
      r.params.expression = t < 1.6 ? 'surprised' : 'neutral'
      r.params.headX = 0.35 * Math.sin(TAU * 2.2 * t) * env(t, 0.3, 0.45, 1.3, 1.6)
      r.params.mouthOpen = 0.5 * (1 - ease(1.1, 1.4, t))
      r.params.eyeOpen = 1 - 0.25 * env(t, 1.4, 1.6, 2.2, 2.5)
    },
  },
  {
    name: 'head_pat', loop: false, seconds: 3,
    at(r, t) {
      base(r)
      r.params.expression = t < 2.4 ? 'happy' : 'neutral'
      once(t, 0, () => r.pet())
    },
  },
  {
    name: 'poke', loop: false, seconds: 2.5,
    at(r, t) {
      base(r)
      r.params.expression = t < 0.7 ? 'surprised' : t < 2.0 ? 'happy' : 'neutral'
      r.params.mouthOpen = 0.6 * (1 - ease(0.35, 0.5, t))
      r.params.headY = -0.25 * env(t, 0, 0.08, 0.4, 0.6)
      blinks(r, t, [0.75])
    },
  },
  {
    name: 'wings', loop: false, seconds: 2.5,
    at(r, t) {
      base(r)
      r.params.expression = t > 0.3 && t < 2.0 ? 'happy' : 'neutral'
      r.params.flap = env(t, 0, 0.2, 1.6, 2.2)
      r.target = { x: 0, y: -0.1 }
    },
  },
  {
    name: 'idle_yawn', loop: false, seconds: 4,
    at(r, t) {
      base(r)
      const yawn = env(t, 0.3, 1.0, 2.0, 2.6)
      r.params.mouthOpen = 0.9 * yawn
      r.params.eyeOpen = 1 - 0.75 * yawn
      r.params.headY = -0.2 * yawn
      r.params.headZ = 0.3 * yawn
      blinks(r, t, [3.0])
    },
  },
  {
    name: 'idle_glance', loop: false, seconds: 4,
    at(r, t) {
      base(r)
      const x = -0.75 * env(t, 0.4, 1.0, 1.8, 2.4) + 0.75 * env(t, 1.8, 2.4, 3.2, 3.7)
      r.target = { x, y: 0 }
      blinks(r, t, [1.4, 3.75])
    },
  },
  {
    name: 'idle_hum', loop: false, seconds: 5,
    at(r, t) {
      base(r)
      const hum = env(t, 0.2, 0.6, 4.2, 4.6)
      r.activity = hum > 0.01 ? 'speaking' : 'idle'
      r.params.expression = 'happy'
      r.audioMouth = hum > 0.01 ? 0.25 * Math.max(0, Math.sin(TAU * 2.5 * t)) * hum : null
      r.params.headZ = 0.25 * Math.sin(TAU * 0.6 * t) * hum
      blinks(r, t, [4.8])
    },
  },
]

export const MANIFEST_MAPS = {
  stateMap: { IDLE: 'idle', THINKING: 'thinking', WORKING: 'working', WAITING: 'waiting', SUCCESS: 'success', ERROR: 'error', DISCONNECTED: 'idle' },
  workingActivityMap: { searching: 'working_search', commanding: 'working_command', editing: 'working', testing: 'working_command', 'using-tool': 'working' },
  idleMicroClips: ['idle_yawn', 'idle_glance', 'idle_hum'],
  idleMicroIntervalsMs: { quiet: [45000, 90000], normal: [25000, 45000], lively: [12000, 22000] },
  interactionCooldownMs: 1200,
}
