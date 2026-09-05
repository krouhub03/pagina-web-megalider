# 🗄️ 02 - Modelo de Datos (Diagrama Entidad - Relación)

El modelo de datos de **Cigarrería Megalider** implementa una arquitectura **Multi-Base de Datos** mediante [Drizzle ORM](https://orm.drizzle.team/), desacoplando las responsabilidades transaccionales y de negocio respecto a las cargas de trabajo de inteligencia artificial y auditoría de documentos.

---

## 🏗️ 1. Arquitectura de Datos Multi-Base de Datos

> [!NOTE]
> La persistencia se organiza en dos motores complementarios:
> - **MySQL 8.0+ (Núcleo Maestro & Negocio):** Gestiona identidades (RBAC), catálogo de productos, inventario, facturación consolidada, archivos oficiales y el Plan Único de Cuentas (PUC).
> - **PostgreSQL 15+ (Buffer & Auditoría IA):** Actúa como almacén de ingestión transitorio para capturar payloads crudos de escaneo por IA y almacenar las imágenes de páginas antes y después de censura.

```mermaid
flowchart TD
    subgraph Frontend_BFF["Next.js 16 (App Router / BFF Layer)"]
        UI_Scanner["Módulo Escaneo / Auditoría"]
        UI_Admin["Panel Administrativo / POS"]
        UI_Tienda["E-Commerce / Catálogo"]
        API_Route["Route Handlers (BFF APIs)"]
    end

    subgraph PostgreSQL_IA["PostgreSQL (Auditoría & Buffer IA)"]
        DB_PG[("PostgreSQL")]
        T_Audit["facturas_auditoria"]
        T_AuditFiles["facturas_auditoria_archivos"]
        DB_PG --- T_Audit
        DB_PG --- T_AuditFiles
    end

    subgraph MySQL_Core["MySQL (Núcleo Operativo & Oficial)"]
        DB_MY[("MySQL")]
        T_Users["usuarios / roles"]
        T_Catalog["categorias_productos & productos"]
        T_Bills["facturas, factura_items & factura_archivos"]
        T_PUC["puc_cuentas, proveedores & medios_pago"]
        DB_MY --- T_Users
        DB_MY --- T_Catalog
        DB_MY --- T_Bills
        DB_MY --- T_PUC
    end

    UI_Scanner -->|1. Ingesta y análisis IA| API_Route
    API_Route -->|2. Guarda JSON crudo y páginas Base64| PostgreSQL_IA
    UI_Admin -->|3. Auditoría y aprobación del usuario| API_Route
    API_Route -->|4. Persistencia contable y actualización de stock| MySQL_Core
    UI_Tienda -->|5. Consulta catálogo, precios e inventario| MySQL_Core
```

---

## 🗂️ 2. Diagrama Entidad - Relación (Mermaid ER)

El siguiente diagrama detalla la totalidad de tablas, atributos, tipos de datos y relaciones foráneas definidas en el esquema Drizzle (`lib/db/mysql/schema.ts` y `lib/db/postgres/schema.ts`):

```mermaid
erDiagram
    %% ==========================================
    %% BASE DE DATOS 1: MYSQL (Núcleo Operativo)
    %% ==========================================
    
    USUARIOS {
        bigint id PK
        varchar nombre
        varchar email UK
        varchar password_hash
        varchar google_id
        varchar avatar_url
        enum rol "SUPERADMIN, ADMIN, CLIENTE"
        boolean activo
        timestamp creado_en
        timestamp actualizado_en
    }

    CATEGORIAS_PRODUCTOS ||--o{ PRODUCTOS : "agrupa"
    CATEGORIAS_PRODUCTOS {
        bigint id PK
        varchar nombre
        varchar slug UK
        text descripcion
        varchar icono
        boolean activo
        timestamp creado_en
    }

    PRODUCTOS {
        bigint id PK
        int categoria_id FK
        varchar codigo_barras UK
        varchar nombre
        text descripcion
        decimal precio_compra
        decimal precio_venta
        int stock_actual
        int stock_minimo
        varchar imagen_url
        boolean destacado
        boolean activo
        timestamp creado_en
        timestamp actualizado_en
    }

    PROVEEDORES ||--o{ FACTURAS : "emite"
    PROVEEDORES {
        bigint id PK
        varchar nit UK
        varchar razon_social
        timestamp creado_en
    }

    FACTURAS ||--|{ FACTURA_ITEMS : "contiene"
    FACTURAS ||--o{ FACTURA_ARCHIVOS : "adjunta"
    FACTURAS {
        bigint id PK
        varchar numero_factura
        varchar tipo_documento
        varchar cufe
        varchar documento_referencia
        date fecha_emision
        date fecha_vencimiento
        int proveedor_id FK
        varchar cliente_documento
        varchar cliente_nombre
        varchar condicion_pago
        varchar medio_pago
        decimal subtotal
        decimal descuento_total_factura
        decimal iva
        decimal impoconsumo
        decimal ibua_ipcu
        decimal otros_impuestos_total
        decimal total_factura
        enum categoria "INVENTARIO, OPEX, ACTIVOS"
        enum estado_pago "PAGADA, PENDIENTE, CREDITO_30_DIAS"
        text archivo_url
        text observaciones
        timestamp creado_en
    }

    FACTURA_ITEMS {
        bigint id PK
        int factura_id FK
        varchar codigo_barras
        varchar codigo_proveedor
        text nombre_producto
        decimal cantidad_ingresada
        varchar unidad_medida
        decimal costo_unitario_compra
        decimal descuento_por_producto
        decimal iva_total
        decimal porcentaje_iva
        decimal impuesto_consumo
        decimal otros_impuestos
        decimal costo_total_linea
        timestamp creado_en
    }

    FACTURA_ARCHIVOS {
        bigint id PK
        int factura_id FK
        varchar nombre_archivo
        varchar tipo_mime
        text datos_base64
        timestamp creado_en
    }

    PUC_CUENTAS {
        varchar codigo PK
        varchar nombre
        int nivel
        varchar naturaleza
        text descripcion
        timestamp creado_en
    }

    MEDIOS_PAGO {
        bigint id PK
        varchar nombre UK
        boolean activo
        timestamp creado_en
    }

    %% ==========================================
    %% BASE DE DATOS 2: POSTGRESQL (Motor de IA)
    %% ==========================================

    FACTURAS_AUDITORIA ||--o{ FACTURAS_AUDITORIA_ARCHIVOS : "posee paginas"
    FACTURAS_AUDITORIA {
        serial id PK
        text datos_extraidos "JSON crudo IA"
        varchar estado "PENDIENTE, REVISADO, ERROR"
        timestamp creado_en
    }

    FACTURAS_AUDITORIA_ARCHIVOS {
        serial id PK
        int factura_auditoria_id FK
        text datos_base64
        text datos_base64_censurada
        int orden
        timestamp creado_en
    }
```

---

## 📝 3. Diccionario de Tablas y Esquemas

### 3.1 Base de Datos MySQL (`lib/db/mysql/schema.ts`)

#### 👤 Dominio: Usuarios y Autenticación
- **`usuarios`**: Almacena las cuentas tanto para personal interno con acceso administrativo como para clientes de la tienda online.
  - Campos clave: `email` (UK), `rol` (`SUPERADMIN`, `ADMIN`, `CLIENTE`), `password_hash`, `google_id` (para OAuth 2.0).

#### 📦 Dominio: Catálogo e Inventario
- **`categorias_productos`**: Familias taxonómicas de productos (Licores, Cigarrillos, Bebidas, Confitería, etc.).
  - Campos clave: `slug` (UK para URLs amigables), `activo`.
- **`productos`**: Catálogo comercial y control de existencias.
  - Campos clave: `categoria_id` (FK a `categorias_productos`), `codigo_barras` (UK), `precio_compra`, `precio_venta`, `stock_actual`, `stock_minimo`.

#### 🧾 Dominio: Facturación y Compras
- **`proveedores`**: Terceros y distribuidores de mercancía.
  - Campos clave: `nit` (UK), `razon_social`.
- **`facturas`**: Cabecera contable y comercial de facturas de compra/inventario.
  - Campos clave: `numero_factura`, `proveedor_id` (FK), `cufe`, `total_factura`, desgloses impositivos (`iva`, `impoconsumo`, `ibua_ipcu`), `estado_pago`.
- **`factura_items`**: Líneas de detalle de cada producto contenido en la factura con su denominación comercial (`nombre_producto`).
  - Campos clave: `factura_id` (FK), `nombre_producto`, `cantidad_ingresada`, `costo_unitario_compra`, `costo_total_linea`, `iva_total`.
- **`factura_archivos`**: Soporte digitalizado de la factura en formato Base64 persistido de forma oficial.
  - Campos clave: `factura_id` (FK), `nombre_archivo`, `tipo_mime`, `datos_base64`.

#### 📚 Dominio: Maestro Contable
- **`puc_cuentas`**: Catálogo del Plan Único de Cuentas para causación y parametrización contable.
  - Campos clave: `codigo` (PK alfanumérico), `nombre`, `nivel`, `naturaleza` (Débito/Crédito).
- **`medios_pago`**: Métodos autorizados de pago (Efectivo, Transferencia, Tarjeta, Crédito 30 días).

---

### 3.2 Base de Datos PostgreSQL (`lib/db/postgres/schema.ts`)

#### 🤖 Dominio: Ingestión y Auditoría con IA
- **`facturas_auditoria`**: Almacena temporalmente la extracción en formato JSON crudo generada por los modelos de visión/OCR de IA durante la captura web.
  - Campos clave: `id` (PK), `datos_extraidos` (JSON text), `estado` (`PENDIENTE`, `REVISADO`, `ERROR`).
- **`facturas_auditoria_archivos`**: Guarda los archivos e imágenes de cada página escaneada, junto con su versión censurada (si el operador cubrió datos confidenciales).
  - Campos clave: `factura_auditoria_id` (FK con cascada), `datos_base64`, `datos_base64_censurada`, `orden`.

> [!IMPORTANT]
> **Ciclo de Vida de los Datos:** Una vez que el usuario revisa y aprueba los datos en el módulo de auditoría de facturas, la información se transforma en registros consolidados en MySQL (`facturas`, `factura_items`, `factura_archivos`) y actualiza el inventario en `productos`.

---

## 🔗 Referencias Relacionadas
- 🏛️ [Arquitectura General del Sistema](./01-Arquitectura-General.md)
- 🔄 [Flujos de Autenticación](./03-Flujos-de-Autenticacion.md)
- 🛡️ [Patrones de Arquitectura y Estado](./05-Patrones-de-Arquitectura.md)
- 📑 [Índice de Diseño](./README.md)
