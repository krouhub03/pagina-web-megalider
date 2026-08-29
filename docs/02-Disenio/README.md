# 02 - Documentos de Diseño y Arquitectura

Este directorio contiene la arquitectura del sistema, diagramas de flujo, modelo de datos y lineamientos visuales de **Cigarrería Megalider**.

---

## 🏛️ 1. Arquitectura General del Sistema

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

## 🗄️ 2. Modelo de Datos (Diagrama Entidad - Relación)

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

## 🔄 3. Diagrama de Flujo: Autenticación Unificada con Google OAuth 2.0 y RBAC

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant Nav as Navegador (/login)
    participant AuthRoute as API (/api/auth/google)
    participant Google as Google Identity
    participant Callback as API (/api/auth/google/callback)
    participant MySQL as MySQL (usuarios)
    participant MW as Middleware (Edge)
    participant Destino as Destino Final (/ o /dashboard)

    Usuario->>Nav: Clic en "Continuar con Google"
    Nav->>AuthRoute: GET /api/auth/google?from=/dashboard
    AuthRoute->>AuthRoute: Generar state criptográfico y cookie oauth_state
    AuthRoute-->>Google: Redirección con client_id, scopes y state
    Usuario->>Google: Autentica y autoriza permisos
    Google-->>Callback: Redirige con ?code=...&state=...
    Callback->>Callback: Valida state vs cookie (Prevención CSRF)
    Callback->>Google: Canjea code por access_token y solicita UserInfo
    Google-->>Callback: Retorna perfil (email, name, picture, sub)
    Callback->>MySQL: SELECT usuario por google_id o email
    alt Usuario nuevo
        Callback->>MySQL: INSERT usuario con rol 'CLIENTE'
    else Usuario existente
        Callback->>MySQL: UPDATE google_id y avatar_url
    end
    Callback->>Callback: Genera JWT (jose) con rol del usuario
    Callback-->>Nav: Set-Cookie HttpOnly: auth_token
    
    alt Si el Rol es 'CLIENTE'
        Callback-->>Nav: Redirige a '/' (Landing Pública)
    else Si el Rol es Staff ('SUPERADMIN' / 'ADMIN' / 'CAJERO')
        Callback-->>Nav: Redirige a '/dashboard'
    end

    Nav->>MW: Petición a ruta solicitada con auth_token
    MW->>MW: Valida firma JWT y verifica permisos de ruta
    MW-->>Destino: Permite o bloquea el acceso
```

---

## 🎨 4. Lineamientos de Marca y Paleta de Colores

| Tono / Rol | Código Hex | Aplicación en la Interfaz |
| :--- | :--- | :--- |
| **Verde Esmeralda Oscuro** | `#067335` | Color primario, logotipos, títulos serif y barras principales. |
| **Verde Acción (CTA)** | `#038C3E` | Botones de acción principal (`Button variant="primary"`), estados activos. |
| **Verde Medio** | `#53A677` | Bordes sutiles, detalles de branding y líneas secundarias. |
| **Menta Suave** | `#A7D9BD` | Badges de estado (`Badge variant="mint"`), fondos de iconos y acentos. |
| **Fondo Claro / Neutro** | `#F2F2F2` | Fondo de página general, tarjetas secundarias y contraste limpio. |

### Tipografía
* **Títulos y Encabezados:** `Playfair Display` (serif elegante y tradicional).
* **Textos e Interfaz:** `Plus Jakarta Sans` (sans-serif moderna y altamente legible).

---

## 🛡️ 5. Patrón Data Access Layer (DAL) & Cache Components

Para cumplir con la arquitectura de **Cache Components**:

1. **Aislamiento Seguro (`server-only`):** La lógica de validación criptográfica y tokens en [`lib/auth/jwt.ts`](../../lib/auth/jwt.ts) está encapsulada para evitar que cualquier secreto o helper llegue al bundle del navegador.
2. **Push Dynamic Access Down (Streaming no bloqueante):** Los `layouts` no ejecutan llamadas bloqueantes a `cookies()` en su raíz. Las lecturas dinámicas se delegan a componentes específicos envueltos en `<Suspense>`, permitiendo que el shell estático se transmita de forma instantánea al cliente.
3. **Data Transfer Objects (DTO):** Las respuestas y sesiones solo exponen campos públicos (`id`, `nombre`, `email`, `rol`, `avatarUrl`), garantizando que datos sensibles como `password_hash` nunca sean transferidos al cliente.

---

## 🔌 6. Arquitectura Backend for Frontend (BFF)

El patrón BFF en Next.js desacopla la UI de los servicios y bases de datos internos:

```
[Cliente Web / Móvil / Agentes IA]
              │
    (HTTPS / REST / OAuth)
              ▼
┌──────────────────────────────────────────────┐
│       Next.js App Router (BFF Layer)         │
│  - Route Handlers (`app/api/**/route.ts`)    │
│  - Middleware / Proxy (`middleware.ts`)      │
│  - Negociación de Contenido (`Vary: Accept`) │
│  - Sanitización & Validación de Esquema      │
└──────┬───────────────────────────────┬───────┘
       │                               │
       ▼                               ▼
 [PostgreSQL: Hermes IA]      [MySQL: Tienda & Usuarios]
```

- **Regla de Separación:** Los Server Components leen directamente de las capas de base de datos (`lib/db/`), mientras que los Route Handlers atienden peticiones externas, OAuth, webhooks y clientes que requieren formatos específicos (JSON, XML, Markdown).

---

## ⚡ 7. Estrategia de Lazy Loading & Optimización de Bundle

1. **Server Components por Defecto:** Se dividen automáticamente en fragmentos (*code-splitting*) en el servidor y se transmiten mediante *streaming*.
2. **Client Components Bajo Demanda (`next/dynamic`):**
   - Modales (verificación de edad, filtros avanzados, drawers de carrito).
   - Componentes interactivos dependientes de APIs de navegador con `{ ssr: false }` exclusivo en Client Components.
   - Placeholders visuales (`loading: () => <Skeleton />`) para garantizar estabilidad visual (CLS = 0).
3. **Librerías Externas (`import()` dinámico):** Carga en diferido de herramientas pesadas (búsqueda difusa `fuse.js`, generadores de recibos PDF, exportadores Excel) solo al desencadenar la acción.

---

## 📈 8. Medición de Rendimiento y Core Web Vitals

- **Límites de Cliente Aislados:** Telemetría instrumentada en componentes cliente dedicados (`useReportWebVitals`) sin convertir páginas o layouts en Client Components.
- **Envío No Bloqueante:** Uso prioritario de `navigator.sendBeacon()` o `fetch(..., { keepalive: true })` para garantizar la entrega de métricas sin impactar el hilo principal de renderizado.
