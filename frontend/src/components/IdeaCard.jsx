// components/IdeaCard.jsx
// A horizontal row summarising one startup idea, linking to its details.
// Used inside .idea-list on the Landing, Dashboard and My Ideas pages.

import { Link } from "react-router-dom";
import { ArrowRight, User } from "lucide-react";
import RoastBadge from "./RoastBadge";

export default function IdeaCard({ idea }) {
  const ownerName = idea.owner && idea.owner.name ? idea.owner.name : "Unknown";

  return (
    <Link
      to={"/ideas/" + idea.id}
      className="card card-hover idea-card"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="idea-card-head">
        <RoastBadge level={idea.roastLevel} />
        <span className="badge badge-neutral">v{idea.currentVersion}</span>
      </div>

      <div>
        <h3>{idea.problem}</h3>
        <p className="idea-snippet">{idea.solution}</p>
      </div>

      <div className="idea-meta">
        <span className="row" style={{ gap: 6 }}>
          <User size={14} />
          {ownerName}
        </span>
        <ArrowRight size={18} className="idea-arrow" />
      </div>
    </Link>
  );
}
