# 🏛️ 01 - Arquitectura General del Sistema

El sistema **Cigarrería Megalider** adopta una arquitectura desacoplada por capas basada en Next.js 16+ App Router, con renderizado híbrido (SSR / Client Components) y acceso a múltiples bases de datos relacionales mediante Drizzle ORM.

---

## 🏛️ Diagrama de Arquitectura de Capas

```mermaid
graph TD
    subgraph Client ["Navegador / Cliente"]
        PublicViews["Landing Pública (/)"]
        AuthView["Portal de Acceso (/login)"]
        AdminViews["Dashboard & Gestión (/dashboard, /contabilidad/*)"]
    end

    subgraph ExternalAuth ["Proveedores Externos"]
        GoogleOAuth["Google Identity Services (OAuth 2.0)"]
    end

    subgraph AppRouter ["Next.js App Router (Node.js / Edge)"]
        MW["Middleware (Verificación JWT / Control RBAC)"]
        OAuthRoutes["Endpoints OAuth (/api/auth/google, /callback)"]
        ServerActions["Server Actions (Auth & Contabilidad)"]
        Components["Design System UI (Button, Card, Badge, Input)"]
    end

    subgraph DataAccessLayer ["Capa Multi-BD & DAL (server-only)"]
        DAL["Auth DAL (lib/auth/jwt.ts)"]
        PGClient["Postgres Client (drizzle-orm/postgres-js)"]
        MySQLClient["MySQL Client (drizzle-orm/mysql2)"]
    end

    subgraph Storage ["Almacenamiento y Agentes"]
        DB_PG[("PostgreSQL (cmegalider)\nHermes IA & Contabilidad")]
        DB_MySQL[("MySQL (u200862310_megalider)\nUsuarios & Catálogo")]
        HermesAgent["Hermes IA Bot (Extractor Facturas)"]
    end

    Client --> MW
    MW --> PublicViews
    MW --> AuthView
    MW --> AdminViews
    AuthView --> OAuthRoutes
    OAuthRoutes <--> GoogleOAuth
    AdminViews --> Components
    AdminViews --> ServerActions
    OAuthRoutes --> MySQLClient
    ServerActions --> DAL
    ServerActions --> PGClient
    ServerActions --> MySQLClient
    DAL --> MySQLClient
    PGClient --> DB_PG
    MySQLClient --> DB_MySQL
    HermesAgent --> DB_PG
```

---

## 🗄️ Estrategia Multi-Base de Datos

1. **PostgreSQL (`cmegalider`):**
   - **Propósito:** Almacenar la contabilidad de la empresa, facturas de compras de mercancía (desglose de IVA, Impoconsumo, CUFE), egresos de caja registrados por el bot **Hermes IA** y la tabla de auditoría `historial_correcciones`.
   - **ORM Driver:** `drizzle-orm/postgres-js` utilizando la biblioteca `postgres`.

2. **MySQL (`u200862310_megalider`):**
   - **Propósito:** Gestionar la tabla `usuarios` (cuentas locales y Google OAuth con roles `SUPERADMIN`, `ADMIN`, `CAJERO`, `CLIENTE`) y las tablas del catálogo de productos y categorías para el módulo E-commerce.
   - **ORM Driver:** `drizzle-orm/mysql2` utilizando el pool de conexiones `mysql2`.
