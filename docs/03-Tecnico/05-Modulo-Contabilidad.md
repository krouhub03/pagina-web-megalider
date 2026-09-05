# 📄 05 - Módulo de Contabilidad, Tesorería y Facturación

Este documento detalla la arquitectura técnica, modelo de datos, motor de partida doble, catálogo PUC, gestión de medios de pago y cuentas de tesorería, auditoría tributaria y ciclo de vida de facturas y remisiones para **Cigarrería Megalider**.

---

## 🏛️ 1. Arquitectura y Fundamento Contable (NIIF Colombia)

El módulo contable sigue las directrices del **Plan Único de Cuentas (PUC)** comercial colombiano y las normas **NIIF para Pymes**:

1. **Dinámica de Partida Doble Rigurosa:** Cada transacción genera registros en el libro diario (`factura_asientos`) donde se verifica estrictamente que $\sum \text{Débitos} \equiv \sum \text{Créditos}$.
2. **Desacoplamiento en 2 Fases:**
   - **Fase 1 (Auditoría Básica Ágil):** Ingesta universal desde escáner de IA (Factura Electrónica, POS, Remisión, Documento Soporte). Validación de proveedor, ítems, totales matemáticos, Medio de Pago Macro y Tipo de Operación.
   - **Fase 2 (Conciliación Post-Aprobación en Tesorería):** Selección de la cuenta específica de caja/banco (`cuentas_tesoreria`), aplicación de retenciones fiscales (RteFte, ReteIVA, ReteICA) y generación automática del asiento contable balanceado.
3. **Manejo Especial de Remisiones:** Registro contable transitorio contra provisión de pasivo (`220595`) sin afectar cuentas por pagar comerciales definitivas (`220505`) hasta su legalización con Factura Electrónica.

```mermaid
graph TD
    A[Escáner IA / Documento Físico] --> B[Buffer Temporal PostgreSQL]
    B --> C[Fase 1: Auditoría Básica en Modal]
    C -->|Selección Tipo de Operación & Medio Macro| D[Aprobación a Base Real MySQL]
    D --> E{¿Es Remisión o Factura?}
    E -->|Remisión| F[Asiento Provisional: Inventario 1435 vs Provisiones 220595]
    E -->|Factura Directa| G[Asiento Directo: Débito Operación + IVA vs CxP 220505]
    F --> H[Fase 2: Conciliación Tesorería / Legalización]
    G --> H
    H -->|Selección Cuenta Caja/Banco + Retenciones| I[Libro Diario Asiento Final Balanceado]
```

---

## 🗄️ 2. Modelo de Datos y Tablas Contables (MySQL)

### 2.1 Tablas Maestras
* **`puc_cuentas`**: Catálogo jerárquico de cuentas contables (Clases 1 a 6).
* **`tipos_operacion`**: Define el destino económico del gasto o activo, la cuenta PUC débito/crédito, y si afecta stock o si es remisión.
  - `COMPRA_MERCANCIA`: Débito `143505`, Crédito `220505`, `afecta_inventario = true`.
  - `COMPRA_ACTIVO_FIJO`: Débito `152805`, Crédito `220505`, `afecta_inventario = false`.
  - `MANTENIMIENTO_LOCAL`: Débito `514510`, Crédito `233595`, `afecta_inventario = false`.
  - `SERVICIOS_PUBLICOS`: Débito `513525`, Crédito `233595`, `afecta_inventario = false`.
  - `REMISION_COMPRA`: Débito `143505`, Crédito `220595`, `es_remision = true`.
* **`medios_pago`**: Clasificación Macro (Efectivo, Transferencia, Tarjeta Datáfono, Crédito 30 días).
* **`cuentas_tesoreria`**: Subcuentas auxiliares reales asociadas a un medio macro y a una cuenta PUC (ej. *Caja Mostrador 1* $\rightarrow$ `11050501`, *Bancolombia* $\rightarrow$ `11100501`, *Nequi* $\rightarrow$ `11100502`).
* **`tipos_retencion`**: Catálogo de retenciones fiscales (RteFte Compras 2.5%, RteFte Servicios 3.5%, ReteIVA 15%, ReteICA).
* **`factura_retenciones`**: Retenciones deducidas aplicadas a cada factura.
* **`factura_asientos`**: Libro diario oficial de partida doble generado por la factura o su pago.

---

## ⚙️ 3. Motor de Asientos Contables (`lib/contabilidad/motor-asientos.ts`)

La función `generarAsientoCompra()` implementa el cálculo determinístico:

$$\text{Valor a Pagar / CxP} = \text{Subtotal} + \text{IVA} + \text{Impoconsumo} + \text{Otros Impuestos} - \text{Retenciones}$$

```typescript
// Regla de Oro Contable
const totalDebitos = lineas.reduce((acc, l) => acc + Number(l.debito), 0);
const totalCreditos = lineas.reduce((acc, l) => acc + Number(l.credito), 0);

if (Math.abs(totalDebitos - totalCreditos) > 0.01) {
  throw new Error(`Asiento descuadrado: Débitos ($${totalDebitos}) !== Créditos ($${totalCreditos})`);
}
```

---

---

## 🖥️ 4. Arquitectura de Interfaces y Modales del Historial (`app/(admin)/facturas/history/page.tsx`)

