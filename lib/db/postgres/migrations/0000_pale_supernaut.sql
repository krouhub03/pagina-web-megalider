CREATE TABLE "categorias_gastos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"comportamiento" varchar(20) NOT NULL,
	"descripcion" text,
	"puc_sugerido" varchar(10),
	CONSTRAINT "categorias_gastos_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "egresos_tienda" (
	"id" serial PRIMARY KEY NOT NULL,
	"fecha_egreso" date NOT NULL,
	"tipo_egreso" varchar(50) NOT NULL,
	"categoria_id" integer NOT NULL,
	"codigo_puc" varchar(10),
	"descripcion" text NOT NULL,
	"proveedor" varchar(255),
	"nit_emisor" varchar(50),
	"codigo_ciiu" varchar(20),
	"subtotal" numeric DEFAULT '0',
	"iva" numeric DEFAULT '0',
	"otros_impuestos" numeric DEFAULT '0',
	"total_egreso" numeric NOT NULL,
	"tiene_factura" boolean DEFAULT false,
	"numero_comprobante" varchar(100),
	"origen" varchar(20),
	"registrado_por" varchar(100) DEFAULT 'Hermes Bot',
	"creado_en" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "factura_archivos" (
	"id" serial PRIMARY KEY NOT NULL,
	"factura_id" integer,
	"nombre_archivo" varchar(255) NOT NULL,
	"tipo_mime" varchar(100) NOT NULL,
	"datos_base64" text NOT NULL,
	"creado_en" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "factura_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"factura_id" integer,
	"codigo_barras" varchar(100),
	"codigo_proveedor" varchar(100),
	"descripcion" text NOT NULL,
	"cantidad_ingresada" numeric NOT NULL,
	"unidad_medida" varchar(50),
	"costo_unitario_compra" numeric NOT NULL,
	"descuento_por_producto" numeric DEFAULT '0',
	"iva_total" numeric DEFAULT '0',
	"porcentaje_iva" numeric DEFAULT '0',
	"impuesto_consumo" numeric DEFAULT '0',
	"otros_impuestos" numeric DEFAULT '0',
	"costo_total_linea" numeric NOT NULL,
	"creado_en" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "facturas" (
	"id" serial PRIMARY KEY NOT NULL,
	"numero_factura" varchar(100) NOT NULL,
	"cufe" varchar(255),
	"documento_referencia" varchar(100),
	"fecha_emision" date NOT NULL,
	"fecha_vencimiento" date,
	"proveedor_id" integer,
	"cliente_documento" varchar(50),
	"cliente_nombre" varchar(255),
	"condicion_pago" varchar(100),
	"medio_pago" varchar(100),
	"subtotal" numeric DEFAULT '0',
	"descuento_total_factura" numeric DEFAULT '0',
	"iva" numeric DEFAULT '0',
	"impoconsumo" numeric DEFAULT '0',
	"ibua_ipcu" numeric DEFAULT '0',
	"otros_impuestos_total" numeric DEFAULT '0',
	"total_factura" numeric DEFAULT '0',
	"observaciones" text,
	"creado_en" timestamp DEFAULT now(),
	CONSTRAINT "facturas_numero_factura_unique" UNIQUE("numero_factura")
);
--> statement-breakpoint
CREATE TABLE "historial_correcciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"egreso_id" integer NOT NULL,
	"campo_modificado" varchar(50) NOT NULL,
	"valor_anterior" text,
	"valor_nuevo" text,
	"motivo" text,
	"corregido_por" varchar(100) DEFAULT 'Hermes Bot',
	"corregido_en" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "proveedores" (
	"id" serial PRIMARY KEY NOT NULL,
	"nit" varchar(50) NOT NULL,
	"razon_social" varchar(255) NOT NULL,
	"creado_en" timestamp DEFAULT now(),
	CONSTRAINT "proveedores_nit_unique" UNIQUE("nit")
);
--> statement-breakpoint
CREATE TABLE "puc_cuentas" (
	"codigo" varchar(10) PRIMARY KEY NOT NULL,
	"nombre" varchar(255),
	"nivel" integer,
	"naturaleza" varchar(50),
	"descripcion" text,
	"creado_en" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "factura_archivos" ADD CONSTRAINT "factura_archivos_factura_id_facturas_id_fk" FOREIGN KEY ("factura_id") REFERENCES "public"."facturas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factura_items" ADD CONSTRAINT "factura_items_factura_id_facturas_id_fk" FOREIGN KEY ("factura_id") REFERENCES "public"."facturas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_correcciones" ADD CONSTRAINT "historial_correcciones_egreso_id_egresos_tienda_id_fk" FOREIGN KEY ("egreso_id") REFERENCES "public"."egresos_tienda"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_egresos_fecha" ON "egresos_tienda" USING btree ("fecha_egreso");--> statement-breakpoint
CREATE INDEX "idx_egresos_tipo" ON "egresos_tienda" USING btree ("tipo_egreso");--> statement-breakpoint
CREATE INDEX "idx_egresos_categoria_id" ON "egresos_tienda" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "idx_egresos_puc" ON "egresos_tienda" USING btree ("codigo_puc");--> statement-breakpoint
CREATE INDEX "idx_factura_archivos_factura_id" ON "factura_archivos" USING btree ("factura_id");--> statement-breakpoint
CREATE INDEX "idx_factura_items_factura_id" ON "factura_items" USING btree ("factura_id");--> statement-breakpoint
CREATE INDEX "idx_facturas_proveedor" ON "facturas" USING btree ("proveedor_id");--> statement-breakpoint
CREATE INDEX "idx_facturas_fecha" ON "facturas" USING btree ("fecha_emision");--> statement-breakpoint
CREATE INDEX "idx_historial_egreso_id" ON "historial_correcciones" USING btree ("egreso_id");