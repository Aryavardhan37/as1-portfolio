import { useEffect, useState } from "react";
import { telemetry } from "../lib/telemetry.js";

/** Re-renders only when the selected value changes (e.g. active section index). */
export function useTelemetry(selector) {
  const [value, setValue] = useState(() => selector(telemetry.get()));
  useEffect(() => telemetry.subscribe((s) => setValue(selector(s))), [selector]);
  return value;
}

export const selectActive = (s) => s.active;
export const selectReady = (s) => s.ready;
