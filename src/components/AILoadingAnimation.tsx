import { useEffect, useRef, useState } from 'react'
import { useKinalysTheme } from '../contexts/KinalysTheme'

const JARVIS_LINE = "Running diagnostic on your performance matrix. Stand by. Analysing KPI gaps. Cross-referencing learning modules. Recommendation protocol engaged."

const LOADING_MESSAGES: Record<string, string[]> = {
  light:     ['Analysing your KPI gaps...', 'Searching your learning catalogue...', 'Building your recommendations...', 'Almost ready...'],
  dark:      ['Analysing your KPI gaps...', 'Searching your learning catalogue...', 'Building your recommendations...', 'Almost ready...'],
  matcha:    ['Steeping your performance data...', 'Blending your learning gaps...', 'Preparing your recommendations...', 'Almost ready...'],
  coffee:    ['Brewing your performance analysis...', 'Grinding through your KPI gaps...', 'Pulling your recommendations...', 'Almost ready...'],
  cyberpunk: ['SCANNING NEURAL INTERFACE...', 'DECRYPTING KPI MATRIX...', 'UPLOADING COURSE PROTOCOL...', 'SYSTEM READY...'],
  nfs:       ['Accelerating through your KPIs...', 'Hitting top speed on gap analysis...', 'Turbo-charging your recommendations...', 'Ready to race...'],
  matrix:    ['Entering the matrix...', 'Decoding your performance data...', 'Following the white rabbit...', 'There is no spoon...'],
  avengers:  ['Assembling your performance data...', 'Initiating SHIELD analysis protocol...', 'Cross-referencing Avengers intelligence...', 'Whatever it takes...'],
  ironman:   [JARVIS_LINE, 'Scanning KPI architecture...', 'Compiling recommendation suite...', 'Systems online. Good to go.'],
}

