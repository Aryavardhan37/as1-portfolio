import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createMaterials } from "./materials.js";
import { buildChip } from "./buildChip.js";
import { clamp, lerp, smoothstep } from "../lib/math.js";
import { telemetry } from "../lib/telemetry.js";

const BG = 0x0c0d0f;
const CHIP_SCALE = 0.8;

/**
 * Owns the WebGL renderer, the chip, the scroll-driven camera and
 * the projected layer labels. React only mounts / disposes it.
 */
export class ChipEngine {
  constructor({ host, labelsEl, sections, chipOptions }) {
    // Each engine owns a fresh canvas + WebGL context. This keeps React StrictMode's
    // mount → unmount → mount cycle from sharing (and corrupting) one context.
    this.host = host;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "scene";
    this.canvas.setAttribute("aria-hidden", "true");
    host.appendChild(this.canvas);

    this.labelsEl = labelsEl;
    this.sections = sections;
    this.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.cur = { ...sections[0].scene };
    this.tgt = { ...sections[0].scene };
    this.ptr = { x: 0, y: 0, sx: 0, sy: 0 };
    this.spin = 0;
    this.scrollFrac = 0;
    this.activeIdx = 0;
    this.raf = 0;
    this.ready = false;
    this.v3 = new THREE.Vector3();
    this.camRight = new THREE.Vector3();

    this.#initRenderer();
    this.#initScene(chipOptions);
    this.#initLabels();

    this.onScroll = () => this.readScroll();
    this.onResize = () => this.resize();
    this.onPointer = (e) => {
      this.ptr.x = e.clientX / window.innerWidth - 0.5;
      this.ptr.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointermove", this.onPointer);
  }

  // Render at ≥1.5× even on standard (DPR 1) monitors — supersampling keeps the
  // thin copper traces and the lid marking crisp instead of soft / shimmering.
  get pixelRatio() {
    return Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2);
  }

