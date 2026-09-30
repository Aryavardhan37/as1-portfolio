import Chapter from "../components/Chapter.jsx";
import Panel from "../components/Panel.jsx";
import Eyebrow from "../components/Eyebrow.jsx";
import Reveal from "../components/Reveal.jsx";
import { STATS, SPEC_ROWS, SKILLS } from "../data/content.js";

export default function Spec() {
  return (
    <Chapter id="spec" name="Specification" align="right">
      <div className="col wide">
        <Panel>
          <Eyebrow>03 — Specification</Eyebrow>
          <Reveal as="h2" delay={1}>Spec sheet.</Reveal>

          <Reveal delay={2} className="stats">
            {STATS.map((s) => (
              <div key={s.label}>
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </Reveal>

          <Reveal delay={2}>
            <table className="spec">
              <tbody>
                {SPEC_ROWS.map(([k, v]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>

          <Reveal delay={3} className="chips">
            {SKILLS.map((g) => (
              <div className="row" key={g.group}>
                <span>{g.group}</span>
                <ul>
                  {g.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </Reveal>
        </Panel>
      </div>
    </Chapter>
  );
}
