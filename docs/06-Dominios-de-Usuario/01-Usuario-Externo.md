# 🟢 01 - Dominio Usuario Externo (Clientes y Visitantes)

Este documento especifica las funcionalidades, flujos de experiencia, interfaces y componentes orientados al **Usuario Externo** (clientes actuales, potenciales compradores y visitantes de la zona de Engativá).

---

## 🏛️ Mapeo de Código e Interfaces (`app/(public)` & `app/(auth)`)

| Ruta URL | Componente / Código | Propósito para el Usuario Externo |
| :--- | :--- | :--- |
| `/` | `app/(public)/page.tsx` | **Landing Page Comercial:** Presentación de Cigarrería Megalider, horarios de atención, canales de atención WhatsApp, ubicación interactiva con Google Maps en Engativá, catálogo de categorías y marcas destacadas. |
| `/politicas` | `app/(public)/politicas/page.tsx` | Política de Tratamiento de Datos Personales conforme a la Ley 1581 de 2012. |
| `/terminos` | `app/(public)/terminos/page.tsx` | Términos y condiciones generales de compra y servicio. |
| `/login` | `app/(auth)/login/page.tsx` | Portal unificado de inicio de sesión (credenciales o Google OAuth 2.0). |
| `/register` | `app/(auth)/register/page.tsx` | Formulario de registro de nuevos clientes con verificación humana Google reCAPTCHA v2 y aceptación explícita de privacidad. |

---

## 🛒 Estado Interactivo Cliente (Zustand)

El usuario externo interactúa con la aplicación mediante stores cliente optimizados sin recargar la página:

1. **Verificación de Mayoría de Edad (`useAgeVerificationStore`):** Modal persistente que solicita confirmación antes de permitir la visualización de bebidas alcohólicas o productos de cigarrería/vapeo.
2. **Carrito de Compras (`useCartStore`):** Adición de productos, modificación de cantidades, persistencia en `localStorage` y cálculo dinámico de subtotal/total.
3. **Filtros y Búsqueda de Productos (`useFilterStore`):** Búsqueda reactiva por nombre, filtrado por categorías de la tienda y rango de precios.
4. **Vista Rápida (`useQuickViewStore`):** Previsualización de detalles del producto en modal flotante.

---

## 🛡️ Asignación de Permisos y Rol (`CLIENTE`)

- **Autenticación con Google OAuth 2.0:** Cualquier usuario externo que inicie sesión por primera vez con su cuenta de Google es creado automáticamente en MySQL con el rol de menor privilegio: **`CLIENTE`**.
- **Redirección Autónoma:** Al autenticarse correctamente como `CLIENTE`, el sistema redirige forzadamente al usuario a la página de inicio (`/`).
- **Seguridad en Rutas Privadas:** Si el usuario `CLIENTE` intenta escribir manualmente la URL de administración (`/dashboard` o `/contabilidad`), el **Edge Middleware** bloquea el acceso y lo devuelve a `/`.
