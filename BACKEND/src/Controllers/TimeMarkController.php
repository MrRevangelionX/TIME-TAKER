<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Database;
use App\Response;

final class TimeMarkController
{
    /** Tolerancia en minutos para considerar una marca "a tiempo". */
    private const TOLERANCE = 5;

    public function index(array $query): void
    {
        $pdo = Database::connection();

        $where = [];
        $params = [];

        if (!empty($query['worker_id'])) {
            $where[] = 'tm.worker_id = :worker_id';
            $params['worker_id'] = (int) $query['worker_id'];
        }
        if (!empty($query['from'])) {
            $where[] = 'tm.mark_date >= :from';
            $params['from'] = $query['from'];
        }
        if (!empty($query['to'])) {
            $where[] = 'tm.mark_date <= :to';
            $params['to'] = $query['to'];
        }
        if (!empty($query['status'])) {
            $where[] = 'tm.status = :status';
            $params['status'] = $query['status'];
        }

        $sql =
            'SELECT tm.*, w.full_name, w.document, w.department
             FROM time_marks tm
             INNER JOIN workers w ON w.id = tm.worker_id';
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY tm.mark_date DESC, tm.expected_time ASC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        Response::success($stmt->fetchAll());
    }

    public function show(int $id): void
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare(
            'SELECT tm.*, w.full_name, w.document, w.department
             FROM time_marks tm
             INNER JOIN workers w ON w.id = tm.worker_id
             WHERE tm.id = ?'
        );
        $stmt->execute([$id]);
        $mark = $stmt->fetch();

        if (!$mark) {
            Response::error('Marcación no encontrada', 404);
        }
        Response::success($mark);
    }

    public function store(array $body): void
    {
        $data = $this->validate($body);
        $pdo = Database::connection();

        $stmt = $pdo->prepare(
            'INSERT INTO time_marks (worker_id, mark_date, mark_type, expected_time, actual_time, status, minutes_diff, notes)
             VALUES (:worker_id, :mark_date, :mark_type, :expected_time, :actual_time, :status, :minutes_diff, :notes)'
        );
        $stmt->execute($data);

        $data['id'] = (int) $pdo->lastInsertId();
        Response::success($data, 'Marcación creada', 201);
    }

    public function update(int $id, array $body): void
    {
        $pdo = Database::connection();
        $check = $pdo->prepare('SELECT id FROM time_marks WHERE id = ?');
        $check->execute([$id]);
        if (!$check->fetch()) {
            Response::error('Marcación no encontrada', 404);
        }

        $data = $this->validate($body);
        $data['id'] = $id;

        $stmt = $pdo->prepare(
            'UPDATE time_marks
             SET worker_id = :worker_id, mark_date = :mark_date, mark_type = :mark_type,
                 expected_time = :expected_time, actual_time = :actual_time,
                 status = :status, minutes_diff = :minutes_diff, notes = :notes
             WHERE id = :id'
        );
        $stmt->execute($data);

        Response::success($data, 'Marcación actualizada');
    }

    public function destroy(int $id): void
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare('DELETE FROM time_marks WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            Response::error('Marcación no encontrada', 404);
        }
        Response::success(null, 'Marcación eliminada');
    }

    /** Valida el cuerpo y calcula status + minutos de diferencia. */
    private function validate(array $body): array
    {
        $errors = [];
        $workerId = (int) ($body['worker_id'] ?? 0);
        $markDate = trim((string) ($body['mark_date'] ?? ''));
        $markType = trim((string) ($body['mark_type'] ?? 'entrada'));
        $expected = trim((string) ($body['expected_time'] ?? ''));
        $actual   = trim((string) ($body['actual_time'] ?? ''));

        if ($workerId <= 0) {
            $errors['worker_id'] = 'Debe seleccionar un trabajador';
        }
        if ($markDate === '') {
            $errors['mark_date'] = 'La fecha es obligatoria';
        }
        if (!in_array($markType, ['entrada', 'salida'], true)) {
            $errors['mark_type'] = 'Tipo de marca inválido';
        }
        if ($expected === '') {
            $errors['expected_time'] = 'El tiempo esperado es obligatorio';
        }

        if ($errors) {
            Response::error('Datos inválidos', 422, $errors);
        }

        // Verificar que el trabajador exista
        $pdo = Database::connection();
        $w = $pdo->prepare('SELECT id FROM workers WHERE id = ?');
        $w->execute([$workerId]);
        if (!$w->fetch()) {
            Response::error('El trabajador indicado no existe', 422, ['worker_id' => 'No existe']);
        }

        [$status, $diff] = $this->computeStatus($expected, $actual ?: null);

        return [
            'worker_id'     => $workerId,
            'mark_date'     => $markDate,
            'mark_type'     => $markType,
            'expected_time' => $this->normalizeTime($expected),
            'actual_time'   => $actual ? $this->normalizeTime($actual) : null,
            'status'        => $status,
            'minutes_diff'  => $diff,
            'notes'         => trim((string) ($body['notes'] ?? '')) ?: null,
        ];
    }

    /** Calcula el estado de la marca comparando esperado vs real. */
    private function computeStatus(string $expected, ?string $actual): array
    {
        if ($actual === null || $actual === '') {
            return ['ausente', 0];
        }
        $e = strtotime($expected);
        $a = strtotime($actual);
        $diff = (int) round(($a - $e) / 60);

        if ($diff > self::TOLERANCE) {
            return ['tarde', $diff];
        }
        if ($diff < -self::TOLERANCE) {
            return ['temprano', $diff];
        }
        return ['a_tiempo', $diff];
    }

    private function normalizeTime(string $time): string
    {
        // Acepta HH:MM o HH:MM:SS
        return substr($time, 0, 5) . (strlen($time) === 5 ? ':00' : substr($time, 5));
    }
}
