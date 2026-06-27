-- Migración: tabla de trabajadores
CREATE TABLE IF NOT EXISTS workers (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name    VARCHAR(120) NOT NULL,
    document     VARCHAR(40)  NOT NULL,
    position     VARCHAR(80)  DEFAULT NULL,
    department   VARCHAR(80)  DEFAULT NULL,
    email        VARCHAR(120) DEFAULT NULL,
    active       TINYINT(1)   NOT NULL DEFAULT 1,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_workers_document (document)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
