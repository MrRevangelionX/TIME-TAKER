export default function StatCard({ icon, label, value, color = 'primary', suffix = '' }) {
  return (
    <div className="card tt-stat-card h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <div className={`tt-stat-icon bg-${color}-subtle text-${color}`}>
          <i className={`bi ${icon}`}></i>
        </div>
        <div>
          <div className="tt-stat-value">{value}{suffix}</div>
          <div className="tt-stat-label">{label}</div>
        </div>
      </div>
    </div>
  );
}
