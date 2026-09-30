// ─────────────────────────────────────────────────────────────
// Section registry + 3D camera choreography.
// Order here = order on the page. The ChipEngine blends between
// neighbouring `scene` states as you scroll.
//
//   e      explode amount 0..1
//   shift  horizontal screen offset of the chip (-0.5..0.5 of width)
//   dist   camera distance
//   elev   camera elevation (radians)
//   rot    chip yaw (radians)
//   lbl    1 = show projected layer labels
// ─────────────────────────────────────────────────────────────
export const SECTIONS = [
  { id: "top",          name: "Overview",         nav: null,          scene: { e: 0.0,  shift: 0.24,  dist: 17, elev: 0.52, rot: -0.55, lbl: 0 } },
  { id: "anatomy",      name: "Anatomy",          nav: "Anatomy",     scene: { e: 1.0,  shift: 0.09,  dist: 29, elev: 0.12, rot: -0.30, lbl: 1 } },
  { id: "spec",         name: "Specification",    nav: "Spec",        scene: { e: 0.22, shift: -0.22, dist: 19, elev: 0.75, rot: 0.40,  lbl: 0 } },
  { id: "experience",   name: "Revision history", nav: "Revisions",   scene: { e: 0.06, shift: 0.25,  dist: 19, elev: 0.35, rot: -1.10, lbl: 0 } },
  { id: "work",         name: "Capabilities",     nav: "Work",        scene: { e: 0.55, shift: -0.24, dist: 23, elev: 0.22, rot: 0.90,  lbl: 0 } },
  { id: "publications", name: "Publications",     nav: "Papers",      scene: { e: 0.0,  shift: 0.25,  dist: 18, elev: 1.05, rot: 0.20,  lbl: 0 } },
  { id: "recognition",  name: "Recognition",      nav: "Recognition", scene: { e: 0.14, shift: -0.24, dist: 20, elev: 0.40, rot: -0.80, lbl: 0 } },
  { id: "contact",      name: "Contact",          nav: "Contact",     scene: { e: 0.0,  shift: 0.0,   dist: 16, elev: 0.30, rot: 0.0,   lbl: 0 } },
];
