import * as THREE from 'three';

/* ---------- shared helpers ---------- */
const RED = 0x9c0f1f;
const WOOD = 0x2e1409;

const velvet = () => new THREE.MeshPhysicalMaterial({ color: RED, roughness: 0.92, sheen: 1, sheenColor: new THREE.Color(0xff5a64), sheenRoughness: 0.45 });
const wood = () => new THREE.MeshStandardMaterial({ color: WOOD, roughness: 0.38, metalness: 0.08 });
const fabric = () => new THREE.MeshStandardMaterial({ color: 0xb01418, roughness: 1 });
const plastic = () => new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.4, metalness: 0.15 });

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/* box with softly rounded edges (extruded rounded rectangle with bevel) */
function softBox(w, h, d, bevel, mat) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w, h, bevel * 1.4), {
    depth: Math.max(d - bevel * 2, 0.001), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 6,
  });
  g.translate(0, 0, -(d - bevel * 2) / 2);
  return mesh(g, mat);
}

function tube(points, r, mat, seg = 64) {
  const c = new THREE.CatmullRomCurve3(points);
  return mesh(new THREE.TubeGeometry(c, seg, r, 10, false), mat);
}

/* log-spiral scroll (volute) in the XY plane, centre (cx,cy) */
function spiral(cx, cy, r0, turns, dir, z = 0, n = 40) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = dir * t * turns * Math.PI * 2, r = r0 * (1 - t * 0.86);
    pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z));
  }
  return pts;
}

/* =====================================================================
   CHAIR 1 — carved mahogany throne with tufted red velvet
   ===================================================================== */