function NeuralNetwork({ color1, color2 }: { color1: string; color2: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const W = canvas.width; const H = canvas.height
    const nodes = Array.from({ length: 28 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 3 + 2, pulse: Math.random() * Math.PI * 2
    }))
    let frame = 0
    let raf: number
    function draw() {
      ctx!.clearRect(0, 0, W, H)
      frame++
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.pulse += 0.04
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
      })
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach(b => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (dist < 140) {
            ctx!.beginPath()
            ctx!.strokeStyle = color1 + Math.floor((1 - dist / 140) * 180).toString(16).padStart(2, '0')
            ctx!.lineWidth = 0.8
            ctx!.moveTo(a.x, a.y)
            ctx!.lineTo(b.x, b.y)
            ctx!.stroke()
          }
        })
      })
      nodes.forEach(n => {
        const glow = Math.sin(n.pulse) * 0.5 + 0.5
        ctx!.beginPath()
        ctx!.arc(n.x, n.y, n.r + glow * 2, 0, Math.PI * 2)
        ctx!.fillStyle = color2
        ctx!.globalAlpha = 0.6 + glow * 0.4
        ctx!.fill()
        ctx!.globalAlpha = 1
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [color1, color2])
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
}

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const W = canvas.width; const H = canvas.height
    const cols = Math.floor(W / 18)
    const drops = Array(cols).fill(1)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*KINALYSkinalys'
    let raf: number
    function draw() {
      ctx!.fillStyle = 'rgba(0,0,0,0.05)'
      ctx!.fillRect(0, 0, W, H)
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx!.fillStyle = Math.random() > 0.95 ? '#FFFFFF' : '#00FF41'
        ctx!.font = '14px monospace'
        ctx!.fillText(char, i * 18, y * 18)
        if (y * 18 > H && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
}

function CoffeeBrew() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const W = canvas.width; const H = canvas.height
    let frame = 0; let raf: number
    const steam = Array.from({ length: 6 }, (_, i) => ({
      x: W / 2 + (i - 2.5) * 28, y: H * 0.38, phase: i * 0.8, amp: 8 + Math.random() * 6
    }))
    function draw() {
      ctx!.clearRect(0, 0, W, H)
      frame++
      const fill = Math.min(1, frame / 180)
      const cx = W / 2; const cy = H * 0.55; const cw = 110; const ch = 90
      ctx!.beginPath()
      ctx!.moveTo(cx - cw / 2, cy - ch / 2)
      ctx!.lineTo(cx - cw / 2 + 12, cy + ch / 2)
      ctx!.lineTo(cx + cw / 2 - 12, cy + ch / 2)
      ctx!.lineTo(cx + cw / 2, cy - ch / 2)
      ctx!.closePath()
      ctx!.strokeStyle = '#C8A882'
      ctx!.lineWidth = 3
      ctx!.stroke()
      ctx!.beginPath()
      ctx!.arc(cx + cw / 2 + 12, cy, 22, -0.8, 0.8)
      ctx!.strokeStyle = '#C8A882'
      ctx!.lineWidth = 3
      ctx!.stroke()
      const fillH = ch * fill
      const fillY = cy + ch / 2 - fillH
      ctx!.save()
      ctx!.beginPath()
      ctx!.moveTo(cx - cw / 2, cy - ch / 2)
      ctx!.lineTo(cx - cw / 2 + 12, cy + ch / 2)
      ctx!.lineTo(cx + cw / 2 - 12, cy + ch / 2)
      ctx!.lineTo(cx + cw / 2, cy - ch / 2)
      ctx!.closePath()
      ctx!.clip()
      const grad = ctx!.createLinearGradient(0, fillY, 0, cy + ch / 2)
      grad.addColorStop(0, '#6B3A2A')
      grad.addColorStop(1, '#3D1C02')
      ctx!.fillStyle = grad
      ctx!.fillRect(cx - cw / 2, fillY, cw, fillH + 2)
      ctx!.restore()
      if (fill > 0.6) {
        steam.forEach(s => {
          s.y -= 0.5
          if (s.y < H * 0.1) s.y = H * 0.38
          const alpha = Math.min(1, (fill - 0.6) * 2.5) * 0.5
          ctx!.beginPath()
          ctx!.moveTo(s.x, s.y)
          for (let i = 1; i <= 8; i++) {
            ctx!.lineTo(s.x + Math.sin(frame * 0.04 + s.phase + i) * s.amp, s.y - i * 8)
          }
          ctx!.strokeStyle = `rgba(200,168,130,${alpha})`
          ctx!.lineWidth = 2
          ctx!.stroke()
        })
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
}

function MatchaInk() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const W = canvas.width; const H = canvas.height
    let frame = 0; let raf: number
    const ripples = [
      { r: 0, alpha: 0.8, speed: 1.2 },
      { r: 30, alpha: 0.6, speed: 1.0 },
      { r: 60, alpha: 0.4, speed: 0.8 },
    ]
    function draw() {
      ctx!.clearRect(0, 0, W, H)
      frame++
      const cx = W / 2; const cy = H / 2
      const bg = ctx!.createRadialGradient(cx, cy, 0, cx, cy, W * 0.6)
      bg.addColorStop(0, 'rgba(74,124,89,0.15)')
      bg.addColorStop(1, 'rgba(74,124,89,0)')
      ctx!.fillStyle = bg
      ctx!.fillRect(0, 0, W, H)
      ripples.forEach(rp => {
        rp.r += rp.speed
        rp.alpha -= 0.003
        if (rp.r > Math.max(W, H) * 0.8) { rp.r = 0; rp.alpha = 0.7 }
        ctx!.beginPath()
        ctx!.arc(cx, cy, rp.r, 0, Math.PI * 2)
        ctx!.strokeStyle = `rgba(74,124,89,${Math.max(0, rp.alpha)})`
        ctx!.lineWidth = 2
        ctx!.stroke()
      })
      ctx!.beginPath()
      ctx!.arc(cx, cy, 8 + Math.sin(frame * 0.06) * 3, 0, Math.PI * 2)
      ctx!.fillStyle = '#4A7C59'
      ctx!.fill()
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
}

function NFSSpeed() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const W = canvas.width; const H = canvas.height
    let frame = 0; let raf: number; let speed = 0; let targetSpeed = 0
    let engineInterval: ReturnType<typeof setInterval> | null = null

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const audioCtx = new AudioCtx()
      const engineRev = () => {
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        oscillator.type = 'sawtooth'
        oscillator.frequency.setValueAtTime(80, audioCtx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.4)
        oscillator.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.9)
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0)
        oscillator.start(audioCtx.currentTime)
        oscillator.stop(audioCtx.currentTime + 1.0)
      }
      engineRev()
      engineInterval = setInterval(engineRev, 3200)
    } catch(e) {}

    function draw() {
      ctx!.clearRect(0, 0, W, H)
      frame++
      if (frame % 60 === 0) targetSpeed = Math.random() * 220 + 80
      speed += (targetSpeed - speed) * 0.03
      const cx = W / 2; const cy = H * 0.6; const r = Math.min(W, H) * 0.38
      for (let i = 0; i < 12; i++) {
        const angle = (frame * 0.08 + i * 0.52) % (Math.PI * 2)
        const sx = cx + Math.cos(angle) * (r * 0.6)
        const sy = cy + Math.sin(angle) * (r * 0.6)
        const ex = cx + Math.cos(angle) * (r * 0.95)
        const ey = cy + Math.sin(angle) * (r * 0.95)
        ctx!.beginPath()
        ctx!.moveTo(sx, sy)
        ctx!.lineTo(ex, ey)
        ctx!.strokeStyle = `rgba(255,107,0,${0.1 + (i % 3) * 0.1})`
        ctx!.lineWidth = 1.5
        ctx!.stroke()
      }
      ctx!.beginPath()
      ctx!.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25)
      ctx!.strokeStyle = '#1A1A1A'
      ctx!.lineWidth = 14
      ctx!.stroke()
      const pct = speed / 300
      ctx!.beginPath()
      ctx!.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 0.75 + pct * Math.PI * 1.5)
      const grad = ctx!.createLinearGradient(cx - r, cy, cx + r, cy)
      grad.addColorStop(0, '#FF6B00')
      grad.addColorStop(1, '#FFFFFF')
      ctx!.strokeStyle = grad
      ctx!.lineWidth = 14
      ctx!.lineCap = 'round'
      ctx!.stroke()
      ctx!.fillStyle = '#FFFFFF'
      ctx!.font = `bold ${r * 0.5}px Calibri`
      ctx!.textAlign = 'center'
      ctx!.fillText(Math.round(speed).toString(), cx, cy + r * 0.15)
      ctx!.font = `${r * 0.18}px Calibri`
      ctx!.fillStyle = '#FF6B00'
      ctx!.fillText('KPIs/sec', cx, cy + r * 0.38)
      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      if (engineInterval) clearInterval(engineInterval)
    }
  }, [])
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
}

