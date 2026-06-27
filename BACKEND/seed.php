<?php
/**
 * Inserta datos de ejemplo para probar la aplicación.
 * Uso:  php seed.php
 */

declare(strict_types=1);

require __DIR__ . '/src/Database.php';

use App\Database;

$pdo = Database::connection();

echo "==> Sembrando datos de ejemplo...\n";

$pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
$pdo->exec('TRUNCATE TABLE time_marks');
$pdo->exec('TRUNCATE TABLE workers');
$pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

$workers = [
    ['Ana María Gómez',   '1001', 'Analista',     'Operaciones', 'ana.gomez@empresa.com'],
    ['Carlos Pérez',      '1002', 'Desarrollador','Tecnología',  'carlos.perez@empresa.com'],
    ['Lucía Fernández',   '1003', 'Diseñadora',   'Tecnología',  'lucia.fernandez@empresa.com'],
    ['Jorge Ramírez',     '1004', 'Soporte',      'Operaciones', 'jorge.ramirez@empresa.com'],
    ['María José Ruiz',   '1005', 'Contadora',    'Finanzas',    'mariajose.ruiz@empresa.com'],
];

$wStmt = $pdo->prepare(
    'INSERT INTO workers (full_name, document, position, department, email, active)
     VALUES (?, ?, ?, ?, ?, 1)'
);
$ids = [];
foreach ($workers as $w) {
    $wStmt->execute($w);
    $ids[] = (int) $pdo->lastInsertId();
}
echo '[ok] ' . count($ids) . " trabajadores insertados.\n";

/** Calcula estado y diferencia en minutos (igual que el backend). */
function computeStatus(string $expected, ?string $actual): array
{
    if ($actual === null || $actual === '') {
        return ['ausente', 0];
    }
    $e = strtotime($expected);
    $a = strtotime($actual);
    $diff = (int) round(($a - $e) / 60);
    if ($diff > 5) {
        return ['tarde', $diff];
    }
    if ($diff < -5) {
        return ['temprano', $diff];
    }
    return ['a_tiempo', $diff];
}

$mStmt = $pdo->prepare(
    'INSERT INTO time_marks (worker_id, mark_date, mark_type, expected_time, actual_time, status, minutes_diff, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);

$count = 0;
// Generamos marcas para los últimos 10 días hábiles
for ($d = 0; $d < 10; $d++) {
    $date = date('Y-m-d', strtotime("-$d days"));
    foreach ($ids as $workerId) {
        // Entrada
        $expectedIn = '08:00:00';
        $actualIn = sprintf('08:%02d:00', random_int(0, 1) ? random_int(0, 5) : random_int(6, 25));
        [$st, $diff] = computeStatus($expectedIn, $actualIn);
        $mStmt->execute([$workerId, $date, 'entrada', $expectedIn, $actualIn, $st, $diff, null]);
        $count++;

        // Salida
        $expectedOut = '17:00:00';
        $actualOut = sprintf('17:%02d:00', random_int(0, 1) ? random_int(0, 8) : 0);
        [$st, $diff] = computeStatus($expectedOut, $actualOut);
        $mStmt->execute([$workerId, $date, 'salida', $expectedOut, $actualOut, $st, $diff, null]);
        $count++;
    }
}

echo "[ok] $count marcaciones insertadas.\n";
echo "Listo.\n";
