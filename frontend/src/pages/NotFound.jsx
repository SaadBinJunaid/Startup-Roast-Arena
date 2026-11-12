// pages/NotFound.jsx
// Shown for any URL that does not match a real page.

import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container page">
      <div className="page-narrow center">
        <span className="eyebrow">Error</span>
        <div className="notfound-num">404</div>
        <h2>Page not found</h2>
        <p className="muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to home
        </Link>
      </div>
    </div>
  );
}
