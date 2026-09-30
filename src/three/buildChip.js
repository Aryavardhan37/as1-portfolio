import * as THREE from "three";
import { createRng, clamp, lerp, smoothstep } from "../lib/math.js";
import { createLidTexture } from "./lidTexture.js";

/**
 * Builds a flip-chip package as an ordered stack of layers (bottom → top):
 *   BGA · SUB · C4/UBM · RDL · M8 … M1 · FEOL · Si · TIM · LID
 *
 * The die is face-down, so the thick M8 power grid sits closest to the bumps
 * and M1 sits directly under the transistors. Every via is placed at a real
 * crossing between a track on its own layer and an orthogonal track on the
 * layer below, and stretches with the explode gap so it always lands on metal.
 *
 * Assembled (e ≈ 0) it looks like a real closed package: die layers squashed
 * flat, a solid die sidewall and an epoxy underfill fillet hide the internals.
 * `lift` floats the Si + TIM + lid upward to reveal the copper stack.
 * As the stack opens (e → 1), the shell fades out and every layer grows to
 * full "exploded-view" thickness.
 */
export function buildChip(M, { mark = "AS·1", lidLines = [], anisotropy = 8 } = {}) {
  const rand = createRng(20260930);
  const BOX = new THREE.BoxGeometry(1, 1, 1);
  const VIA = new THREE.BoxGeometry(1, 1, 1).translate(0, -0.5, 0); // top at y=0, extends down
  const dummy = new THREE.Object3D();

  const DIE = 4;        // die edge length
  const HALF = 1.9;     // routable half-extent
  const SPACING = 0.62; // explode gap per layer at e = 1

  // Thickness multiplier per layer when fully assembled (1 = never squashed).
  const FLAT = {
    C4: 0.55, RDL: 0.2,
    M8: 0.2, M7: 0.2, M6: 0.2, M5: 0.2, M4: 0.2, M3: 0.2, M2: 0.2, M1: 0.2,
    FEOL: 0.2, Si: 0.2, TIM: 0.2, LID: 0.4,
  };
  const FLAT_BLEND_END = 0.5;  // explode amount at which layers reach full thickness
  const SHELL_FADE_END = 0.12; // explode amount at which the die shell / underfill are gone
  const LIFT_H = 2.4;          // how far the Si + TIM + lid float up at lift = 1

  // Layers whose internals are hidden inside the die shell when assembled.
  const INTERNAL = new Set(["RDL", "M8", "M7", "M6", "M5", "M4", "M3", "M2", "M1", "FEOL", "Si", "TIM"]);

  const layers = [];
  const addLayer = (code, name, t, group, extent, extra = {}) =>
    layers.push({
      code, name, t, group, extent,
      segs: null, dir: null, via: null, viaTop: 0,
      flat: FLAT[code] ?? 1,
      edges: group.userData.edges ?? null,
      ...extra,
    });

  const slab = (w, h, d, mat, edgeMat = M.edge) => {
    const g = new THREE.Group();
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = h / 2;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
    edges.position.y = h / 2;
    g.add(mesh, edges);
    g.userData.edges = edges;
    return g;
  };

  const place = (im, k, x, y, z, sx = 1, sy = 1, sz = 1) => {
    dummy.position.set(x, y, z);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    im.setMatrixAt(k, dummy.matrix);
  };

  // Metal-track generator. dir 0 = tracks run along X, dir 1 = along Z.
  const tracks = (g, t, lh, pitch, width, dir, mat, split) => {
    const segs = [];
    const n = Math.floor((2 * HALF) / pitch);
    for (let i = 0; i < n; i++) {
      const c = -HALF + pitch / 2 + i * pitch;
      const cuts = [-HALF, HALF];
      if (split) {
        const k = Math.floor(rand() * 3);
        for (let q = 0; q < k; q++) cuts.push(-HALF + 0.4 + rand() * (2 * HALF - 0.8));
        cuts.sort((a, b) => a - b);
      }
      for (let q = 0; q < cuts.length - 1; q++) {
        const a = cuts[q] + (q ? 0.06 : 0);
        const b = cuts[q + 1] - (q < cuts.length - 2 ? 0.06 : 0);
        if (b - a > 0.25 && !(split && rand() < 0.12)) segs.push({ c, a, b });
      }
    }
    const im = new THREE.InstancedMesh(BOX, mat, segs.length);
    segs.forEach((s, k) => {
      const mid = (s.a + s.b) / 2;
      const len = s.b - s.a;
      if (dir === 0) place(im, k, mid, t - lh / 2, s.c, len, lh, width);
      else place(im, k, s.c, t - lh / 2, mid, width, lh, len);
    });
    g.add(im);
    return segs;
  };

  /* 0 · BGA balls */
  {
    const g = new THREE.Group();
    const n = 12, p = 0.55;
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.19, 24, 16), M.solder, n * n);
    let k = 0;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) place(im, k++, (i - (n - 1) / 2) * p, 0.19, (j - (n - 1) / 2) * p);
    g.add(im);
    addLayer("BGA", "Ball grid array", 0.38, g, 3.3);
  }

  /* 1 · Package substrate with landing pads and fan-out traces */
  {
    const g = slab(7, 0.42, 7, M.substrate);
    const n = 10, p = 0.4;
    const pads = new THREE.InstancedMesh(BOX, M.copper, n * n);
    let k = 0;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) place(pads, k++, (i - (n - 1) / 2) * p, 0.43, (j - (n - 1) / 2) * p, 0.2, 0.02, 0.2);
    // Escape routing: 4 sides × 11 traces, each ending in a round via pad ("dogbone").
    // Offsets stay inside ±1.7 so traces from neighbouring sides never cross at the corners.
    const PER_SIDE = 11;
    const tr = new THREE.InstancedMesh(BOX, M.copper, PER_SIDE * 4);
    const vp = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 20), M.copper, PER_SIDE * 4);
    k = 0;
    for (let s = 0; s < 4; s++)
      for (let i = 0; i < PER_SIDE; i++) {
        const off = -1.7 + (i * 3.4) / (PER_SIDE - 1);
        const len = 0.55 + ((i * 7 + s * 3) % 5) * 0.14; // staggered, not random-looking
        const sign = s % 2 ? 1 : -1;
        const along = sign * (2.15 + len / 2);
        const end = sign * (2.15 + len);
        const horiz = s < 2;
        place(tr, k, horiz ? along : off, 0.426, horiz ? off : along, horiz ? len : 0.035, 0.012, horiz ? 0.035 : len);
        place(vp, k, horiz ? end : off, 0.43, horiz ? off : end);
        k++;
      }
    g.add(pads, tr, vp);
    addLayer("SUB", "Package substrate", 0.42, g, 3.5);
  }

  /* 2 · C4 bumps + UBM */
  {
    const g = new THREE.Group();
    const n = 10, p = 0.4;
    const bumps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 18, 12), M.solder, n * n);
    const ubm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.115, 0.115, 0.035, 20), M.ubm, n * n);
    let k = 0;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const x = (i - (n - 1) / 2) * p, z = (j - (n - 1) / 2) * p;
        place(bumps, k, x, 0.1, z);
        place(ubm, k, x, 0.205, z);
        k++;
      }
    g.add(bumps, ubm);
    addLayer("C4", "C4 bumps · UBM", 0.22, g, 1.95);
  }

  /* 3 · RDL + passivation */
  {
    const t = 0.12;
    const g = slab(DIE, t, DIE, M.passiv);
    const p = 0.4;
    const segs = [];
    for (let i = 0; i < 10; i++) {
      segs.push({ c: (i - 4.5) * p, a: -HALF + rand() * 0.6, b: HALF - rand() * 0.6 });
    }
    const lines = new THREE.InstancedMesh(BOX, M.alum, segs.length);
    segs.forEach((s, k) => place(lines, k, s.c, t - 0.015, (s.a + s.b) / 2, 0.06, 0.03, s.b - s.a));
    const pads = new THREE.InstancedMesh(BOX, M.alum, 100);
    let k = 0;
    for (let i = 0; i < 10; i++)
      for (let j = 0; j < 10; j++) place(pads, k++, (i - 4.5) * p, 0.012, (j - 4.5) * p, 0.2, 0.024, 0.2);
    g.add(lines, pads);
    addLayer("RDL", "Redistribution layer", t, g, 2.0, { segs, dir: 1, lh: 0.03, w: 0.06 });
  }

  /* 4–11 · M8 → M1 */
  const METALS = [
    // code  name                   t     lh     pitch width dir  mat          split
    ["M8", "Global power grid",    0.24, 0.075, 0.5,  0.22,  0, M.copperPwr, false],
    ["M7", "Global power / clock", 0.21, 0.065, 0.42, 0.17,  1, M.copperPwr, false],
    ["M6", "Semi-global routing",  0.17, 0.05,  0.3,  0.1,   0, M.copper,    true],
    ["M5", "Semi-global routing",  0.16, 0.045, 0.26, 0.085, 1, M.copper,    true],
    ["M4", "Intermediate routing", 0.15, 0.04,  0.22, 0.07,  0, M.copper,    true],
    ["M3", "Intermediate routing", 0.14, 0.035, 0.18, 0.06,  1, M.copper,    true],
    ["M2", "Local interconnect",   0.13, 0.03,  0.15, 0.05,  0, M.copper,    true],
    ["M1", "Local interconnect",   0.12, 0.028, 0.12, 0.04,  1, M.copper,    true],
  ];
  for (const [code, name, t, lh, pitch, w, dir, mat, split] of METALS) {
    const g = slab(DIE, t, DIE, M.ild);
    const segs = tracks(g, t, lh, pitch, w, dir, mat, split);
    addLayer(code, name, t, g, 2.0, { segs, dir, lh, w, viaMat: code === "M8" ? M.alum : M.copper });
  }

  /* 12 · FEOL — poly gates, fins, tungsten contacts down to M1 */
  {
    const t = 0.14;
    const g = slab(DIE, t, DIE, M.feol, M.edgeHi);
    const segs = tracks(g, t, 0.035, 0.1, 0.03, 0, M.poly, true);
    const fins = new THREE.InstancedMesh(BOX, M.tungsten, 36);
    for (let i = 0; i < 36; i++) {
      place(fins, i, -HALF + 0.35 + (i % 6) * 0.66, 0.03, -HALF + 0.25 + Math.floor(i / 6) * 0.66, 0.5, 0.04, 0.018);
    }
    g.add(fins);
    addLayer("FEOL", "Transistors · W contacts", t, g, 2.0, { segs, dir: 0, lh: 0.035, w: 0.03, viaMat: M.tungsten });
  }

  /* 13 · Silicon bulk (backside up in flip-chip) */
  addLayer("Si", "Silicon bulk · backside up", 0.5, slab(DIE, 0.5, DIE, M.silicon, M.edgeHi), 2.0);

  /* 14 · Thermal interface material */
  addLayer("TIM", "Thermal interface material", 0.04, slab(3.9, 0.04, 3.9, M.tim), 1.95);

  /* 15 · Lid / integrated heat spreader with etched marking */
  {
    const g = slab(5.4, 0.26, 5.4, M.lid);
    const alphaMap = createLidTexture({ mark, lines: lidLines, anisotropy });
    const etch = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 4.6),
      new THREE.MeshStandardMaterial({
        color: 0x1f2126, metalness: 0.5, roughness: 0.65,
        alphaMap, transparent: true, depthWrite: false,
        // Pull the marking toward the camera so it never z-fights with the lid top.
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      })
    );
    etch.rotation.set(-Math.PI / 2, 0, Math.PI);
    etch.position.y = 0.26;
    g.add(etch);
    addLayer("LID", "Integrated heat spreader", 0.26, g, 2.7);
  }

  /* Vias — dropped from each layer onto true crossings with the layer below */
  for (let i = 1; i < layers.length; i++) {
    const up = layers[i], dn = layers[i - 1];
    if (!up.segs || !dn.segs || up.dir === dn.dir) continue;
    const want = up.code === "FEOL" ? 70 : up.code === "M8" || up.code === "M7" ? 36 : 55;
    const pts = [];
    let tries = 0;
    while (pts.length < want && tries < 6000) {
      tries++;
      const a = up.segs[Math.floor(rand() * up.segs.length)];
      const b = dn.segs[Math.floor(rand() * dn.segs.length)];
      const px = up.dir === 0 ? b.c : a.c;
      const pz = up.dir === 0 ? a.c : b.c;
      const alongUp = up.dir === 0 ? px : pz;
      const alongDn = dn.dir === 0 ? px : pz;
      if (alongUp < a.a + 0.03 || alongUp > a.b - 0.03 || alongDn < b.a + 0.03 || alongDn > b.b - 0.03) continue;
      if (pts.some((p) => Math.abs(p[0] - px) < 1e-3 && Math.abs(p[1] - pz) < 1e-3)) continue;
      pts.push([px, pz]);
    }
    const size = Math.min(up.w, dn.w) * 0.85;
    const im = new THREE.InstancedMesh(VIA, up.viaMat || M.copper, pts.length);
    pts.forEach((p, k) => place(im, k, p[0], 0, p[1], size, 1, size));
    up.viaTop = up.t - up.lh; // via starts at the underside of this layer's tracks
    im.position.y = up.viaTop;
    up.group.add(im);
    up.via = im;
  }

  /* Assembled-state shell: die sidewalls + underfill fillet */
  const shell = new THREE.Group();
  // Sidewalls only (top/bottom faces hidden) so the metal stack is visible from above when the lid lifts.
  const noFace = new THREE.MeshBasicMaterial({ visible: false });
  const dieShell = new THREE.Mesh(
    new THREE.BoxGeometry(DIE + 0.02, 1, DIE + 0.02).translate(0, 0.5, 0),
    [M.dieShell, M.dieShell, noFace, noFace, M.dieShell, M.dieShell]
  );
  // Square frustum (4-sided cylinder turned 45°): wide at the substrate, die-sized at the top.
  const R = Math.SQRT2;
  const underfill = new THREE.Mesh(
    new THREE.CylinderGeometry((DIE / 2 + 0.03) * R, (DIE / 2 + 0.32) * R, 1, 4, 1).rotateY(Math.PI / 4).translate(0, 0.5, 0),
    M.underfill
  );
  shell.add(dieShell, underfill);

  /* Assemble */
  const root = new THREE.Group();
  const stack = new THREE.Group();
  root.add(stack);
  layers.forEach((L) => stack.add(L.group));
  stack.add(shell);

  const idx = Object.fromEntries(layers.map((L, i) => [L.code, i]));

  /**
   * Positions every layer. Returns total stack height.
   *   e    explode amount 0..1 — layers separate and grow to full thickness
   *   lift 0..1 — Si + TIM + lid float up to reveal the copper stack
   * Every via is stretched so it still spans from its own tracks to the layer below.
   */
  const layout = (e, lift = 0) => {
    const gap = e * SPACING;
    const f = smoothstep(clamp(e / FLAT_BLEND_END, 0, 1));
    const up = smoothstep(clamp(lift, 0, 1)) * LIFT_H;
    // With the lid lifted, thin the FEOL glass so the copper grid underneath reads clearly.
    M.feol.opacity = lerp(0.55, 0.18, clamp(lift, 0, 1) * (1 - f));
    let y = 0;
    layers.forEach((L, i) => {
      const k = lerp(L.flat, 1, f);
      L.group.scale.y = k;
      L.group.position.y = y + gap * i + (i >= idx.Si ? up : 0);
      L.bottom = L.group.position.y;
      L.top = L.bottom + L.t * k;
      if (L.via) L.via.scale.y = L.viaTop + gap / k + 0.004;
      y += L.t * k;
    });

    // Shell: fully opaque when closed, gone by SHELL_FADE_END.
    const o = 1 - smoothstep(clamp(e / SHELL_FADE_END, 0, 1));
    shell.visible = o > 0.01;
    M.dieShell.opacity = M.underfill.opacity = o;
    M.dieShell.depthWrite = M.underfill.depthWrite = o > 0.98;
    if (shell.visible) {
      const rdl = layers[idx.RDL], feol = layers[idx.FEOL], c4 = layers[idx.C4];
      dieShell.position.y = rdl.bottom;
      dieShell.scale.y = feol.top - rdl.bottom;
      underfill.position.y = c4.bottom;
      underfill.scale.y = Math.max(0.001, rdl.bottom - c4.bottom + (feol.top - rdl.bottom) * 0.35);
    }
    // Hide the stacked edge outlines of internal layers while closed — they shimmer as a fuzzy band.
    for (const L of layers) if (INTERNAL.has(L.code) && L.edges) L.edges.visible = o < 0.5;

    const h = y + gap * (layers.length - 1) + up;
    stack.position.y = -h / 2;
    return h;
  };

  return { root, layers, layout };
}