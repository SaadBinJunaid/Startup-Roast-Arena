// pages/Landing.jsx
// Public home page: two-column hero, investor roster, how-it-works steps,
// and the latest community pitches (real data from the API).

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Laugh, Rocket, ArrowRight } from "lucide-react";
import api from "../services/apiClient";
import IdeaCard from "../components/IdeaCard";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";

const INVESTORS = [
  {
    name: "Strict Investor",
    icon: ShieldAlert,
    className: "icon-strict",
    text: "Grills your business model with hard questions about revenue, costs, market size and competition.",
  },
  {
    name: "Funny Investor",
    icon: Laugh,
    className: "icon-funny",
    text: "Roasts your idea to your chosen spice level — while still slipping in one genuinely useful observation.",
  },
  {
    name: "Dreamer Investor",
    icon: Rocket,
    className: "icon-dreamer",
    text: "Sees your idea's future potential and maps out how it could grow into a much bigger business.",
  },
];

export default function Landing() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadIdeas() {
      try {
        const response = await api.get("/ideas");
        setIdeas(response.data.ideas.slice(0, 3));
      } catch {
        // The landing page should still work even if ideas cannot load.
        setIdeas([]);
      } finally {
        setLoading(false);
      }
    }

    loadIdeas();
  }, []);

  return (
    <div>
      {/* Hero: copy on the left, blank pitch sheet on the right. */}
      <section className="container hero">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">AI-powered startup feedback</span>
            <h1 className="hero-title">
              Pitch your startup. Get roasted by three investors.
            </h1>
            <p className="hero-sub">
              Submit your idea, choose your roast level, and face a Strict,
              Funny and Dreamer investor. Collect AI scores and funding offers,
              then let the community vote you up the leaderboard.
            </p>

            <div className="hero-actions">
              {user ? (
                <Link to="/submit" className="btn btn-primary">
                  Submit a startup idea <ArrowRight size={18} />
                </Link>
              ) : (
                <Link to="/register" className="btn btn-primary">
                  Get started free <ArrowRight size={18} />
                </Link>
              )}
              <Link to="/leaderboard" className="btn btn-secondary">
                View leaderboard
              </Link>
            </div>
          </div>

          {/* Static outline of the four pitch fields (a design element,
              not sample data — the real pitches are loaded below). */}
          <div className="hero-panel">
            <div className="panel-head">
              <strong>Your pitch sheet</strong>
              <span className="badge badge-neutral">4 fields</span>
            </div>

            <div className="panel-row">
              <span className="panel-num">01</span>
              <div>
                <div className="panel-label">Problem</div>
                <div className="panel-hint">What does your startup solve?</div>
              </div>
            </div>
            <div className="panel-row">
              <span className="panel-num">02</span>
              <div>
                <div className="panel-label">Solution</div>
                <div className="panel-hint">How will you solve it?</div>
              </div>
            </div>
            <div className="panel-row">
              <span className="panel-num">03</span>
              <div>
                <div className="panel-label">Target customer</div>
                <div className="panel-hint">Who will use or buy it?</div>
              </div>
            </div>
            <div className="panel-row">
              <span className="panel-num">04</span>
              <div>
                <div className="panel-label">Roast level</div>
                <div className="panel-hint">How hard should they hit?</div>
              </div>
            </div>

            <div className="panel-legend">
              <span className="badge badge-mild">Mild</span>
              <span className="badge badge-medium">Medium</span>
              <span className="badge badge-spicy">Spicy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Investor roster: numbered full-width rows instead of cards. */}
      <section className="container section">
        <div className="section-head">
          <span className="eyebrow">The panel</span>
          <h2>Meet your three investors</h2>
          <p>Every idea is reviewed by all three personalities.</p>
        </div>

        <div className="roster">
          {INVESTORS.map((investor, index) => {
            const Icon = investor.icon;
            const number = "0" + (index + 1);

            return (
              <div className="roster-row" key={investor.name}>
                <span className="roster-num">{number}</span>
                <span className={"feature-icon " + investor.className}>
                  <Icon size={22} />
                </span>
                <div className="roster-body">
                  <h3>{investor.name}</h3>
                  <p>{investor.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works: three numbered step blocks. */}
      <section className="container section">
        <div className="section-head">
          <span className="eyebrow">Process</span>
          <h2>How it works</h2>
        </div>

        <div className="steps">
          <div className="step">
            <span className="step-num">1</span>
            <h3>Describe your idea</h3>
            <p>
              Explain the problem, your solution and your target customer, then
              pick a roast level.
            </p>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <h3>Face the investors</h3>
            <p>
              Get three scores out of 10, roasts, improvement tips and fictional
              funding offers.
            </p>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <h3>Win the crowd</h3>
            <p>
              Community votes and AI scores combine on the leaderboard. Re-pitch
              to improve your score.
            </p>
          </div>
        </div>
      </section>

      {/* Latest pitches: real ideas from the API, shown as rows. */}
      <section className="container section">
        <div className="row-between section-head">
          <div>
            <span className="eyebrow">Community feed</span>
            <h2>Latest pitches</h2>
            <p>Fresh ideas from the community.</p>
          </div>
          <Link to="/leaderboard" className="btn btn-secondary btn-sm">
            See all
          </Link>
        </div>

        {loading && <Loader message="Loading pitches..." />}

        {!loading && ideas.length === 0 && (
          <div className="empty">
            <h3>No ideas yet</h3>
            <p>Be the first to submit a startup idea.</p>
            <Link to={user ? "/submit" : "/register"} className="btn btn-primary">
              Submit an idea
            </Link>
          </div>
        )}

        {!loading && ideas.length > 0 && (
          <div className="idea-list">
            {ideas.map((idea) => (
              <IdeaCard idea={idea} key={idea.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