El módulo del historial consolida las operaciones de auditoría mediante 4 acciones dedicadas e independientes por cada factura:

```mermaid
graph TD
    Historial[Historial Consolidado de Facturas] --> Ver[1. Ver: HistoryModal]
    Historial --> Conciliar[2. Conciliar: ModalConciliacionFactura]
    Historial --> Editar[3. Editar: ModalEditarFacturaHistorial]
    Historial --> Eliminar[4. Eliminar: ModalEliminarFactura]

    Ver -->|Solo Lectura| Visor[Visor Interactivo: Zoom en cursor, Pan, Rotación 90°, Multi-página]
    Conciliar -->|Tesorería| FiltroMedio[Filtro reactivo por Medio de Pago -> Caja/Banco -> Asiento Partida Doble]
    Editar -->|Recálculo| Items[Edición de Cabecera, Items, Impuestos y PUC]
    Eliminar -->|Transaccional| Cascade[Borrado en cascada de Asientos, Items, Archivos y Factura]
```

### 4.1 Componentes de Gestión Contable

1. **`HistoryModal.tsx` (Visor de Inspección de Solo Lectura)**:
   - Visor de imagen de factura con soporte multi-página (`factura_archivos` y `archivo_url` `LONGTEXT`).
   - Zoom interactivo con rueda del ratón centrado en el punto del cursor (`onWheel`), arrastre/pan (`onMouseDown`/`onMouseMove`), doble clic de aumento rápido y rotación incremental de 90° (`rotate(90deg)`).
   - Pestaña de **Detalle de Compra** con datos de emisor, items, base gravable e impuestos.
   - Pestaña de **Libro Diario (NIIF)** con detalle de partidas débitos y créditos registradas.

2. **`ModalConciliacionFactura.tsx` (Cierre y Asignación de Tesorería)**:
   - **Filtro reactivo por Medio de Pago**: Píldoras interactivas (*Todos*, *Efectivo*, *Transferencia*, *Billeteras Digitales*, *Tarjetas*) que filtran en tiempo real el desplegable de cajas y bancos.
   - **Asignación de Cuentas de Tesorería**: Cajas registradoras (`110505`) o Cuentas Bancarias (`111005`).
   - **Retenciones en la Fuente**: Selección de tarifas aplicables (RteFte Compras, Servicios, ReteIVA, ReteICA).
   - **Previsualización de Partida Doble**: Verificación matemática en vivo de $\sum \text{Débitos} \equiv \sum \text{Créditos}$.

3. **`ModalEditarFacturaHistorial.tsx` (Modificación y Recálculo)**:
   - Permite editar información fiscal, clasificación de tipo de operación, medio de pago y detalle de productos.
   - Recálculo dinámico en tiempo real de subtotales, IVA 5%, IVA 19%, Impoconsumo, otros impuestos y total final.

4. **`ModalEliminarFactura.tsx` (Eliminación Segura)**:
   - Proceso transaccional en MariaDB que elimina en cascada: `factura_asientos`, `factura_retenciones`, `factura_items`, `factura_archivos` y la factura principal.

5. **`ModalDocumentoSoporte.tsx` (Compras y Salidas de Dinero sin Factura)**:
   - Permite registrar adquisiciones a comerciantes informales, campesinos o prestadores no obligados a facturar.
   - Genera un consecutivo oficial interno (`DS-XXXX`), registra el proveedor informal con cédula/NIT, agrega los ítems de mercancía afectando el stock de productos, y genera automáticamente el asiento contable balanceado (Débito `143505` Inventario vs Crédito `110505` Caja o `220505` Cuentas por Pagar).

---

## 🔄 5. Ciclo de Vida de Estados Contables y Compras a Crédito

### 5.1 Matriz de Estados
| Estado Contable | Cuenta Crédito Principal | Condición de Tesorería | Estado de Pago |
| :--- | :--- | :--- | :--- |
| **`CONCILIADA`** | `110505` (Caja) o `111005` (Bancos) | Cuenta de tesorería asignada | `PAGADA` |
| **`PENDIENTE_CONCILIACION`** | `220505` (Proveedores Nacionales) | Sin cuenta de tesorería ("Ninguna") | `PENDIENTE` (Crédito) |

### 5.2 Flujo de Facturas a Crédito y Pago Posterior
1. **Momento 1 (Causación)**: Al aprobar o registrar la factura a crédito, se deja la cuenta de tesorería en `— Ninguna —`. El sistema acredita la cuenta `220505` (Proveedores Nacionales), quedando en estado `PENDIENTE_CONCILIACION` y `PENDIENTE`.
2. **Momento 2 (Cancelación/Pago Días Después)**: Desde el Historial (`/facturas/history`), se presiona el botón **Conciliar (`Scale`)**, se selecciona la Caja o Banco desembolsado y la fecha de pago. El sistema actualiza el asiento contable acreditando la cuenta de tesorería (`110505`/`111005`) y transiciona el estado a `CONCILIADA` y `PAGADA`.

> [!IMPORTANT]
> El filtro de **Estado Contable** en el Historial (`/facturas/history`) evalúa estrictamente `estadoContable = 'CONCILIADA'` o `estadoContable = 'PENDIENTE_CONCILIACION'`, garantizando consistencia absoluta entre los reportes de libro diario y las cuentas por pagar.
