import { useEffect, useState } from "react";

const fmt = (tz) => new Date().toLocaleTimeString("en-GB", { timeZone: tz, hour12: false });

export function useClock(timeZone = "Asia/Kolkata") {
  const [time, setTime] = useState(() => fmt(timeZone));
  useEffect(() => {
    const id = setInterval(() => setTime(fmt(timeZone)), 1000);
    return () => clearInterval(id);
  }, [timeZone]);
  return time;
}
