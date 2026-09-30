import * as THREE from "three";

// Muted, physically-based palette: copper interconnect, tungsten contacts,
// aluminium RDL, SAC solder, green laminate substrate, nickel-plated lid.
export function createMaterials() {
  return {
    copper: new THREE.MeshStandardMaterial({ color: 0xb8743f, metalness: 1, roughness: 0.32 }),
    copperPwr: new THREE.MeshStandardMaterial({ color: 0xc07c45, metalness: 1, roughness: 0.28 }),
    tungsten: new THREE.MeshStandardMaterial({ color: 0x8d9299, metalness: 1, roughness: 0.38 }),
    poly: new THREE.MeshStandardMaterial({ color: 0x8a5a4e, metalness: 0.2, roughness: 0.55 }),
    alum: new THREE.MeshStandardMaterial({ color: 0xc9ccd1, metalness: 1, roughness: 0.34 }),
    solder: new THREE.MeshStandardMaterial({ color: 0xc3c7cc, metalness: 1, roughness: 0.22 }),
    ubm: new THREE.MeshStandardMaterial({ color: 0xc9a45c, metalness: 1, roughness: 0.3 }),
    substrate: new THREE.MeshStandardMaterial({ color: 0x1d3a30, metalness: 0.1, roughness: 0.75 }),
    silicon: new THREE.MeshStandardMaterial({ color: 0x252a36, metalness: 0.55, roughness: 0.28 }),
    feol: new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 0.3, roughness: 0.5, transparent: true, opacity: 0.55 }),
    tim: new THREE.MeshStandardMaterial({ color: 0x6b6f76, metalness: 0.2, roughness: 0.9 }),
    lid: new THREE.MeshStandardMaterial({ color: 0xa6abb1, metalness: 1, roughness: 0.3 }),
    passiv: new THREE.MeshPhysicalMaterial({ color: 0x6d7f73, metalness: 0, roughness: 0.4, transparent: true, opacity: 0.35, depthWrite: false }),
    ild: new THREE.MeshPhysicalMaterial({ color: 0x9fb3c8, metalness: 0, roughness: 0.2, transparent: true, opacity: 0.07, depthWrite: false }),

    // Only visible while the package is assembled: solid die sidewall + epoxy underfill fillet.
    dieShell: new THREE.MeshStandardMaterial({ color: 0x1b1e26, metalness: 0.55, roughness: 0.35, transparent: true }),
    underfill: new THREE.MeshStandardMaterial({ color: 0x24262b, metalness: 0.05, roughness: 0.85, flatShading: true, transparent: true }),

    edge: new THREE.LineBasicMaterial({ color: 0xece8e1, transparent: true, opacity: 0.16 }),
    edgeHi: new THREE.LineBasicMaterial({ color: 0xc8814a, transparent: true, opacity: 0.45 }),
  };
}