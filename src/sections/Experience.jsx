import Chapter from "../components/Chapter.jsx";
import Panel from "../components/Panel.jsx";
import Eyebrow from "../components/Eyebrow.jsx";
import Reveal from "../components/Reveal.jsx";
import { EXPERIENCE } from "../data/content.js";

export default function Experience() {
  return (
    <Chapter id="experience" name="Revision history">
      <div className="col wide">
        <Panel>
          <Eyebrow>04 — Revision history</Eyebrow>
          <Reveal as="h2" delay={1}>
            Rev C<span>, and before.</span>
          </Reveal>
          <Reveal delay={2} className="rev">
            {EXPERIENCE.map((e) => (
              <article key={e.rev}>
                <div className="r">
                  {e.rev}
                  <small>{e.when}</small>
                </div>
                <div>
                  <h3>
                    {e.role}
                    {e.current && <span className="cur">CURRENT</span>}
                  </h3>
                  <div className="org">{e.org}</div>
                  <ul>
                    {e.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </Reveal>
        </Panel>
      </div>
    </Chapter>
  );
}
