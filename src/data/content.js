// ─────────────────────────────────────────────────────────────
// All section content. Add / remove entries freely — the
// sections render whatever is in these arrays.
// ─────────────────────────────────────────────────────────────

export const MARQUEE = [
  "FLOORPLAN", "POWER PLAN", "PLACEMENT", "CTS", "ROUTING", "STA", "TIMING ECO",
  "IR / EM", "DRC · LVS", "LEC", "3NM → 32NM", "FUSION COMPILER", "PRIMETIME",
];

export const ANATOMY_GROUPS = [
  { code: "FEOL", title: "Devices & contacts.", text: "Poly gates with tungsten contacts up into M1." },
  { code: "BEOL", title: "M1 – M8 interconnect.", text: "Alternating routing directions, pitch growing with each layer." },
  { code: "PACKAGE", title: "RDL · UBM · C4 · BGA.", text: "Where the die meets the board." },
];

export const STATS = [
  { value: "3nm", label: "Smallest node" },
  { value: "04", label: "Tech nodes" },
  { value: "02", label: "IEEE papers" },
  { value: "₹1L", label: "Product grant" },
];

export const SPEC_ROWS = [
  ["Designation", "ASIC Physical Design Associate Engineer"],
  ["Organisation", "eInfochips — An Arrow Company"],
  ["In service", "January 2025 → present"],
  ["Process nodes", "3nm · 14nm · 28nm · 32nm"],
  ["Flow coverage", "Synthesis → Floorplan → Place → CTS → Route → Signoff"],
  ["Toolchain", "Synopsys and Cadence suites"],
  ["Education", "Bachelor of ICT, Embedded & VLSI — Marwadi University, 2021–2025 · CGPA 9.24 / 10"],
];

export const SKILLS = [
  { group: "Implement", items: ["Fusion Compiler", "IC Compiler II", "Design Compiler"] },
  { group: "Signoff", items: ["PrimeTime", "Formality", "IC Validator", "RedHawk-SC"] },
  { group: "Open-source", items: ["OpenLane", "OpenROAD"] },
  { group: "Languages", items: ["Verilog", "Tcl", "Python", "Perl", "Shell"] },
  { group: "Platform", items: ["Linux", "Git", "Docker"] },
  { group: "Hardware", items: ["Altera FPGA", "Jetson Nano", "Raspberry Pi 4", "Arduino", "ESP8266"] },
];

export const EXPERIENCE = [
  {
    rev: "Rev C",
    when: "Jan 2025 — Now",
    current: true,
    role: "ASIC Physical Design Associate Engineer",
    org: "eInfochips — An Arrow Company · Ahmedabad",
    points: [
      "Backend implementation across the full physical design flow on multiple designs",
      "Synopsys and Cadence tool suites, synthesis through signoff",
      "Technology nodes: 3nm, 14nm, 28nm and 32nm",
    ],
  },
  {
    rev: "Rev B",
    when: "Mar — Dec 2024",
    role: "Research & Development Intern",
    org: "Arishna IoT Solutions · Remote",
    points: [
      "Built cloud and IoT data pipelines",
      "Developed multi-modal networks for IoT applications",
      "Created a Gen-AI cloud server for inference",
    ],
  },
  {
    rev: "Rev A",
    when: "May — Jul 2023",
    role: "Research Intern",
    org: "Marwadi University · Rajkot",
    points: [
      "Turned research ideas into working prototypes with Python and IoT",
      "First research prototype, published at an IEEE international conference",
    ],
  },
];

export const FLOW = [
  { n: "01", title: "Floorplan", text: "Macro placement, site rows, IO and power-grid planning." },
  { n: "02", title: "Placement", text: "Legal, congestion-aware placement and optimisation." },
  { n: "03", title: "CTS", text: "Balanced clock trees with controlled skew and latency." },
  { n: "04", title: "Routing", text: "Track assignment, detail route, DRC-clean convergence." },
  { n: "05", title: "Timing & ECO", text: "STA in PrimeTime and targeted timing ECOs." },
  { n: "06", title: "Signoff", text: "IR / EM, DRC, LVS and equivalence checks." },
];

export const PROJECTS = [
  {
    title: "Elevator Controller in Verilog",
    text: "FSM-based controller with next-state logic, implemented and verified in simulation.",
    tag: "Verilog · RTL",
    url: "https://github.com/Aryavardhan37/Design-and-Implmentation-of-Elevator-Controller-using-verilog",
  },
  { title: "Electronic Tug of War", text: "Case study simulated in Proteus — shift registers, flip-flops and digital logic.", tag: "Digital · Proteus" },
  { title: "NatureNexus — Smart IoT Plant", text: "Research internship project taken from prototype to product.", tag: "IoT · Product" },
  { title: "ARICA", text: "AI assistant for custom datasets; won a ₹1 lakh product-development grant.", tag: "AI · Grant" },
  { title: "Gen-AI Inference Server", text: "Cloud server for model inference, built during the Arishna internship.", tag: "Cloud · AI" },
];

export const PUBLICATIONS = [
  {
    type: "IEEE Conference",
    year: "2023",
    title: "Sensor-Node Based Smart Irrigation System with IoT Framework",
    venue: "IEEE Int. Conf. on Electrical, Electronics, Communication and Computers · IIT Roorkee",
    url: "https://ieeexplore.ieee.org/document/10370640",
  },
  {
    type: "IEEE Conference",
    year: "2023",
    title: "How Effective is Game Based Learning for Teaching Graph Theory Concepts? A Case Study of Treasure Hunt Game",
    venue: "IEEE Region 10 Humanitarian Technology Conference · Marwadi University",
    url: "https://ieeexplore.ieee.org/document/10461843",
  },
  {
    type: "Copyright",
    year: "—",
    title: "Pathfinding Adventure — a game developed in Python",
    venue: "Copyright approved · Patent Office of India",
    url: "https://drive.google.com/file/d/16Njm0x-9bG1PZtaukFVbBDsTDwPNPQ6K/view?usp=drive_link",
  },
];

export const RECOGNITION = [
  { title: "Product-development grant — ₹1,00,000", text: "NewGEN-IEDC (Government initiative) for ARICA", badge: "Grant" },
  { title: "AIU Anveshan 2023", text: "Finalist, national-level student research convention", badge: "Finalist" },
  { title: "IEEEXtreme 17.0", text: "Gujarat Section Lead at the international programming competition", badge: "Lead" },
  { title: "IEEE MEFGI WIE", text: "Co-Chair, Executive Committee", badge: "Co-Chair" },
  { title: "Circuitology Club", text: "Elected General Secretary of the hardware club", badge: "Gen. Sec." },
];
