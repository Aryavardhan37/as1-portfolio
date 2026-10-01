import { useEffect, useRef } from "react";

/* Liquid-glass capsule button — raw WebGL fragment shader.
   Flowing copper/steel liquid behind refractive glass, Fresnel rim,
   pointer-following highlight, hover boost and a tactile press squish. */

const PAD = 44; // CSS px of room around the pill for the outer glow

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;     // canvas size (device px)
uniform vec2  uBox;     // pill half-size (device px)
uniform float uDpr;
uniform float uTime;
uniform vec2  uMouse;   // pointer (device px, canvas space, origin bottom-left)
uniform float uHover;
uniform float uPress;

const vec3 BG     = vec3(0.047, 0.051, 0.059);  // #0c0d0f
const vec3 COPPER = vec3(0.784, 0.506, 0.290);  // #c8814a
const vec3 DEEP   = vec3(0.330, 0.170, 0.090);
const vec3 STEEL  = vec3(0.561, 0.639, 0.722);  // #8fa3b8
const vec3 INK    = vec3(0.925, 0.910, 0.882);  // #ece8e1

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
float sdPill(vec2 p, vec2 b) {
  float r = b.y;
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 px = gl_FragCoord.xy - 0.5 * uRes;

  // tactile press: capsule squishes slightly
  vec2 hb = uBox * vec2(1.0 - 0.035 * uPress, 1.0 - 0.06 * uPress);
  float d = sdPill(px, hb);

  // surface normal from the SDF gradient
  float e = 1.0;
  vec2 n = vec2(sdPill(px + vec2(e, 0.0), hb) - sdPill(px - vec2(e, 0.0), hb),
                sdPill(px + vec2(0.0, e), hb) - sdPill(px - vec2(0.0, e), hb));
  n = normalize(n + 1e-5);

  // 0 deep inside -> 1 at the glass edge
  float k = 1.0 - clamp(-d / hb.y, 0.0, 1.0);
  float bend = k * k * k;

  // ---- flowing liquid, refracted near the rim ----
  vec2 uv = px / hb.y;
  vec2 q = uv * vec2(0.55, 1.0) - n * bend * 0.55;
  float t = uTime * (0.10 + 0.22 * uHover + 0.3 * uPress);
  vec2 w = vec2(fbm(q * 1.3 + vec2(t, -0.6 * t)),
                fbm(q * 1.3 + vec2(-0.8 * t, t) + 5.2));
  float f = fbm(q * 1.15 + 2.4 * w + vec2(0.5 * t, 0.0));

  vec3 col = mix(BG * 1.6, DEEP, smoothstep(0.30, 0.62, f));
  col = mix(col, COPPER, smoothstep(0.56, 0.86, f) * (0.50 + 0.35 * uHover));
  col = mix(col, STEEL * 0.55, smoothstep(0.58, 0.92, w.x) * 0.30);

  // keep the centre dark enough for the label
  col = mix(col, BG, 0.38 * (1.0 - k));

  // inner Fresnel glow
  col += COPPER * pow(k, 4.0) * (0.22 + 0.25 * uHover);

  // glass reflection streak across the top
  float top = smoothstep(0.15, 0.75, uv.y) * (1.0 - smoothstep(0.78, 0.98, uv.y));
  float streak = top * smoothstep(hb.x / hb.y + 0.2, 0.0, abs(uv.x + 0.25 * hb.x / hb.y));
  col += INK * streak * 0.09;

  // pointer-following specular
  vec2 m = uMouse - 0.5 * uRes;
  float sig = hb.y * 1.3;
  float pl = exp(-dot(px - m, px - m) / (2.0 * sig * sig));
  col += mix(COPPER, INK, 0.35) * pl * (0.18 + 0.40 * uHover);

  // bright rim (copper below, warm-white on top edge)
  float rim = smoothstep(-2.6 * uDpr, 0.0, d);
  vec3 rimCol = mix(COPPER, INK, 0.25 + 0.45 * max(n.y, 0.0));
  col = mix(col, rimCol, rim * (0.75 + 0.25 * uHover));

  col *= 1.0 + 0.22 * uPress;

  // inside coverage (anti-aliased) + soft outer copper halo
  float aIn = 1.0 - smoothstep(-0.75 * uDpr, 0.75 * uDpr, d);
  float glow = exp(-max(d, 0.0) / (16.0 * uDpr)) * (0.14 + 0.22 * uHover + 0.25 * uPress);
  glow *= 1.0 - aIn;

  gl_FragColor = vec4(col * aIn + COPPER * glow, aIn + glow);   // premultiplied
}
`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(log);
  }
  return s;
}

export default function LiquidGlassButton({ children, onClick, disabled = false, autoFocus = false, className = "" }) {
  const btnRef = useRef(null);

  useEffect(() => {
    const btn = btnRef.current;
    let raf = 0;

    // Fresh canvas per mount. React StrictMode mounts -> unmounts -> remounts;
    // reusing one canvas would hand the 2nd mount an already-lost WebGL context
    // (Chrome then paints a white box with a sad face).
    const canvas = document.createElement("canvas");
    canvas.className = "lg-canvas";
    canvas.setAttribute("aria-hidden", "true");
    btn.prepend(canvas);

    const fail = () => {
      canvas.remove();
      btn.classList.add("lg-fallback");
    };

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!gl) {
      fail();
      return;
    }

    // If the GPU drops the context later, fall back instead of showing a broken canvas.
    const onLost = (e) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      fail();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (err) {
      console.warn("[LiquidGlassButton] shader failed:", err);
      fail();
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = {};
    ["uRes", "uBox", "uDpr", "uTime", "uMouse", "uHover", "uPress"].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const s = { dpr: 1, W: 0, H: 0, bw: 0, bh: 0, mx: 0, my: 0, hover: 0, press: 0, th: 0, tp: 0, hasPtr: false };

    const resize = () => {
      s.dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.bw = btn.offsetWidth;
      s.bh = btn.offsetHeight;
      s.W = Math.max(1, Math.round((s.bw + PAD * 2) * s.dpr));
      s.H = Math.max(1, Math.round((s.bh + PAD * 2) * s.dpr));
      canvas.width = s.W;
      canvas.height = s.H;
      gl.viewport(0, 0, s.W, s.H);
      if (!s.hasPtr) { s.mx = s.W * 0.35; s.my = s.H * 0.62; }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(btn);
    resize();

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      s.mx = (e.clientX - r.left) * s.dpr;
      s.my = (r.bottom - e.clientY) * s.dpr;
      s.hasPtr = true;
    };
    const enter = () => (s.th = 1);
    const leave = () => { s.th = document.activeElement === btn ? 1 : 0; s.tp = 0; };
    const down = () => (s.tp = 1);
    const up = () => (s.tp = 0);
    const keyDown = (e) => { if (e.key === "Enter" || e.key === " ") s.tp = 1; };
    const keyUp = () => (s.tp = 0);
    const focus = () => (s.th = 1);
    const blur = () => (s.th = btn.matches(":hover") ? 1 : 0);

    window.addEventListener("pointermove", onMove, { passive: true });
    btn.addEventListener("pointerenter", enter);
    btn.addEventListener("pointerleave", leave);
    btn.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    btn.addEventListener("keydown", keyDown);
    btn.addEventListener("keyup", keyUp);
    btn.addEventListener("focus", focus);
    btn.addEventListener("blur", blur);
    if (document.activeElement === btn) s.th = 1;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = performance.now(), time = 0;

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt * (reduce ? 0.15 : 1);
      s.hover += (s.th - s.hover) * (1 - Math.exp(-dt * 7));
      s.press += (s.tp - s.press) * (1 - Math.exp(-dt * 18));

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uRes, s.W, s.H);
      gl.uniform2f(U.uBox, (s.bw / 2) * s.dpr, (s.bh / 2) * s.dpr);
      gl.uniform1f(U.uDpr, s.dpr);
      gl.uniform1f(U.uTime, time);
      gl.uniform2f(U.uMouse, s.mx, s.my);
      gl.uniform1f(U.uHover, s.hover);
      gl.uniform1f(U.uPress, s.press);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      btn.removeEventListener("pointerenter", enter);
      btn.removeEventListener("pointerleave", leave);
      btn.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      btn.removeEventListener("keydown", keyDown);
      btn.removeEventListener("keyup", keyUp);
      btn.removeEventListener("focus", focus);
      btn.removeEventListener("blur", blur);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
      btn.classList.remove("lg-fallback");
    };
  }, []);

  return (
    <button
      ref={btnRef}
      type="button"
      className={`lg-btn ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      autoFocus={autoFocus}
    >
      <span className="lg-label">{children}</span>
    </button>
  );
}