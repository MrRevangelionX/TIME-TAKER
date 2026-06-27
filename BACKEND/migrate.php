<?php
/**
 * Ejecuta todas las migraciones SQL ubicadas en database/migrations.
 * Crea la base de datos si no existe y lleva el control de las migraciones
 * aplicadas mediante la tabla `migrations`.
 *
 * Uso:  php migrate.php
 */

declare(strict_types=1);

require __DIR__ . '/src/Database.php';

use App\Database;

$config = require __DIR__ . '/config/config.php';
$dbName = $config['db']['name'];

echo "==> Time-Taker | Migraciones\n";

/* 1. Crear la base de datos si no existe */
try {
    $server = Database::serverConnection();
    $server->exec(sprintf(
        'CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
        $dbName
    ));
    echo "[ok] Base de datos `$dbName` lista.\n";
} catch (Throwable $e) {
    fwrite(STDERR, '[error] ' . $e->getMessage() . "\n");
    exit(1);
}

/* 2. Conectar a la base de datos y registrar la tabla de control */
$pdo = Database::connection();
$pdo->exec(
    'CREATE TABLE IF NOT EXISTS migrations (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        migration VARCHAR(191) NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_migration (migration)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
);

$applied = $pdo->query('SELECT migration FROM migrations')->fetchAll(PDO::FETCH_COLUMN);

/* 3. Ejecutar las migraciones pendientes en orden */
$files = glob(__DIR__ . '/database/migrations/*.sql');
sort($files);

$ran = 0;
foreach ($files as $file) {
    $name = basename($file);
    if (in_array($name, $applied, true)) {
        echo "[skip] $name (ya aplicada)\n";
        continue;
    }

    $sql = file_get_contents($file);
    try {
        $pdo->exec($sql);
        $stmt = $pdo->prepare('INSERT INTO migrations (migration) VALUES (?)');
        $stmt->execute([$name]);
        echo "[run ] $name\n";
        $ran++;
    } catch (Throwable $e) {
        fwrite(STDERR, "[error] $name -> " . $e->getMessage() . "\n");
        exit(1);
    }
}

echo $ran === 0
    ? "Sin migraciones pendientes.\n"
    : "Listo. $ran migración(es) aplicada(s).\n";
