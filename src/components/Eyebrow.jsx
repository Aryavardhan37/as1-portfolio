import Reveal from "./Reveal.jsx";

export default function Eyebrow({ children, center = false }) {
  return (
    <Reveal className="eyebrow" style={center ? { justifyContent: "center" } : undefined}>
      {children}
    </Reveal>
  );
}
