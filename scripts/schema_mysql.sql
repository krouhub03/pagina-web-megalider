-- ===================================================================
-- CIGARRERÍA MEGALIDER - ESQUEMA DE USUARIOS Y ROLES (MySQL)
-- ===================================================================

-- 1. Crear tabla de usuarios con soporte para JWT, Roles y Google OAuth
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NULL,
  `google_id` VARCHAR(255) NULL,
  `avatar_url` VARCHAR(500) NULL,
  `rol` ENUM('SUPERADMIN', 'ADMIN', 'CAJERO', 'CLIENTE') NOT NULL DEFAULT 'CLIENTE',
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,
  `creado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX `idx_usuarios_email` (`email`),
  INDEX `idx_usuarios_rol` (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. (Opcional) Tabla de Sesiones / Logs de Auditoría de Accesos
CREATE TABLE IF NOT EXISTS `sesiones_usuarios` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT UNSIGNED NOT NULL,
  `ip_origen` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `fecha_ingreso` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sesiones_usuario` 
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- DATOS INICIALES (SEMILLA / SEED)
-- ===================================================================

-- Usuario Superadministrador inicial por defecto:
-- Correo: admin@megalider.com
-- Contraseña temporal: Megalider2026* (Hasheada con bcrypt)
INSERT INTO `usuarios` (`nombre`, `email`, `password_hash`, `rol`, `activo`)
VALUES 
(
  'Super Admin Megalider',
  'admin@megalider.com',
  '$2a$12$7kP2yRqvXp42bXj2uC92Z.0Y/lIqL6s9gWb8dY4K9D0s5X8G2HqWe',
  'SUPERADMIN',
  TRUE
)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);
