// components/RoastBadge.jsx
// Colored badge that shows the roast level (Mild / Medium / Spicy).

export default function RoastBadge({ level }) {
  const classByLevel = {
    Mild: "badge-mild",
    Medium: "badge-medium",
    Spicy: "badge-spicy",
  };

  const className = classByLevel[level] || "badge-neutral";

  return <span className={"badge " + className}>{level}</span>;
}
