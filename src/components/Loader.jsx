import { useEffect, useRef, useState } from "react";
import { telemetry } from "../lib/telemetry.js";
import { PROFILE } from "../data/profile.js";

const MESSAGES = [
  "Loading substrate", "Placing C4 bumps", "Routing RDL", "Building M8 → M1",
  "Dropping vias", "Forming FEOL", "Bonding lid", "Signoff clean",
];

export default function Loader() {
  const [done, setDone] = useState(false);
  const numRef = useRef(null);
  const barRef = useRef(null);
  const msgRef = useRef(null);

  useEffect(() => {
    let p = 0, raf = 0, finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setTimeout(() => setDone(true), 250);
    };
    const tick = () => {
      const target = telemetry.get().ready ? 100 : 88;
      p = Math.min(target, p + (target - p) * 0.06 + 0.25);
      if (numRef.current) numRef.current.textContent = String(Math.floor(p)).padStart(3, "0");
      if (barRef.current) barRef.current.style.width = `${p}%`;
      if (msgRef.current) msgRef.current.textContent = MESSAGES[Math.min(MESSAGES.length - 1, Math.floor((p / 100) * MESSAGES.length))];
      if (p >= 99.5) return finish();
      raf = requestAnimationFrame(tick);
    };
    tick();
    const fallback = setTimeout(finish, 8000); // never block the page if WebGL/CDN fails
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div className={`loader${done ? " done" : ""}`} aria-hidden={done}>
      <div>
        {PROFILE.mark} &nbsp;/&nbsp; Initialising die &nbsp;/&nbsp; {PROFILE.location}
      </div>
      <div>
        <div className="loader-num">
          <span ref={numRef}>000</span>%
        </div>
        <div className="loader-bar">
          <i ref={barRef} />
        </div>
        <div className="loader-foot">
          <span ref={msgRef}>{MESSAGES[0]}</span>
          <span>
            {PROFILE.revision} · {PROFILE.year}
          </span>
        </div>
      </div>
    </div>
  );
}
