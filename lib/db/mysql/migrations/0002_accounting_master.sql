-- Migración: Sistema Contable Maestro, Tipos de Operación, Cuentas de Tesorería, Retenciones y Libro Diario
CREATE TABLE IF NOT EXISTS `tipos_operacion` (
  `id` serial PRIMARY KEY,
  `codigo` varchar(50) NOT NULL UNIQUE,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text,
  `cuenta_puc_debito` varchar(10) NOT NULL,
  `cuenta_puc_credito` varchar(10),
  `afecta_inventario` boolean NOT NULL DEFAULT false,
  `es_remision` boolean NOT NULL DEFAULT false,
  `activo` boolean NOT NULL DEFAULT true,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `cuentas_tesoreria` (
  `id` serial PRIMARY KEY,
  `medio_pago_id` int NOT NULL,
  `codigo_puc` varchar(10) NOT NULL,
  `nombre_cuenta` varchar(150) NOT NULL,
  `numero_referencia` varchar(100),
  `activo` boolean NOT NULL DEFAULT true,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cuentas_tesoreria_medio_pago` (`medio_pago_id`),
  INDEX `idx_cuentas_tesoreria_codigo_puc` (`codigo_puc`)
);

CREATE TABLE IF NOT EXISTS `tipos_retencion` (
  `id` serial PRIMARY KEY,
  `codigo` varchar(50) NOT NULL UNIQUE,
  `nombre` varchar(150) NOT NULL,
  `porcentaje` decimal(5,2) NOT NULL,
  `base_minima` decimal(12,2) DEFAULT 0.00,
  `cuenta_puc` varchar(10) NOT NULL,
  `activo` boolean NOT NULL DEFAULT true,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `factura_retenciones` (
  `id` serial PRIMARY KEY,
  `factura_id` int NOT NULL,
  `tipo_retencion_id` int NOT NULL,
  `base_gravable` decimal(12,2) NOT NULL,
  `porcentaje_aplicado` decimal(5,2) NOT NULL,
  `valor_retenido` decimal(12,2) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_factura_retenciones_factura_id` (`factura_id`)
);

CREATE TABLE IF NOT EXISTS `factura_asientos` (
  `id` serial PRIMARY KEY,
  `factura_id` int NOT NULL,
  `cuenta_puc` varchar(10) NOT NULL,
  `concepto` varchar(255) NOT NULL,
  `debito` decimal(12,2) NOT NULL DEFAULT 0.00,
  `credito` decimal(12,2) NOT NULL DEFAULT 0.00,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_factura_asientos_factura_id` (`factura_id`),
  INDEX `idx_factura_asientos_cuenta_puc` (`cuenta_puc`)
);
