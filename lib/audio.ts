/**
 * lib/audio.ts
 *
 * Lightweight, zero-dependency procedural audio synthesis using the Web Audio API.
 * Synthesizes high-fidelity sound effects off the main JavaScript thread with 0 latency
 * and 0 external asset downloads.
 */

let globalAudioContext: AudioContext | null = null
let hasRegisteredUnlocker = false

/**
 * Mobile Safari and Chrome strictly require user interaction (touchstart/click)
 * to unlock Web Audio for subsequent programmatic/background event playback.
 */
function registerAudioUnlocker() {
  if (typeof window === "undefined" || hasRegisteredUnlocker) return
  hasRegisteredUnlocker = true

  const unlock = () => {
    if (globalAudioContext && globalAudioContext.state === "suspended") {
      globalAudioContext.resume().catch(() => {})
    } else if (!globalAudioContext) {
      getAudioContext()
    }

    if (globalAudioContext && globalAudioContext.state === "running") {
      window.removeEventListener("touchstart", unlock, true)
      window.removeEventListener("touchend", unlock, true)
      window.removeEventListener("click", unlock, true)
      window.removeEventListener("keydown", unlock, true)
    }
  }

  window.addEventListener("touchstart", unlock, {
    capture: true,
    passive: true,
  })
  window.addEventListener("touchend", unlock, { capture: true, passive: true })
  window.addEventListener("click", unlock, { capture: true, passive: true })
  window.addEventListener("keydown", unlock, { capture: true, passive: true })
}

if (typeof window !== "undefined") {
  registerAudioUnlocker()
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext

    if (!AudioContextClass) return null

    if (!globalAudioContext || globalAudioContext.state === "closed") {
      globalAudioContext = new AudioContextClass()
    }

    if (globalAudioContext.state === "suspended") {
      globalAudioContext.resume().catch(() => {
        // Ignored if waiting for user interaction
      })
    }

    return globalAudioContext
  } catch (error) {
    console.warn("[audio] Web Audio API unavailable:", error)
    return null
  }
}

/**
 * Play a sweet, sparkling fintech payment success chime when the customer's wallet is funded.
 * Synthesizes an ascending major chord arpeggio (E5 -> G#5 -> B5 -> E6) with smooth decay.
 * Accompanied by a celebratory mobile tactile vibration pattern.
 */
export function playWalletFundedSound() {
  // 1. Celebratory tactile vibration for mobile devices
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([80, 60, 80, 60, 140])
    } catch {
      // Ignored if vibration is restricted
    }
  }

  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime

    // Master gain to keep volume pleasant and prevent clipping
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.28, now)
    masterGain.connect(ctx.destination)

    // Musical chord notes (E major arpeggio with shimmering high harmonic)
    const notes = [
      {
        freq: 659.25,
        time: 0.0,
        duration: 0.35,
        type: "sine" as OscillatorType,
        vol: 0.7,
      }, // E5
      {
        freq: 830.61,
        time: 0.07,
        duration: 0.35,
        type: "sine" as OscillatorType,
        vol: 0.75,
      }, // G#5
      {
        freq: 987.77,
        time: 0.14,
        duration: 0.45,
        type: "sine" as OscillatorType,
        vol: 0.8,
      }, // B5
      {
        freq: 1318.51,
        time: 0.21,
        duration: 0.7,
        type: "triangle" as OscillatorType,
        vol: 0.9,
      }, // E6 (sparkle)
      {
        freq: 2637.02,
        time: 0.22,
        duration: 0.4,
        type: "sine" as OscillatorType,
        vol: 0.2,
      }, // E7 (glass shimmer)
      {
        freq: 329.63,
        time: 0.05,
        duration: 0.5,
        type: "sine" as OscillatorType,
        vol: 0.4,
      }, // E4 (warm fundamental)
    ]

    notes.forEach(({ freq, time, duration, type, vol }) => {
      const startTime = now + time
      const endTime = startTime + duration

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, startTime)

      // Attack (quick 15ms ramp to prevent audio click/pop)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.015)
      // Exponential decay
      gain.gain.exponentialRampToValueAtTime(0.0001, endTime)

      osc.connect(gain)
      gain.connect(masterGain)

      osc.start(startTime)
      osc.stop(endTime)
    })
  } catch (error) {
    console.warn("[audio] Could not play wallet sound:", error)
  }
}

/**
 * Play a synthesized acoustic tactile tick or completion chime for pull-to-refresh.
 * Zero-latency procedural synthesis with physical vibration support.
 */
export function playPullToRefreshHaptic(
  type: "trigger" | "success" = "trigger"
) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(type === "trigger" ? 12 : 16)
    } catch {
      // Ignored if vibration is restricted
    }
  }

  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    if (type === "trigger") {
      osc.frequency.setValueAtTime(140, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.02)
      gain.gain.setValueAtTime(0.06, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02)
      osc.start()
      osc.stop(ctx.currentTime + 0.02)
    } else {
      osc.frequency.setValueAtTime(320, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.035)
      gain.gain.setValueAtTime(0.04, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035)
      osc.start()
      osc.stop(ctx.currentTime + 0.035)
    }

    osc.connect(gain)
    gain.connect(ctx.destination)
  } catch {
    // Ignored if AudioContext is blocked before user interaction
  }
}

// Global hook for easy testing in browser DevTools: window.testWalletSound()
if (typeof window !== "undefined") {
  ;(window as Window & { testWalletSound?: () => void }).testWalletSound =
    playWalletFundedSound
}
