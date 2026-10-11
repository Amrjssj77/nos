import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import stagePic from 'data-url:./assets/stage.jpg'
import { buildWorld, ZC } from './scene'

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const range = (p: number, a: number, b: number) => clamp((p - a) / (b - a))
const ease = (t: number) => t * t * (3 - 2 * t)
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

const chapters = [
  { a: 0.0, b: 0.15, k: 'I', t: 'The Façade', s: 'Sandstone, domes and a quiet fountain on Gezira Island.' },
  { a: 0.17, b: 0.31, k: 'II', t: 'The Doors Open', s: 'Bronze doors swing inward onto a warm lobby.' },
  { a: 0.31, b: 0.42, k: 'III', t: 'The Lobby', s: 'A short walk, then the room opens up.' },
  { a: 0.44, b: 0.58, k: 'IV', t: 'The Grand Hall', s: 'A fan of rose-velvet seats beneath a blossom of light.' },
  { a: 0.66, b: 0.84, k: 'V', t: 'The Balconies', s: 'Two tiers wrap the room in white-trimmed curves.' },
  { a: 0.9, b: 1.01, k: 'VI', t: 'Full Circle', s: 'Take your seat. The performance is about to begin.' },
]

// camera path (progress 0 → ORBIT_AT) + look-at path
const PATH = new THREE.CatmullRomCurve3([
  V(0, 3.4, 50), V(4, 3.0, 32), V(1.5, 2.5, 15), V(0, 2.1, 6.5), V(0, 1.85, 1.0),
  V(0, 1.85, -5), V(0, 2.9, -10.5), V(0, 3.3, -16), V(0, 3.4, -24),
], false, 'centripetal')
const LOOK = new THREE.CatmullRomCurve3([
  V(0, 6, 0), V(0, 5, 0), V(0, 4.2, 0), V(0, 3.6, -4), V(0, 3.0, -10),
  V(0, 2.6, -18), V(0, 3.6, -34), V(0, 5, ZC - 8), V(0, 5.8, ZC - 12),
], false, 'centripetal')
const ORBIT_AT = 0.56

export default function App() {
  const wrap = useRef<HTMLDivElement>(null)
  const mount = useRef<HTMLDivElement>(null)
  const hero = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(0)
  const [ready, setReady] = useState(false)
  const target = useRef(0)

  useEffect(() => {
    const el = mount.current!
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)

    const tex = new THREE.TextureLoader().load(stagePic)
    tex.colorSpace = THREE.SRGBColorSpace
    const { world, hall, doors, hemi, sun, amb, hallLights } = buildWorld(tex)
    const scene = new THREE.Scene()
    scene.add(world)
    const camera = new THREE.PerspectiveCamera(62, el.clientWidth / el.clientHeight, 0.1, 600)
    camera.rotation.order = 'YXZ'

    const onResize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight)
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
    }
    addEventListener('resize', onResize)

    const onScroll = () => {
      const w = wrap.current!
      target.current = clamp(-w.getBoundingClientRect().top / (w.offsetHeight - innerHeight))
    }
    addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    let cur = 0, raf = 0
    const tmp = new THREE.Vector3(), look = new THREE.Vector3()
    const tick = () => {
      cur += (target.current - cur) * 0.07
      const pr = cur

      const u = ease(range(pr, 0, ORBIT_AT)) * 0.35 + range(pr, 0, ORBIT_AT) * 0.65
      PATH.getPoint(u, camera.position)
      LOOK.getPoint(u, look)
      if (pr < ORBIT_AT) {
        camera.lookAt(look)
      } else {
        const spin = ease(range(pr, ORBIT_AT, 1))
        const end = LOOK.getPoint(1, tmp)
        const dir = end.clone().sub(camera.position)
        const basePitch = Math.atan2(dir.y, Math.hypot(dir.x, dir.z))
        camera.rotation.y = -spin * Math.PI * 2
        camera.rotation.x = basePitch + 0.6 * Math.sin(spin * Math.PI) * Math.sin(spin * Math.PI)
        camera.rotation.z = 0
      }
      camera.fov = 62 + 14 * ease(range(pr, 0.4, 0.58))
      camera.updateProjectionMatrix()

      // doors
      const open = ease(range(pr, 0.15, 0.3)) * 1.8
      doors[0].rotation.y = open
      doors[1].rotation.y = -open

      // light balance: sunset outside → warm interior
      const inside = ease(range(pr, 0.24, 0.36))
      sun.intensity = 2.4 * (1 - inside)
      hemi.intensity = 1.0 - 0.75 * inside
      amb.intensity = 0.18 * inside
      hall.visible = pr > 0.2
      hallLights.forEach((l) => (l.visible = true))

      renderer.render(scene, camera)
      if (hero.current) hero.current.style.opacity = String(1 - range(pr, 0, 0.09))
      setP((o) => (Math.abs(o - pr) > 0.0015 ? pr : o))
      raf = requestAnimationFrame(tick)
    }
    tick()
    setReady(true)

    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onResize)
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [])

  const deg = Math.round(range(p, ORBIT_AT, 1) * 360)

  return (
    <div ref={wrap} style={{ height: '900vh', background: '#0b0605' }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ fontFamily: "'Jost', sans-serif", color: '#f6ece4' }}>
        <div ref={mount} className="absolute inset-0" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(8,3,2,.7), transparent 35%), radial-gradient(ellipse at center, transparent 58%, rgba(8,3,2,.55) 100%)' }}
        />
        <div ref={hero} className="absolute left-6 top-24 md:left-16 md:top-28">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] opacity-80">Gezira · Cairo</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300 }} className="text-5xl leading-[0.95] md:text-8xl">
            Cairo<br /><em>Opera House</em>
          </h1>
          <p className="mt-6 text-xs uppercase tracking-[0.3em] opacity-70">Scroll to enter ↓</p>
        </div>
        {chapters.slice(1).map((c) => {
          const o = ease(range(p, c.a, c.a + 0.03)) * (1 - ease(range(p, c.b - 0.03, c.b)))
          return (
            <div key={c.k} className="pointer-events-none absolute bottom-14 left-6 max-w-md md:bottom-20 md:left-16" style={{ opacity: o, transform: `translateY(${(1 - o) * 18}px)` }}>
              <p className="mb-2 text-xs tracking-[0.4em] opacity-70">{c.k}</p>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300 }} className="text-4xl md:text-6xl">{c.t}</h2>
              <p className="mt-3 text-sm leading-relaxed opacity-80 md:text-base">{c.s}</p>
            </div>
          )
        })}
        <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-3 md:flex md:right-12">
          <div className="h-40 w-px bg-white/25"><div className="w-px bg-white" style={{ height: `${p * 100}%` }} /></div>
          <span className="text-xs tabular-nums tracking-[0.25em] opacity-80">{String(deg).padStart(3, '0')}°</span>
        </div>
        {!ready && <div className="absolute inset-0 flex items-center justify-center bg-[#0b0605] text-xs uppercase tracking-[0.4em]">Loading…</div>}
      </div>
    </div>
  )
}
