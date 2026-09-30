/**
 * Full-height scroll chapter. `id` must match an entry in data/sections.js
 * so the 3D camera knows where this section sits.
 */
export default function Chapter({ id, name, align = "left", tall = false, className = "", children }) {
  const wrap = align === "left" ? "wrap" : `wrap ${align}`;
  return (
    <section id={id} data-name={name} className={`chapter${tall ? " tall" : ""} ${className}`.trim()}>
      <div className={wrap}>{children}</div>
    </section>
  );
}
