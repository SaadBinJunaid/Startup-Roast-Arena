// components/Loader.jsx
// A simple spinner with a message, used while data is loading.

export default function Loader({ message }) {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p className="muted">{message || "Loading..."}</p>
    </div>
  );
}
