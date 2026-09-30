import { MARQUEE } from "../data/content.js";

export default function Marquee() {
  const run = [...MARQUEE, ...MARQUEE]; // duplicated for a seamless loop
  return (
    <div className="marquee" aria-hidden="true">
      <div>
        {run.map((item, i) => (
          <span key={i}>
            {item}
            <i>◆</i>
          </span>
        ))}
      </div>
    </div>
  );
}