function CyberpunkGlitch() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const W = canvas.width; const H = canvas.height
    let frame = 0; let raf: number
    let glitchInterval: ReturnType<typeof setInterval> | null = null
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const audioCtx = new AudioCtx()
      const glitchBurst = () => {
        const bufferSize = audioCtx.sampleRate * 0.08
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15
        const source = audioCtx.createBufferSource()
        source.buffer = buffer
        const filter = audioCtx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.value = 800 + Math.random() * 1200
        source.connect(filter)
        filter.connect(audioCtx.destination)
        source.start()
      }
      glitchBurst()
      glitchInterval = setInterval(glitchBurst, 2800)
    } catch(e) {}
    function draw() {
      ctx!.fillStyle = 'rgba(0,0,0,0.15)'
      ctx!.fillRect(0, 0, W, H)
      frame++
      for (let y = 0; y < H; y += 4) {
        if (Math.random() > 0.97) {
          ctx!.fillStyle = `rgba(255,0,255,${Math.random() * 0.3})`
          ctx!.fillRect(0, y, W, 2)
        }
      }
      if (frame % 3 === 0) {
        const gridY = Math.floor(Math.random() * H)
        ctx!.beginPath()
        ctx!.moveTo(0, gridY)
        ctx!.lineTo(W, gridY)
        ctx!.strokeStyle = `rgba(0,255,255,${Math.random() * 0.4})`
        ctx!.lineWidth = 1
        ctx!.stroke()
      }
      for (let i = 0; i < 3; i++) {
        if (Math.random() > 0.85) {
          const bx = Math.random() * W; const by = Math.random() * H
          ctx!.fillStyle = `rgba(255,0,255,${Math.random() * 0.5})`
          ctx!.fillRect(bx, by, Math.random() * 120 + 20, Math.random() * 8 + 2)
        }
      }
      ctx!.strokeStyle = 'rgba(0,255,255,0.6)'
      ctx!.lineWidth = 1
      ctx!.beginPath()
      ctx!.moveTo(W / 2 - 20, H / 2); ctx!.lineTo(W / 2 + 20, H / 2)
      ctx!.moveTo(W / 2, H / 2 - 20); ctx!.lineTo(W / 2, H / 2 + 20)
      ctx!.stroke()
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      if (glitchInterval) clearInterval(glitchInterval)
    }
  }, [])
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
}

