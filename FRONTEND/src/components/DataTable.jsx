import { useEffect, useRef } from 'react';
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-bs5';

// Extensiones de exportación
import 'datatables.net-buttons-bs5';
import 'datatables.net-buttons/js/buttons.html5.mjs';
import 'datatables.net-buttons/js/buttons.print.mjs';
import jszip from 'jszip';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Registrar dependencias necesarias para exportar a Excel y PDF
DataTable.use(DT);
window.JSZip = jszip;
pdfMake.vfs = pdfFonts.vfs || pdfFonts.pdfMake?.vfs;

/**
 * Tabla reutilizable basada en DataTables (Bootstrap 5) con botones de
 * exportación a Excel, PDF, copiar e imprimir, y un encabezado profesional.
 *
 * props:
 *  - columns: definición de columnas de DataTables
 *  - data: arreglo de filas
 *  - title: título que aparece en los archivos exportados
 *  - fileName: nombre base de los archivos exportados
 *  - slots: render personalizado por columna (datatables.net-react)
 */
export default function ProDataTable({ columns, data, title, fileName, slots }) {
  const tableRef = useRef(null);

  const exportConfig = {
    title,
    messageTop: `Generado el ${new Date().toLocaleString('es')}`,
  };

  const options = {
    dom: "<'row align-items-center mb-3'<'col-md-6'B><'col-md-6'f>>" +
         "<'row'<'col-12'tr>>" +
         "<'row mt-3 align-items-center'<'col-md-5'i><'col-md-7'p>>",
    language: {
      url: 'https://cdn.datatables.net/plug-ins/2.1.8/i18n/es-ES.json',
    },
    pageLength: 10,
    order: [],
    buttons: [
      {
        extend: 'excelHtml5',
        text: '<i class="bi bi-file-earmark-excel me-1"></i> Excel',
        className: 'btn btn-sm btn-success',
        titleAttr: 'Exportar a Excel',
        ...exportConfig,
      },
      {
        extend: 'pdfHtml5',
        text: '<i class="bi bi-file-earmark-pdf me-1"></i> PDF',
        className: 'btn btn-sm btn-danger',
        titleAttr: 'Exportar a PDF',
        orientation: 'landscape',
        pageSize: 'A4',
        ...exportConfig,
        customize: (doc) => {
          doc.styles.tableHeader.fillColor = '#2c3e50';
          doc.styles.tableHeader.color = '#ffffff';
          doc.defaultStyle.fontSize = 9;
          doc.styles.title = { fontSize: 16, bold: true, color: '#2c3e50', margin: [0, 0, 0, 8] };
        },
      },
      {
        extend: 'print',
        text: '<i class="bi bi-printer me-1"></i> Imprimir',
        className: 'btn btn-sm btn-secondary',
        titleAttr: 'Imprimir',
        ...exportConfig,
      },
      {
        extend: 'copy',
        text: '<i class="bi bi-clipboard me-1"></i> Copiar',
        className: 'btn btn-sm btn-outline-secondary',
        titleAttr: 'Copiar al portapapeles',
      },
    ],
  };

  // Mantener nombre de archivo configurable
  useEffect(() => {
    options.buttons.forEach((b) => {
      if (b.extend !== 'print' && b.extend !== 'copy') b.filename = fileName;
    });
  }, [fileName]);

  return (
    <DataTable
      ref={tableRef}
      className="table table-striped table-hover align-middle w-100"
      columns={columns}
      data={data}
      options={options}
      slots={slots}
    />
  );
}