function buildThrone() {
  const g = new THREE.Group();
  const W = wood(), V = velvet();

  /* turned legs */
  const prof = [[0.0, 0], [0.03, 0], [0.035, 0.03], [0.05, 0.06], [0.04, 0.1], [0.032, 0.14], [0.045, 0.2], [0.055, 0.25], [0.04, 0.3], [0.04, 0.4]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const legGeo = new THREE.LatheGeometry(prof, 24);
  [[-0.29, 0.26], [0.29, 0.26]].forEach(([x, z]) => g.add(mesh(legGeo, W, x, 0, z)));
  [[-0.29, -0.26], [0.29, -0.26]].forEach(([x, z]) => g.add(mesh(new THREE.BoxGeometry(0.075, 0.42, 0.075), W, x, 0.21, z)));

  /* seat rail with carved apron */
  g.add(mesh(new THREE.BoxGeometry(0.66, 0.1, 0.6), W, 0, 0.45, 0));
  const apron = [[-0.2, 0.3], [0, 0.34], [0.2, 0.3]];
  g.add(mesh(new THREE.SphereGeometry(0.05, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.6, 1, 0.5), W, 0, 0.4, 0.31));
  apron.forEach(([x]) => { const t = tube(spiral(x * 1.0, 0.43, 0.04, 1.4, x < 0 ? 1 : -1, 0.31, 24), 0.008, W, 24); g.add(t); });
  [[-0.335, 0.31], [0.335, 0.31]].forEach(([x, z]) => g.add(mesh(new THREE.BoxGeometry(0.04, 0.07, 0.04), W, x, 0.42, z)));

  /* seat cushion */
  const seat = softBox(0.62, 0.56, 0.12, 0.035, V);
  seat.rotation.x = Math.PI / 2; seat.position.set(0, 0.57, 0.01);
  g.add(seat);

  /* back posts */
  [-0.31, 0.31].forEach(x => {
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.95, 0.06), W, x, 0.9, -0.27));
    g.add(mesh(new THREE.SphereGeometry(0.04, 16, 12), W, x, 1.4, -0.27));
  });

  /* arched back: frame + tufted velvet */
  const BW = 0.55, BH0 = 0.64, BH1 = 1.34, ARCH = 0.1;
  const frameShape = new THREE.Shape();
  const arch = (hw, y0, y1, a) => {
    frameShape.moveTo(-hw, y0); frameShape.lineTo(hw, y0); frameShape.lineTo(hw, y1);
    frameShape.quadraticCurveTo(hw * 0.5, y1 + a * 1.1, 0, y1 + a * 1.1);
    frameShape.quadraticCurveTo(-hw * 0.5, y1 + a * 1.1, -hw, y1); frameShape.lineTo(-hw, y0);
  };
  arch(0.34, BH0 - 0.06, BH1 + 0.04, ARCH);
  const hole = new THREE.Path();
  hole.moveTo(-BW / 2, BH0); hole.lineTo(-BW / 2, BH1); hole.quadraticCurveTo(-BW / 4, BH1 + ARCH * 1.1, 0, BH1 + ARCH * 1.1);
  hole.quadraticCurveTo(BW / 4, BH1 + ARCH * 1.1, BW / 2, BH1); hole.lineTo(BW / 2, BH0); hole.lineTo(-BW / 2, BH0);
  frameShape.holes.push(hole);
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3 });
  g.add(mesh(frameGeo, W, 0, 0, -0.29));

  /* tufted panel: subdivided grid, arched top, gaussian dimples at button positions */
  const SX = 56, SY = 90;
  const pg = new THREE.PlaneGeometry(BW, 1, SX, SY);
  const pos = pg.attributes.position;
  const buttons = [];
  const rows = 5, ROWH = (BH1 - BH0 - 0.06) / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < (r % 2 ? 3 : 2); c++) {
    const n = r % 2 ? 3 : 2;
    buttons.push([(c - (n - 1) / 2) * (BW / 2.6), BH0 + 0.07 + r * ROWH * 1.01]);
  }
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), v = pos.getY(i) + 0.5;
    const top = BH1 + ARCH * Math.max(0, 1 - Math.pow(x / (BW / 2), 2)) * 1.0;
    const y = BH0 + v * (top - BH0);
    let z = 0.045 * Math.sin(Math.PI * Math.min(1, (v)) ) * 0.4 + 0.03;
    let dip = 0;
    for (const [bx, by] of buttons) { const d2 = (x - bx) ** 2 + (y - by) ** 2; dip += Math.exp(-d2 / 0.0018); }
    z -= Math.min(dip, 1.2) * 0.035;
    /* tighten toward the frame */
    const edge = Math.min(1, (BW / 2 - Math.abs(x)) / 0.05, (top - y) / 0.05, (y - BH0) / 0.05);
    z *= 0.4 + 0.6 * Math.max(0, edge);
    pos.setXYZ(i, x, y, z);
  }
  pg.computeVertexNormals();
  g.add(mesh(pg, V, 0, 0, -0.245));
  const btnGeo = new THREE.SphereGeometry(0.012, 10, 8);
  const btnMat = new THREE.MeshStandardMaterial({ color: 0x6d0a15, roughness: 0.8 });
  buttons.forEach(([x, y]) => g.add(mesh(btnGeo, btnMat, x, y, -0.245 - 0.005)));
  g.add(mesh(new THREE.BoxGeometry(BW + 0.02, BH1 - BH0 + ARCH + 0.06, 0.012), W, 0, (BH0 + BH1 + ARCH) / 2, -0.262));

  /* carved crest: central shell + acanthus scrolls */
  const crestY = BH1 + ARCH * 1.1 + 0.02;
  const shellGeo = new THREE.CircleGeometry(0.1, 48, 0, Math.PI);
  const sp = shellGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i), y = sp.getY(i), a = Math.atan2(y, x), r = Math.hypot(x, y);
    sp.setZ(i, 0.035 * Math.cos(a * 8) * Math.min(1, r / 0.1) + 0.04 * (1 - r / 0.1));
  }
  shellGeo.computeVertexNormals();
  const shell = mesh(shellGeo, W, 0, crestY - 0.01, -0.255); shell.material.side = THREE.DoubleSide; g.add(shell);
  g.add(mesh(new THREE.SphereGeometry(0.03, 16, 12), W, 0, crestY + 0.1, -0.245));
  [-1, 1].forEach(s => {
    g.add(tube(spiral(s * 0.17, crestY - 0.01, 0.07, 1.7, -s, -0.255), 0.013, W));
    g.add(tube(spiral(s * 0.27, crestY - 0.09, 0.055, 1.6, s, -0.255), 0.012, W));
    const lead = [[0.06, 0.0], [0.1, 0.045], [0.15, 0.07], [0.2, 0.06]].map(([x, y]) => new THREE.Vector3(s * x, crestY + y - 0.04, -0.255));
    g.add(tube(lead, 0.012, W, 24));
    g.add(mesh(new THREE.SphereGeometry(0.022, 12, 10).scale(1, 1.4, 1), W, s * 0.34, BH1 + 0.03, -0.265));
  });

  /* arms with scrolled hand-rests */
  [-1, 1].forEach(s => {
    const x = s * 0.325;
    const rail = [[-0.26, 0.9], [-0.1, 0.87], [0.08, 0.86], [0.2, 0.87], [0.27, 0.9]].map(([z, y]) => new THREE.Vector3(x, y, z));
    g.add(tube(rail, 0.022, W, 40));
    g.add(mesh(new THREE.BoxGeometry(0.055, 0.03, 0.14), W, x, 0.885, -0.18));
    /* volute at the hand end */
    const vol = spiral(0, 0, 0.045, 1.5, 1, 0, 30).map(p => new THREE.Vector3(x, 0.9 + p.y * 1.0, 0.27 + p.x * 1.0 + 0.04));
    g.add(tube(vol, 0.02, W, 40));
    g.add(mesh(new THREE.SphereGeometry(0.03, 14, 10), W, x, 0.9, 0.31));
    /* S-curved support */
    const sup = [[0.2, 0.85], [0.215, 0.74], [0.235, 0.62], [0.26, 0.5]].map(([z, y]) => new THREE.Vector3(x, y, z));
    g.add(tube(sup, 0.027, W, 30));
    g.add(mesh(new THREE.BoxGeometry(0.05, 0.12, 0.012), W, x + s * 0.0, 0.68, 0.225));
  });

  /* stretcher */
  g.add(mesh(new THREE.BoxGeometry(0.58, 0.03, 0.03), W, 0, 0.14, 0.26));
  g.add(mesh(new THREE.BoxGeometry(0.58, 0.03, 0.03), W, 0, 0.14, -0.26));
  [-0.29, 0.29].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.03, 0.03, 0.52), W, x, 0.14, 0)));

  g.userData.height = 1.55;
  return g;
}

