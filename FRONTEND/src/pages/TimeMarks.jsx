import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import ProDataTable from '../components/DataTable.jsx';
import { TimeMarksAPI, WorkersAPI } from '../api/client.js';
import { statusBadge, formatMinutesDiff, formatTime, formatDate } from '../utils/format.js';

const today = () => new Date().toISOString().slice(0, 10);

export default function TimeMarks() {
  const [marks, setMarks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ worker_id: '', from: '', to: '', status: '' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const [m, w] = await Promise.all([TimeMarksAPI.list(params), WorkersAPI.list()]);
      setMarks(m);
      setWorkers(w);
    } catch (e) {
      Swal.fire('Error', 'No se pudieron cargar las marcaciones. ¿Está el backend en línea?', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const openForm = async (mark = null) => {
    const isEdit = Boolean(mark);
    const options = workers
      .map((w) => `<option value="${w.id}" ${mark?.worker_id == w.id ? 'selected' : ''}>${w.full_name} (${w.document})</option>`)
      .join('');

    const { value: form } = await Swal.fire({
      title: isEdit ? 'Editar marcación' : 'Nueva marcación',
      width: 600,
      html: `
        <div class="text-start">
          <div class="mb-2">
            <label class="form-label">Trabajador *</label>
            <select id="f-worker" class="form-select"><option value="">Seleccione...</option>${options}</select>
          </div>
          <div class="row">
            <div class="col-md-6 mb-2">
              <label class="form-label">Fecha *</label>
              <input id="f-date" type="date" class="form-control" value="${mark?.mark_date ?? today()}">
            </div>
            <div class="col-md-6 mb-2">
              <label class="form-label">Tipo de marca *</label>
              <select id="f-type" class="form-select">
                <option value="entrada" ${mark?.mark_type === 'entrada' ? 'selected' : ''}>Entrada</option>
                <option value="salida" ${mark?.mark_type === 'salida' ? 'selected' : ''}>Salida</option>
              </select>
            </div>
          </div>
          <div class="row">
            <div class="col-md-6 mb-2">
              <label class="form-label">Tiempo esperado *</label>
              <input id="f-expected" type="time" class="form-control" value="${formatTime(mark?.expected_time) === '—' ? '08:00' : formatTime(mark?.expected_time)}">
            </div>
            <div class="col-md-6 mb-2">
              <label class="form-label">Marca real</label>
              <input id="f-actual" type="time" class="form-control" value="${mark?.actual_time ? formatTime(mark.actual_time) : ''}">
            </div>
          </div>
          <div class="mb-1">
            <label class="form-label">Notas</label>
            <input id="f-notes" class="form-control" value="${mark?.notes ?? ''}">
          </div>
          <small class="text-muted">El estado (a tiempo / tarde / temprano / ausente) se calcula automáticamente.</small>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: isEdit ? 'Guardar cambios' : 'Crear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2c3e50',
      preConfirm: () => {
        const payload = {
          worker_id: document.getElementById('f-worker').value,
          mark_date: document.getElementById('f-date').value,
          mark_type: document.getElementById('f-type').value,
          expected_time: document.getElementById('f-expected').value,
          actual_time: document.getElementById('f-actual').value,
          notes: document.getElementById('f-notes').value.trim(),
        };
        if (!payload.worker_id || !payload.mark_date || !payload.expected_time) {
          Swal.showValidationMessage('Trabajador, fecha y tiempo esperado son obligatorios');
          return false;
        }
        return payload;
      },
    });

    if (!form) return;

    try {
      if (isEdit) {
        await TimeMarksAPI.update(mark.id, form);
      } else {
        await TimeMarksAPI.create(form);
      }
      await load();
      Swal.fire({ icon: 'success', title: isEdit ? 'Actualizada' : 'Creada', timer: 1400, showConfirmButton: false });
    } catch (e) {
      Swal.fire('Error', e.response?.data?.message || 'Ocurrió un error', 'error');
    }
  };

  const removeMark = async (mark) => {
    const res = await Swal.fire({
      title: '¿Eliminar marcación?',
      html: `Marcación de <b>${mark.full_name}</b> del ${formatDate(mark.mark_date)}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e74c3c',
    });
    if (!res.isConfirmed) return;
    try {
      await TimeMarksAPI.remove(mark.id);
      await load();
      Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire('Error', e.response?.data?.message || 'No se pudo eliminar', 'error');
    }
  };

  const columns = [
    { data: 'full_name', title: 'Trabajador' },
    { data: 'department', title: 'Departamento', defaultContent: '—' },
    { data: 'mark_date', title: 'Fecha', render: (v) => formatDate(v) },
    {
      data: 'mark_type',
      title: 'Tipo',
      render: (v) => v === 'entrada'
        ? '<span class="badge bg-primary-subtle text-primary border border-primary-subtle">Entrada</span>'
        : '<span class="badge bg-dark-subtle text-dark border">Salida</span>',
    },
    { data: 'expected_time', title: 'Esperado', render: (v) => formatTime(v) },
    { data: 'actual_time', title: 'Real', render: (v) => formatTime(v) },
    { data: 'minutes_diff', title: 'Diferencia', render: (v) => formatMinutesDiff(v) },
    { data: 'status', title: 'Estado', render: (v) => statusBadge(v) },
    { data: null, title: 'Acciones', orderable: false, searchable: false, name: 'actions' },
  ];

  const slots = {
    8: (data, row) => (
      <div className="d-flex gap-1">
        <button className="btn btn-sm btn-outline-primary" onClick={() => openForm(row)} title="Editar">
          <i className="bi bi-pencil"></i>
        </button>
        <button className="btn btn-sm btn-outline-danger" onClick={() => removeMark(row)} title="Eliminar">
          <i className="bi bi-trash"></i>
        </button>
      </div>
    ),
  };

  return (
    <>
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label small text-muted mb-1">Trabajador</label>
              <select className="form-select form-select-sm" value={filters.worker_id}
                onChange={(e) => setFilters({ ...filters, worker_id: e.target.value })}>
                <option value="">Todos</option>
                {workers.map((w) => <option key={w.id} value={w.id}>{w.full_name}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">Desde</label>
              <input type="date" className="form-control form-control-sm" value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">Hasta</label>
              <input type="date" className="form-control form-control-sm" value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">Estado</label>
              <select className="form-select form-select-sm" value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">Todos</option>
                <option value="a_tiempo">A tiempo</option>
                <option value="tarde">Tarde</option>
                <option value="temprano">Temprano</option>
                <option value="ausente">Ausente</option>
              </select>
            </div>
            <div className="col-md-3 text-end">
              <button className="btn btn-sm btn-outline-secondary me-1"
                onClick={() => setFilters({ worker_id: '', from: '', to: '', status: '' })}>
                <i className="bi bi-x-circle me-1"></i>Limpiar
              </button>
              <button className="btn btn-sm btn-primary" onClick={() => openForm()}>
                <i className="bi bi-plus-lg me-1"></i>Nueva marcación
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="mb-3"><i className="bi bi-clock-history me-2"></i>Marcaciones</h5>
          {loading ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border text-secondary" role="status"></div>
              <p className="mt-2">Cargando...</p>
            </div>
          ) : (
            <ProDataTable
              columns={columns}
              data={marks}
              slots={slots}
              title="Reporte de Marcaciones"
              fileName="marcaciones"
            />
          )}
        </div>
      </div>
    </>
  );
}
