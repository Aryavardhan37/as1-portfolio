import Chapter from "../components/Chapter.jsx";
import Panel from "../components/Panel.jsx";
import Eyebrow from "../components/Eyebrow.jsx";
import Reveal from "../components/Reveal.jsx";
import { PROFILE } from "../data/profile.js";

export default function Contact() {
  return (
    <Chapter id="contact" name="Contact" align="center">
      <Panel className="contact">
        <Eyebrow center>08 — Contact</Eyebrow>
        <Reveal as="h2" delay={1}>
          Let's tape out
          <br />
          <span>something.</span>
        </Reveal>
        <Reveal as="a" delay={2} className="mail" href={`mailto:${PROFILE.email}`}>
          {PROFILE.email}
        </Reveal>
        <Reveal delay={3} className="links">
          {PROFILE.links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label} ↗
            </a>
          ))}
        </Reveal>
      </Panel>
    </Chapter>
  );
}
