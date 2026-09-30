import { useEffect, useRef } from "react";
import { ChipEngine } from "../three/ChipEngine.js";
import { SECTIONS } from "../data/sections.js";
import { PROFILE } from "../data/profile.js";

/** Fixed, full-viewport WebGL layer that stays behind every section. */
export default function ChipScene() {
  const hostRef = useRef(null);
  const labelsRef = useRef(null);

  useEffect(() => {
    let engine;
    try {
      engine = new ChipEngine({
        host: hostRef.current,
        labelsEl: labelsRef.current,
        sections: SECTIONS,
        chipOptions: {
          mark: PROFILE.mark,
          lidLines: [
            "ASIC PHYSICAL DESIGN",
            PROFILE.nodes.replace(/ nm$/, "NM").replace(/ · /g, "NM · "),
            `${PROFILE.revision.toUpperCase()} · ${PROFILE.year} · ${PROFILE.location.split(",")[0].toUpperCase()}`,
          ],
        },
      });
      engine.start();
    } catch (err) {
      // WebGL unavailable — the page still works as a plain dark layout.
      console.warn("[ChipScene] WebGL disabled:", err);
      hostRef.current?.replaceChildren();
    }
    return () => engine?.dispose();
  }, []);

  return (
    <>
      <div ref={hostRef} className="scene-host" />
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div ref={labelsRef} className="labels" aria-hidden="true" />
    </>
  );
}
