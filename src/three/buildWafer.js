import * as THREE from "three";

/**
 * Patterned 300 mm-style wafer + the single die that gets singulated from it.
 *
 * Both share one ShaderMaterial recipe:
 *   - thin-film interference (the green / red sheen real wafers show),
 *     with thickness varying radially, per die and per functional block
 *   - scribe streets between dies, pad ring on every die
 *   - laser-dicing glow on the centre die's streets (uCut)
 *   - the centre slot goes dark once the die has been lifted (uHole)
 *
 * Sizes are in world units and match the chip's silicon footprint
 * (die 4 × chip scale 0.8 = 3.2).
 */

const VERT = /* glsl */ `
varying vec3 vLocal;
varying vec3 vLocalN;
varying vec3 vWorld;
varying vec3 vWorldN;
void main() {
  vLocal  = position;
  vLocalN = normal;
  vec4 w  = modelMatrix * vec4(position, 1.0);
  vWorld  = w.xyz;
  vWorldN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const FRAG = /* glsl */ `
uniform float uMode;     // 0 = wafer, 1 = single die
uniform float uPitch;    // die pitch (die + street)
uniform float uDie;      // die edge
uniform float uR;        // wafer radius
uniform float uCut;      // 0..1 laser dicing glow on centre die
uniform float uHole;     // 0..1 centre slot emptied
uniform float uOpacity;
uniform float uTime;

varying vec3 vLocal;
varying vec3 vLocalN;
varying vec3 vWorld;
varying vec3 vWorldN;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// thin-film interference colour for an optical path difference (in "waves")
vec3 film(float opd) {
  return 0.5 + 0.5 * cos(6.28318 * (opd * vec3(1.0, 1.22, 1.48) + vec3(0.0, 0.18, 0.42)));
}

