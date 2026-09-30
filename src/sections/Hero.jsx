import Chapter from "../components/Chapter.jsx";
import Eyebrow from "../components/Eyebrow.jsx";
import Reveal from "../components/Reveal.jsx";
import { PROFILE } from "../data/profile.js";

export default function Hero() {
  const strip = [
    ["Role", PROFILE.role],
    ["Base", PROFILE.location],
    ["Nodes", PROFILE.nodes],
    ["Flow", "RTL → GDSII"],
  ];
  const [a, b, c] = PROFILE.tagline;

  return (
    <Chapter id="top" name="Overview" className="hero">
      <div className="col">
        <Eyebrow>
          {PROFILE.mark} — ASIC Physical Design — {PROFILE.revision}
        </Eyebrow>
        <Reveal as="h1" delay={1}>
          {PROFILE.firstName}
          <br />
          <span>{PROFILE.lastName}</span>
        </Reveal>
        <Reveal as="p" delay={2} className="lede">
          {PROFILE.lede}
        </Reveal>
        <Reveal delay={2} className="strip">
          {strip.map(([k, v]) => (
            <div key={k}>
              <span className="mono">{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </Reveal>
        <Reveal delay={3} className="btns">
          <a href="#anatomy" className="btn solid">Inspect the stack ↓</a>
          <a href="#contact" className="btn">Get in touch →</a>
        </Reveal>
      </div>
      <div className="tag">
        {a} <b>{b}</b>
        {c}
      </div>
    </Chapter>
  );
}
