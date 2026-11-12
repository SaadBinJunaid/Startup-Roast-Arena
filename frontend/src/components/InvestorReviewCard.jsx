// components/InvestorReviewCard.jsx
// One investor's verdict as a full-width row: big score on the left,
// roast, improvement tip and funding/equity offers on the right.

import { ShieldAlert, Laugh, Rocket, Lightbulb } from "lucide-react";

// Look up the icon and color for each investor personality.
const INVESTOR_META = {
  "Strict Investor": { icon: ShieldAlert, className: "icon-strict" },
  "Funny Investor": { icon: Laugh, className: "icon-funny" },
  "Dreamer Investor": { icon: Rocket, className: "icon-dreamer" },
};

function formatMoney(amount) {
  return "Rs. " + Number(amount).toLocaleString();
}

export default function InvestorReviewCard({ review }) {
  const meta =
    INVESTOR_META[review.investorName] || INVESTOR_META["Dreamer Investor"];
  const Icon = meta.icon;

  return (
    <div className="verdict">
      {/* Left block: the score, set large in serif. */}
      <div className="verdict-score">
        <span className="num">{review.score}</span>
        <span className="out-of">out of 10</span>
      </div>

      {/* Right block: investor identity, roast, tip, offers. */}
      <div className="verdict-body">
        <div className="verdict-top">
          <div className="verdict-investor">
            <span className={"review-avatar " + meta.className}>
              <Icon size={20} />
            </span>
            <div>
              <strong>{review.investorName}</strong>
              <span className="small">AI Investor</span>
            </div>
          </div>
          <span className="badge badge-neutral">Verdict</span>
        </div>

        <p className="verdict-roast">{review.roast}</p>

        <p className="verdict-tip">
          <Lightbulb size={18} />
          <span>{review.improvementTip}</span>
        </p>

        <div className="verdict-offers">
          <div className="offer-item">
            <strong>{formatMoney(review.fundingAmount)}</strong>
            <span>Funding offer</span>
          </div>
          <div className="offer-item">
            <strong>{review.equityPercentage}%</strong>
            <span>Equity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