/* =====================================================================
   CHAIR 2 — cinema / auditorium seat (tip-up, with cup holder)
   ===================================================================== */
function buildCinema() {
  const g = new THREE.Group();
  const F = fabric(), P = plastic();

  /* side frames (cheek panels) */
  [-1, 1].forEach(s => {
    const x = s * 0.33;
    const panel = softBox(0.5, 0.82, 0.07, 0.015, P);
    panel.rotation.y = Math.PI / 2; panel.position.set(x, 0.43, 0);
    g.add(panel);
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.03, 0.56), P, x - s * 0.005, 0.85, 0.02)); /* arm rest */
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.03, 0.62), P, x, 0.015, 0.0));             /* foot */
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 20).rotateZ(Math.PI / 2), P, x - s * 0.04, 0.38, -0.02)); /* hinge */
  });

  /* tall upholstered back, slightly reclined */
  const back = new THREE.Group();
  const bb = softBox(0.5, 0.92, 0.1, 0.03, F);
  back.add(bb);
  back.position.set(0, 0.93, -0.2); back.rotation.x = -0.1;
  g.add(back);

  /* tip-up seat: pivots about hinge axis */
  const pivot = new THREE.Group(); pivot.position.set(0, 0.42, 0.17);
  const base = softBox(0.46, 0.46, 0.08, 0.02, P);   /* plastic shell (underside) */
  base.rotation.x = Math.PI / 2; base.position.set(0, 0, 0.23);
  const cushion = softBox(0.44, 0.44, 0.1, 0.03, F);
  cushion.rotation.x = Math.PI / 2; cushion.position.set(0, 0.07, 0.23);
  pivot.add(base, cushion);
  g.add(pivot);

  /* cup holder on the right arm */
  const cup = new THREE.Group();
  const ring = new THREE.LatheGeometry([[0.04, 0.0], [0.043, 0.0], [0.045, 0.07], [0.04, 0.075], [0.037, 0.07], [0.039, 0.0]].map(([x, y]) => new THREE.Vector2(x, y)), 28);
  cup.add(mesh(ring, P)); cup.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.008, 24), P, 0, 0, 0));
  cup.position.set(0.39, 0.77, 0.2);
  g.add(cup);
  g.add(mesh(new THREE.BoxGeometry(0.08, 0.02, 0.1), P, 0.375, 0.845, 0.2));

  g.userData.pivot = pivot;
  g.userData.height = 1.45;
  return g;
}

