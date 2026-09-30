import * as THREE from "three";

// Laser-etched marking on the heat spreader, drawn to a 2048px canvas and used
// as an alpha map. High resolution + anisotropic filtering keep it sharp even
// at the shallow viewing angle of the hero shot.
export function createLidTexture({ mark, lines, anisotropy = 8 }) {
  const S = 2048;
  const u = S / 512; // design units → pixels
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = anisotropy;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const draw = () => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = `600 ${64 * u}px 'Inter Tight', sans-serif`;
    ctx.fillText(mark, 48 * u, 110 * u);
    ctx.font = `500 ${22 * u}px 'JetBrains Mono', monospace`;
    lines.forEach((s, i) => ctx.fillText(s, 50 * u, (170 + i * 34) * u));
    ctx.lineWidth = 2 * u;
    ctx.strokeRect(24 * u, 24 * u, 464 * u, 464 * u);
    ctx.beginPath();
    ctx.arc(452 * u, 452 * u, 12 * u, 0, Math.PI * 2);
    ctx.stroke();
    texture.needsUpdate = true;
  };

  draw();
  // Redraw once web fonts have loaded so the marking uses the real typefaces.
  document.fonts?.ready?.then(draw);
  return texture;
}