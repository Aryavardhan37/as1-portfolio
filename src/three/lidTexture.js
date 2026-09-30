import * as THREE from "three";

// Laser-etched marking on the heat spreader, drawn to a canvas and used as an alpha map.
export function createLidTexture({ mark, lines }) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);

  const draw = () => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
    ctx.textAlign = "left";
    ctx.font = "600 64px 'Inter Tight', sans-serif";
    ctx.fillText(mark, 48, 110);
    ctx.font = "400 22px 'JetBrains Mono', monospace";
    lines.forEach((s, i) => ctx.fillText(s, 50, 170 + i * 34));
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, 464, 464);
    ctx.beginPath();
    ctx.arc(452, 452, 12, 0, Math.PI * 2);
    ctx.stroke();
    texture.needsUpdate = true;
  };

  draw();
  // Redraw once web fonts have loaded so the marking uses the real typefaces.
  document.fonts?.ready?.then(draw);
  return texture;
}
