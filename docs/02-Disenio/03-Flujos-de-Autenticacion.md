# 🔄 03 - Diagrama de Flujo: Autenticación Unificada con Google OAuth 2.0 y RBAC

El sistema utiliza un flujo unificado de autenticación que soporta credenciales locales y Google OAuth 2.0, aplicando enrutamiento dinámico según el rol del usuario.

---

## 🔄 Diagrama de Secuencia (Mermaid)

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

## 🛡️ Reglas de Enrutamiento por Rol (RBAC)

1. **`SUPERADMIN` & `ADMIN`:** Acceso total al Dashboard (`/dashboard`), Contabilidad (`/contabilidad/*`), Auditoría e Inventario.
2. **`CAJERO`:** Acceso a Dashboard básico y consulta de facturas/egresos sin permisos de eliminación.
3. **`CLIENTE`:** Redirección automática a la Landing Pública (`/`). Bloqueo estricto por Middleware Edge si intenta ingresar a `/dashboard` o `/contabilidad`.
