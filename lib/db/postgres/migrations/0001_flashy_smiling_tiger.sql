CREATE TABLE "facturas_auditoria" (
	"id" serial PRIMARY KEY NOT NULL,
	"datos_extraidos" text,
	"estado" varchar(50) DEFAULT 'PENDIENTE',
	"creado_en" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "facturas_auditoria_archivos" (
	"id" serial PRIMARY KEY NOT NULL,
	"factura_auditoria_id" integer,
	"datos_base64" text NOT NULL,
	"orden" integer DEFAULT 0,
	"creado_en" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "facturas_auditoria_archivos" ADD CONSTRAINT "facturas_auditoria_archivos_factura_auditoria_id_facturas_auditoria_id_fk" FOREIGN KEY ("factura_auditoria_id") REFERENCES "public"."facturas_auditoria"("id") ON DELETE cascade ON UPDATE no action;