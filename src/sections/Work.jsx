import Chapter from "../components/Chapter.jsx";
import Panel from "../components/Panel.jsx";
import Eyebrow from "../components/Eyebrow.jsx";
import Reveal from "../components/Reveal.jsx";
import { FLOW, PROJECTS } from "../data/content.js";

function ProjectRow({ p, i }) {
  const inner = (
    <>
      <span className="n">{String(i + 1).padStart(2, "0")}</span>
      <div>
        <h3>
          {p.title}
          {p.url ? " ↗" : ""}
        </h3>
        <p>{p.text}</p>
      </div>
      <span className="k">{p.tag}</span>
    </>
  );
  return p.url ? (
    <a href={p.url} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <div className="item">{inner}</div>
  );
}

export default function Work() {
  return (
    <Chapter id="work" name="Capabilities" align="right" tall>
      <div className="col wide">
        <Panel>
          <Eyebrow>05 — Capabilities &amp; builds</Eyebrow>
          <Reveal as="h2" delay={1}>
            Netlist in.
            <br />
            <span>Clean GDS out.</span>
          </Reveal>
          <Reveal delay={2} className="flow">
            {FLOW.map((f) => (
              <div key={f.n}>
                <b>{f.n}</b>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </Reveal>
          <Reveal className="mono sub">Selected builds</Reveal>
          <Reveal delay={2} className="proj">
            {PROJECTS.map((p, i) => (
              <ProjectRow key={p.title} p={p} i={i} />
            ))}
          </Reveal>
        </Panel>
      </div>
    </Chapter>
  );
}
