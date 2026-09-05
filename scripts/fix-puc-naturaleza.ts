import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const { dbMysql, schema } = await import("@/lib/db/mysql");
  const { eq } = await import("drizzle-orm");
  const { calcularNivelPuc, normalizarNaturalezaPuc } = await import("@/lib/puc-utils");
  console.log("🔄 Actualizando y estandarizando cuentas PUC en MySQL...");

  const cuentas = await dbMysql.query.pucCuentas.findMany();
  console.log(`📋 Se encontraron ${cuentas.length} cuentas PUC.`);

  let actualizadas = 0;

  for (const c of cuentas) {
    const nivelOficial = calcularNivelPuc(c.codigo);
    const naturalezaOficial = normalizarNaturalezaPuc(c.naturaleza, c.codigo);

    const requiereCambio =
      c.naturaleza !== naturalezaOficial ||
      c.nivel !== nivelOficial;

    if (requiereCambio) {
      await dbMysql
        .update(schema.pucCuentas)
        .set({
          naturaleza: naturalezaOficial,
          nivel: nivelOficial,
        })
        .where(eq(schema.pucCuentas.codigo, c.codigo));

      console.log(
        `  ✅ [${c.codigo}] ${c.nombre}: Naturaleza '${c.naturaleza}' -> '${naturalezaOficial}' | Nivel ${c.nivel} -> ${nivelOficial}`
      );
      actualizadas++;
    }
  }

  console.log(`\n🎉 Proceso completado: ${actualizadas} cuentas actualizadas con éxito.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error actualizando cuentas PUC:", err);
  process.exit(1);
});
