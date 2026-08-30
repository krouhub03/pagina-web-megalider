# 👤 02 - Historias de Usuario (User Stories)

Las historias de usuario definen las funcionalidades requeridas por cada tipo de usuario del sistema (Administrador, Superadministrador, Cajero, Cliente Externo y Auditor).

---

## 🔐 Módulo 1: Autenticación y Seguridad

* **HU-01:** *Como administrador*, quiero iniciar sesión con mi correo y contraseña para acceder de forma segura al panel de gestión interna.
* **HU-02:** *Como usuario (personal o cliente)*, quiero iniciar sesión con mi cuenta de Google mediante un solo clic para acceder de forma ágil y segura.
* **HU-03:** *Como cliente externo*, quiero que al autenticarme con Google se me cree una cuenta automáticamente con rol `CLIENTE` y se me redirija a la página principal de la tienda (`/`).
* **HU-04:** *Como superadministrador*, quiero gestionar usuarios y asignar roles (`SUPERADMIN`, `ADMIN`, `CAJERO`, `CLIENTE`) para delimitar las acciones del personal y proteger datos financieros confidenciales.

---

## 🧾 Módulo 2: Contabilidad y Hermes IA

* **HU-05:** *Como administrador*, quiero visualizar el listado de facturas de compras con su desglose de impuestos (IVA, Impoconsumo, CUFE) para controlar el abastecimiento de mercancía.
* **HU-06:** *Como administrador*, quiero revisar los egresos de caja registrados por Hermes Bot y modificarlos si contienen errores de extracción, dejando constancia del motivo de corrección.
* **HU-07:** *Como auditor*, quiero consultar un registro cronológico de todas las correcciones manuales hechas a los egresos de Hermes para mantener la transparencia contable.
* **HU-11:** *Como administrador*, quiero ver el detalle completo de cada factura de compra con su desglose de impuestos, proveedor, adquiriente y líneas de producto en una tabla scrollable con sticky header.
* **HU-12:** *Como administrador*, quiero corregir los datos administrativos (N° factura, CUFE, fechas) y las líneas de producto (descripción, cantidad, costo unitario, impuestos) recalculando automáticamente los totales acumulados en PostgreSQL.
* **HU-13:** *Como administrador*, quiero eliminar facturas de compra obsoletas o duplicadas con confirmación modal de seguridad y eliminación en cascada de sus ítems asociados.
* **HU-14:** *Como usuario del panel*, quiero buscar y filtrar reactivamente en tiempo real las facturas de compra por N° de factura, CUFE o proveedor usando Zustand sin recargar la página.

---

## 📊 Módulo 3: Métricas, Landing e Inventario

* **HU-08:** *Como administrador*, quiero ver un resumen ejecutivo (KPIs) del total de compras, egresos del mes y balance operativo para tomar decisiones financieras rápidas.
* **HU-09:** *Como usuario*, quiero navegar por la landing pública y ver el horario de atención, marcas destacadas y la ubicación exacta del local en Engativá.
* **HU-10:** *Como cliente nuevo*, quiero registrarme en una página independiente (`/register`), aceptando los términos y políticas de datos personales y validando la seguridad con reCAPTCHA para crear mi cuenta de forma transparente.
