<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Database;
use App\Response;

/**
 * Genera las métricas que alimentan el dashboard del frontend.
 */
final class AnalyticsController
{
    public function index(array $query): void
    {
        $pdo = Database::connection();

        $where = [];
        $params = [];
        if (!empty($query['from'])) {
            $where[] = 'tm.mark_date >= :from';
            $params['from'] = $query['from'];
        }
        if (!empty($query['to'])) {
            $where[] = 'tm.mark_date <= :to';
            $params['to'] = $query['to'];
        }
        $whereSql = $where ? ' WHERE ' . implode(' AND ', $where) : '';

        /* --- Resumen global --- */
        $summaryStmt = $pdo->prepare(
            "SELECT
                COUNT(*) AS total_marks,
                SUM(status = 'a_tiempo') AS on_time,
                SUM(status = 'tarde')    AS late,
                SUM(status = 'temprano') AS early,
                SUM(status = 'ausente')  AS absent,
                COALESCE(ROUND(AVG(CASE WHEN status = 'tarde' THEN minutes_diff END), 1), 0) AS avg_late_minutes
             FROM time_marks tm $whereSql"
        );
        $summaryStmt->execute($params);
        $summary = $summaryStmt->fetch();

        $totalWorkers = (int) $pdo->query('SELECT COUNT(*) FROM workers WHERE active = 1')->fetchColumn();

        $totalMarks = (int) $summary['total_marks'];
        $onTime = (int) $summary['on_time'];
        $punctuality = $totalMarks > 0 ? round(($onTime / $totalMarks) * 100, 1) : 0.0;

        /* --- Ranking por trabajador --- */
        $byWorkerStmt = $pdo->prepare(
            "SELECT
                w.id, w.full_name, w.document, w.department,
                COUNT(tm.id) AS total_marks,
                SUM(tm.status = 'a_tiempo') AS on_time,
                SUM(tm.status = 'tarde')    AS late,
                SUM(tm.status = 'ausente')  AS absent,
                COALESCE(ROUND(AVG(CASE WHEN tm.status = 'tarde' THEN tm.minutes_diff END), 1), 0) AS avg_late_minutes,
                COALESCE(ROUND(SUM(tm.status = 'a_tiempo') / NULLIF(COUNT(tm.id), 0) * 100, 1), 0) AS punctuality_rate
             FROM workers w
             LEFT JOIN time_marks tm ON tm.worker_id = w.id"
            . ($where ? ' AND ' . implode(' AND ', $where) : '') .
            " GROUP BY w.id, w.full_name, w.document, w.department
              ORDER BY punctuality_rate DESC, late ASC"
        );
        $byWorkerStmt->execute($params);
        $byWorker = $byWorkerStmt->fetchAll();

        /* --- Tendencia por día --- */
        $byDateStmt = $pdo->prepare(
            "SELECT
                tm.mark_date,
                COUNT(*) AS total_marks,
                SUM(tm.status = 'a_tiempo') AS on_time,
                SUM(tm.status = 'tarde')    AS late,
                SUM(tm.status = 'ausente')  AS absent
             FROM time_marks tm $whereSql
             GROUP BY tm.mark_date
             ORDER BY tm.mark_date ASC"
        );
        $byDateStmt->execute($params);
        $byDate = $byDateStmt->fetchAll();

        /* --- Distribución por departamento --- */
        $byDeptStmt = $pdo->prepare(
            "SELECT
                COALESCE(w.department, 'Sin asignar') AS department,
                COUNT(tm.id) AS total_marks,
                SUM(tm.status = 'tarde') AS late
             FROM workers w
             LEFT JOIN time_marks tm ON tm.worker_id = w.id"
            . ($where ? ' AND ' . implode(' AND ', $where) : '') .
            " GROUP BY COALESCE(w.department, 'Sin asignar')
              ORDER BY total_marks DESC"
        );
        $byDeptStmt->execute($params);
        $byDepartment = $byDeptStmt->fetchAll();

        Response::success([
            'summary' => [
                'total_workers'    => $totalWorkers,
                'total_marks'      => $totalMarks,
                'on_time'          => $onTime,
                'late'             => (int) $summary['late'],
                'early'            => (int) $summary['early'],
                'absent'          => (int) $summary['absent'],
                'avg_late_minutes' => (float) $summary['avg_late_minutes'],
                'punctuality_rate' => $punctuality,
            ],
            'by_worker'     => $byWorker,
            'by_date'       => $byDate,
            'by_department' => $byDepartment,
        ]);
    }
}
