import { NextResponse } from "next/server";
import { dbPostgres } from "@/lib/db/postgres";
import { facturasAuditoria, facturasAuditoriaArchivos } from "@/lib/db/postgres/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { facturaId, currentData, feedback, annotatedImages } = await req.json();

    if (!facturaId) {
      return NextResponse.json({ error: "Falta el ID de la factura" }, { status: 400 });
    }

    // 1. Obtener las imágenes base64 originales de la BD (se conservan intactas en PostgreSQL)
    const archivos = await dbPostgres.select().from(facturasAuditoriaArchivos).where(eq(facturasAuditoriaArchivos.facturaAuditoriaId, facturaId));
    if (archivos.length === 0) {
      return NextResponse.json({ error: "No se encontraron imágenes para esta factura" }, { status: 404 });
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return NextResponse.json({ error: "Falta API KEY" }, { status: 500 });
    }

    const systemPrompt = `      Eres un experto contable especializado en facturas colombianas de abarrotes, licores y minimercados.
      Esta es una solicitud de RE-ESCANEO. Tuviste errores en tu extracción anterior y el usuario te ha dado instrucciones precisas de qué corregir.
      
      JSON ANTERIOR CON ERRORES:
      ${JSON.stringify(currentData, null, 2)}
      
      COMENTARIOS DEL USUARIO PARA CORREGIR:
      "${feedback || 'Revisa detenidamente la factura y corrige los descuadres matemáticos.'}"

      ⚠️  REGLAS CRÍTICAS DE EXTRACCIÓN VISUAL:                  
      1. ANOTACIONES EN LA IMAGEN: Si ves subrayados de colores o notas hechas por el usuario, tenlos muy en cuenta para las correcciones.
      2. LECTURA MULTILÍNEA: Asocia visualmente líneas de productos con sus valores inferiores.
      3. LIMPIEZA DE DESCRIPCIONES: Ignora SKUs. Mantén abreviaturas.
      4. IBUA Y DESCUENTOS: Si hay "Valor IBUA", inclúyelo en otros_impuestos. Si hay "Reducción", "Desc", "Dcto" o un valor negativo bajo el producto, inclúyelo obligatoriamente en 'descuento_por_producto'. No lo restes del costo unitario invisiblemente.
      5. IMPUESTOS: Diferencia estricta entre IVA e Impoconsumo.
      6. FORMATO NUMÉRICO: Usa punto para decimales, sin separadores de miles.
      7. VERIFICACIÓN ARITMÉTICA OBLIGATORIA:
         a) El 'costo_total_linea' debe ser el valor final de ese producto. 
         b) LA ECUACIÓN PERFECTA: Para CADA línea, DEBE cumplirse estrictamente esta fórmula matemática:
            (cantidad * costo_unitario_compra) - descuento + iva_total + impoconsumo + otros_impuestos = costo_total_linea
         c) INFERENCIA: Si la factura no imprime el unitario o IVA, calcúlalos.
         d) Comprueba que: suma(costo_total_linea) cuadre con el Total Factura impreso.
      8. DOBLE CHEQUEO Y PREVENCIÓN DE ERRORES: Antes de generar el JSON, haz una verificación mental rápida de tus correcciones. NO te inventes un producto fantasma para cuadrar la caja.
      9. PRIVACIDAD ABSOLUTA Y CENSURA ESTRICTA:
         a) Si cualquier dato en la imagen está tapado o cubierto por un bloque o círculo negro (censura), o está borroso / ilegible, NUNCA LO INVENTES, NO LO ADIVINES Y NO LO DEDUZCAS. Debes colocar null o "" en el JSON para ese campo (por ejemplo si el número de factura, fechas, NIT, proveedor, totales o líneas de producto están tapados por un cuadro negro, asigna null a esos campos).
         b) DATOS PERSONALES A IGNORAR: NUNCA extraigas teléfonos personales, direcciones domiciliarias de personas naturales, correos personales, números de cuentas bancarias, firmas o códigos QR personales. Si aparecen, ignóralos y pon null.
      
      El JSON debe tener la misma estructura exacta que el JSON anterior, pero con los valores matemáticamente perfectos y corregidos.`;

    const contentPayload: any[] = [
      { type: "text", text: systemPrompt }
    ];
    
    // Mapear capturas compuestas con anotaciones/censura por índice y actualizar en PostgreSQL si aplica
    const annotatedMap = new Map<number, string>();
    if (Array.isArray(annotatedImages)) {
      for (const item of annotatedImages) {
        if (typeof item.index === 'number' && item.dataUrl) {
          annotatedMap.set(item.index, item.dataUrl);
          const arch = archivos[item.index];
          if (arch?.id) {
            try {
              await dbPostgres.update(facturasAuditoriaArchivos)
                .set({ datosBase64Censurada: item.dataUrl })
                .where(eq(facturasAuditoriaArchivos.id, arch.id));
            } catch (uErr) {
              console.warn("[Rescan API] Advertencia actualizando datosBase64Censurada:", uErr);
            }
          }
        }
      }
    }

    // Añadir imágenes enviando la versión censurada si existe, o la original como último recurso
    archivos.forEach((file, index) => {
      const imageUrlToSend = annotatedMap.get(index) || file.datosBase64Censurada || file.datosBase64;
      contentPayload.push({
        type: "image_url",
        image_url: {
          url: imageUrlToSend
        }
      });
    });

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "user",
            content: contentPayload
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      console.error("Error OpenRouter:", errBody);
      return NextResponse.json({ error: "Fallo en IA" }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    let jsonContent = aiData.choices[0].message.content;
    
    const firstBrace = jsonContent.indexOf('{');
    const lastBrace = jsonContent.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonContent = jsonContent.slice(firstBrace, lastBrace + 1);
    }
    
    const extractedData = JSON.parse(jsonContent);

    // 2. Actualizar la base de datos con el nuevo JSON
    await dbPostgres.update(facturasAuditoria)
      .set({ datosExtraidos: JSON.stringify(extractedData) })
      .where(eq(facturasAuditoria.id, facturaId));

    return NextResponse.json({ data: extractedData });

  } catch (error: any) {
    console.error("Error rescan-audit:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
  