  #initRenderer() {
    const r = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: "high-performance" });
    r.setPixelRatio(this.pixelRatio);
    r.setSize(window.innerWidth, window.innerHeight);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.95;
    r.setClearColor(BG, 1);
    this.renderer = r;
  }

  #initScene(chipOptions) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(BG, 42, 95);

    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTex = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = this.envTex;

    scene.add(new THREE.HemisphereLight(0xdfe6ee, 0x1a1410, 0.35));
    const key = new THREE.DirectionalLight(0xfff1e0, 1.6);
    key.position.set(8, 14, 6);
    const rim = new THREE.DirectionalLight(0x8fa3b8, 1.1);
    rim.position.set(-10, 4, -8);
    const low = new THREE.PointLight(0xc8814a, 18, 30, 2);
    low.position.set(0, -6, 4);
    scene.add(key, rim, low);

    this.grid = new THREE.GridHelper(80, 80, 0x2a2c30, 0x1a1c1f);
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.35;
    scene.add(this.grid);

    this.chip = buildChip(createMaterials(), {
      ...chipOptions,
      anisotropy: this.renderer.capabilities.getMaxAnisotropy(),
    });
    this.chip.root.scale.setScalar(CHIP_SCALE);
    scene.add(this.chip.root);

    this.camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 200);
    this.scene = scene;
  }

  #initLabels() {
    this.labelsEl.innerHTML = "";
    this.chip.layers.forEach((L) => {
      const d = document.createElement("div");
      d.className = "lbl";
      d.innerHTML = `<span class="pin"></span><em>${L.code}</em>${L.name}`;
      this.labelsEl.appendChild(d);
      L.el = d;
    });
  }

  get isMobile() {
    return window.innerWidth < 760;
  }

  readScroll() {
    const els = this.sections.map((s) => document.getElementById(s.id));
    if (els.some((el) => !el)) return;
    const mid = window.scrollY + window.innerHeight / 2;
    const centers = els.map((el) => el.offsetTop + el.offsetHeight / 2);

    let i = 0;
    while (i < centers.length - 1 && mid > centers[i + 1]) i++;
    const j = Math.min(i + 1, centers.length - 1);
    const a = this.sections[i].scene;
    const b = this.sections[j].scene;
    const span = Math.max(1, centers[j] - centers[i]);
    const f = mid < centers[0] ? 0 : smoothstep(clamp((mid - centers[i]) / span, 0, 1));
    for (const k in a) this.tgt[k] = lerp(a[k], b[k], f);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollFrac = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;

    let act = 0;
    els.forEach((el, k) => {
      if (mid >= el.offsetTop) act = k;
    });
    this.activeIdx = act;
  }

  resize() {
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.readScroll();
  }

  start() {
    this.readScroll();
    Object.assign(this.cur, this.tgt);
    this.clock = new THREE.Clock();
    const loop = () => {
      this.#frame();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  #frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const { cur, tgt, ptr } = this;
    const k = 1 - Math.exp(-dt * (this.reduce ? 20 : 3.2));
    for (const p in tgt) cur[p] = lerp(cur[p], tgt[p], k);
    ptr.sx = lerp(ptr.sx, ptr.x, 1 - Math.exp(-dt * 3));
    ptr.sy = lerp(ptr.sy, ptr.y, 1 - Math.exp(-dt * 3));
    if (!this.reduce) this.spin += dt * 0.07 * (1 - cur.e * 0.8);

    // chip
    const h = this.chip.layout(cur.e);
    const root = this.chip.root;
    root.rotation.y = cur.rot + this.spin + ptr.sx * 0.35;
    root.rotation.x = ptr.sy * 0.08;
    this.grid.position.y = (-h / 2 - 1.2) * CHIP_SCALE;

    // camera orbit + horizontal framing offset
    const az = Math.PI / 4;
    const d = cur.dist * (this.isMobile ? 1.25 : 1);
    this.camera.position.set(d * Math.cos(cur.elev) * Math.sin(az), d * Math.sin(cur.elev), d * Math.cos(cur.elev) * Math.cos(az));
    this.camera.lookAt(0, 0, 0);
    const shift = this.isMobile ? 0 : cur.shift;
    const W = window.innerWidth, H = window.innerHeight;
    this.camera.setViewOffset(W, H, -shift * W, 0, W, H);

    this.renderer.render(this.scene, this.camera);
    this.#updateLabels(W, H);

    telemetry.emit({
      e: cur.e,
      rot: THREE.MathUtils.radToDeg(root.rotation.y),
      scroll: this.scrollFrac,
      active: this.activeIdx,
      ...(this.ready ? null : { ready: true }),
    });
    this.ready = true;
  }

  #updateLabels(W, H) {
    const { cur } = this;
    const o = clamp((cur.lbl - 0.3) / 0.5, 0, 1) * clamp((cur.e - 0.45) / 0.35, 0, 1);
    const show = o > 0.01 && !this.isMobile;
    this.labelsEl.style.visibility = show ? "visible" : "hidden";
    if (!show) return;

    this.chip.root.updateMatrixWorld();
    this.camRight.setFromMatrixColumn(this.camera.matrixWorld, 0);
    for (const L of this.chip.layers) {
      this.v3.set(0, L.t / 2, 0);
      L.group.localToWorld(this.v3);
      this.v3.addScaledVector(this.camRight, L.extent * 1.15);
      this.v3.project(this.camera);
      const x = (this.v3.x * 0.5 + 0.5) * W;
      const y = (-this.v3.y * 0.5 + 0.5) * H;
      L.el.style.transform = `translate(${x.toFixed(1)}px,${(y - 7).toFixed(1)}px)`;
      L.el.style.opacity = o;
    }
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointer);
    this.scene.traverse((o) => {
      o.geometry?.dispose?.();
      if (o.material) {
        [].concat(o.material).forEach((m) => {
          m.alphaMap?.dispose?.();
          m.dispose?.();
        });
      }
    });
    this.envTex?.dispose();
    this.pmrem?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
    this.labelsEl.innerHTML = "";
  }
}