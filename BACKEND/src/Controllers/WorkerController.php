<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Database;
use App\Response;
use PDO;

final class WorkerController
{
    public function index(): void
    {
        $pdo = Database::connection();
        $workers = $pdo->query(
            'SELECT id, full_name, document, position, department, email, active, created_at
             FROM workers ORDER BY full_name ASC'
        )->fetchAll();

        Response::success($workers);
    }

    public function show(int $id): void
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT * FROM workers WHERE id = ?');
        $stmt->execute([$id]);
        $worker = $stmt->fetch();

        if (!$worker) {
            Response::error('Trabajador no encontrado', 404);
        }
        Response::success($worker);
    }

    public function store(array $body): void
    {
        $data = $this->validate($body);

        $pdo = Database::connection();
        $stmt = $pdo->prepare(
            'INSERT INTO workers (full_name, document, position, department, email, active)
             VALUES (:full_name, :document, :position, :department, :email, :active)'
        );

        try {
            $stmt->execute($data);
        } catch (\PDOException $e) {
            if ($e->getCode() === '23000') {
                Response::error('Ya existe un trabajador con ese documento', 422);
            }
            throw $e;
        }

        $data['id'] = (int) $pdo->lastInsertId();
        Response::success($data, 'Trabajador creado', 201);
    }

    public function update(int $id, array $body): void
    {
        $pdo = Database::connection();
        $check = $pdo->prepare('SELECT id FROM workers WHERE id = ?');
        $check->execute([$id]);
        if (!$check->fetch()) {
            Response::error('Trabajador no encontrado', 404);
        }

        $data = $this->validate($body);
        $data['id'] = $id;

        $stmt = $pdo->prepare(
            'UPDATE workers
             SET full_name = :full_name, document = :document, position = :position,
                 department = :department, email = :email, active = :active
             WHERE id = :id'
        );

        try {
            $stmt->execute($data);
        } catch (\PDOException $e) {
            if ($e->getCode() === '23000') {
                Response::error('Ya existe un trabajador con ese documento', 422);
            }
            throw $e;
        }

        Response::success($data, 'Trabajador actualizado');
    }

    public function destroy(int $id): void
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare('DELETE FROM workers WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            Response::error('Trabajador no encontrado', 404);
        }
        Response::success(null, 'Trabajador eliminado');
    }

    /** Valida y normaliza el cuerpo de la petición. */
    private function validate(array $body): array
    {
        $errors = [];
        $fullName = trim((string) ($body['full_name'] ?? ''));
        $document = trim((string) ($body['document'] ?? ''));
        $email    = trim((string) ($body['email'] ?? ''));

        if ($fullName === '') {
            $errors['full_name'] = 'El nombre es obligatorio';
        }
        if ($document === '') {
            $errors['document'] = 'El documento es obligatorio';
        }
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'El correo no es válido';
        }

        if ($errors) {
            Response::error('Datos inválidos', 422, $errors);
        }

        return [
            'full_name'  => $fullName,
            'document'   => $document,
            'position'   => trim((string) ($body['position'] ?? '')) ?: null,
            'department' => trim((string) ($body['department'] ?? '')) ?: null,
            'email'      => $email ?: null,
            'active'     => isset($body['active']) ? (int) (bool) $body['active'] : 1,
        ];
    }
}
