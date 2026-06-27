# ⏱️ Time-Taker 1.0

Aplicación web para la **marcación y control de tiempos** de los trabajadores.
Permite crear, modificar y eliminar las marcaciones (los tiempos en los que se
deben ingresar las marcas), gestionar a los trabajadores y visualizar
**analíticas profesionales** de puntualidad, con exportación de reportes a
**PDF** y **Excel**.

El proyecto está dividido en dos partes independientes:

| Carpeta      | Tecnología                                   | Rol                         |
|--------------|----------------------------------------------|-----------------------------|
| `backend/`   | PHP 8.1+ · MySQL · PDO (API REST)            | API, base de datos, CRUD    |
| `frontend/`  | React 18 · Vite · Bootstrap 5                | Interfaz de usuario         |

---

## ✨ Características

- **CRUD completo de marcaciones**: crear, editar y eliminar los tiempos esperados
  y reales de entrada/salida.
- **CRUD de trabajadores** (nombre, documento, cargo, departamento, correo, estado).
- **Cálculo automático de estado** de cada marca: `a tiempo`, `tarde`, `temprano`
  o `ausente`, junto con los minutos de diferencia.
- **Dashboard de analíticas** con métricas clave (puntualidad, tardanzas,
  promedio de retraso, ausencias) y **gráficos** (dona, líneas y barras) usando
  Chart.js.
- **Tablas interactivas** con DataTables (búsqueda, orden, paginación) en español.
- **Exportación profesional** de cualquier tabla a **Excel**, **PDF**, impresión
  y copia al portapapeles, con encabezados, título y fecha de generación.
- **Notificaciones y formularios** con **SweetAlert2**.
- Diseño **sobrio y profesional** (paleta azul pizarra / verde azulado).

---

## 🧱 Arquitectura y stack

**Backend**
- PHP puro (sin framework) con enrutador propio y autoload PSR-4.
- PDO + MySQL con consultas preparadas (a prueba de inyección SQL).
- Sistema de **migraciones** versionadas y **seeder** de datos de ejemplo.
- Respuestas JSON consistentes y CORS habilitado.

**Frontend**
- React 18 + React Router + Vite.
- Bootstrap 5 + Bootstrap Icons para los estilos.
- SweetAlert2 (notificaciones/modales), DataTables (tablas), Chart.js (gráficos).
- Exportación con `datatables.net-buttons` + `jszip` (Excel) + `pdfmake` (PDF).
- Axios como cliente HTTP.

---

## 📂 Estructura del proyecto

```
TIME-TAKER/
├── backend/
│   ├── config/
│   │   └── config.php              # Configuración (lee .env)
│   ├── database/
│   │   └── migrations/
│   │       ├── 001_create_workers_table.sql
│   │       └── 002_create_time_marks_table.sql
│   ├── public/
│   │   ├── index.php               # Front controller / router de la API
│   │   └── .htaccess               # Rewrite para Apache
│   ├── src/
│   │   ├── Database.php            # Conexión PDO
│   │   ├── Response.php            # Helper de respuestas JSON
│   │   └── Controllers/
│   │       ├── WorkerController.php
│   │       ├── TimeMarkController.php
│   │       └── AnalyticsController.php
│   ├── migrate.php                 # Ejecuta las migraciones
│   ├── seed.php                    # Inserta datos de ejemplo
│   ├── composer.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── api/client.js           # Cliente Axios (Workers/TimeMarks/Analytics)
    │   ├── components/
    │   │   ├── Layout.jsx          # Sidebar + topbar
    │   │   ├── DataTable.jsx       # Tabla reutilizable con exportación
    │   │   └── StatCard.jsx        # Tarjeta de métrica
    │   ├── pages/
    │   │   ├── Dashboard.jsx       # Analíticas + gráficos
    │   │   ├── TimeMarks.jsx       # CRUD de marcaciones
    │   │   └── Workers.jsx         # CRUD de trabajadores
    │   ├── utils/format.js
    │   ├── styles/app.css
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── .env.example
```

---

## 🗄️ Modelo de datos

### Tabla `workers`
| Campo        | Tipo          | Descripción                          |
|--------------|---------------|--------------------------------------|
| id           | INT (PK)      | Identificador                        |
| full_name    | VARCHAR(120)  | Nombre completo                      |
| document     | VARCHAR(40)   | Documento (único)                    |
| position     | VARCHAR(80)   | Cargo                                |
| department   | VARCHAR(80)   | Departamento                         |
| email        | VARCHAR(120)  | Correo                               |
| active       | TINYINT(1)    | Activo / inactivo                    |
| created_at / updated_at | TIMESTAMP | Auditoría                    |

### Tabla `time_marks`
| Campo         | Tipo                                   | Descripción                                   |
|---------------|----------------------------------------|-----------------------------------------------|
| id            | INT (PK)                               | Identificador                                 |
| worker_id     | INT (FK → workers, ON DELETE CASCADE)  | Trabajador                                    |
| mark_date     | DATE                                   | Fecha de la marca                             |
| mark_type     | ENUM('entrada','salida')               | Tipo de marca                                 |
| expected_time | TIME                                   | **Tiempo en el que se debe ingresar la marca**|
| actual_time   | TIME (nullable)                        | Marca real registrada                         |
| status        | ENUM('a_tiempo','tarde','temprano','ausente') | Estado calculado automáticamente       |
| minutes_diff  | INT                                    | Diferencia en minutos (+ tarde / − temprano)  |
| notes         | VARCHAR(255)                           | Notas                                         |

