// Utilidades de formato y presentación

export const STATUS_META = {
  a_tiempo: { label: 'A tiempo', color: 'success', icon: 'bi-check-circle' },
  tarde:    { label: 'Tarde',    color: 'danger',  icon: 'bi-exclamation-circle' },
  temprano: { label: 'Temprano', color: 'info',    icon: 'bi-arrow-up-circle' },
  ausente:  { label: 'Ausente',  color: 'secondary', icon: 'bi-dash-circle' },
};

export function statusBadge(status) {
  const meta = STATUS_META[status] ?? { label: status, color: 'secondary', icon: 'bi-question' };
  return `<span class="badge badge-status bg-${meta.color}-subtle text-${meta.color} border border-${meta.color}-subtle">
    <i class="bi ${meta.icon} me-1"></i>${meta.label}</span>`;
}

export function formatMinutesDiff(min) {
  const n = Number(min) || 0;
  if (n === 0) return '—';
  if (n > 0) return `+${n} min`;
  return `${n} min`;
}

export function formatTime(t) {
  if (!t) return '—';
  return t.substring(0, 5);
}

export function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('es');
}
