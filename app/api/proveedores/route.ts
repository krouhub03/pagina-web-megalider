import { NextResponse } from "next/server";
import { dbMysql } from "@/lib/db/mysql";
import * as mysqlSchema from "@/lib/db/mysql/schema";

export async function GET() {
  try {
    const proveedores = await dbMysql.select({
      nit: mysqlSchema.proveedores.nit,
      razonSocial: mysqlSchema.proveedores.razonSocial,
    }).from(mysqlSchema.proveedores);

    return NextResponse.json(proveedores);
  } catch (error) {
    console.error("Error fetching proveedores:", error);
    return NextResponse.json({ error: "Error fetching proveedores" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { nit, razonSocial } = await req.json();
    
    if (!nit || !razonSocial) {
      return NextResponse.json({ error: "NIT y Razón Social son requeridos" }, { status: 400 });
    }

    const insertResult = await dbMysql.insert(mysqlSchema.proveedores).values({
      nit,
      razonSocial,
    });

    return NextResponse.json({ success: true, id: insertResult[0].insertId });
  } catch (error) {
    console.error("Error creating proveedor:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
