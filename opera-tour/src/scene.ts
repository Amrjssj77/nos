import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const ZC = -42 // stage-front centre of the fan-shaped hall
export const HALL_R = 32
const rake = (r: number) => Math.max(0, (r - 6) * 0.046)

const lam = (color: number, extra: Partial<THREE.MeshLambertMaterialParameters> = {}) =>
  new THREE.MeshLambertMaterial({ color, ...extra })

function stoneTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#d9c29b'
  g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = `rgba(${120 + Math.random() * 60},${100 + Math.random() * 50},70,${Math.random() * 0.07})`
    g.fillRect(Math.random() * 256, Math.random() * 256, 3, 3)
  }
  g.strokeStyle = 'rgba(110,88,60,.55)'
  g.lineWidth = 2
  for (let y = 0; y <= 256; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke() }
  for (let r = 0; r < 2; r++) {
    const off = r % 2 ? 0 : 128
    g.beginPath(); g.moveTo(off, r * 128); g.lineTo(off, r * 128 + 128); g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function buildWorld(stagePhoto: THREE.Texture) {
  const world = new THREE.Group()
  const stone = stoneTexture()
  const stoneMat = (rx: number, ry: number) => {
    const t = stone.clone()
    t.needsUpdate = true
    t.repeat.set(Math.max(1, rx / 3), Math.max(1, ry / 2))
    return lam(0xffffff, { map: t })
  }
  const stoneBox = (w: number, h: number, d: number) =>
    new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [
      stoneMat(d, h), stoneMat(d, h), stoneMat(w, d), stoneMat(w, d), stoneMat(w, h), stoneMat(w, h),
    ])

  /* ───────────── sky ───────────── */
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(300, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {},
      vertexShader: 'varying vec3 v; void main(){ v = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `varying vec3 v; void main(){
        float h = clamp(v.y,0.,1.);
        vec3 top = vec3(.36,.46,.66), mid = vec3(.93,.78,.62), low = vec3(.98,.85,.62);
        vec3 c = mix(low, mid, smoothstep(0.,.18,h)); c = mix(c, top, smoothstep(.12,.7,h));
        float s = max(dot(normalize(v), normalize(vec3(.55,.09,.6))),0.);
        c += vec3(1.,.8,.5)*pow(s,24.)*.9 + vec3(1.,.9,.7)*pow(s,300.);
        float n = sin(v.x*18.+v.y*9.)*sin(v.z*14.-v.y*7.)*.5+.5; c = mix(c, c*1.08+.05, n*smoothstep(.1,.5,h)*.35);
        gl_FragColor = vec4(c,1.); }`,
    }),
  )
  world.add(sky)

  /* ───────────── plaza ───────────── */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), lam(0x9b7f68))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.02
  world.add(ground)
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(24, 64), lam(0xb08c78))
  plaza.rotation.x = -Math.PI / 2
  plaza.position.set(0, 0, 18)
  world.add(plaza)

  // fountain
  const tile = document.createElement('canvas')
  tile.width = 128; tile.height = 64
  const tg = tile.getContext('2d')!
  tg.fillStyle = '#f3ead8'; tg.fillRect(0, 0, 128, 64)
  tg.strokeStyle = '#1b2a4a'; tg.lineWidth = 3
  for (let x = 0; x < 128; x += 32) { tg.beginPath(); tg.moveTo(x, 0); tg.lineTo(x + 16, 32); tg.lineTo(x, 64); tg.moveTo(x + 32, 0); tg.lineTo(x + 16, 32); tg.lineTo(x + 32, 64); tg.stroke() }
  const tt = new THREE.CanvasTexture(tile); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(8, 1); tt.colorSpace = THREE.SRGBColorSpace
  const fountain = new THREE.Group()
  fountain.add(new THREE.Mesh(new THREE.CylinderGeometry(5.4, 6.2, 1.2, 48, 1, true), lam(0xffffff, { map: tt })))
  const water = new THREE.Mesh(new THREE.CircleGeometry(5.4, 48), new THREE.MeshLambertMaterial({ color: 0x14203a, emissive: 0x0a1020 }))
  water.rotation.x = -Math.PI / 2; water.position.y = 1.0; fountain.add(water)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 6.9, 0.3, 48), lam(0xcdb89a))
  base.position.y = 0.15; fountain.add(base)
  fountain.position.set(0, 0, 17)
  world.add(fountain)

  // hedges
  const hedgeMat = lam(0x3f6b34)
  for (let i = 0; i < 20; i++) {
    const a = Math.PI * (0.12 + (i / 19) * 0.76) + Math.PI
    for (const side of [1]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.0, 1.4), hedgeMat)
      m.position.set(Math.cos(a) * 11.5, 0.5, 17 - Math.sin(a) * 11.5 * side)
      m.rotation.y = a + Math.PI / 2
      world.add(m)
    }
  }
  // bare trees
  const bark = lam(0x4a3a2e)
  ;[[-26, 14], [27, 11], [30, 26], [-30, 28]].forEach(([x, z]) => {
    const t = new THREE.Group()
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 7, 6), bark)
    trunk.position.y = 3.5; t.add(trunk)
    for (let i = 0; i < 7; i++) {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.2, 4, 5), bark)
      br.position.set(Math.sin(i * 1.7) * 1.2, 6 + (i % 3), Math.cos(i * 1.7) * 1.2)
      br.rotation.set(Math.cos(i * 1.7) * 0.7, 0, -Math.sin(i * 1.7) * 0.7)
      t.add(br)
    }
    t.position.set(x, 0, z)
    world.add(t)
  })

  /* ───────────── façade ───────────── */
  const W = 20, H = 9, DOOR_W = 5.2, DOOR_H = 5.4
  const wall = new THREE.Shape()
  wall.moveTo(-W / 2, -1); wall.lineTo(W / 2, -1); wall.lineTo(W / 2, H); wall.lineTo(-W / 2, H); wall.closePath()
  const hole = new THREE.Path()
  hole.moveTo(-DOOR_W / 2, -0.5); hole.lineTo(DOOR_W / 2, -0.5); hole.lineTo(DOOR_W / 2, DOOR_H)
  hole.absarc(0, DOOR_H, DOOR_W / 2, 0, Math.PI, false); hole.lineTo(-DOOR_W / 2, -0.5)
  wall.holes.push(hole)
  const stoneSolid = lam(0xd9c29b, { map: stone })
  const centre = new THREE.Mesh(new THREE.ExtrudeGeometry(wall, { depth: 2.2, bevelEnabled: false }), stoneSolid)
  centre.geometry.translate(0, 0, -2.2)
  const uvScale = new THREE.Matrix4().makeScale(1 / 4, 1 / 4, 1)
  const uv = centre.geometry.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 4, uv.getY(i) / 4)
  void uvScale
  world.add(centre)

  const upper = stoneBox(14, 6.5, 14); upper.position.set(0, H + 3.25 - 0.5, -9); world.add(upper)
  const upper2 = stoneBox(18, 1.2, 14); upper2.position.set(0, H + 0.1, -7.5); world.add(upper2)
  // arched window on tower
  const win = new THREE.Mesh(
    new THREE.CircleGeometry(2.2, 24, 0, Math.PI),
    lam(0x3b2f26, { emissive: 0x6a4a2a }),
  )
  win.position.set(0, H + 3.4, -1.98); world.add(win)
  const balc = stoneBox(7.5, 0.5, 1.2); balc.position.set(0, H + 3.0, -2.4); world.add(balc)

  const domeMat = lam(0xcdb8a0)
  const dome1 = new THREE.Mesh(new THREE.SphereGeometry(5.6, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), domeMat)
  dome1.position.set(0, H + 6.0, -9); world.add(dome1)
  const dome2 = new THREE.Mesh(new THREE.SphereGeometry(3.8, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMat)
  dome2.position.set(0, H + 9.8, -9); world.add(dome2)

  // wings
  for (const s of [-1, 1]) {
    const wing = stoneBox(18, 8, 14); wing.position.set(s * 19, 4, -7); world.add(wing)
    const niche = new THREE.Mesh(
      (() => {
        const sh = new THREE.Shape()
        sh.moveTo(-3.4, 0); sh.lineTo(3.4, 0); sh.lineTo(3.4, 3.8); sh.absarc(0, 3.8, 3.4, 0, Math.PI, false); sh.lineTo(-3.4, 0)
        return new THREE.ShapeGeometry(sh)
      })(),
      lam(0xbfa57c),
    )
    niche.position.set(s * 19, 0.4, 0.03); world.add(niche)
    // small arched slits
    for (const dx of [-7, 7]) {
      const slit = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 2.2), lam(0x40342a))
      slit.position.set(s * 19 + dx, 6.4, 0.03); world.add(slit)
    }
    // statue + plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.4), lam(0xb9a381))
    plinth.position.set(s * 8.2, 0.5, 2.2); world.add(plinth)
    const statue = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.2, 0.8), lam(0x2c2824))
    statue.position.set(s * 8.2, 2.1, 2.2); world.add(statue)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), lam(0x2c2824))
    head.position.set(s * 8.2, 3.5, 2.2); world.add(head)
    // planters
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.7, 10), lam(0x8a4a38))
    pot.position.set(s * 11.5, 0.35, 1.2); world.add(pot)
    const plant = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 8), lam(0x2f5a2c))
    plant.position.set(s * 11.5, 1.8, 1.2); world.add(plant)
  }
  // arcade on façade sides (blind arches)
  for (const s of [-1, 1]) for (const dx of [6.9, 9.0]) {
    const a = new THREE.Mesh(new THREE.CircleGeometry(1.0, 16, 0, Math.PI), lam(0x3b2f26))
    a.position.set(s * (dx - 0.9) + (s > 0 ? 0 : 0), 6.0, 0.04)
    a.position.x = s * (dx + 0.0)
    world.add(a)
  }

  // doors
  const bronze = lam(0x3a2a1c)
  const glass = new THREE.MeshBasicMaterial({ color: 0xffdca0 })
  const transom = new THREE.Mesh(new THREE.CircleGeometry(DOOR_W / 2 - 0.1, 24, 0, Math.PI), glass)
  transom.position.set(0, DOOR_H, -1.2); world.add(transom)
  const leafW = DOOR_W / 2
  const doors: THREE.Group[] = []
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group()
    pivot.position.set(s * (DOOR_W / 2), 0, -1.2)
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, DOOR_H, 0.14), bronze)
    leaf.position.set(-s * leafW / 2, DOOR_H / 2, 0)
    const pane = new THREE.Mesh(new THREE.BoxGeometry(leafW - 0.5, DOOR_H - 0.9, 0.16), glass)
    pane.position.copy(leaf.position)
    pivot.add(leaf, pane)
    doors.push(pivot); world.add(pivot)
  }

  /* ───────────── lobby ───────────── */
  const lobbyWall = lam(0xb59568, { emissive: 0x1c1208, side: THREE.DoubleSide })
  const lobbyLen = 8
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(lobbyLen + 0.2, 7.5), lobbyWall)
    w.position.set(s * 10, 3.75, -2 - lobbyLen / 2); w.rotation.y = -s * Math.PI / 2; world.add(w)
  }
  const lobbyCeil = new THREE.Mesh(new THREE.PlaneGeometry(20, lobbyLen), lam(0xcdb890, { emissive: 0x2a1c0c }))
  lobbyCeil.rotation.x = Math.PI / 2; lobbyCeil.position.set(0, 7.5, -2 - lobbyLen / 2); world.add(lobbyCeil)
  for (const s of [-1, 1]) {
    const lb = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 7.5), lobbyWall)
    lb.position.set(s * 6.6, 3.75, -2 - lobbyLen); world.add(lb)
  }
  // ramp floor
  const ramp = new THREE.BufferGeometry()
  const y1 = rake(HALL_R)
  ramp.setAttribute('position', new THREE.Float32BufferAttribute([-10, 0, -2, 10, 0, -2, 10, y1, -10, -10, y1, -10], 3))
  ramp.setIndex([0, 2, 1, 0, 3, 2]); ramp.computeVertexNormals()
  const rampM = new THREE.Mesh(ramp, new THREE.MeshLambertMaterial({ color: 0x8c1d1d, side: THREE.DoubleSide, emissive: 0x2a0606 }))
  world.add(rampM)
  // entrance floor strip (through door)
  const sill = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, 0.05, 2.2), lam(0x8c1d1d)); sill.position.set(0, 0.0, -1.1); world.add(sill)
  // lobby chandeliers
  for (const z of [-4.5, -8]) {
    const ch = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe2b0 }))
    ch.position.set(0, 6.4, z); world.add(ch)
    const cl = new THREE.PointLight(0xffd6a0, 7, 0, 1); cl.position.set(0, 6.0, z); world.add(cl)
  }

  /* ───────────── auditorium ───────────── */
  const hall = new THREE.Group()
  hall.position.set(0, 0, ZC)
  world.add(hall)
  const T0 = -1.4, TL = 2.8, GAP = 0.1
  const wallRose = lam(0x5a2323, { emissive: 0x180707, side: THREE.BackSide })
  for (const [a, b] of [[T0, -GAP], [GAP, T0 + TL]]) {
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(HALL_R, HALL_R, 22, 48, 1, true, a, b - a), wallRose)
    cyl.position.y = 11; hall.add(cyl)
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(6.4, 14, 0.6), wallRose.clone())
  ;(lintel.material as THREE.MeshLambertMaterial).side = THREE.FrontSide
  lintel.position.set(0, 7.5 + 7, HALL_R - 0.2); hall.add(lintel)
  // fan side walls to proscenium
  for (const s of [-1, 1]) {
    const ex = s * HALL_R * Math.sin(1.4), ez = HALL_R * Math.cos(1.4)
    const q = new THREE.BufferGeometry()
    q.setAttribute('position', new THREE.Float32BufferAttribute([s * 10, 0, 0, ex, 0, ez, ex, 22, ez, s * 10, 22, 0], 3))
    q.setIndex([0, 1, 2, 0, 2, 3]); q.computeVertexNormals()
    hall.add(new THREE.Mesh(q, lam(0x5a2323, { emissive: 0x180707, side: THREE.DoubleSide })))
    // stage-house sides
    const hs = new THREE.Mesh(new THREE.PlaneGeometry(18, 22), lam(0x2b1010, { side: THREE.DoubleSide }))
    hs.position.set(s * 10, 11, -9); hs.rotation.y = Math.PI / 2; hall.add(hs)
  }
  const back = new THREE.Mesh(new THREE.PlaneGeometry(20, 22), lam(0x2b1010)); back.position.set(0, 11, -18); hall.add(back)
  // ceiling
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(70, 52), lam(0x5a2323, { emissive: 0x1d0808 }))
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 21, 7); hall.add(ceil)
  // proscenium top
  const pro = new THREE.Mesh(new THREE.BoxGeometry(20.6, 9, 1), lam(0x7d3333, { emissive: 0x2a0d0d })); pro.position.set(0, 17.2, 0); hall.add(pro)
  const gold = new THREE.MeshBasicMaterial({ color: 0xd9ae55 })
  const valance = new THREE.Mesh(new THREE.BoxGeometry(20, 1.6, 0.6), lam(0x6e0f1a, { emissive: 0x2a0408 })); valance.position.set(0, 11.2, -0.5); hall.add(valance)
  const strip = new THREE.Mesh(new THREE.BoxGeometry(20, 0.18, 0.62), gold); strip.position.set(0, 10.35, -0.5); hall.add(strip)
  for (const s of [-1, 1]) {
    const cur = new THREE.Mesh(new THREE.BoxGeometry(3.2, 12, 1), lam(0x6e0f1a, { emissive: 0x2a0408 })); cur.position.set(s * 8.4, 5.2, -1); hall.add(cur)
  }
  // stage
  const stg = new THREE.Mesh(new THREE.BoxGeometry(20, 1.0, 18), lam(0xb88a58)); stg.position.set(0, 0.5, -9); hall.add(stg)
  stagePhoto.repeat.set(0.38, 0.42); stagePhoto.offset.set(0.58, 0.42)
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(17, 11), new THREE.MeshBasicMaterial({ map: stagePhoto, color: 0xdddddd }))
  backdrop.position.set(0, 6.6, -17.9); hall.add(backdrop)
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(17, 11), new THREE.MeshBasicMaterial({ color: 0x1a2a6a, transparent: true, opacity: 0.18 })); sh.position.set(0, 6.6, -17.8); hall.add(sh)

  // raked floor (lathe: x = r sinφ, z = r cosφ)
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0), new THREE.Vector2(6, 0)]
  for (let r = 7; r <= HALL_R; r += 1) pts.push(new THREE.Vector2(r, rake(r)))
  const floor = new THREE.Mesh(new THREE.LatheGeometry(pts, 64, T0, TL), new THREE.MeshLambertMaterial({ color: 0x6b1818, emissive: 0x160404, side: THREE.DoubleSide }))
  hall.add(floor)
  const pitFill = new THREE.Mesh(new THREE.PlaneGeometry(70, 30), lam(0x3a0e0e)); pitFill.rotation.x = -Math.PI / 2; pitFill.position.set(0, -0.01, 5); hall.add(pitFill)

  // seats (instanced, merged geometry)
  const seatGeo = (() => {
    const base = new THREE.BoxGeometry(0.62, 0.22, 0.6); base.translate(0, 0.45, 0)
    const back = new THREE.BoxGeometry(0.62, 0.8, 0.14); back.translate(0, 0.9, 0.28)
    const arm = new THREE.BoxGeometry(0.06, 0.35, 0.55); arm.translate(0.33, 0.62, 0)
    const stem = new THREE.BoxGeometry(0.3, 0.4, 0.3); stem.translate(0, 0.2, 0.05)
    return mergeGeometries([base, back, arm, stem])!
  })()
  const seatMat = new THREE.MeshLambertMaterial({ color: 0x8f2a22, emissive: 0x1c0604 })
  const seatsAt: THREE.Matrix4[] = []
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler()
  const addRow = (r: number, y: number, tMax: number, aisle = 0.07) => {
    const step = 0.72 / r
    for (let t = step / 2; t < tMax; t += step) {
      for (const sg of [-1, 1]) {
        const th = sg * t
        if (Math.abs(th) < aisle) continue
        e.set(0, th, 0); q.setFromEuler(e)
        m4.compose(new THREE.Vector3(r * Math.sin(th), y, r * Math.cos(th)), q, new THREE.Vector3(1, 1, 1))
        seatsAt.push(m4.clone())
      }
    }
  }
  for (let r = 8; r <= 27; r += 1.35) addRow(r, rake(r), 1.12)
  // balconies
  const slabMat = lam(0x8a3a34, { emissive: 0x2a0d0d })
  const white = lam(0xf2e8e2, { emissive: 0x403a38 })
  const sector = (r0: number, r1: number, y: number, th: number, tm: number) => {
    const s = new THREE.Shape()
    s.absarc(0, 0, r1, -tm - Math.PI / 2, tm - Math.PI / 2, false)
    s.absarc(0, 0, r0, tm - Math.PI / 2, -tm - Math.PI / 2, true)
    const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false, curveSegments: 40 })
    g.rotateX(-Math.PI / 2)
    const m = new THREE.Mesh(g, slabMat); m.position.y = y; return m
  }
  const tiers = [
    { y: 6.4, r0: 21, rows: [24, 26.4, 28.8, 31], step: 0.42, fasc: 1.5, tm: 1.38 },
    { y: 10.6, r0: 26, rows: [28.4, 30.6], step: 0.5, fasc: 1.5, tm: 1.38 },
  ]
  const lamps: THREE.Matrix4[] = []
  for (const t of tiers) {
    hall.add(sector(t.r0, HALL_R, t.y, 0.5, t.tm))
    const fasc = new THREE.Mesh(new THREE.CylinderGeometry(t.r0, t.r0, t.fasc, 64, 1, true, -t.tm, t.tm * 2), white)
    fasc.position.y = t.y + 0.5 + t.fasc / 2 - 0.9; hall.add(fasc)
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(t.r0 + 0.02, t.r0 + 0.02, 0.12, 64, 1, true, -t.tm, t.tm * 2), new THREE.MeshBasicMaterial({ color: 0xd9ae55 }))
    rail.position.y = t.y + 0.5 + t.fasc - 0.9; hall.add(rail)
    t.rows.forEach((r, i) => addRow(r, t.y + 0.5 + i * t.step, 1.3, 0.09))
    for (let a = -t.tm + 0.04; a < t.tm; a += 0.06) {
      e.set(0, 0, 0); q.setFromEuler(e)
      m4.compose(new THREE.Vector3((t.r0 - 0.1) * Math.sin(a), t.y - 0.25, (t.r0 - 0.1) * Math.cos(a)), q, new THREE.Vector3(1, 1, 1))
      lamps.push(m4.clone())
    }
  }
  const seats = new THREE.InstancedMesh(seatGeo, seatMat, seatsAt.length)
  seatsAt.forEach((m, i) => seats.setMatrixAt(i, m))
  hall.add(seats)
  const lampMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff1d6 }), lamps.length)
  lamps.forEach((m, i) => lampMesh.setMatrixAt(i, m))
  hall.add(lampMesh)
  // rear stalls wall panels
  const redLamp = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2a3a }), 18)
  for (let i = 0; i < 18; i++) {
    const a = -1.3 + (i / 17) * 2.6
    m4.compose(new THREE.Vector3((HALL_R - 0.3) * Math.sin(a), 8.3 + (i % 2) * 4.2, (HALL_R - 0.3) * Math.cos(a)), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1))
    redLamp.setMatrixAt(i, m4)
  }
  hall.add(redLamp)

  // petal ceiling
  const petalMat = new THREE.MeshLambertMaterial({ color: 0xc9a8a0, emissive: 0x4a302c })
  const petalGeo = new THREE.SphereGeometry(1, 16, 8)
  const dome = new THREE.Group(); dome.position.set(0, 19.6, 18)
  const rings = [
    { r: 3.4, n: 8, len: 2.6, wid: 1.5 },
    { r: 6.8, n: 14, len: 3.2, wid: 1.6 },
    { r: 10.6, n: 20, len: 3.6, wid: 1.75 },
    { r: 14.4, n: 26, len: 3.8, wid: 1.85 },
  ]
  rings.forEach((rg, ri) => {
    for (let i = 0; i < rg.n; i++) {
      const a = (i / rg.n) * Math.PI * 2 + ri * 0.2
      const p = new THREE.Mesh(petalGeo, petalMat)
      p.scale.set(rg.len, 0.22, rg.wid)
      p.position.set(Math.cos(a) * rg.r, -ri * 0.25, Math.sin(a) * rg.r)
      p.rotation.y = -a
      p.rotation.z = 0.08
      dome.add(p)
    }
  })
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff0d0 }))
  bulb.position.y = -0.4; dome.add(bulb)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, rr = i % 2 ? 9.2 : 5.2
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }))
    d.position.set(Math.cos(a) * rr, -1.2, Math.sin(a) * rr); dome.add(d)
  }
  hall.add(dome)

  const lights: THREE.PointLight[] = []
  const addL = (x: number, y: number, z: number, i: number, c = 0xffe0c4) => {
    const l = new THREE.PointLight(c, i, 0, 1); l.position.set(x, y, z); hall.add(l); lights.push(l)
  }
  addL(0, 17, 18, 30)
  addL(0, 9, 8, 35)
  addL(-18, 8, 14, 28)
  addL(18, 8, 14, 28)
  addL(0, 4, 24, 25)
  addL(0, 5, -8, 40, 0xfff0e0)

  /* ───────────── light rig ───────────── */
  const hemi = new THREE.HemisphereLight(0xbfd0f0, 0x7a6048, 1.0)
  const sun = new THREE.DirectionalLight(0xffd29a, 2.4)
  sun.position.set(30, 14, 40)
  const amb = new THREE.AmbientLight(0xffffff, 0.0)
  world.add(hemi, sun, amb)

  return { world, hall, doors, hemi, sun, amb, hallLights: lights }
}
