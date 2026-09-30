import Chapter from "../components/Chapter.jsx";
import Panel from "../components/Panel.jsx";
import Eyebrow from "../components/Eyebrow.jsx";
import Reveal from "../components/Reveal.jsx";
import { ANATOMY_GROUPS } from "../data/content.js";

export default function Anatomy() {
  return (
    <Chapter id="anatomy" name="Anatomy" tall>
      <div className="col col-anatomy">
        <Panel>
          <Eyebrow>02 — Anatomy</Eyebrow>
          <Reveal as="h2" delay={1}>
            Sixteen layers.
            <br />
            <span>One signal path.</span>
          </Reveal>
          <Reveal as="p" delay={2}>
            This is a flip-chip package drawn in its real order. The die sits face-down: transistors at the top of the
            stack, dense M1 routing right beneath them, widening through the intermediate layers into the thick M8 power
            grid, then out through the RDL, UBM and C4 bumps into the substrate and BGA balls. Every via lands on metal
            above and below it.
          </Reveal>
          <Reveal delay={3} className="groups">
            {ANATOMY_GROUPS.map((g) => (
              <div key={g.code}>
                <b>{g.code}</b>
                <span>
                  <strong>{g.title}</strong> {g.text}
                </span>
              </div>
            ))}
          </Reveal>
          <Reveal as="p" className="mono hint">
            Keep scrolling to reassemble ↓
          </Reveal>
        </Panel>
      </div>
    </Chapter>
  );
}
