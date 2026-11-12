// App.jsx
// Responsibility: define every route in the app and wrap all pages with the
// shared Navbar and Footer.

import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SubmitPitch from "./pages/SubmitPitch";
import MyPitches from "./pages/MyPitches";
import IdeaDetails from "./pages/IdeaDetails";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <Navbar />

      <main>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/ideas/:id" element={<IdeaDetails />} />

          {/* Pages that require login */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit"
            element={
              <ProtectedRoute>
                <SubmitPitch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-ideas"
            element={
              <ProtectedRoute>
                <MyPitches />
              </ProtectedRoute>
            }
          />

          {/* Anything else -> 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