void main() {
  vec3 N = normalize(vWorldN);
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 L = normalize(vec3(0.45, 1.0, 0.35));
  float ndv = clamp(abs(dot(N, V)), 0.0, 1.0);

  vec3 SI   = vec3(0.105, 0.118, 0.150);   // polished silicon
  vec3 BACK = vec3(0.120, 0.132, 0.165);   // ground backside
  vec3 COPPER = vec3(0.784, 0.506, 0.290);

  // ---------- sides & backside ----------
  if (vLocalN.y < 0.5) {
    vec3 c = (vLocalN.y < -0.5) ? BACK : SI * 1.25;
    float sp = pow(max(dot(reflect(-L, N), V), 0.0), 24.0);
    c += vec3(0.55) * sp * 0.25;
    c += vec3(0.04) * (1.0 - ndv);
    gl_FragColor = vec4(c, uOpacity);
    return;
  }

  // ---------- active (top) face ----------
  vec2 p = vLocal.xz;
  vec2 cell, fp;
  if (uMode < 0.5) {
    cell = floor((p + 0.5 * uPitch) / uPitch);
    fp   = p - cell * uPitch;                       // -pitch/2 .. pitch/2 inside the cell
  } else {
    cell = vec2(0.0);
    fp   = p;
  }
  float hd = 0.5 * uDie;
  float edge = max(abs(fp.x), abs(fp.y));          // square distance from die centre
  float inDie = 1.0 - step(hd, edge);
  float r = length(p);
  bool  centre = (uMode > 0.5) || (cell.x == 0.0 && cell.y == 0.0);

  // die fully inside the usable wafer area?
  float cornerR = length(abs(cell * uPitch) + vec2(hd));
  float whole = (uMode > 0.5) ? 1.0 : step(cornerR, uR - 0.35);

  // film thickness: radial bowl + slow noise + per-die + fine per-block variation
  vec2 blk  = floor((fp + hd) / (uDie / 14.0));
  vec2 mac  = floor((fp + hd) / (uDie / 3.0));
  float th  = 0.62 + 0.42 * (r / max(uR, 1.0));
  th += 0.18 * noise(p * 0.16 + 3.1);
  th += (hash(cell) - 0.5) * 0.05;
  th += inDie * whole * ((hash(mac + cell * 3.0) - 0.5) * 0.10 + (hash(blk + cell * 7.0) - 0.5) * 0.035);
  // pad ring just inside each die
  float ring = inDie * (1.0 - smoothstep(0.0, 0.035, abs(edge - (hd - 0.12))));
  th += ring * 0.22;
  // optical path grows with grazing angle
  float opd = th * (1.1 + 1.1 * (1.0 - ndv));
  // green / red-copper dominant palette (pulls blue out of the magentas)
  vec3 irid = film(opd) * vec3(1.1, 1.0, 0.5);

  // fine routing texture inside each die
  vec2 g = abs(fract(fp / (uDie / 48.0)) - 0.5);
  float lines = inDie * whole * smoothstep(0.42, 0.5, max(g.x, g.y)) * 0.5;

  float fres = pow(1.0 - ndv, 2.0);
  vec3 c = SI + irid * (0.30 + 0.35 * fres) * mix(0.55, 1.0, inDie * whole);
  c += irid * lines * 0.12;
  c += vec3(0.85, 0.75, 0.6) * ring * 0.08;

  // streets: bare, darker silicon
  c = mix(c, SI * 0.75 + irid * 0.05, 1.0 - inDie);
  // partial dies at the edge: unpatterned film
  c = mix(SI + irid * 0.16, c, max(whole, 1.0 - inDie));

  // edge-exclusion ring of the wafer
  if (uMode < 0.5) {
    float excl = smoothstep(uR - 0.55, uR - 0.35, r);
    c = mix(c, SI * 1.2 + irid * 0.1, excl);
  }

  // specular sweep
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 40.0);
  c += vec3(1.0, 0.96, 0.9) * spec * 0.22;
  c += vec3(0.6, 0.65, 0.75) * pow(1.0 - ndv, 4.0) * 0.12;

  // ---------- centre die: laser dicing + empty slot ----------
  if (centre && uMode < 0.5) {
    float d = abs(edge - hd - 0.03);                 // distance to the cut line
    float lane = 1.0 - smoothstep(0.0, 0.07, d);
    float glow = exp(-d / 0.18);
    // the laser runs around the perimeter once, then the kerf stays hot
    float ang = atan(fp.y, fp.x) / 6.28318 + 0.5;
    float run = smoothstep(ang - 0.02, ang, uCut * 1.05);
    vec3 hot = mix(COPPER, vec3(1.0, 0.35, 0.18), 0.45);
    float flick = 0.85 + 0.15 * sin(uTime * 40.0 + ang * 60.0);
    c += hot * (lane * 1.4 + glow * 0.45) * run * flick * (1.0 - uHole * 0.6);
    // empty slot after lift-off
    if (edge < hd + 0.03) c = mix(c, vec3(0.02, 0.02, 0.025) + hot * glow * 0.15, uHole);
  }

  gl_FragColor = vec4(c, uOpacity);
}
`;

function waferMaterial(mode, pitch, die, radius) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    uniforms: {
      uMode: { value: mode },
      uPitch: { value: pitch },
      uDie: { value: die },
      uR: { value: radius },
      uCut: { value: 0 },
      uHole: { value: 0 },
      uOpacity: { value: 1 },
      uTime: { value: 0 },
    },
  });
}

export function buildWafer({ die = 3.2, street = 0.14, radius = 15, thickness = 0.22, dieThickness = 0.4 } = {}) {
  const pitch = die + street;

  // Wafer disc with an orientation notch.
  const shape = new THREE.Shape();
  const notch = 0.35;
  const a0 = -Math.PI / 2 + notch / radius;
  shape.absarc(0, 0, radius, a0, a0 + Math.PI * 2 - (2 * notch) / radius, false);
  shape.lineTo(0, -radius + notch * 1.4);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 160 });
  geo.rotateX(-Math.PI / 2);          // lie flat, extrude upward (+y)
  geo.translate(0, -thickness, 0);    // top face at y = 0
  const waferMat = waferMaterial(0, pitch, die, radius);
  const wafer = new THREE.Mesh(geo, waferMat);
  wafer.renderOrder = 1;

  // The centre die that gets cut out (top face = active side).
  const dieGeo = new THREE.BoxGeometry(die, dieThickness, die);
  const dieMat = waferMaterial(1, pitch, die, radius);
  const cutDie = new THREE.Mesh(dieGeo, dieMat);
  cutDie.renderOrder = 2;

  const group = new THREE.Group();
  const waferGroup = new THREE.Group();
  waferGroup.add(wafer);
  group.add(waferGroup, cutDie);

  // die sits flush in its slot: top at y = 0
  const slotY = -dieThickness / 2;

  return { group, waferGroup, wafer, cutDie, waferMat, dieMat, slotY, dieThickness };
}