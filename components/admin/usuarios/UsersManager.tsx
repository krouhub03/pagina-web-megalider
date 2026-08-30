"use client";

import React, { useState, useTransition, useMemo } from "react";
import Image from "next/image";
import {
  Users,
  ShieldCheck,
  Shield,
  UserCheck,
  Search,
  UserPlus,
  UserX,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Mail,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import CreateUserModal from "./CreateUserModal";
import ConfirmModal from "./ConfirmModal";
import {
  UserItem,
  UserRole,
  toggleUserStatusAction,
  updateUserRoleAction,
  deleteUserAction,
} from "@/services/usuarios.service";

interface UsersManagerProps {
  initialUsers: UserItem[];
  currentUserId: number;
  currentUserRole: UserRole;
}

export default function UsersManager({
  initialUsers,
  currentUserId,
  currentUserRole,
}: UsersManagerProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"todos" | "staff" | "clientes">("todos");
  const [roleFilter, setRoleFilter] = useState<string>("TODOS");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Confirm Action state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "danger" | "warning" | "primary";
    confirmText: string;
    actionType: "toggleStatus" | "changeRole" | "delete";
    targetUser?: UserItem;
    newRole?: UserRole;
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "danger",
    confirmText: "Confirmar",
    actionType: "toggleStatus",
  });

  const [isPending, startTransition] = useTransition();

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 1. Filtro por pestaña (Internos vs Externos)
      if (selectedTab === "staff" && user.rol === "CLIENTE") return false;
      if (selectedTab === "clientes" && user.rol !== "CLIENTE") return false;

      // 2. Filtro por rol específico
      if (roleFilter !== "TODOS" && user.rol !== roleFilter) return false;

      // 3. Filtro por estado activo / inactivo
      if (statusFilter === "ACTIVOS" && !user.activo) return false;
      if (statusFilter === "BLOQUEADOS" && user.activo) return false;

      // 4. Búsqueda por texto (nombre, email)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = user.nombre.toLowerCase().includes(query);
        const matchEmail = user.email.toLowerCase().includes(query);
        if (!matchName && !matchEmail) return false;
      }

      return true;
    });
  }, [users, selectedTab, roleFilter, statusFilter, searchQuery]);

  // Recalcular métricas dinámicas
  const stats = useMemo(() => {
    return {
      total: users.length,
      staff: users.filter((u) => u.rol === "SUPERADMIN" || u.rol === "ADMIN").length,
      clientes: users.filter((u) => u.rol === "CLIENTE").length,
      bloqueados: users.filter((u) => !u.activo).length,
    };
  }, [users]);

  // Manejar apertura de confirmación para Bloquear / Activar
  const handlePromptToggleStatus = (user: UserItem) => {
    const isActivating = !user.activo;
    setConfirmModalState({
      isOpen: true,
      title: isActivating ? `Reactivar cuenta de ${user.nombre}` : `Bloquear cuenta de ${user.nombre}`,
      description: isActivating
        ? `¿Confirmas que deseas reactivar el acceso para ${user.email}? Podrá volver a iniciar sesión de inmediato.`
        : `¿Seguro que deseas suspender la cuenta de ${user.email}? El usuario no podrá iniciar sesión ni acceder al sistema mientras esté bloqueado.`,
      variant: isActivating ? "primary" : "warning",
      confirmText: isActivating ? "Reactivar Cuenta" : "Bloquear Cuenta",
      actionType: "toggleStatus",
      targetUser: user,
    });
  };

  // Manejar apertura de confirmación para Cambio de Rol
  const handlePromptChangeRole = (user: UserItem, targetRole: UserRole) => {
    if (user.rol === targetRole) return;
    setConfirmModalState({
      isOpen: true,
      title: `Cambiar rol de ${user.nombre}`,
      description: `Estás a punto de cambiar el rol de ${user.nombre} de ${user.rol} a ${targetRole}. Sus permisos en la plataforma cambiarán inmediatamente.`,
      variant: "primary",
      confirmText: `Asignar rol ${targetRole}`,
      actionType: "changeRole",
      targetUser: user,
      newRole: targetRole,
    });
  };

  // Manejar apertura de confirmación para Eliminar Usuario
  const handlePromptDelete = (user: UserItem) => {
    setConfirmModalState({
      isOpen: true,
      title: `Eliminar usuario ${user.nombre}`,
      description: `Esta acción es irreversible. Se eliminará la cuenta asociada a ${user.email} y todos sus accesos.`,
      variant: "danger",
      confirmText: "Eliminar Permanentemente",
      actionType: "delete",
      targetUser: user,
    });
  };

  // Ejecutar acción confirmada
  const handleConfirmAction = () => {
    const { actionType, targetUser, newRole } = confirmModalState;
    if (!targetUser) return;

    startTransition(async () => {
      if (actionType === "toggleStatus") {
        const nextState = !targetUser.activo;
        const res = await toggleUserStatusAction(targetUser.id, nextState);
        if (res.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === targetUser.id ? { ...u, activo: nextState } : u))
          );
          setFeedback({ type: "success", message: res.message });
        } else {
          setFeedback({ type: "error", message: res.message });
        }
      } else if (actionType === "changeRole" && newRole) {
        const res = await updateUserRoleAction(targetUser.id, newRole);
        if (res.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === targetUser.id ? { ...u, rol: newRole } : u))
          );
          setFeedback({ type: "success", message: res.message });
        } else {
          setFeedback({ type: "error", message: res.message });
        }
      } else if (actionType === "delete") {
        const res = await deleteUserAction(targetUser.id);
        if (res.success) {
          setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
          setFeedback({ type: "success", message: res.message });
        } else {
          setFeedback({ type: "error", message: res.message });
        }
      }

      setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
    });
  };

  return (
    <div className="space-y-6">
      {/* Notificación de feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#038C3E] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:underline opacity-80 hover:opacity-100"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Usuarios */}
        <Card hoverEffect className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Registrados
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {stats.total}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cuentas en MySQL
            </p>
          </div>
          <div className="p-3 bg-[#A7D9BD]/20 text-[#067335] rounded-2xl border border-[#53A677]/30">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        {/* Personal Administrativo (Internos) */}
        <Card hoverEffect className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Personal Interno (Staff)
            </span>
            <div className="text-2xl font-bold text-[#067335] mt-1">
              {stats.staff}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              SUPERADMIN y ADMIN
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-[#067335] rounded-2xl border border-emerald-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </Card>

        {/* Clientes (Externos) */}
        <Card hoverEffect className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Clientes (Externos)
            </span>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {stats.clientes}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Usuarios de la tienda
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <UserCheck className="w-5 h-5" />
          </div>
        </Card>

        {/* Cuentas Bloqueadas */}
        <Card hoverEffect className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Cuentas Bloqueadas
            </span>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              {stats.bloqueados}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Acceso suspendido
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <UserX className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Main Container Card */}
      <Card className="overflow-hidden">
        {/* Navigation Tabs (Todos / Internos / Externos) */}
        <div className="px-6 pt-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-px">
            <button
              onClick={() => setSelectedTab("todos")}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                selectedTab === "todos"
                  ? "bg-[#067335] text-white shadow-sm shadow-[#067335]/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              Todos los Usuarios ({users.length})
            </button>

            <button
              onClick={() => setSelectedTab("staff")}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedTab === "staff"
                  ? "bg-[#067335] text-white shadow-sm shadow-[#067335]/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Personal Administrativo ({stats.staff})
            </button>

            <button
              onClick={() => setSelectedTab("clientes")}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedTab === "clientes"
                  ? "bg-[#067335] text-white shadow-sm shadow-[#067335]/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Clientes Externos ({stats.clientes})
            </button>
          </div>

          {/* Action Button: Nuevo Administrador */}
          <div className="pb-3 sm:pb-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Nuevo Administrador
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="w-full md:max-w-md">
            <Input
              type="text"
              placeholder="Buscar por nombre o correo electrónico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          {/* Select Filters */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter by Rol */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Rol:</span>
              <select
                aria-label="Filtrar por rol de usuario"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#067335]"
              >
                <option value="TODOS">Todos los roles</option>
                <option value="SUPERADMIN">SUPERADMIN</option>
                <option value="ADMIN">ADMIN</option>
                <option value="CLIENTE">CLIENTE (Normal)</option>
              </select>
            </div>

            {/* Filter by Estado */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Estado:</span>
              <select
                aria-label="Filtrar por estado de cuenta"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#067335]"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVOS">Solo Activos</option>
                <option value="BLOQUEADOS">Solo Bloqueados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No se encontraron usuarios</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No hay coincidencias con los filtros aplicados ({searchQuery || selectedTab}). Intenta buscar con otros términos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Tipo de Cuenta</th>
                  <th className="p-4">Rol Asignado</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Fecha de Registro</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const isStaff = user.rol === "SUPERADMIN" || user.rol === "ADMIN";

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Avatar & User Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt={user.nombre}
                              width={36}
                              height={36}
                              className="rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${
                                user.rol === "SUPERADMIN"
                                  ? "bg-[#067335] text-white"
                                  : user.rol === "ADMIN"
                                  ? "bg-blue-600 text-white"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {user.nombre.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {user.nombre}
                              {isSelf && (
                                <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                                  Tú
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tipo de Cuenta (Interno / Externo) */}
                      <td className="p-4">
                        <div className="space-y-1">
                          {isStaff ? (
                            <Badge variant="mint">
                              <ShieldCheck className="w-3 h-3 text-[#067335]" />
                              Staff Interno
                            </Badge>
                          ) : (
                            <Badge variant="amber">
                              <UserCheck className="w-3 h-3 text-amber-600" />
                              Cliente Externo
                            </Badge>
                          )}

                          {/* Login Method */}
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            {user.googleId ? (
                              <span className="text-blue-600 font-medium flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                Google OAuth
                              </span>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-1">
                                <KeyRound className="w-2.5 h-2.5" />
                                Email / Clave
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Rol Asignado (Con selector para SUPERADMIN) */}
                      <td className="p-4">
                        {currentUserRole === "SUPERADMIN" && !isSelf ? (
                          <select
                            aria-label={`Cambiar rol de ${user.nombre}`}
                            value={user.rol}
                            onChange={(e) =>
                              handlePromptChangeRole(user, e.target.value as UserRole)
                            }
                            disabled={isPending}
                            className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-all cursor-pointer ${
                              user.rol === "SUPERADMIN"
                                ? "bg-emerald-50 text-[#067335] border-emerald-300"
                                : user.rol === "ADMIN"
                                ? "bg-blue-50 text-blue-700 border-blue-300"
                                : "bg-amber-50 text-amber-700 border-amber-300"
                            }`}
                          >
                            <option value="CLIENTE">CLIENTE (Normal)</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPERADMIN">SUPERADMIN</option>
                          </select>
                        ) : (
                          <Badge
                            variant={
                              user.rol === "SUPERADMIN"
                                ? "emerald"
                                : user.rol === "ADMIN"
                                ? "blue"
                                : "amber"
                            }
                          >
                            {user.rol === "SUPERADMIN" && <ShieldCheck className="w-3 h-3" />}
                            {user.rol === "ADMIN" && <Shield className="w-3 h-3" />}
                            {user.rol === "CLIENTE" && <UserCheck className="w-3 h-3" />}
                            {user.rol}
                          </Badge>
                        )}
                      </td>

                      {/* Estado (Activo / Bloqueado) */}
                      <td className="p-4">
                        {user.activo ? (
                          <Badge variant="emerald" dot>
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="rose" dot>
                            Bloqueado
                          </Badge>
                        )}
                      </td>

                      {/* Fecha de Registro */}
                      <td className="p-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {formatDate(user.creadoEn)}
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Activar / Bloquear */}
                          <Button
                            variant={user.activo ? "secondary" : "soft"}
                            size="sm"
                            disabled={isSelf || isPending}
                            onClick={() => handlePromptToggleStatus(user)}
                            title={user.activo ? "Bloquear acceso" : "Reactivar acceso"}
                            className={
                              user.activo
                                ? "hover:text-amber-700 hover:border-amber-200"
                                : "text-[#067335]"
                            }
                          >
                            {user.activo ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden lg:inline text-[11px]">
                              {user.activo ? "Bloquear" : "Activar"}
                            </span>
                          </Button>

                          {/* Eliminar (Solo SUPERADMIN y no a sí mismo) */}
                          {currentUserRole === "SUPERADMIN" && (
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={isSelf || isPending}
                              onClick={() => handlePromptDelete(user)}
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Creación de Administrador */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUserRole={currentUserRole}
        onSuccess={(msg) => {
          setFeedback({ type: "success", message: msg });
        }}
      />

      {/* Modal de Confirmación Genérico */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        description={confirmModalState.description}
        variant={confirmModalState.variant}
        confirmText={confirmModalState.confirmText}
        isLoading={isPending}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
