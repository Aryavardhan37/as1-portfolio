import { SECTIONS } from "../data/sections.js";
import { PROFILE } from "../data/profile.js";
import { useClock } from "../hooks/useClock.js";
import { useTelemetry, selectActive } from "../hooks/useTelemetry.js";

export default function TopBar() {
  const time = useClock("Asia/Kolkata");
  const active = useTelemetry(selectActive);

  return (
    <header className="topbar">
      <a href="#top" className="brand">
        <span className="sq" />
        <b>{PROFILE.mark}</b>
        <span>{`${PROFILE.firstName} ${PROFILE.lastName}`.toUpperCase()}</span>
      </a>

      <nav className="nav" aria-label="Sections">
        {SECTIONS.map((s, i) =>
          s.nav ? (
            <a key={s.id} href={`#${s.id}`} className={i === active ? "on" : undefined}>
              {s.nav}
            </a>
          ) : null
        )}
      </nav>

      <div className="status">
        {PROFILE.status && (
          <span>
            <span className="dot" />
            {PROFILE.status}
          </span>
        )}
        <span className="clk">IST {time}</span>
      </div>
    </header>
  );
}
