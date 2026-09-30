import { useEffect } from "react";

let observer = null;
function getObserver() {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.15 }
    );
  }
  return observer;
}

/** Adds the `.in` class to the element the first time it scrolls into view. */
export function useReveal(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = getObserver();
    io.observe(el);
    return () => io.unobserve(el);
  }, [ref]);
}
