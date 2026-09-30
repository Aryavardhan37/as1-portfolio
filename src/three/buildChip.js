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
 * Assembled (e = 0) the die layers are squashed to a realistic flat profile;
 * they grow to full "exploded-view" thickness as the stack opens up.
 */
export function buildChip(M, { mark = "AS·1", lidLines = [] } = {}) {
  const rand = createRng(20260930);
  const BOX = new THREE.BoxGeometry(1, 1, 1);
  const VIA = new THREE.BoxGeometry(1, 1, 1).translate(0, -0.5, 0); // top at y=0, extends down
  const dummy = new THREE.Object3D();

  const DIE = 4;        // die edge length
  const HALF = 1.9;     // routable half-extent
  const SPACING = 0.62; // explode gap per layer at e = 1

  // Thickness multiplier per layer when fully assembled (1 = never squashed).
  // Die layers go very thin so the closed package reads as a flat chip.
  const FLAT = {
    RDL: 0.2, M8: 0.2, M7: 0.2, M6: 0.2, M5: 0.2, M4: 0.2, M3: 0.2, M2: 0.2, M1: 0.2,
    FEOL: 0.2, Si: 0.2, TIM: 0.2, LID: 0.45,
  };
  const FLAT_BLEND_END = 0.5; // explode amount at which layers reach full thickness

  const layers = [];
  const addLayer = (code, name, t, group, extent, extra = {}) =>
    layers.push({
      code, name, t, group, extent,
      segs: null, dir: null, via: null, viaTop: 0,
      flat: FLAT[code] ?? 1,
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
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.19, 20, 14), M.solder, n * n);
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
    const tr = new THREE.InstancedMesh(BOX, M.copper, 64);
    k = 0;
    for (let s = 0; s < 4; s++)
      for (let i = 0; i < 16; i++) {
        const off = -2.55 + i * 0.34;
        const len = 0.4 + rand() * 0.75;
        const x = s < 2 ? (s ? 1 : -1) * (2.1 + len / 2) : off;
        const z = s < 2 ? off : (s === 2 ? 1 : -1) * (2.1 + len / 2);
        place(tr, k++, x, 0.43, z, s < 2 ? len : 0.05, 0.012, s < 2 ? 0.05 : len);
      }
    g.add(pads, tr);
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
    const alphaMap = createLidTexture({ mark, lines: lidLines });
    const etch = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 4.6),
      new THREE.MeshStandardMaterial({ color: 0x2a2c30, metalness: 0.6, roughness: 0.6, alphaMap, transparent: true })
    );
    etch.rotation.x = -Math.PI / 2;
    etch.position.y = 0.261;
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

  /* Assemble */
  const root = new THREE.Group();
  const stack = new THREE.Group();
  root.add(stack);
  layers.forEach((L) => stack.add(L.group));

  /**
   * Positions every layer for explode amount e (0..1). Returns total stack height.
   * Each layer is scaled vertically by k (flat → full thickness); every via is
   * stretched so it still spans exactly from its own tracks down to the layer below.
   */
  const layout = (e) => {
    const gap = e * SPACING;
    const f = smoothstep(clamp(e / FLAT_BLEND_END, 0, 1));
    let y = 0;
    layers.forEach((L, i) => {
      const k = lerp(L.flat, 1, f);
      L.group.scale.y = k;
      L.group.position.y = y + gap * i;
      // via length in this layer's local (scaled) units
      if (L.via) L.via.scale.y = L.viaTop + gap / k + 0.004;
      y += L.t * k;
    });
    const h = y + gap * (layers.length - 1);
    stack.position.y = -h / 2;
    return h;
  };

  return { root, layers, layout };
}