import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import ProDataTable from '../components/DataTable.jsx';
import { WorkersAPI } from '../api/client.js';

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setWorkers(await WorkersAPI.list());
    } catch (e) {
      Swal.fire('Error', 'No se pudieron cargar los trabajadores. ¿Está el backend en línea?', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openForm = async (worker = null) => {
    const isEdit = Boolean(worker);
    const { value: form } = await Swal.fire({
      title: isEdit ? 'Editar trabajador' : 'Nuevo trabajador',
      width: 600,
      html: `
        <div class="text-start">
          <div class="mb-2">
            <label class="form-label">Nombre completo *</label>
            <input id="f-name" class="form-control" value="${worker?.full_name ?? ''}">
          </div>
          <div class="row">
            <div class="col-md-6 mb-2">
              <label class="form-label">Documento *</label>
              <input id="f-doc" class="form-control" value="${worker?.document ?? ''}">
            </div>
            <div class="col-md-6 mb-2">
              <label class="form-label">Cargo</label>
              <input id="f-pos" class="form-control" value="${worker?.position ?? ''}">
            </div>
          </div>
          <div class="row">
            <div class="col-md-6 mb-2">
              <label class="form-label">Departamento</label>
              <input id="f-dep" class="form-control" value="${worker?.department ?? ''}">
            </div>
            <div class="col-md-6 mb-2">
              <label class="form-label">Correo</label>
              <input id="f-email" class="form-control" value="${worker?.email ?? ''}">
            </div>
          </div>
          <div class="form-check mt-1">
            <input id="f-active" class="form-check-input" type="checkbox" ${(!isEdit || worker?.active == 1) ? 'checked' : ''}>
            <label class="form-check-label" for="f-active">Activo</label>
          </div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: isEdit ? 'Guardar cambios' : 'Crear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2c3e50',
      preConfirm: () => {
        const payload = {
          full_name: document.getElementById('f-name').value.trim(),
          document: document.getElementById('f-doc').value.trim(),
          position: document.getElementById('f-pos').value.trim(),
          department: document.getElementById('f-dep').value.trim(),
          email: document.getElementById('f-email').value.trim(),
          active: document.getElementById('f-active').checked ? 1 : 0,
        };
        if (!payload.full_name || !payload.document) {
          Swal.showValidationMessage('Nombre y documento son obligatorios');
          return false;
        }
        return payload;
      },
    });

    if (!form) return;

    try {
      if (isEdit) {
        await WorkersAPI.update(worker.id, form);
      } else {
        await WorkersAPI.create(form);
      }
      await load();
      Swal.fire({ icon: 'success', title: isEdit ? 'Actualizado' : 'Creado', timer: 1400, showConfirmButton: false });
    } catch (e) {
      const msg = e.response?.data?.message || 'Ocurrió un error';
      Swal.fire('Error', msg, 'error');
    }
  };

  const removeWorker = async (worker) => {
    const res = await Swal.fire({
      title: '¿Eliminar trabajador?',
      html: `Se eliminará <b>${worker.full_name}</b> y todas sus marcaciones.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e74c3c',
    });
    if (!res.isConfirmed) return;
    try {
      await WorkersAPI.remove(worker.id);
      await load();
      Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire('Error', e.response?.data?.message || 'No se pudo eliminar', 'error');
    }
  };

  const columns = [
    { data: 'full_name', title: 'Nombre' },
    { data: 'document', title: 'Documento' },
    { data: 'position', title: 'Cargo', defaultContent: '—' },
    { data: 'department', title: 'Departamento', defaultContent: '—' },
    { data: 'email', title: 'Correo', defaultContent: '—' },
    {
      data: 'active',
      title: 'Estado',
      render: (v) => v == 1
        ? '<span class="badge bg-success-subtle text-success border border-success-subtle">Activo</span>'
        : '<span class="badge bg-secondary-subtle text-secondary border">Inactivo</span>',
    },
    {
      data: null,
      title: 'Acciones',
      orderable: false,
      searchable: false,
      name: 'actions',
    },
  ];

  const slots = {
    6: (data, row) => (
      <div className="d-flex gap-1">
        <button className="btn btn-sm btn-outline-primary" onClick={() => openForm(row)} title="Editar">
          <i className="bi bi-pencil"></i>
        </button>
        <button className="btn btn-sm btn-outline-danger" onClick={() => removeWorker(row)} title="Eliminar">
          <i className="bi bi-trash"></i>
        </button>
      </div>
    ),
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0"><i className="bi bi-people me-2"></i>Trabajadores</h5>
          <button className="btn btn-primary" onClick={() => openForm()}>
            <i className="bi bi-plus-lg me-1"></i> Nuevo trabajador
          </button>
        </div>
        {loading ? (
          <div className="text-center py-5 text-muted">
            <div className="spinner-border text-secondary" role="status"></div>
            <p className="mt-2">Cargando...</p>
          </div>
        ) : (
          <ProDataTable
            columns={columns}
            data={workers}
            slots={slots}
            title="Listado de Trabajadores"
            fileName="trabajadores"
          />
        )}
      </div>
    </div>
  );
}
