import { NextRequest, NextResponse } from "next/server";
import { dbPostgres, schema } from "@/lib/db/postgres";
import { dbMysql } from "@/lib/db/mysql";
import { proveedores, mediosPago } from "@/lib/db/mysql/schema";
import { sql, eq } from "drizzle-orm";

export const maxDuration = 60; // Max execution time for vercel

let migrationChecked = false;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const isBlobOrFile = (val: any): val is Blob | File => {
      return val && typeof val === "object" && typeof val.arrayBuffer === "function";
    };

    // 1. Obtener archivos destinados para la IA (con censura física aplicada si el usuario censuró)
    const aiFiles: (File | Blob)[] = [];
    const aiEntries = formData.getAll("ai_files");
    for (const val of aiEntries) {
      if (isBlobOrFile(val)) aiFiles.push(val);
    }

    // Compatibilidad retroactiva si no se especificó 'ai_files'
    if (aiFiles.length === 0) {
      for (const [key, value] of formData.entries()) {
        if (isBlobOrFile(value) && key !== "original_files") {
          aiFiles.push(value);
        }
      }
    }

    // 2. Obtener archivos originales INTACTOS para almacenamiento en PostgreSQL
    const originalFiles: (File | Blob)[] = [];
    const origEntries = formData.getAll("original_files");
    for (const val of origEntries) {
      if (isBlobOrFile(val)) originalFiles.push(val);
    }

    // Si no vinieron archivos originales explícitos, usar los aiFiles
    if (originalFiles.length === 0) {
      originalFiles.push(...aiFiles);
    }
    
    if (aiFiles.length === 0) {
      return NextResponse.json({ error: "No se proporcionaron archivos" }, { status: 400 });
    }

    console.log(`[Scan API] Archivos recibidos: ${aiFiles.length} para análisis de IA, ${originalFiles.length} originales para auditoría en BD.`);

    // Convertir a base64 los archivos para la IA
    const base64AiFiles = await Promise.all(
      aiFiles.map(async (file, idx) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString("base64");
        const mimeType = file.type || "image/jpeg";
        const name = (file as any).name || `archivo_ia_${idx + 1}.jpg`;
        return {
          name,
          type: mimeType,
          base64: base64Data,
          dataUrl: `data:${mimeType};base64,${base64Data}`,
        };
      })
    );

    // Convertir a base64 los archivos originales para la BD
    const base64OriginalFiles = await Promise.all(
      originalFiles.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString("base64");
        const mimeType = file.type || "image/jpeg";
        const name = (file as any).name || "factura_original.jpg";
        return {
          name,
          type: mimeType,
          base64: base64Data,
          dataUrl: `data:${mimeType};base64,${base64Data}`,
        };
      })
    );

    const invalidFile = base64AiFiles.find((f) => !f.type.startsWith("image/"));
    if (invalidFile) {
      return NextResponse.json({ 
        error: "Formato no soportado. Por favor sube solo imágenes (JPG/PNG). Si tienes un PDF, conviértelo a imagen primero." 
      }, { status: 400 });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY no está configurada." }, { status: 500 });
    }

    // Obtener listas desde la base de datos MySQL para guiar a la IA
    const proveedoresList = await dbMysql.select({ nit: proveedores.nit, razonSocial: proveedores.razonSocial }).from(proveedores);
    const mediosPagoList = await dbMysql.select({ nombre: mediosPago.nombre }).from(mediosPago).where(eq(mediosPago.activo, true));
    
    const provStr = proveedoresList.map(p => `- ${p.razonSocial} (NIT: ${p.nit})`).join("\\n");
    const mediosStr = mediosPagoList.map(mp => `- ${mp.nombre}`).join("\\n");

    const systemPrompt = `      Eres un experto contable especializado en facturas colombianas de abarrotes, licores y minimercados.  
       Extrae con total fidelidad los datos contables y comerciales visibles en la imagen sin inventar nada.
       
       IMPORTANTE - BASES DE DATOS DEL SISTEMA:
       Si detectas uno de los siguientes proveedores, trata de usar EXACTAMENTE la Razón Social y NIT como está aquí listado:
       ${provStr}
       
       Para el Medio de Pago, intenta clasificarlo en uno de los siguientes si coincide:
       ${mediosStr}
       
       Para el Tipo de Documento, usa EXCLUSIVAMENTE uno de estos valores:
       - Factura Electrónica
       - Factura POS
       - Remisión
       - Soporte de Entrega
       - Nota Pedido
       - Otro
       
      ⚠️  REGLAS CRÍTICAS DE EXTRACCIÓN VISUAL (basadas en +50 facturas reales procesadas):                  
      1. LECTURA MULTILÍNEA (Tirillas térmicas): En muchos recibos térmicos, el nombre del producto está    
      en una línea y sus valores (cantidad, precio, IVA, ICO, total) aparecen en la línea inmediatamente    
      inferior DEBAJO. Asocia visualmente ambas líneas como un ÚNICO item. En facturas de licores, algunos  
       valores pueden estar en filas adicionales debajo.                                                    
      2. LIMPIEZA DE DESCRIPCIONES: Ignora códigos internos del proveedor (SKUs) y códigos de barras        
      redundantes. Extrae el nombre comercial claro del producto. Si ves una línea corta como "AG           
      Lt330X6", es la abreviatura real — déjala así, no la "limpies" porque es la descripción del producto  
       para el sistema. El formato de abreviatura usual es: MARCA+PRODUCTO+TAMAÑO+FORMATO (ej. AG =         
      Aguila, Lt = Lata, 330 = 330ml, X6 = pack de 6).                                                      
      3. IBUA Y DESCUENTOS (Reducciones): Facturas de gaseosas, cervezas y licores (como Postobón, Bavaria) traen frecuentemente una fila o columna etiquetada como "Reducción", "Desc", "Dcto" o un valor negativo debajo de cada item. 
      DEBES extraer ese valor exacto y colocarlo en el campo 'descuento_por_producto'. No lo restes del costo unitario invisiblemente. 
      Igualmente, extrae la columna "Valor IBUA" y colócala en 'otros_impuestos'. 
      4. IMPUESTOS (IVA e Impoconsumo/ICO): Diferencia estrictamente IVA vs Impuesto al Consumo (ICO/IC).
      En items con IVA: calcula el % basado en el valor si no está explícito (19% o 5%). El impoconsumo es  
       separado y suele aparecer etiquetado como "Imp. Consumo", "ICO", "IC" o "Impoconsumo".               
      5. FORMATO NUMÉRICO: Extrae números SIN símbolos de moneda, SIN separadores de miles, usando punto    
      para decimales (ej. "1250000.50").                                                                    
      6. CLIENTE RECEPTOR: Si está visible y no censurado, extráelo (ej. NIT 1032401381 / GUEVARA VANEGAS YULI MARCELA / MEGALIDER). Si está tachado, censurado o no aparece, déjalo en null.                                                                                           
      7. TIPOS DE DOCUMENTO: "SOPORTE DE ENTREGA" y "NOTA PEDIDO" son documentos sustitutivos válidos — NO  
       son factura fiscal pero se registran igual. Déjales cufe: null si no traen CUFE.                     
      8. VERIFICACIÓN ARITMÉTICA OBLIGATORIA:
         a) El 'costo_total_linea' debe ser el valor final de ese producto. 
         b) LA ECUACIÓN PERFECTA: Para CADA línea, DEBE cumplirse estrictamente esta fórmula matemática:
            (cantidad * costo_unitario_compra) - descuento + iva_total + impoconsumo + otros_impuestos = costo_total_linea
         c) INFERENCIA: Si la factura no imprime el 'costo_unitario_compra' o el 'iva_total' por línea, pero muestra la cantidad y el total, CALCÚLALOS TÚ MISMO deduciendo los valores de modo que la ecuación perfecta se cumpla.
         d) Comprueba que: suma(costo_total_linea) cuadre con el Total Factura impreso.
      9. PRODUCTOS DE LICORERÍA: En facturas de licores y cervezas, a veces el costo impreso ya incluye impuestos. Si es así, asegúrate de desglosarlo matemáticamente o llenar los campos de modo que la Ecuación Perfecta (8.b) se cumpla.
      10. DUPLICACIÓN DE ITEMS: La visión a veces duplica items idénticos. Si ves dos filas exactamente iguales (misma descripción, misma cantidad, mismo costo), dedúplica.
      11. DOBLE CHEQUEO Y PREVENCIÓN DE ERRORES: Antes de generar el JSON, haz una verificación mental rápida:
         - ¿Confundiste la letra 'B' with un '8' o la 'O' con un '0'? (ej. en el NIT o códigos).
         - ¿El número del Subtotal más los Impuestos da el Total exacto impreso en el papel?
         - Si hay un descuadre matemático, REVISA LAS IMÁGENES de nuevo, es probable que te hayas saltado un producto (muy común en facturas largas), o que hayas omitido un descuento (Reducción). 
         NO te inventes un producto fantasma para cuadrar la caja. Ajusta los valores de las filas para que reflejen la realidad impresa.
      12. PRIVACIDAD ABSOLUTA Y CENSURA ESTRICTA:
         a) Si cualquier dato en la imagen está tapado o cubierto por un bloque o círculo negro (censura), o está borroso / ilegible, NUNCA LO INVENTES, NO LO ADIVINES Y NO LO DEDUZCAS. Debes colocar null o "" en el JSON para ese campo (por ejemplo si el número de factura, fechas, NIT, proveedor, totales o productos están tapados por un cuadro negro, asigna null a esos campos).
         b) DATOS PERSONALES A IGNORAR: NUNCA extraigas teléfonos personales, direcciones domiciliarias de personas naturales, correos personales, números de cuentas bancarias, firmas manuscritas o códigos QR personales. Si aparecen, déjalos en null.
      
      El JSON debe tener esta estructura exacta (NO agregues campos extra, NO uses nombres alternativos):
      {
        "factura_compra": {
          "cufe": null o string con el CUFE,
          "numero_factura": "string o null si está censurado",
          "tipo_documento": "Factura Electrónica" o "Remision" o "Soporte de Entrega" o "Nota Pedido" según corresponda,
          "fecha_emision": "DD/MM/YYYY o null si está censurado",
          "fecha_vencimiento": "DD/MM/YYYY o null",
          "proveedor": {
            "nit": "string (con puntos y guión si aplica, ej. 900.818.921-6) o null si está censurado",
            "razon_social": "string o null si está censurado"
          },
          "cliente_receptor": {
            "documento": "string o null",
            "nombre": "string o null"
          },
          "condiciones_comerciales": {
            "medio_pago": "CREDITO" o "CONTADO",
            "forma_pago": "string con la condición exacta del proveedor",
            "plazo_dias": número o null
          },
          "logistica_transporte": {
            "pedido": número o null,
            "orden_compra": "string o null",
            "vendedor": "string o null",
            "vehiculo": "string o null",
            "zona": "string o null",
            "ruta": "string o null",
            "peso_total": null,
            "total_unidades": número,
            "total_cajas": número o null
          },
          "documento_referencia": null,
          "observaciones": "string con notas adicionales",
          "items": [
            {
              "codigo_barras": "string o vacío",
              "codigo_proveedor": "string (SKU del proveedor)",
              "nombre_producto": "string (nombre completo del producto)",
              "cantidad_ingresada": número,
              "unidad_medida": "UND o CAJ o SXP o FRP o BOL",
              "costo_unitario_compra": número (con decimales, precio base antes de impuestos, deducir si no está impreso),
              "descuento_por_producto": número o 0,
              "iva_%": número (19, 5, 0),
              "iva_total": número,
              "impoconsumo": número (si aplica, si no 0),
              "otros_impuestos": número (IBUA o 0),
              "costo_total_linea": número (debe cumplir matemáticamente la fórmula de la regla 8b)
            }
          ],
          "totales": {
            "subtotal": número (exactamente el impreso antes de impuestos globales),
            "descuento_total_factura": número o 0 (puede ser negativo),
            "iva_5": número o 0,
            "iva_19": número o 0,
            "impoconsumo_total": número o 0,
            "ibua_ipcu": número o 0,
            "otros_impuestos_total": número o 0,
            "total_factura": número (total a pagar impreso)
          }                                                                                                 
        }                                                                                                   
      }                                                                                                     
      Reglas del JSON:                                                                                      
      - Los items van dentro de "items" (NO "productos", NO "detalle")                                      
      - Los totales usan "iva_5" e "iva_19" separados (NO solo "iva")                                       
      - proveedor tiene solo "nit" y "razon_social"                                                         
      - cliente_receptor tiene solo "documento" y "nombre"                                                  
      - Las condiciones comerciales van como sub-objeto "condiciones_comerciales"                           
      - Los datos logísticos van como sub-objeto "logistica_transporte"                                     
      IMPORTANTE: Después del JSON, DEBES incluir una sección de validación aritmética así:                 
      --- VALIDACION ---                                                                                    
      N items: [número]                                                                                     
      Suma costo_total_linea items: [suma]                                                                  
      Total factura impreso: [total_factura] (diff: [diferencia] )                                          
      Suma IVA items: [suma] vs Total IVA impreso: [valor]                                                  
      Suma ICO items: [suma] vs Total ICO impreso: [valor]                                                  
      IBUA detectado: [SI/NO]   `;

    // Preparar el array de mensajes con las imágenes destinadas para la IA
    const contentPayload: any[] = [
      { type: "text", text: systemPrompt }
    ];
    
    base64AiFiles.forEach((file, index) => {
      console.log(`[Scan API] Enviando imagen a la IA (Pág. ${index + 1}/${base64AiFiles.length}): ${file.name}, tamaño base64: ${file.base64.length}`);

      contentPayload.push({
        type: "image_url",
        image_url: {
          url: file.dataUrl
        }
      });
    });

    const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: contentPayload
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error OpenRouter:", errorText);
      return NextResponse.json({ error: `Error de OpenRouter: ${errorText}` }, { status: 500 });
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content || "{}";
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("La respuesta de la IA no contiene un objeto JSON válido");
    }
    const extractedData = JSON.parse(jsonMatch[0]);

    // Fusionar datos manuales si fueron provistos por el usuario en el formulario (prioridad sobre campos censurados)
    const manualDataRaw = formData.get("manual_data") as string | null;
    if (manualDataRaw) {
      try {
        const manualData = JSON.parse(manualDataRaw);
        if (extractedData.factura_compra && manualData) {
          if (manualData.numero_factura?.trim()) extractedData.factura_compra.numero_factura = manualData.numero_factura.trim();
          if (manualData.fecha_emision?.trim()) extractedData.factura_compra.fecha_emision = manualData.fecha_emision.trim();
          if (manualData.fecha_vencimiento?.trim()) extractedData.factura_compra.fecha_vencimiento = manualData.fecha_vencimiento.trim();
          if (manualData.tipo_documento?.trim()) extractedData.factura_compra.tipo_documento = manualData.tipo_documento.trim();
          if (manualData.proveedor_nit?.trim()) {
            if (!extractedData.factura_compra.proveedor) extractedData.factura_compra.proveedor = {};
            extractedData.factura_compra.proveedor.nit = manualData.proveedor_nit.trim();
          }
          if (manualData.proveedor_razon_social?.trim()) {
            if (!extractedData.factura_compra.proveedor) extractedData.factura_compra.proveedor = {};
            extractedData.factura_compra.proveedor.razon_social = manualData.proveedor_razon_social.trim();
          }
        }
      } catch (e) {
        console.warn("[Scan API] Error procesando manual_data:", e);
      }
    }

    // Guardar temporalmente en PostgreSQL (Auditoría) de forma resiliente
    let auditId: number | null = null;
    
    try {
      if (!migrationChecked) {
        try {
          await dbPostgres.execute(sql`ALTER TABLE facturas_auditoria_archivos ADD COLUMN IF NOT EXISTS datos_base64_censurada TEXT;`);
          migrationChecked = true;
        } catch (mErr) {
          console.warn("[Scan API] Auto-migración columna censura:", mErr);
        }
      }

      const insertedAudit = await dbPostgres.insert(schema.facturasAuditoria).values({
        datosExtraidos: JSON.stringify(extractedData),
        estado: "PENDIENTE",
      }).returning({ id: schema.facturasAuditoria.id });
      
      auditId = insertedAudit[0]?.id;

      if (auditId) {
        try {
          // Insertar ambas versiones de la imagen en PostgreSQL
          const fileInserts = base64OriginalFiles.map((f, i) => {
            const aiFile = base64AiFiles[i];
            const isCensored = aiFile && (aiFile.name?.startsWith("censored_scan_") || aiFile.dataUrl !== f.dataUrl);
            return {
              facturaAuditoriaId: auditId!,
              datosBase64: f.dataUrl, // Original intacta
              datosBase64Censurada: isCensored ? aiFile.dataUrl : null, // Versión censurada
              orden: i,
            };
          });
          await dbPostgres.insert(schema.facturasAuditoriaArchivos).values(fileInserts);
        } catch (colErr) {
          console.warn("[Scan API] Fallback de inserción de archivos:", colErr);
          try {
            const basicInserts = base64OriginalFiles.map((f, i) => ({
              facturaAuditoriaId: auditId!,
              datosBase64: f.dataUrl,
              orden: i,
            }));
            await dbPostgres.insert(schema.facturasAuditoriaArchivos).values(basicInserts as any);
          } catch (e2) {
            console.error("[Scan API] Error al guardar archivos:", e2);
          }
        }
      }
    } catch (dbError) {
      console.warn("[Scan API] Advertencia al registrar auditoría en PostgreSQL:", dbError);
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      auditId: auditId,
      images: base64OriginalFiles.map((f, i) => ({
        datosBase64: f.dataUrl,
        datosBase64Censurada: base64AiFiles[i]?.dataUrl !== f.dataUrl ? base64AiFiles[i]?.dataUrl : null,
      }))
    });

  } catch (error) {
    console.error("Error en scan factura:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}