import { SECTIONS } from "../data/sections.js";
import { useTelemetry, selectActive } from "../hooks/useTelemetry.js";

export default function SideIndex() {
  const active = useTelemetry(selectActive);
  return (
    <nav className="side-idx" aria-label="Section index">
      {SECTIONS.map((s, i) => (
        <a key={s.id} href={`#${s.id}`} title={s.name} aria-label={s.name} className={i === active ? "on" : undefined} />
      ))}
    </nav>
  );
}
