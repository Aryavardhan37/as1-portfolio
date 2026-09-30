import { useRef } from "react";
import { useReveal } from "../hooks/useReveal.js";

/** Fades + lifts its content in on first view. delay: 0–3. */
export default function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
  const ref = useRef(null);
  useReveal(ref);
  const cls = ["rv", delay ? `d${delay}` : "", className].filter(Boolean).join(" ");
  return (
    <Tag ref={ref} className={cls} {...rest}>
      {children}
    </Tag>
  );
}
