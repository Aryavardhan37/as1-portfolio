import Chapter from "../components/Chapter.jsx";
import Panel from "../components/Panel.jsx";
import Eyebrow from "../components/Eyebrow.jsx";
import Reveal from "../components/Reveal.jsx";
import { RECOGNITION } from "../data/content.js";

export default function Recognition() {
  return (
    <Chapter id="recognition" name="Recognition" align="right">
      <div className="col">
        <Panel>
          <Eyebrow>07 — Recognition</Eyebrow>
          <Reveal as="h2" delay={1}>
            Signed off
            <br />
            <span>by others.</span>
          </Reveal>
          <Reveal delay={2} className="rec">
            {RECOGNITION.map((r) => (
              <div key={r.title}>
                <div>
                  <h3>{r.title}</h3>
                  <p>{r.text}</p>
                </div>
                <span>{r.badge}</span>
              </div>
            ))}
          </Reveal>
        </Panel>
      </div>
    </Chapter>
  );
}
