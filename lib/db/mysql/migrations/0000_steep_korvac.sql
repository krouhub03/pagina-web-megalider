CREATE TABLE `categorias_productos` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`nombre` varchar(150) NOT NULL,
	`slug` varchar(150) NOT NULL,
	`descripcion` text,
	`icono` varchar(50),
	`activo` boolean NOT NULL DEFAULT true,
	`creado_en` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categorias_productos_id` PRIMARY KEY(`id`),
	CONSTRAINT `categorias_productos_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `factura_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`factura_id` int NOT NULL,
	`descripcion` text NOT NULL,
	`cantidad` decimal(12,2) NOT NULL,
	`precio_unitario` decimal(12,2) NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	CONSTRAINT `factura_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `facturas` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`numero_factura` varchar(100) NOT NULL,
	`proveedor_id` int NOT NULL,
	`fecha_emision` timestamp NOT NULL,
	`total_factura` decimal(12,2) NOT NULL DEFAULT '0.00',
	`categoria` enum('INVENTARIO','OPEX','ACTIVOS') NOT NULL DEFAULT 'INVENTARIO',
	`estado_pago` enum('PAGADA','PENDIENTE','CREDITO_30_DIAS') NOT NULL DEFAULT 'PENDIENTE',
	`creado_en` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `facturas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productos` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`categoria_id` int NOT NULL,
	`codigo_barras` varchar(100),
	`nombre` varchar(255) NOT NULL,
	`descripcion` text,
	`precio_compra` decimal(12,2) DEFAULT '0.00',
	`precio_venta` decimal(12,2) NOT NULL,
	`stock_actual` int NOT NULL DEFAULT 0,
	`stock_minimo` int NOT NULL DEFAULT 5,
	`imagen_url` varchar(500),
	`destacado` boolean DEFAULT false,
	`activo` boolean NOT NULL DEFAULT true,
	`creado_en` timestamp NOT NULL DEFAULT (now()),
	`actualizado_en` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productos_id` PRIMARY KEY(`id`),
	CONSTRAINT `productos_codigo_barras_unique` UNIQUE(`codigo_barras`)
);
--> statement-breakpoint
CREATE TABLE `proveedores` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`nit` varchar(50) NOT NULL,
	`razon_social` varchar(255) NOT NULL,
	`creado_en` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proveedores_id` PRIMARY KEY(`id`),
	CONSTRAINT `proveedores_nit_unique` UNIQUE(`nit`)
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255),
	`google_id` varchar(255),
	`avatar_url` varchar(500),
	`rol` enum('SUPERADMIN','ADMIN','CLIENTE') NOT NULL DEFAULT 'CLIENTE',
	`activo` boolean NOT NULL DEFAULT true,
	`creado_en` timestamp NOT NULL DEFAULT (now()),
	`actualizado_en` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usuarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `usuarios_email_unique` UNIQUE(`email`),
	CONSTRAINT `idx_usuarios_email` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `idx_factura_items_factura_id` ON `factura_items` (`factura_id`);--> statement-breakpoint
CREATE INDEX `idx_facturas_proveedor` ON `facturas` (`proveedor_id`);--> statement-breakpoint
CREATE INDEX `idx_productos_categoria` ON `productos` (`categoria_id`);--> statement-breakpoint
CREATE INDEX `idx_productos_codigo_barras` ON `productos` (`codigo_barras`);--> statement-breakpoint
CREATE INDEX `idx_usuarios_rol` ON `usuarios` (`rol`);