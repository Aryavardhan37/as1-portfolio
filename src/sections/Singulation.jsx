import Chapter from "../components/Chapter.jsx";
import Panel from "../components/Panel.jsx";
import Eyebrow from "../components/Eyebrow.jsx";
import Reveal from "../components/Reveal.jsx";

export default function Singulation() {
  return (
    <Chapter id="singulation" name="Singulation">
      <div className="col">
        <Panel>
          <Eyebrow>From wafer to die</Eyebrow>
          <Reveal as="h2" delay={1}>
            One die,
            <br />
            <span>cut from the wafer.</span>
          </Reveal>
          <Reveal as="p" delay={2}>
            A laser scribes the streets, one die lifts free, flips face-down and drops into its
            package — the same stack you can take apart next.
          </Reveal>
        </Panel>
      </div>
    </Chapter>
  );
}