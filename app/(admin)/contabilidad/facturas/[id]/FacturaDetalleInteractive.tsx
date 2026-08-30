"use client";

import React from "react";
import dynamic from "next/dynamic";
import { BotonCopiarCufe } from "./BotonCopiarCufe";
import { BotonEliminarFactura } from "./BotonEliminarFactura";
import { FacturaEditarData } from "./ModalEditarFactura";
import { ItemFacturaData } from "./ModalEditarFacturaItem";

const ModalEditarFactura = dynamic(
  () => import("./ModalEditarFactura").then((mod) => mod.ModalEditarFactura),
  { ssr: false }
);

const ModalEditarFacturaItem = dynamic(
  () => import("./ModalEditarFacturaItem").then((mod) => mod.ModalEditarFacturaItem),
  { ssr: false }
);

interface FacturaDetalleActionsProps {
  factura: FacturaEditarData;
  cufe?: string | null;
}

export function FacturaDetalleActions({ factura, cufe }: FacturaDetalleActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {cufe && <BotonCopiarCufe cufe={cufe} />}
      <ModalEditarFactura factura={factura} variant="full" />
      <BotonEliminarFactura
        facturaId={factura.id}
        numeroFactura={factura.numeroFactura}
        redirectOnSuccess="/contabilidad/facturas"
        variant="full"
      />
    </div>
  );
}

interface FacturaItemActionProps {
  item?: ItemFacturaData;
  facturaId: number;
  mode?: "edit" | "create";
}

export function FacturaItemAction({ item, facturaId, mode = "edit" }: FacturaItemActionProps) {
  return <ModalEditarFacturaItem item={item} facturaId={facturaId} mode={mode} />;
}
