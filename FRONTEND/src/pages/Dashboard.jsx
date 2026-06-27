import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

import StatCard from '../components/StatCard.jsx';
import ProDataTable from '../components/DataTable.jsx';
import { AnalyticsAPI } from '../api/client.js';
import { formatDate } from '../utils/format.js';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend
);

const CHART_COLORS = {
  primary: '#2c3e50',
  accent: '#1abc9c',
  danger: '#e74c3c',
  warning: '#f39c12',
  info: '#3498db',
  muted: '#95a5a6',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: '', to: '' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(Object.entries(range).filter(([, v]) => v));
      setData(await AnalyticsAPI.get(params));
    } catch (e) {
      Swal.fire('Error', 'No se pudieron cargar las analíticas. ¿Está el backend en línea?', 'error');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) {
    return (
      <div className="text-center py-5 text-muted">
        <div className="spinner-border text-secondary" role="status"></div>
        <p className="mt-2">Cargando analíticas...</p>
      </div>
    );
  }

  const { summary, by_worker, by_date, by_department } = data;

  /* --- Gráfico: distribución de estados (dona) --- */
  const doughnutData = {
    labels: ['A tiempo', 'Tarde', 'Temprano', 'Ausente'],
    datasets: [{
      data: [summary.on_time, summary.late, summary.early, summary.absent],
      backgroundColor: [CHART_COLORS.accent, CHART_COLORS.danger, CHART_COLORS.info, CHART_COLORS.muted],
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  /* --- Gráfico: tendencia por día (línea) --- */
  const lineData = {
    labels: by_date.map((d) => formatDate(d.mark_date)),
    datasets: [
      {
        label: 'A tiempo',
        data: by_date.map((d) => Number(d.on_time)),
        borderColor: CHART_COLORS.accent,
        backgroundColor: 'rgba(26,188,156,0.1)',
        tension: 0.3, fill: true,
      },
      {
        label: 'Tarde',
        data: by_date.map((d) => Number(d.late)),
        borderColor: CHART_COLORS.danger,
        backgroundColor: 'rgba(231,76,60,0.1)',
        tension: 0.3, fill: true,
      },
    ],
  };

  /* --- Gráfico: marcaciones tardías por departamento (barras) --- */
  const barData = {
    labels: by_department.map((d) => d.department),
    datasets: [
      {
        label: 'Total marcaciones',
        data: by_department.map((d) => Number(d.total_marks)),
        backgroundColor: CHART_COLORS.primary,
        borderRadius: 4,
      },
      {
        label: 'Tardanzas',
        data: by_department.map((d) => Number(d.late)),
        backgroundColor: CHART_COLORS.warning,
        borderRadius: 4,
      },
    ],
  };

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  /* --- Tabla ranking de trabajadores --- */
  const columns = [
    { data: 'full_name', title: 'Trabajador' },
    { data: 'department', title: 'Departamento', defaultContent: '—' },
    { data: 'total_marks', title: 'Marcaciones' },
    { data: 'on_time', title: 'A tiempo' },
    { data: 'late', title: 'Tardanzas' },
    { data: 'absent', title: 'Ausencias' },
    { data: 'avg_late_minutes', title: 'Prom. retraso (min)' },
    {
      data: 'punctuality_rate',
      title: 'Puntualidad',
      render: (v) => {
        const n = Number(v);
        const color = n >= 90 ? 'success' : n >= 70 ? 'warning' : 'danger';
        return `<div class="d-flex align-items-center gap-2">
          <div class="progress flex-grow-1" style="height:8px;min-width:60px">
            <div class="progress-bar bg-${color}" style="width:${n}%"></div>
          </div>
          <span class="small fw-semibold">${n}%</span></div>`;
      },
    },
  ];

  return (
    <>
      {/* Filtro de rango */}
      <div className="card mb-3">
        <div className="card-body d-flex flex-wrap align-items-end gap-2">
          <div>
            <label className="form-label small text-muted mb-1">Desde</label>
            <input type="date" className="form-control form-control-sm" value={range.from}
              onChange={(e) => setRange({ ...range, from: e.target.value })} />
          </div>
          <div>
            <label className="form-label small text-muted mb-1">Hasta</label>
            <input type="date" className="form-control form-control-sm" value={range.to}
              onChange={(e) => setRange({ ...range, to: e.target.value })} />
          </div>
          <button className="btn btn-sm btn-outline-secondary"
            onClick={() => setRange({ from: '', to: '' })}>
            <i className="bi bi-arrow-counterclockwise me-1"></i>Todo el periodo
          </button>
        </div>
      </div>

      {/* Tarjetas de métricas */}
      <div className="row g-3 mb-3">
        <div className="col-md-3 col-sm-6"><StatCard icon="bi-people-fill" color="primary" label="Trabajadores activos" value={summary.total_workers} /></div>
        <div className="col-md-3 col-sm-6"><StatCard icon="bi-clipboard-check" color="info" label="Total marcaciones" value={summary.total_marks} /></div>
        <div className="col-md-3 col-sm-6"><StatCard icon="bi-check-circle-fill" color="success" label="Puntualidad" value={summary.punctuality_rate} suffix="%" /></div>
        <div className="col-md-3 col-sm-6"><StatCard icon="bi-exclamation-triangle-fill" color="danger" label="Tardanzas" value={summary.late} /></div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-3 col-sm-6"><StatCard icon="bi-stopwatch" color="warning" label="Prom. retraso (min)" value={summary.avg_late_minutes} /></div>
        <div className="col-md-3 col-sm-6"><StatCard icon="bi-arrow-up-circle" color="info" label="Entradas tempranas" value={summary.early} /></div>
        <div className="col-md-3 col-sm-6"><StatCard icon="bi-dash-circle" color="secondary" label="Ausencias" value={summary.absent} /></div>
        <div className="col-md-3 col-sm-6"><StatCard icon="bi-check2-all" color="success" label="A tiempo" value={summary.on_time} /></div>
      </div>

      {/* Gráficos */}
      <div className="row g-3 mb-3">
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted mb-3">Distribución de estados</h6>
              <div style={{ height: 260 }}><Doughnut data={doughnutData} options={baseOpts} /></div>
            </div>
          </div>
        </div>
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted mb-3">Tendencia diaria (a tiempo vs. tarde)</h6>
              <div style={{ height: 260 }}><Line data={lineData} options={baseOpts} /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-3">Marcaciones y tardanzas por departamento</h6>
              <div style={{ height: 280 }}><Bar data={barData} options={baseOpts} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla analítica de trabajadores (exportable) */}
      <div className="card">
        <div className="card-body">
          <h5 className="mb-3"><i className="bi bi-bar-chart-line me-2"></i>Analítica por trabajador</h5>
          <ProDataTable
            columns={columns}
            data={by_worker}
            title="Analítica de Puntualidad por Trabajador"
            fileName="analitica_trabajadores"
          />
        </div>
      </div>
    </>
  );
}
