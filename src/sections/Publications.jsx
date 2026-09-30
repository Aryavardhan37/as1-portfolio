import Chapter from "../components/Chapter.jsx";
import Panel from "../components/Panel.jsx";
import Eyebrow from "../components/Eyebrow.jsx";
import Reveal from "../components/Reveal.jsx";
import { PUBLICATIONS } from "../data/content.js";

export default function Publications() {
  return (
    <Chapter id="publications" name="Publications">
      <div className="col wide">
        <Panel>
          <Eyebrow>06 — Publications</Eyebrow>
          <Reveal as="h2" delay={1}>On record.</Reveal>
          <Reveal delay={2} className="pubs">
            {PUBLICATIONS.map((p) => (
              <a key={p.title} className="pub" href={p.url} target="_blank" rel="noopener noreferrer">
                <div>
                  <div className="type">{p.type}</div>
                  <h3>{p.title}</h3>
                  <div className="v">{p.venue}</div>
                </div>
                <div className="y">{p.year}</div>
              </a>
            ))}
          </Reveal>
        </Panel>
      </div>
    </Chapter>
  );
}
