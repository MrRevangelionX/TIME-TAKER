-- Migración: tabla de marcaciones de tiempo
-- Cada registro define el tiempo en que se DEBE ingresar una marca (expected_time)
-- y, opcionalmente, la marca real registrada (actual_time).
CREATE TABLE IF NOT EXISTS time_marks (
    id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    worker_id      INT UNSIGNED NOT NULL,
    mark_date      DATE         NOT NULL,
    mark_type      ENUM('entrada','salida') NOT NULL DEFAULT 'entrada',
    expected_time  TIME         NOT NULL,
    actual_time    TIME         DEFAULT NULL,
    status         ENUM('a_tiempo','tarde','temprano','ausente') NOT NULL DEFAULT 'ausente',
    minutes_diff   INT          NOT NULL DEFAULT 0, -- positivo = tarde, negativo = temprano
    notes          VARCHAR(255) DEFAULT NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_time_marks_worker (worker_id),
    KEY idx_time_marks_date (mark_date),
    CONSTRAINT fk_time_marks_worker FOREIGN KEY (worker_id)
        REFERENCES workers (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
