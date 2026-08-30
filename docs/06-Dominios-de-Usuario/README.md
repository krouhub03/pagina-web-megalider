# 👥 06 - Módulo por Dominios de Usuario

Este módulo organiza la arquitectura y funcionalidades de **Cigarrería Megalider** desde la perspectiva de sus actores principales: el **Usuario Externo** (clientes/visitantes), el **Usuario Interno** (equipo administrativo y personal de tienda) y la **Capa Integradora de Servicios (BFF & APIs)**.

---

## 📁 Estructura del Módulo

```text
docs/06-Dominios-de-Usuario/
├── README.md                 # Índice general de dominios de usuario
├── 01-Usuario-Externo.md     # Flujos, rutas app/(public) y app/(auth) para clientes
├── 02-Usuario-Interno.md     # Flujos, rutas app/(admin) y módulo contable de Hermes IA para staff
└── 03-Capa-BFF-y-APIs.md     # APIs app/api/, enrutamiento RBAC Edge y Google OAuth 2.0
```

---

## 📌 Resumen por Dominio

| Dominio | Actor Principal | Rutas de Código | Propósito Principal |
| :--- | :--- | :--- | :--- |
| 🟢 **Usuario Externo** | Clientes finales y visitantes | `app/(public)/`<br>`app/(auth)/` | Presencia comercial en Engativá, catálogo de productos, registro con reCAPTCHA v2 y compra e-commerce. |
| 🔴 **Usuario Interno** | Superadmin, Admin, Cajero | `app/(admin)/` | Panel ejecutivo, supervisión de Hermes IA, auditoría de facturas/egresos y gestión de usuarios. |
| ⚡ **Capa BFF & APIs** | Sistema / Agentes / Cliente | `app/api/`<br>`middleware.ts` | Autenticación OAuth 2.0, firma de JWTs, control RBAC en Edge y negociación de contenido HTTP. |
