"use client";

import React, { useState, useTransition } from "react";
import {
  Plus,
  X,
  Save,
  AlertCircle,
  Wallet,
  Zap,
  Users,
  Building2,
  CreditCard,
  UserCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Receipt,
  Wrench,
  BookOpen,
  Sparkles,
  FileText,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { obtenerNaturalezaFinanciera, TipoNaturalezaFinanciera } from "@/lib/clasificacion-financiera";
import { crearEgresoAction } from "./actions";

export interface CategoriaGastoItem {
  id: number;
  nombre: string;
  comportamiento?: string | null;
  descripcion?: string | null;
  pucSugerido?: string | null;
}

export interface PucCuentaItem {
  codigo: string;
  nombre: string | null;
}

interface ModalNuevoEgresoProps {
  categorias: CategoriaGastoItem[];
  pucCuentas: PucCuentaItem[];
}

// Categorías predeterminadas sincronizadas exactamente con la tabla DB categorias_gastos
const CATEGORIAS_DEFAULT_DB: CategoriaGastoItem[] = [
  { id: 8, nombre: "Servicios y Arriendo", comportamiento: "FIJO", descripcion: "Luz, agua, gas, internet, arriendo", pucSugerido: "5135" },
  { id: 9, nombre: "Nómina y Turnos", comportamiento: "FIJO", descripcion: "Sueldos, turnos, ayudantes", pucSugerido: "5105" },
  { id: 10, nombre: "Mantenimiento & Arreglos", comportamiento: "VARIABLE", descripcion: "Reparación congelador, locativos", pucSugerido: "5145" },
  { id: 11, nombre: "Insumos, Aseo y Papelería", comportamiento: "VARIABLE", descripcion: "Bolsas, detergente, cinta, bolsas", pucSugerido: "5195" },
  { id: 12, nombre: "Cámara Comercio & Impuestos", comportamiento: "FIJO", descripcion: "Renovación, registro, tributos", pucSugerido: "5115" },
  { id: 13, nombre: "Seguros del Local", comportamiento: "FIJO", descripcion: "Póliza contra robo, incendio", pucSugerido: "5130" },
  { id: 14, nombre: "Letreros y Publicidad", comportamiento: "VARIABLE", descripcion: "Avisos, volantes, redes sociales", pucSugerido: "5295" },
  { id: 15, nombre: "Equipos y Congeladores", comportamiento: "VARIABLE", descripcion: "Neveras, vitrinas, equipos (Activos)", pucSugerido: "1528" },
  { id: 16, nombre: "Bancos y Préstamos", comportamiento: "FIJO", descripcion: "Cuota de crédito, intereses, datáfono", pucSugerido: "5305" },
  { id: 17, nombre: "Gastos Personales / Retiros", comportamiento: "VARIABLE", descripcion: "Almuerzo del dueño, retiros socio", pucSugerido: "1325" },
];

const PROVEEDORES_FRECUENTES = [
  "Enel Codensa",
  "EAAB (Agua)",
  "Claro / ETB",
  "Vanti (Gas)",
  "Surtidor Local",
  "Nequi / Efectivo",
];

// Helper para asignar íconos según el pucSugerido o nombre de la categoría DB
function obtenerIconoCategoria(pucSugerido?: string | null, nombre?: string): React.ElementType {
  const puc = pucSugerido || "";
  const nom = (nombre || "").toLowerCase();

  if (puc.startsWith("5135") || puc.startsWith("5120") || nom.includes("servicio") || nom.includes("arriendo")) return Zap;
  if (puc.startsWith("5105") || nom.includes("nomina") || nom.includes("turno")) return Users;
  if (puc.startsWith("5145") || nom.includes("mantenimiento")) return Wrench;
  if (puc.startsWith("5195") || nom.includes("aseo") || nom.includes("papeleria")) return Sparkles;
  if (puc.startsWith("5115") || nom.includes("camara") || nom.includes("impuesto")) return FileText;
  if (puc.startsWith("5130") || nom.includes("seguro")) return ShieldCheck;
  if (puc.startsWith("5295") || puc.startsWith("5235") || nom.includes("publicidad") || nom.includes("letrero")) return Megaphone;
  if (puc.startsWith("1528") || puc.startsWith("1524") || puc.startsWith("1520") || puc.startsWith("15") || nom.includes("equipo")) return Building2;
  if (puc.startsWith("5305") || puc.startsWith("2105") || puc.startsWith("21") || nom.includes("banco")) return CreditCard;
  if (puc.startsWith("1325") || puc.startsWith("3140") || puc.startsWith("3115") || nom.includes("personal") || nom.includes("retiro")) return UserCheck;
  return Zap;
}

// Helper para determinar el tipo de egreso financiero según el prefijo PUC de 4 dígitos
function determinarTipoEgresoPorPucPrefix(pucPrefix: string): TipoNaturalezaFinanciera {
  if (pucPrefix.startsWith("15")) return "ACTIVO_FIJO";
  if (pucPrefix.startsWith("21") || pucPrefix.startsWith("2")) return "PAGO_DEUDA";
  if (pucPrefix.startsWith("13") || pucPrefix.startsWith("31") || pucPrefix.startsWith("3")) return "RETIRO_PERSONAL";
  if (pucPrefix.startsWith("14")) return "COMPRA_INVENTARIO";
  return "GASTO_OPERATIVO"; // Clase 5 por defecto
}

export function ModalNuevoEgreso({
  categorias: categoriasProp,
  pucCuentas,
}: ModalNuevoEgresoProps) {
  const [abierto, setAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false);

  // Usar categorías reales traídas de PostgreSQL o el listado de resguardo sincronizado
  const categoriasLista = categoriasProp.length > 0 ? categoriasProp : CATEGORIAS_DEFAULT_DB;
  
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState<number>(categoriasLista[0].id);

  const hoy = new Date().toISOString().substring(0, 10);

  const [formData, setFormData] = useState({
    fechaEgreso: hoy,
    tipoEgreso: "GASTO_OPERATIVO",
    categoriaId: String(categoriasLista[0].id),
    codigoPuc: "513530",
    descripcion: "",
    proveedor: "",
    nitEmisor: "",
    codigoCiiu: "",
    subtotal: "0",
    iva: "0",
    otrosImpuestos: "0",
    totalEgreso: "",
    tieneFactura: false,
    numeroComprobante: "",
  });

  // Categoría activa actualmente seleccionada
  const catActiva = categoriasLista.find((c) => c.id === categoriaSeleccionadaId) || categoriasLista[0];
  const pucPrefix4Digitos = catActiva.pucSugerido?.trim() || "5135";

  // Filtrado Progresivo de Cuentas PUC por los primeros 4 dígitos de puc_sugerido (ej: 5135, 5105, 5145, 5195...)
  const pucsExactos4Digitos = pucCuentas.filter((puc) => puc.codigo.startsWith(pucPrefix4Digitos));
  const pucsGrupo2Digitos = pucCuentas.filter((puc) => puc.codigo.startsWith(pucPrefix4Digitos.substring(0, 2)));
  const pucsClase1Digito = pucCuentas.filter((puc) => puc.codigo.startsWith(pucPrefix4Digitos.substring(0, 1)));

  // Selector final de cuentas PUC filtradas dinámicamente
  const pucCuentasFiltradas = pucsExactos4Digitos.length > 0
    ? pucsExactos4Digitos
    : pucsGrupo2Digitos.length > 0
    ? pucsGrupo2Digitos
    : pucsClase1Digito.length > 0
    ? pucsClase1Digito
    : pucCuentas;

  const handleSeleccionarCategoria = (cat: CategoriaGastoItem) => {
    setCategoriaSeleccionadaId(cat.id);
    const prefix4 = cat.pucSugerido?.trim() || "5135";
    const tipoFinanciero = determinarTipoEgresoPorPucPrefix(prefix4);

    // Buscar la primera cuenta PUC correspondiente a este prefijo de 4 dígitos
    const pucsParaEstaCat = pucCuentas.filter((p) => p.codigo.startsWith(prefix4));
    const primerPucEncontrado = pucsParaEstaCat.length > 0
      ? pucsParaEstaCat[0].codigo
      : prefix4;

    setFormData((prev) => ({
      ...prev,
      categoriaId: String(cat.id),
      tipoEgreso: tipoFinanciero,
      codigoPuc: primerPucEncontrado,
    }));
  };

  const handleSeleccionarPucProgresivo = (codigoPuc: string) => {
    const cuenta = pucCuentas.find((p) => p.codigo === codigoPuc);
    const nombrePuc = cuenta?.nombre || "";

    let tipoDerivado: TipoNaturalezaFinanciera = "GASTO_OPERATIVO";
    if (codigoPuc.startsWith("5")) tipoDerivado = "GASTO_OPERATIVO";
    else if (codigoPuc.startsWith("15")) tipoDerivado = "ACTIVO_FIJO";
    else if (codigoPuc.startsWith("14")) tipoDerivado = "COMPRA_INVENTARIO";
    else if (codigoPuc.startsWith("2")) tipoDerivado = "PAGO_DEUDA";
    else if (codigoPuc.startsWith("13") || codigoPuc.startsWith("3")) tipoDerivado = "RETIRO_PERSONAL";

    setFormData((prev) => {
      const descripcionSugerida = prev.descripcion.trim() ? prev.descripcion : `Pago de ${nombrePuc}`;

      return {
        ...prev,
        codigoPuc,
        tipoEgreso: tipoDerivado,
        descripcion: descripcionSugerida,
      };
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    const name = target.name;

    setFormData((prev) => {
      const nextData = { ...prev, [name]: value };

      if (["subtotal", "iva", "otrosImpuestos"].includes(name)) {
        const sub = parseFloat(String(nextData.subtotal || 0)) || 0;
        const ivaVal = parseFloat(String(nextData.iva || 0)) || 0;
        const otros = parseFloat(String(nextData.otrosImpuestos || 0)) || 0;
        const sum = sub + ivaVal + otros;
        if (sum > 0) {
          nextData.totalEgreso = String(sum);
        }
      }

      if (name === "codigoPuc" && typeof value === "string" && value.trim()) {
        const puc = value.trim();
        if (puc.startsWith("5")) nextData.tipoEgreso = "GASTO_OPERATIVO";
        else if (puc.startsWith("15")) nextData.tipoEgreso = "ACTIVO_FIJO";
        else if (puc.startsWith("14")) nextData.tipoEgreso = "COMPRA_INVENTARIO";
        else if (puc.startsWith("2")) nextData.tipoEgreso = "PAGO_DEUDA";
        else if (puc.startsWith("13") || puc.startsWith("3")) nextData.tipoEgreso = "RETIRO_PERSONAL";
      }

      return nextData;
    });
  };

  const handleProveedorRapido = (nombreProv: string) => {
    setFormData((prev) => ({ ...prev, proveedor: nombreProv }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.descripcion.trim()) {
      setError("Por favor ingresa una breve descripción del gasto o salida de dinero.");
      return;
    }

    const totalVal = parseFloat(formData.totalEgreso);
    if (isNaN(totalVal) || totalVal <= 0) {
      setError("Ingresa el monto total pagado (debe ser mayor a $0).");
      return;
    }

    startTransition(async () => {
      const res = await crearEgresoAction({
        fechaEgreso: formData.fechaEgreso,
        tipoEgreso: formData.tipoEgreso,
        categoriaId: Number(formData.categoriaId),
        codigoPuc: formData.codigoPuc || null,
        descripcion: formData.descripcion.trim(),
        proveedor: formData.proveedor.trim() || null,
        nitEmisor: formData.nitEmisor.trim() || null,
        codigoCiiu: formData.codigoCiiu.trim() || null,
        subtotal: formData.subtotal || "0",
        iva: formData.iva || "0",
        otrosImpuestos: formData.otrosImpuestos || "0",
        totalEgreso: String(totalVal),
        tieneFactura: formData.tieneFactura,
        numeroComprobante: formData.numeroComprobante.trim() || null,
        origen: "manual",
        registradoPor: "Manual",
      });

      if (res.success) {
        setAbierto(false);
        setFormData({
          fechaEgreso: hoy,
          tipoEgreso: "GASTO_OPERATIVO",
          categoriaId: String(categoriasLista[0].id),
          codigoPuc: "",
          descripcion: "",
          proveedor: "",
          nitEmisor: "",
          codigoCiiu: "",
          subtotal: "0",
          iva: "0",
          otrosImpuestos: "0",
          totalEgreso: "",
          tieneFactura: false,
          numeroComprobante: "",
        });
      } else {
        setError(res.error || "No se pudo registrar la salida de dinero.");
      }
    });
  };

  const infoNat = obtenerNaturalezaFinanciera({
    codigoPuc: formData.codigoPuc,
    tipoEgreso: formData.tipoEgreso,
    descripcion: formData.descripcion,
  });

  return (
    <>
      <Button
        onClick={() => setAbierto(true)}
        size="sm"
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
      >
        <Plus className="w-4 h-4 mr-1" />
        Registrar Salida de Dinero
      </Button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header Modal */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Registrar Salida de Dinero / Egreso de Tienda
                  </h2>
                  <p className="text-xs text-slate-500">
                    Filtrado inteligente por los primeros 4 dígitos del PUC (`puc_sugerido` de cada categoría).
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAbierto(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
              
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {/* PASO 1: Selector Visual Dinámico desde la DB (categorias_gastos) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  1. Selecciona la Categoría de Gasto (Filtra por 4 dígitos PUC)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categoriasLista.map((cat) => {
                    const IconComp = obtenerIconoCategoria(cat.pucSugerido, cat.nombre);
                    const esSeleccionada = categoriaSeleccionadaId === cat.id;
                    const tooltipText = `${cat.nombre} (${cat.descripcion || ""}) — Filtra PUC: ${cat.pucSugerido || "General"}`;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSeleccionarCategoria(cat)}
                        title={tooltipText}
                        className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between group ${
                          esSeleccionada
                            ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs"
                            : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                        }`}
                      >
                        {esSeleccionada && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute top-2 right-2" />
                        )}
                        <div className="flex items-center justify-between w-full mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            esSeleccionada ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700"
                          }`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <div className={`text-xs font-bold ${esSeleccionada ? "text-emerald-950" : "text-slate-800"}`}>
                            {cat.nombre}
                          </div>
                          <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5" title={cat.descripcion || ""}>
                            {cat.descripcion || "Gasto operacional de tienda"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PASO 1.5: Filtrado Progresivo por los primeros 4 dígitos del puc_sugerido */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  Cuenta PUC Específica (Filtrada por prefijo {pucPrefix4Digitos})
                </label>
                
                <select
                  value={formData.codigoPuc}
                  onChange={(e) => handleSeleccionarPucProgresivo(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-slate-800"
                >
                  {pucCuentasFiltradas.length > 0 ? (
                    pucCuentasFiltradas.map((puc) => (
                      <option key={puc.codigo} value={puc.codigo}>
                        {puc.codigo} - {puc.nombre || ""}
                      </option>
                    ))
                  ) : (
                    <option value={pucPrefix4Digitos}>
                      {pucPrefix4Digitos} - {catActiva.nombre}
                    </option>
                  )}
                </select>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Asignación contable directa: <span className="font-bold text-slate-800">PUC {formData.codigoPuc}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${infoNat.badgeClass}`}>
                    {infoNat.esGastoPyG ? "📉 Afecta Utilidad (P&G)" : "🏢 Solo Flujo de Caja"}
                  </span>
                </div>
              </div>

              {/* PASO 2: Datos Principales del Egreso */}
              <div className="space-y-3 pt-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Datos de Pago
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Monto Total Pagado ($) <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="any"
                      name="totalEgreso"
                      value={formData.totalEgreso}
                      onChange={handleChange}
                      placeholder="Ej: 150000"
                      className="text-base font-bold text-slate-900 border-emerald-300 focus:border-emerald-600 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fecha de Salida <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="date"
                      name="fechaEgreso"
                      value={formData.fechaEgreso}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Descripción del Pago <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Ej: Pago servicio energía local principal..."
                    required
                  />
                </div>

                {/* Proveedor con sugerencias rapidas */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Proveedor o Establecimiento (Opcional)
                    </label>
                    <span className="text-[10px] text-slate-400">Clic para autocompletar</span>
                  </div>
                  <Input
                    type="text"
                    name="proveedor"
                    value={formData.proveedor}
                    onChange={handleChange}
                    placeholder="Ej: Enel Codensa, Claro, Vanti..."
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {PROVEEDORES_FRECUENTES.map((prov) => (
                      <button
                        key={prov}
                        type="button"
                        onClick={() => handleProveedorRapido(prov)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition-colors"
                      >
                        + {prov}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* PASO 3: Opciones Avanzadas (Acordeón para Contadores) */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostrarAvanzado(!mostrarAvanzado)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 hover:text-slate-900 py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-slate-400" />
                    ⚙️ Opciones Contables Adicionales (IVA, NIT, CIIU)
                  </span>
                  {mostrarAvanzado ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {mostrarAvanzado && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Naturaleza Financiera (Derivada del PUC)
                      </label>
                      <div className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white font-bold text-slate-800 flex items-center justify-between shadow-2xs">
                        <span>{infoNat.label}</span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                          Auto (PUC {formData.codigoPuc || "Clase 5"})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          NIT del Proveedor
                        </label>
                        <Input
                          type="text"
                          name="nitEmisor"
                          value={formData.nitEmisor}
                          onChange={handleChange}
                          placeholder="Ej: 860005224-1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Código CIIU (DIAN/ICA)
                        </label>
                        <Input
                          type="text"
                          name="codigoCiiu"
                          value={formData.codigoCiiu}
                          onChange={handleChange}
                          placeholder="Ej: 4711"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Subtotal Sin Impuestos ($)
                        </label>
                        <Input
                          type="number"
                          step="any"
                          name="subtotal"
                          value={formData.subtotal}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Valor del IVA ($)
                        </label>
                        <Input
                          type="number"
                          step="any"
                          name="iva"
                          value={formData.iva}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          name="tieneFactura"
                          checked={formData.tieneFactura}
                          onChange={handleChange}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Tiene Factura Física o Electrónica</span>
                      </label>

                      {formData.tieneFactura && (
                        <Input
                          type="text"
                          name="numeroComprobante"
                          value={formData.numeroComprobante}
                          onChange={handleChange}
                          placeholder="N° de Factura/Comprobante"
                          className="w-48"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Modal Acciones */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAbierto(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {isPending ? "Guardando..." : "Guardar Registro"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
