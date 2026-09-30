import { useEffect, useRef } from "react";
import { telemetry } from "../lib/telemetry.js";
import { SECTIONS } from "../data/sections.js";

const pad = (n, l = 3) => String(n).padStart(l, "0");

/** Live readouts, updated straight from the engine without React re-renders. */
export default function HUD() {
  const exp = useRef(null), rot = useRef(null), scr = useRef(null), sec = useRef(null), rail = useRef(null);

  useEffect(() => {
    let last = -1;
    return telemetry.subscribe((s) => {
      if (!exp.current) return;
      exp.current.textContent = s.e.toFixed(2);
      rot.current.textContent = `${pad(Math.round(((s.rot % 360) + 360) % 360))}°`;
      scr.current.textContent = `${pad(Math.round(s.scroll * 100))}%`;
      rail.current.style.width = `${s.scroll * 100}%`;
      if (s.active !== last) {
        last = s.active;
        sec.current.textContent = `§ ${pad(s.active + 1, 2)} / ${pad(SECTIONS.length, 2)} — ${SECTIONS[s.active].name}`;
      }
    });
  }, []);

  return (
    <>
      <div className="hud hud-l" aria-hidden="true">
        <span>
          Explode <b ref={exp}>0.00</b> · Rot <b ref={rot}>000°</b>
        </span>
        <span>
          Layers <b>16</b> · Metals <b>M1–M8</b> · Flip-chip
        </span>
        <span>
          Scroll <b ref={scr}>000%</b>
        </span>
      </div>
      <div className="hud hud-r" aria-hidden="true">
        <span className="sec" ref={sec}>
          § 01 / {pad(SECTIONS.length, 2)} — {SECTIONS[0].name}
        </span>
        <div className="rail">
          <i ref={rail} />
        </div>
      </div>
    </>
  );
}