/* =====================================================================
   Viewer: auto 360° turntable + drag to rotate
   ===================================================================== */
class Viewer {
  constructor(canvas, model, opts = {}) {
    this.canvas = canvas;
    this.model = model;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    const h = model.userData.height;
    this.camera.position.set(0, h * 0.62, h * 2.35);
    this.camera.lookAt(0, h * 0.46, 0);

    this.scene.add(new THREE.HemisphereLight(0xfff1e6, 0x2a1410, 1.1));
    const key = new THREE.DirectionalLight(0xfff0dc, 2.6);
    key.position.set(1.6, 3, 2.4); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -1.5, right: 1.5, top: 1.5, bottom: -1.5, near: 0.5, far: 8 });
    key.shadow.bias = -0.0005; key.shadow.radius = 4;
    const rim = new THREE.DirectionalLight(0xd9ae55, 1.4); rim.position.set(-2.5, 1.6, -2);
    const fill = new THREE.DirectionalLight(0xffd0c0, 0.7); fill.position.set(-2, 1, 2);
    this.scene.add(key, rim, fill);

    const floor = new THREE.Mesh(new THREE.CircleGeometry(1.4, 64), new THREE.ShadowMaterial({ opacity: 0.35 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    this.scene.add(floor);

    this.pivot = new THREE.Group(); this.pivot.add(model); this.scene.add(this.pivot);
    this.pivot.rotation.y = opts.startAngle ?? -0.6;

    this.auto = true; this.visible = false; this.vel = 0; this.resumeAt = 0; this.dragging = false;
    this.seatTarget = 1; this.seat = 1;  /* starts folded up */
    this._bind();
    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(e => { this.visible = e[0].isIntersecting; }, { threshold: 0.01 }).observe(canvas);
    this.resize();
    requestAnimationFrame(t => this.loop(t));
  }
  _bind() {
    const c = this.canvas; let lx = 0;
    c.addEventListener('pointerdown', e => { this.dragging = true; this.auto = false; lx = e.clientX; c.setPointerCapture(e.pointerId); c.classList.add('grab'); });
    c.addEventListener('pointermove', e => { if (!this.dragging) return; const dx = e.clientX - lx; lx = e.clientX; this.pivot.rotation.y += dx * 0.011; this.vel = dx * 0.011; });
    const up = () => { this.dragging = false; this.resumeAt = performance.now() + 2200; c.classList.remove('grab'); };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  }
  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  loop(t) {
    requestAnimationFrame(tt => this.loop(tt));
    if (!this.visible) return;
    if (!this.auto && !this.dragging) {
      this.pivot.rotation.y += this.vel; this.vel *= 0.93;
      if (t > this.resumeAt) this.auto = true;
    }
    if (this.auto) this.pivot.rotation.y += 0.0065;   /* ~360° in 16 s */
    const p = this.model.userData.pivot;
    if (p) { this.seat += (this.seatTarget - this.seat) * 0.12; p.rotation.x = -this.seat * Math.PI / 2; }
    this.renderer.render(this.scene, this.camera);
  }
}

function init() {
  const mk = (id, build, opts) => {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    try { return new Viewer(canvas, build(), opts); }
    catch (e) { canvas.replaceWith(Object.assign(document.createElement('p'), { className: 'nogl', textContent: 'WebGL غير مدعوم على هذا الجهاز' })); return null; }
  };
  mk('chair-throne', buildThrone);
  const cinema = mk('chair-cinema', buildCinema, { startAngle: 0.5 });
  const btn = document.getElementById('seat-toggle');
  if (btn && cinema) btn.addEventListener('click', () => {
    cinema.seatTarget = cinema.seatTarget ? 0 : 1;
    btn.textContent = cinema.seatTarget ? 'Lower seat · نزّل الكرسي' : 'Fold seat up · ارفع الكرسي';
  });
}
init();
