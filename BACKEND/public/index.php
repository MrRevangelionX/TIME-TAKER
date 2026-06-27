<?php
/**
 * Front controller / router de la API REST de Time-Taker.
 *
 * Rutas disponibles:
 *   GET    /api/workers              Lista de trabajadores
 *   GET    /api/workers/{id}         Detalle de un trabajador
 *   POST   /api/workers             Crear trabajador
 *   PUT    /api/workers/{id}        Actualizar trabajador
 *   DELETE /api/workers/{id}        Eliminar trabajador
 *
 *   GET    /api/time-marks           Lista de marcaciones (?worker_id&from&to&status)
 *   GET    /api/time-marks/{id}      Detalle de una marcación
 *   POST   /api/time-marks          Crear marcación
 *   PUT    /api/time-marks/{id}     Actualizar marcación
 *   DELETE /api/time-marks/{id}     Eliminar marcación
 *
 *   GET    /api/analytics            Métricas para el dashboard (?from&to)
 */

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');

$config = require __DIR__ . '/../config/config.php';

/* --- Autoload manual de las clases de App\ --- */
spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
    $file = __DIR__ . '/../src/' . $relative . '.php';
    if (is_file($file)) {
        require $file;
    }
});

use App\Controllers\AnalyticsController;
use App\Controllers\TimeMarkController;
use App\Controllers\WorkerController;
use App\Response;

/* --- CORS --- */
header('Access-Control-Allow-Origin: ' . $config['cors_origin']);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/* --- Manejo global de errores -> JSON --- */
set_exception_handler(static function (Throwable $e): void {
    Response::error('Error interno del servidor: ' . $e->getMessage(), 500);
});

/* --- Resolver la ruta --- */
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';

// Quitar prefijo del subdirectorio si la API no está en la raíz del dominio
$basePath = trim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
if ($basePath !== '' && str_starts_with(ltrim($uri, '/'), $basePath)) {
    $uri = '/' . ltrim(substr(ltrim($uri, '/'), strlen($basePath)), '/');
}

$path = trim($uri, '/');
$path = preg_replace('#^api/?#', '', $path); // soporta /api/... y /...
$segments = $path === '' ? [] : explode('/', $path);

$resource = $segments[0] ?? '';
$id = isset($segments[1]) && ctype_digit($segments[1]) ? (int) $segments[1] : null;

/* --- Leer cuerpo JSON --- */
$body = [];
if (in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
    $raw = file_get_contents('php://input');
    $body = $raw ? (json_decode($raw, true) ?? []) : [];
}

/* --- Despacho --- */
switch ($resource) {
    case '':
        Response::success([
            'app'     => 'Time-Taker API',
            'version' => '1.0.0',
            'status'  => 'ok',
        ], 'API en funcionamiento');
        break;

    case 'workers':
        $c = new WorkerController();
        match (true) {
            $method === 'GET' && $id !== null    => $c->show($id),
            $method === 'GET'                    => $c->index(),
            $method === 'POST'                   => $c->store($body),
            $method === 'PUT' && $id !== null    => $c->update($id, $body),
            $method === 'DELETE' && $id !== null => $c->destroy($id),
            default => Response::error('Método no permitido', 405),
        };
        break;

    case 'time-marks':
        $c = new TimeMarkController();
        match (true) {
            $method === 'GET' && $id !== null    => $c->show($id),
            $method === 'GET'                    => $c->index($_GET),
            $method === 'POST'                   => $c->store($body),
            $method === 'PUT' && $id !== null    => $c->update($id, $body),
            $method === 'DELETE' && $id !== null => $c->destroy($id),
            default => Response::error('Método no permitido', 405),
        };
        break;

    case 'analytics':
        (new AnalyticsController())->index($_GET);
        break;

    default:
        Response::error('Recurso no encontrado', 404);
}
