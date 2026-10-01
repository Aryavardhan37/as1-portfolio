import { useEffect, useRef, useState } from "react";
import { telemetry } from "../lib/telemetry.js";
import { PROFILE } from "../data/profile.js";
import LiquidGlassButton from "./LiquidGlassButton.jsx";

const MESSAGES = [
  "Loading substrate", "Placing C4 bumps", "Routing RDL", "Building M8 → M1",
  "Dropping vias", "Forming FEOL", "Bonding lid", "Signoff clean",
];

const FADE_MS = 1200;

export default function Loader() {
  const [ready, setReady] = useState(false);     // loading hit 100%
  const [leaving, setLeaving] = useState(false); // fade-out running
  const [done, setDone] = useState(false);       // loader removed
  const numRef = useRef(null);
  const barRef = useRef(null);
  const msgRef = useRef(null);

  // Progress counter
  useEffect(() => {
    let p = 0, raf = 0, finished = false;

    const paint = (v) => {
      if (numRef.current) numRef.current.textContent = String(Math.floor(v)).padStart(3, "0");
      if (barRef.current) barRef.current.style.width = `${v}%`;
      if (msgRef.current)
        msgRef.current.textContent = MESSAGES[Math.min(MESSAGES.length - 1, Math.floor((v / 100) * MESSAGES.length))];
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      paint(100);
      setReady(true);
    };

    const tick = () => {
      const target = telemetry.get().ready ? 100 : 88;
      p = Math.min(target, p + (target - p) * 0.06 + 0.25);
      if (p >= 99.5) return finish();
      paint(p);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const fallback = setTimeout(finish, 8000); // if WebGL fails
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, []);

  // Lock page scroll until the portfolio is opened
  useEffect(() => {
    if (done) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [done]);

  const launch = () => {
    if (leaving) return;
    window.scrollTo(0, 0);
    setLeaving(true);
    setTimeout(() => setDone(true), FADE_MS);
  };

  if (done) return null;

  return (
    <div className={`loader${leaving ? " leaving" : ""}`}>
      <div className="loader-waves" aria-hidden="true" />

      <div className="loader-top">
        {PROFILE.mark} &nbsp;/&nbsp; Initialising die &nbsp;/&nbsp; {PROFILE.location}
      </div>

      <div className="loader-bottom">
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

      {ready && (
        <div className="start-gui-layer">
          <LiquidGlassButton onClick={launch} disabled={leaving} autoFocus>
            <span className="start-gui-prompt">&gt;</span>
            <span>start_gui/win</span>
            <span className="start-gui-caret" />
          </LiquidGlassButton>
        </div>
      )}
    </div>
  );
}