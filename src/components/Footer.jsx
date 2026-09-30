import { PROFILE } from "../data/profile.js";

export default function Footer() {
  return (
    <footer className="footer">
      <span>
        © {PROFILE.year} {PROFILE.firstName} {PROFILE.lastName}
      </span>
      <span>{PROFILE.mark} · All geometry procedural · Three.js</span>
      <span>
        {PROFILE.location.split(",")[0]} · {PROFILE.coords}
      </span>
    </footer>
  );
}