function AvengersShield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const W = canvas.width; const H = canvas.height
    let frame = 0; let raf: number
    function draw() {
      ctx!.clearRect(0, 0, W, H)
      frame++
      const cx = W / 2; const cy = H / 2
      const maxR = Math.min(W, H) * 0.38
      const rings = [maxR, maxR * 0.72, maxR * 0.44, maxR * 0.18]
      const colors = ['C9A84C', '1B3A6B', 'C9A84C', 'C9A84C']
      rings.forEach((r, i) => {
        const rotOffset = frame * (i % 2 === 0 ? 0.008 : -0.006) + i * 0.5
        for (let seg = 0; seg < 8; seg++) {
          const startA = rotOffset + seg * Math.PI / 4
          const endA = startA + Math.PI / 4 - 0.08
          const alpha = 0.4 + Math.sin(frame * 0.05 + i + seg) * 0.3
          ctx!.beginPath()
          ctx!.arc(cx, cy, r, startA, endA)
          ctx!.strokeStyle = `rgba(${parseInt(colors[i].slice(0,2),16)},${parseInt(colors[i].slice(2,4),16)},${parseInt(colors[i].slice(4,6),16)},${alpha})`
          ctx!.lineWidth = i === 0 ? 4 : 3
          ctx!.stroke()
        }
      })
      const glow = Math.sin(frame * 0.06) * 0.3 + 0.7
      ctx!.beginPath()
      ctx!.arc(cx, cy, 16, 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(201,168,76,${glow})`
      ctx!.fill()
      ctx!.save()
      ctx!.translate(cx, cy)
      ctx!.rotate(frame * 0.02)
      ctx!.beginPath()
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2
        const a2 = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2
        ctx!.lineTo(Math.cos(a) * 12, Math.sin(a) * 12)
        ctx!.lineTo(Math.cos(a2) * 5, Math.sin(a2) * 5)
      }
      ctx!.closePath()
      ctx!.fillStyle = '#1B3A6B'
      ctx!.fill()
      ctx!.strokeStyle = '#C9A84C'
      ctx!.lineWidth = 1
      ctx!.stroke()
      ctx!.restore()
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
}

function IronManReactor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hasSpoken = useRef(false)
  useEffect(() => {
    if (!hasSpoken.current && 'speechSynthesis' in window) {
      hasSpoken.current = true
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(JARVIS_LINE)
        utterance.rate = 0.88
        utterance.pitch = 0.75
        utterance.volume = 0.9
        const voices = window.speechSynthesis.getVoices()
        const preferred = voices.find(v =>
          v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('google uk') ||
          v.name.toLowerCase().includes('british') ||
          v.lang === 'en-GB'
        )
        if (preferred) utterance.voice = preferred
        window.speechSynthesis.speak(utterance)
      }, 600)
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const W = canvas.width; const H = canvas.height
    let frame = 0; let raf: number
    function draw() {
      ctx!.clearRect(0, 0, W, H)
      frame++
      const cx = W / 2; const cy = H / 2
      const pulse = Math.sin(frame * 0.07) * 0.15 + 0.85
      const rings = [
        { r: Math.min(W,H)*0.42, w: 2, color: 'FFD700', segments: 12 },
        { r: Math.min(W,H)*0.34, w: 1.5, color: 'FFA500', segments: 8 },
        { r: Math.min(W,H)*0.26, w: 2, color: 'FFD700', segments: 16 },
      ]
      rings.forEach((ring, ri) => {
        const rot = frame * (ri % 2 === 0 ? 0.01 : -0.008)
        for (let seg = 0; seg < ring.segments; seg++) {
          const start = rot + (seg / ring.segments) * Math.PI * 2
          const end = start + (Math.PI * 2 / ring.segments) * 0.88
          const alpha = 0.3 + Math.sin(frame * 0.05 + ri + seg * 0.5) * 0.25
          ctx!.beginPath()
          ctx!.arc(cx, cy, ring.r * pulse, start, end)
          ctx!.strokeStyle = `rgba(${parseInt(ring.color.slice(0,2),16)},${parseInt(ring.color.slice(2,4),16)},${parseInt(ring.color.slice(4,6),16)},${alpha})`
          ctx!.lineWidth = ring.w
          ctx!.stroke()
        }
      })
      const hudR = Math.min(W,H)*0.42
      ;[[0,-hudR,0,-hudR*0.55],[0,hudR,0,hudR*0.55],[-hudR,0,-hudR*0.55,0],[hudR,0,hudR*0.55,0]].forEach(([x1,y1,x2,y2]) => {
        ctx!.beginPath()
        ctx!.moveTo(cx+x1,cy+y1); ctx!.lineTo(cx+x2,cy+y2)
        ctx!.strokeStyle='rgba(255,215,0,0.35)'; ctx!.lineWidth=1; ctx!.stroke()
      })
      const coreR = Math.min(W,H)*0.1
      const glowGrad = ctx!.createRadialGradient(cx,cy,0,cx,cy,coreR*2.5)
      glowGrad.addColorStop(0,`rgba(0,210,255,${0.6*pulse})`)
      glowGrad.addColorStop(0.4,`rgba(0,150,255,${0.3*pulse})`)
      glowGrad.addColorStop(1,'rgba(0,0,0,0)')
      ctx!.beginPath(); ctx!.arc(cx,cy,coreR*2.5,0,Math.PI*2)
      ctx!.fillStyle=glowGrad; ctx!.fill()
      ctx!.save(); ctx!.translate(cx,cy); ctx!.rotate(frame*0.015)
      ctx!.beginPath()
      for (let i=0;i<6;i++){
        const a=(i*Math.PI)/3
        i===0?ctx!.moveTo(Math.cos(a)*coreR,Math.sin(a)*coreR):ctx!.lineTo(Math.cos(a)*coreR,Math.sin(a)*coreR)
      }
      ctx!.closePath()
      ctx!.fillStyle=`rgba(0,180,255,${0.7*pulse})`; ctx!.fill()
      ctx!.strokeStyle='#FFD700'; ctx!.lineWidth=2; ctx!.stroke()
      ctx!.restore()
      ctx!.beginPath(); ctx!.arc(cx,cy,coreR*0.35,0,Math.PI*2)
      ctx!.fillStyle=`rgba(200,240,255,${pulse})`; ctx!.fill()
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
}

export default function AILoadingAnimation() {
  const { themeId } = useKinalysTheme()
  const [msgIdx, setMsgIdx] = useState(0)
  const messages = LOADING_MESSAGES[themeId] || LOADING_MESSAGES.light

  useEffect(() => {
    setMsgIdx(0)
    const interval = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % messages.length)
    }, themeId === 'ironman' ? 8000 : 3500)
    return () => clearInterval(interval)
  }, [themeId, messages.length])

  const bgMap: Record<string, string> = {
    light: '#F0FDFA', dark: '#0F172A', matcha: '#F0F5F0',
    coffee: '#1A0A00', cyberpunk: '#0A000F', nfs: '#0A0A0A',
    matrix: '#000000', avengers: '#0A0F1E', ironman: '#0A0A0A',
  }
  const textMap: Record<string, string> = {
    light: '#0D9488', dark: '#14B8A6', matcha: '#4A7C59',
    coffee: '#F5D9B0', cyberpunk: '#FF00FF', nfs: '#FF6B00',
    matrix: '#00FF41', avengers: '#C9A84C', ironman: '#FFD700',
  }
  const fontMap: Record<string, string> = {
    cyberpunk: 'monospace', nfs: 'Impact, sans-serif',
    matrix: 'monospace', ironman: "'Courier New', monospace",
    avengers: 'Georgia, serif',
  }

  const bg = bgMap[themeId] || '#F0FDFA'
  const textColor = textMap[themeId] || '#0D9488'
  const font = fontMap[themeId] || 'Calibri, sans-serif'
  const needsGlow = ['matrix','cyberpunk','ironman','nfs','coffee'].includes(themeId)
  const needsBg = ['coffee','matrix','cyberpunk','nfs','ironman','avengers'].includes(themeId)

  function renderAnimation() {
    switch (themeId) {
      case 'matrix':    return <MatrixRain />
      case 'coffee':    return <CoffeeBrew />
      case 'matcha':    return <MatchaInk />
      case 'nfs':       return <NFSSpeed />
      case 'cyberpunk': return <CyberpunkGlitch />
      case 'avengers':  return <AvengersShield />
      case 'ironman':   return <IronManReactor />
      case 'dark':      return <NeuralNetwork color1='#0D9488' color2='#14B8A6' />
      default:          return <NeuralNetwork color1='#0D9488' color2='#0D9488' />
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '340px', background: bg, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '36px' }}>
      {renderAnimation()}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: needsBg ? '10px 24px' : '0 24px', background: needsBg ? 'rgba(0,0,0,0.55)' : 'transparent', borderRadius: '8px', maxWidth: '560px' }}>
        <div style={{ fontSize: themeId === 'ironman' ? '11px' : '13px', fontFamily: font, color: textColor, fontWeight: 600, letterSpacing: ['matrix','cyberpunk'].includes(themeId) ? '2px' : '0.5px', lineHeight: 1.6, textShadow: needsGlow ? `0 0 12px ${textColor}` : 'none' }}>
          {messages[msgIdx]}
        </div>
        <div style={{ marginTop: '10px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
          {messages.map((_, i) => (
            <div key={i} style={{ width: i === msgIdx ? '20px' : '6px', height: '6px', borderRadius: '3px', background: textColor, opacity: i === msgIdx ? 1 : 0.3, transition: 'all 0.4s ease' }} />
          ))}
        </div>
      </div>
    </div>
  )
}