import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import facade from 'data-url:./assets/facade.webp'
import hall from 'data-url:./assets/hall.webp'
import stage from 'data-url:./assets/stage.jpg'
import balcony from 'data-url:./assets/balcony.jpg'

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const range = (p: number, a: number, b: number) => clamp((p - a) / (b - a))
const ease = (t: number) => t * t * (3 - 2 * t)

const load = (src: string) =>
  new Promise<HTMLImageElement>((res) => {
    const i = new Image()
    i.onload = () => res(i)
    i.src = src
  })

/** Stitch photos into one seamless 360° strip with feathered overlaps. */
function buildPanorama(imgs: HTMLImageElement[], flipLast: boolean) {
  const N = imgs.length
  const S = 1024
  const W = S * N
  const ov = 220
  const c = document.createElement('canvas')
  c.width = W
  c.height = S
  const ctx = c.getContext('2d')!
  imgs.forEach((img, i) => {
    const tw = S + ov * 2
    const t = document.createElement('canvas')
    t.width = tw
    t.height = S
    const t2 = t.getContext('2d')!
    const sc = Math.max(tw / img.width, S / img.height)
    const w = img.width * sc
    const h = img.height * sc
    t2.save()
    if (flipLast && i === N - 1) {
      t2.translate(tw, 0)
      t2.scale(-1, 1)
    }
    t2.drawImage(img, (tw - w) / 2, (S - h) / 2, w, h)
    t2.restore()
    const g = t2.createLinearGradient(0, 0, tw, 0)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(ov / tw, 'rgba(0,0,0,1)')
    g.addColorStop(1 - ov / tw, 'rgba(0,0,0,1)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    t2.globalCompositeOperation = 'destination-in'
    t2.fillStyle = g
    t2.fillRect(0, 0, tw, S)
    const x = i * S - ov
    ctx.drawImage(t, x, 0)
    if (x < 0) ctx.drawImage(t, x + W, 0)
    if (x + tw > W) ctx.drawImage(t, x - W, 0)
  })
  return c
}

const chapters = [
  { a: 0.0, b: 0.16, k: 'I', t: 'The Façade', s: 'Sandstone, domes and a quiet fountain on Gezira Island.' },
  { a: 0.2, b: 0.3, k: 'II', t: 'Step Inside', s: 'The doors open onto the Grand Theatre.' },
  { a: 0.36, b: 0.5, k: 'III', t: 'The Hall', s: 'Rose-velvet seats rise in a deep horseshoe beneath a blossom of light.' },
  { a: 0.54, b: 0.68, k: 'IV', t: 'The Stage', s: 'Curtain, proscenium and a thousand lit rows of attention.' },
  { a: 0.72, b: 0.86, k: 'V', t: 'The Balconies', s: 'Tiers wrap the room in white-trimmed curves.' },
  { a: 0.9, b: 1.01, k: 'VI', t: 'Full Circle', s: 'Take your seat. The performance is about to begin.' },
]

export default function App() {
  const wrap = useRef<HTMLDivElement>(null)
  const mount = useRef<HTMLDivElement>(null)
  const facadeEl = useRef<HTMLDivElement>(null)
  const hud = useRef<HTMLDivElement>(null)
  const hero = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(0)
  const [ready, setReady] = useState(false)
  const target = useRef(0)

  useEffect(() => {
    let raf = 0
    let disposed = false
    let cleanup = () => {}

    ;(async () => {
      const [, h, s, b] = await Promise.all([facade, hall, stage, balcony].map(load))
      if (disposed) return
      const pano = buildPanorama([h, s, b, h], true)

      const el = mount.current!
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      renderer.setSize(el.clientWidth, el.clientHeight)
      el.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(70, el.clientWidth / el.clientHeight, 0.01, 10)
      const tex = new THREE.CanvasTexture(pano)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
      const R = 1
      const geo = new THREE.CylinderGeometry(R, R, 2.0 * R, 96, 1, true)
      const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.scale.x = -1
      scene.add(mesh)

      const onResize = () => {
        renderer.setSize(el.clientWidth, el.clientHeight)
        camera.aspect = el.clientWidth / el.clientHeight
        camera.updateProjectionMatrix()
      }
      addEventListener('resize', onResize)

      let cur = 0
      const tick = () => {
        cur += (target.current - cur) * 0.08
        const pr = cur
        // entering: wide fov + pushed forward, then settle at centre
        const enter = ease(range(pr, 0.2, 0.36))
        // 360° spin spans 0.3 → 1
        const spin = ease(range(pr, 0.3, 1))
        camera.fov = 105 - 35 * enter
        camera.updateProjectionMatrix()
        camera.rotation.order = 'YXZ'
        camera.rotation.y = -spin * Math.PI * 2
        camera.rotation.x = 0
        camera.position.set(0, 0, 0)
        renderer.render(scene, camera)

        // facade zoom + crossfade
        const z = ease(range(pr, 0, 0.26))
        if (facadeEl.current) {
          facadeEl.current.style.transform = `scale(${1 + z * 6})`
          facadeEl.current.style.opacity = String(1 - ease(range(pr, 0.2, 0.31)))
          facadeEl.current.style.filter = `brightness(${1 - z * 0.45})`
        }
        el.style.opacity = String(ease(range(pr, 0.2, 0.31)))
        if (hero.current) hero.current.style.opacity = String(1 - range(pr, 0, 0.1))
        setP((old) => (Math.abs(old - pr) > 0.0015 ? pr : old))
        raf = requestAnimationFrame(tick)
      }
      tick()
      setReady(true)

      cleanup = () => {
        removeEventListener('resize', onResize)
        renderer.dispose()
        el.removeChild(renderer.domElement)
      }
    })()

    const onScroll = () => {
      const w = wrap.current!
      const max = w.offsetHeight - innerHeight
      target.current = clamp(-w.getBoundingClientRect().top / max)
    }
    addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      removeEventListener('scroll', onScroll)
      cleanup()
    }
  }, [])

  const deg = Math.round(range(p, 0.3, 1) * 360)

  return (
    <div ref={wrap} style={{ height: '900vh', background: '#0b0605' }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ fontFamily: "'Jost', sans-serif", color: '#f6ece4' }}>
        {/* 360 hall */}
        <div ref={mount} className="absolute inset-0" style={{ opacity: 0 }} />

        {/* facade */}
        <div
          ref={facadeEl}
          className="absolute inset-0 will-change-transform"
          style={{
            backgroundImage: `url(${facade})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transformOrigin: '53% 68%',
          }}
        />

        {/* vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(8,3,2,.75), transparent 38%), radial-gradient(ellipse at center, transparent 55%, rgba(8,3,2,.6) 100%)' }}
        />

        {/* hero title */}
        <div ref={hero} className="absolute left-6 top-24 md:left-16 md:top-28">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] opacity-80">Gezira · Cairo</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300 }} className="text-5xl leading-[0.95] md:text-8xl">
            Cairo
            <br />
            <em>Opera House</em>
          </h1>
          <p className="mt-6 text-xs uppercase tracking-[0.3em] opacity-70">Scroll to enter ↓</p>
        </div>

        {/* chapter captions */}
        {chapters.map((c) => {
          const o = ease(range(p, c.a, c.a + 0.03)) * (1 - ease(range(p, c.b - 0.03, c.b)))
          return (
            <div
              key={c.k}
              className="pointer-events-none absolute bottom-14 left-6 max-w-md md:bottom-20 md:left-16"
              style={{ opacity: c.k === 'I' ? 0 : o, transform: `translateY(${(1 - o) * 18}px)` }}
            >
              <p className="mb-2 text-xs tracking-[0.4em] opacity-70">{c.k}</p>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300 }} className="text-4xl md:text-6xl">
                {c.t}
              </h2>
              <p className="mt-3 text-sm leading-relaxed opacity-80 md:text-base">{c.s}</p>
            </div>
          )
        })}

        {/* compass / progress */}
        <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-3 md:flex md:right-12">
          <div className="h-40 w-px bg-white/25">
            <div className="w-px bg-white" style={{ height: `${p * 100}%` }} />
          </div>
          <span className="text-xs tabular-nums tracking-[0.25em] opacity-80">{String(deg).padStart(3, '0')}°</span>
        </div>

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b0605] text-xs uppercase tracking-[0.4em]">Loading…</div>
        )}
      </div>
    </div>
  )
}
