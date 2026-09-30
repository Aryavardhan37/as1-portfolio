/** Blurred glass panel with accent corner brackets. */
export default function Panel({ className = "", style, children }) {
  return (
    <div className={`panel ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