> El **estado** se calcula en el backend comparando `actual_time` con
> `expected_time`, usando una tolerancia de ±5 minutos. Si no hay `actual_time`,
> la marca queda como `ausente`.

---

## 🚀 Puesta en marcha

### Requisitos
- PHP **8.1+** con extensiones `pdo_mysql` y `json`.
- MySQL **5.7+** / MariaDB.
- Node.js **18+** y npm.

### 1) Backend

```bash
cd backend

# Configurar credenciales de la base de datos
cp .env.example .env       # En Windows: copy .env.example .env
# Edita .env con tu host, usuario y contraseña de MySQL

# Crear la base de datos + tablas (migraciones)
php migrate.php

# (Opcional) Cargar datos de ejemplo: 5 trabajadores y 100 marcaciones
php seed.php

# Levantar el servidor de la API
php -S localhost:8000 -t public
```

La API queda disponible en `http://localhost:8000/api`.

> Si usas **Apache/XAMPP**, apunta el _DocumentRoot_ a `backend/public` (el
> `.htaccess` ya redirige todo a `index.php`).

### 2) Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar la URL de la API (opcional, ya viene por defecto)
cp .env.example .env       # VITE_API_URL=http://localhost:8000/api

# Levantar la aplicación
npm run dev
```

Abre **http://localhost:5173** en el navegador.

### Build de producción del frontend
```bash
npm run build      # genera la carpeta dist/
npm run preview    # sirve el build localmente
```

---

## 🔌 API REST

Base: `http://localhost:8000/api`. Todas las respuestas tienen el formato:

```json
{ "success": true, "message": "OK", "data": ... }
```

### Trabajadores
| Método | Ruta              | Descripción              |
|--------|-------------------|--------------------------|
| GET    | `/workers`        | Listar trabajadores      |
| GET    | `/workers/{id}`   | Detalle                  |
| POST   | `/workers`        | Crear                    |
| PUT    | `/workers/{id}`   | Actualizar               |
| DELETE | `/workers/{id}`   | Eliminar (cascade marks) |

### Marcaciones
| Método | Ruta                 | Descripción                                   |
|--------|----------------------|-----------------------------------------------|
| GET    | `/time-marks`        | Listar (filtros: `worker_id`, `from`, `to`, `status`) |
| GET    | `/time-marks/{id}`   | Detalle                                       |
| POST   | `/time-marks`        | Crear (calcula `status` y `minutes_diff`)     |
| PUT    | `/time-marks/{id}`   | Actualizar                                    |
| DELETE | `/time-marks/{id}`   | Eliminar                                      |

### Analíticas
| Método | Ruta          | Descripción                                            |
|--------|---------------|--------------------------------------------------------|
| GET    | `/analytics`  | Resumen + ranking por trabajador + tendencia por día + por departamento (filtros `from`, `to`) |

**Ejemplo — crear marcación**
```bash
curl -X POST http://localhost:8000/api/time-marks \
  -H "Content-Type: application/json" \
  -d '{"worker_id":1,"mark_date":"2026-06-26","mark_type":"entrada","expected_time":"08:00","actual_time":"08:20"}'
# -> status: "tarde", minutes_diff: 20
```

---

## 📊 Analíticas disponibles

El dashboard muestra, sobre el período seleccionado:

- **Métricas globales**: trabajadores activos, total de marcaciones, % de
  puntualidad, tardanzas, promedio de retraso, entradas tempranas, ausencias y
  marcas a tiempo.
- **Gráfico de dona**: distribución de estados.
- **Gráfico de líneas**: tendencia diaria (a tiempo vs. tarde).
- **Gráfico de barras**: marcaciones y tardanzas por departamento.
- **Tabla analítica por trabajador**: marcaciones, tardanzas, ausencias,
  promedio de retraso y **tasa de puntualidad** (con barra de progreso),
  exportable a PDF/Excel.

---

## 📤 Exportación de reportes

Cada tabla incluye botones para exportar a **Excel** (`.xlsx`), **PDF**
(orientación horizontal, encabezado corporativo, título y fecha), **imprimir** y
**copiar**. Los archivos se generan en el navegador (sin pasar por el servidor).

---

## 🔧 Configuración (variables de entorno)

**Backend (`backend/.env`)**
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=time_taker
DB_USER=root
DB_PASS=
CORS_ORIGIN=http://localhost:5173
```

**Frontend (`frontend/.env`)**
```
VITE_API_URL=http://localhost:8000/api
```

---

## ✅ Estado verificado

- Migraciones y seeder ejecutados correctamente (5 trabajadores, 100 marcaciones).
- API probada: CRUD de trabajadores y marcaciones, filtros, cálculo de estado y
  endpoint de analíticas.
- Frontend compila correctamente (`npm run build`).

---

## 📝 Licencia

Proyecto de ejemplo de uso libre.
