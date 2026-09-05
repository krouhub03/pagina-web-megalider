"use client";

export function ProductsDetailTable({ data, setData, sumaCostoBase, sumaIVA, sumaTotalLineas }: any) {
  const handleItemChange = (idx: number, field: string, value: any) => {
    const newItems = [...data.items];
    newItems[idx][field] = value;
    if (field === "nombre_producto") newItems[idx].descripcion = value;
    setData({ ...data, items: newItems });
  };

  return (
    <div>
      <h3 className="font-semibold text-gray-800 text-sm mb-3 pb-2 border-b border-gray-200">
        Detalle de Productos
      </h3>
      
      {/* SECCIÓN 1: Resumen por Ítem (Solo Vista) */}
      <div className="mb-6 bg-gradient-to-br from-blue-50 to-white rounded-xl p-3 sm:p-4 border border-blue-200">
        <div className="font-bold text-blue-900 mb-3 text-sm">Resumen por Ítem (Neto vs Bruto)</div>
        
        {/* El scroll horizontal solo envuelve a la tabla, no a toda la tarjeta */}
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="bg-blue-100 border-b-2 border-blue-300">
                <th className="px-2 py-2 text-left font-bold text-blue-900">Descripción</th>
                <th className="px-2 py-2 text-center font-bold text-blue-900">Cant.</th>
                <th className="px-2 py-2 text-right font-bold text-blue-900">Costo Unit.</th>
                <th className="px-2 py-2 text-right font-bold text-blue-900">Subtotal (Neto)</th>
                <th className="px-2 py-2 text-right font-bold text-blue-900">Desc.</th>
                <th className="px-2 py-2 text-right font-bold text-blue-900">Total Impuestos</th>
                <th className="px-2 py-2 text-right font-bold text-emerald-700">Total (Bruto)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {data.items?.map((item: any, idx: number) => {
                const cantidad = Number(item.cantidad_ingresada || 0);
                const costoUnit = Number(item.costo_unitario_compra || 0);
                const subtotalNeto = cantidad * costoUnit;
                const totalImpuestos = Number(item.iva_total || 0) + Number(item.impoconsumo || 0) + Number(item.otros_impuestos || 0);
                
                return (
                  <tr key={idx} className="hover:bg-blue-50 transition">
                    <td className="px-2 py-2 text-left font-medium text-gray-800">{item.nombre_producto || item.descripcion || "—"}</td>
                    <td className="px-2 py-2 text-center font-semibold text-gray-700">{cantidad}</td>
                    <td className="px-2 py-2 text-right font-mono text-gray-700">${costoUnit.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</td>
                    <td className="px-2 py-2 text-right font-mono font-semibold text-gray-900 bg-slate-100 rounded">${subtotalNeto.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</td>
                    <td className="px-2 py-2 text-right font-mono text-red-600 font-medium">
                      {Number(item.descuento_por_producto) > 0 ? `-$${Number(item.descuento_por_producto).toLocaleString('es-CO', { maximumFractionDigits: 0 })}` : "—"}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-amber-600 font-medium">${totalImpuestos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</td>
                    <td className="px-2 py-2 text-right font-mono font-bold text-emerald-700 bg-emerald-100 rounded">${Number(item.costo_total_linea || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Resumen Total Neto vs Bruto (1 col en móvil, 3 en PC) */}
        <div className="mt-4 pt-3 border-t-2 border-blue-300 bg-blue-100 rounded p-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center font-bold">
            <div className="py-1 sm:py-0">
              <p className="text-blue-600 text-[10px] sm:text-xs mb-1">TOTAL NETO</p>
              <p className="text-base sm:text-lg text-blue-900 font-mono">${sumaCostoBase.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="py-1 sm:py-0 border-t sm:border-t-0 sm:border-l border-blue-300/50">
              <p className="text-amber-600 text-[10px] sm:text-xs mb-1">TOTAL IMPUESTOS</p>
              <p className="text-base sm:text-lg text-amber-900 font-mono">
                ${(sumaIVA + data.items?.reduce((a: number, b: any) => a + (Number(b.impoconsumo) || 0) + (Number(b.otros_impuestos) || 0), 0)).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="py-1 sm:py-0 border-t sm:border-t-0 sm:border-l border-blue-300/50">
              <p className="text-emerald-600 text-[10px] sm:text-xs mb-1">TOTAL BRUTO</p>
              <p className="text-base sm:text-lg text-emerald-900 font-mono">${sumaTotalLineas.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: Editor de Items (Grid Editable) */}
      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
        
        {/* Aviso visible SOLO en móviles */}
        <div className="md:hidden text-xs text-blue-700 mb-3 flex items-center bg-blue-50 p-2.5 rounded-lg border border-blue-100 font-medium">
          👉 Desliza horizontalmente la tabla para ver y editar todas las columnas.
        </div>

        <div className="overflow-x-auto pb-4">
          {/* min-w-[800px] fuerza a que el grid mantenga tu diseño exacto en rems y active el scroll */}
          <div className="space-y-2 min-w-[800px]">
            
            {/* Encabezados Grid */}
            <div className="grid gap-2 px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide bg-gray-200/40 rounded-lg items-end"
              style={{ gridTemplateColumns: "5rem 11rem 3rem 4.5rem 4.5rem 4rem 3.5rem 3.5rem 3.5rem 5rem" }}>
              <div>Código</div><div>Descripción</div><div className="text-center">Cant.</div><div className="text-right">Costo Unit.</div>
              <div className="text-right">Subtotal</div><div className="text-right">Desc.</div><div className="text-right">IVA</div>
              <div className="text-right">ICO</div><div className="text-right">Otros</div><div className="text-right">Total Línea</div>
            </div>

            {/* Filas Editables */}
            {data.items?.map((item: any, idx: number) => {
              const calculoEsperado = (Number(item.cantidad_ingresada) * Number(item.costo_unitario_compra)) - Number(item.descuento_por_producto || 0) + Number(item.iva_total || 0) + Number(item.impoconsumo || 0) + Number(item.otros_impuestos || 0);
              const errorFila = Math.abs(calculoEsperado - Number(item.costo_total_linea)) >= 1;

              return (
                <div key={idx} className={`grid gap-2 p-2.5 rounded-lg border transition ${errorFila ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                  style={{ gridTemplateColumns: "5rem 11rem 3rem 4.5rem 4.5rem 4rem 3.5rem 3.5rem 3.5rem 5rem" }}>
                  <input type="text" value={item.codigo_proveedor || item.codigo_barras || ""} onChange={(e) => handleItemChange(idx, "codigo_proveedor", e.target.value)} className="w-full text-xs bg-transparent border-b outline-none font-mono text-gray-600" placeholder="SKU"/>
                  <input type="text" value={item.nombre_producto || item.descripcion || ""} onChange={(e) => handleItemChange(idx, "nombre_producto", e.target.value)} className="w-full text-xs bg-transparent border-b outline-none font-medium text-gray-800" placeholder="Nombre"/>
                  <input type="number" value={item.cantidad_ingresada} onChange={(e) => handleItemChange(idx, "cantidad_ingresada", Number(e.target.value))} className="w-full text-xs bg-transparent border-b outline-none text-center font-medium"/>
                  <input type="number" value={item.costo_unitario_compra} onChange={(e) => handleItemChange(idx, "costo_unitario_compra", Number(e.target.value))} className="w-full text-xs bg-transparent border-b outline-none text-right font-mono"/>
                  <div className="w-full text-xs text-right font-mono font-semibold text-gray-700 bg-slate-100 p-1.5 rounded border flex items-center justify-end">
                    ${(Number(item.cantidad_ingresada) * Number(item.costo_unitario_compra)).toFixed(0)}
                  </div>
                  <input type="number" value={item.descuento_por_producto || 0} onChange={(e) => handleItemChange(idx, "descuento_por_producto", Number(e.target.value))} className="w-full text-xs bg-transparent border-b outline-none text-right text-red-600 font-medium"/>
                  <input type="number" value={item.iva_total || 0} onChange={(e) => handleItemChange(idx, "iva_total", Number(e.target.value))} className="w-full text-xs bg-transparent border-b outline-none text-right text-emerald-600 font-medium"/>
                  <input type="number" value={item.impoconsumo || 0} onChange={(e) => handleItemChange(idx, "impoconsumo", Number(e.target.value))} className="w-full text-xs bg-transparent border-b outline-none text-right text-amber-600 font-medium"/>
                  <input type="number" value={item.otros_impuestos || 0} onChange={(e) => handleItemChange(idx, "otros_impuestos", Number(e.target.value))} className="w-full text-xs bg-transparent border-b outline-none text-right text-purple-600 font-medium"/>
                  <div className="relative w-full">
                    <input type="number" value={item.costo_total_linea} onChange={(e) => handleItemChange(idx, "costo_total_linea", Number(e.target.value))} className={`w-full text-xs bg-transparent border-b outline-none text-right font-bold ${errorFila ? 'border-red-400 text-red-700' : 'border-gray-300 text-gray-900'}`}/>
                    {errorFila && <span className="absolute -bottom-3.5 right-0 text-[8px] text-red-600 font-bold whitespace-nowrap">Espera: ${calculoEsperado.toFixed(0)}</span>}
                  </div>
                </div>
              );
            })}
            
            {/* Totales Fila Inferior */}
            <div className="grid gap-2 p-3 bg-slate-800 text-white rounded-lg font-bold mt-3 shadow-lg items-center"
              style={{ gridTemplateColumns: "5rem 11rem 3rem 4.5rem 4.5rem 4rem 3.5rem 3.5rem 3.5rem 5rem" }}>
              <div className="col-span-2 text-right text-xs uppercase tracking-wide text-slate-300">Total:</div>
              <div className="text-center text-sm">{data.items?.reduce((a: number, b: any) => a + (Number(b.cantidad_ingresada) || 0), 0)}</div>
              <div className="text-right text-xs text-slate-300">—</div>
              <div className="text-right text-sm bg-slate-700/50 p-1.5 rounded text-slate-100 font-mono">${sumaCostoBase.toFixed(0)}</div>
              <div className="text-right text-sm text-rose-300 font-mono">${data.items?.reduce((a: number, b: any) => a + (Number(b.descuento_por_producto) || 0), 0).toFixed(0)}</div>
              <div className="text-right text-sm text-emerald-300 font-mono">${sumaIVA.toFixed(0)}</div>
              <div className="text-right text-sm text-amber-300 font-mono">${data.items?.reduce((a: number, b: any) => a + (Number(b.impoconsumo) || 0), 0).toFixed(0)}</div>
              <div className="text-right text-sm text-purple-300 font-mono">${data.items?.reduce((a: number, b: any) => a + (Number(b.otros_impuestos) || 0), 0).toFixed(0)}</div>
              <div className="text-right text-base text-emerald-400 pt-1 border-t-2 border-emerald-400/30 font-mono">${sumaTotalLineas.toFixed(0)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}