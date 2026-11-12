// components/EmptyState.jsx
// Shown when a list has no items yet.

export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="empty">
      {icon}
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
