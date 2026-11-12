// pages/MyPitches.jsx (formerly MyIdeas.jsx)
// Private page that lists ONLY the logged-in user's own ideas as rows.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import api, { getErrorMessage } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import IdeaCard from "../components/IdeaCard";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

export default function MyPitches() {
  const { user } = useAuth();

  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get("/ideas");

        // Keep only the ideas whose owner id matches the logged-in user.
        const mine = response.data.ideas.filter(function (idea) {
          return idea.owner && idea.owner._id === user.id;
        });

        setIdeas(mine);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user.id]);

  return (
    <div className="container page">
      <div className="page-head row-between">
        <div>
          <span className="eyebrow">Your submissions</span>
          <h1>My ideas</h1>
          <p>All the startup ideas you have pitched.</p>
        </div>
        <Link to="/submit" className="btn btn-primary">
          <PlusCircle size={18} /> New idea
        </Link>
      </div>

      <ErrorMessage message={error} />

      {loading && <Loader message="Loading your ideas..." />}

      {!loading && !error && ideas.length === 0 && (
        <EmptyState
          title="You have not submitted any ideas yet"
          message="Submit your first startup idea and get roasted by three AI investors."
          action={
            <Link to="/submit" className="btn btn-primary">
              Submit an idea
            </Link>
          }
        />
      )}

      {!loading && ideas.length > 0 && (
        <div className="idea-list">
          {ideas.map((idea) => (
            <IdeaCard idea={idea} key={idea.id} />
          ))}
        </div>
      )}
    </div>
  );
}
