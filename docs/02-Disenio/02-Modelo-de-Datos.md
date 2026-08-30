# 🗄️ 02 - Modelo de Datos (Diagrama Entidad - Relación)

El modelo de datos de Cigarrería Megalider combina estructuras relacionales distribuidas entre PostgreSQL (contabilidad) y MySQL (usuarios y catálogo de productos).

---

## 🗄️ Diagrama Entidad - Relación (Mermaid ER)

```mermaid
erDiagram
    PROVEEDORES ||--o{ FACTURAS : "emite"
    FACTURAS ||--|{ FACTURA_ITEMS : "contiene"
    CATEGORIAS_GASTOS ||--o{ EGRESOS_TIENDA : "clasifica"
    PUC_CUENTAS ||--o{ EGRESOS_TIENDA : "asocia PUC"
    EGRESOS_TIENDA ||--o{ HISTORIAL_CORRECCIONES : "audita cambios"

    USUARIOS {
        int id PK
        varchar nombre
        varchar email UK
        varchar password_hash "Nullable (Login local)"
        varchar google_id "Nullable (Google OAuth)"
        varchar avatar_url "Nullable (Foto perfil)"
        enum rol "SUPERADMIN, ADMIN, CAJERO, CLIENTE"
        boolean activo
        timestamp creado_en
        timestamp actualizado_en
    }

    CATEGORIAS_PRODUCTOS ||--o{ PRODUCTOS : "agrupa"
    CATEGORIAS_PRODUCTOS {
        int id PK
        varchar nombre
        varchar slug UK
        varchar descripcion
        varchar icono
        boolean activo
    }

    PRODUCTOS {
        int id PK
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
    }
```

---

## 📋 Descripción de Tablas Principales

### 1. Base de Datos MySQL (`usuarios` & `catálogo`)
- **`usuarios`:** Almacena los datos de identidad. El campo `google_id` permite la autenticación federada. El campo `rol` delimita los permisos de acceso.
- **`categorias_productos`:** Clasifica el inventario en las categorías oficiales (Licores, Cigarrillos y Vapeo, Confitería y Snacks, Bebidas).
- **`productos`:** Catálogo detallado de productos con código de barras, precios de compra/venta y control de stock mínimo.

### 2. Base de Datos PostgreSQL (`cmegalider`)
- **`facturas` & `factura_items`:** Registra las compras de mercancía procesadas por Hermes IA o ingresadas manualmente, almacenando subtotal, IVA, Impoconsumo, CUFE y totales acumulados.
- **`egresos_tienda` & `historial_correcciones`:** Registra los egresos de caja e historial de auditoría de correcciones manuales.
