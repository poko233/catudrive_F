// screens/admin/empresa/components/SucursalesTab.tsx

import React, { useState } from "react";

import { StyleSheet, View } from "react-native";

import {
  Building2,
  KeyRound, // NEW
  Pencil,
  Plus,
  Power,
  RefreshCw,
} from "lucide-react-native";

// NEW
import { useEmpresaStore } from "@/store/empresaStore";
import { SucursalApiTokenModal } from "./SucursalApiTokenModal";

import { Table, TableColumn } from "@/components/Table";

import { ThemedText } from "@/components/ThemedText";

import Visibility from "@/components/Visibility";

import { Badge } from "@/components/ui/Badge";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { EmptyState } from "@/components/ui/EmptyState";

import { IconButton } from "@/components/ui/IconButton";

import { Pagination } from "@/components/ui/Pagination";

import { SearchBar } from "@/components/ui/SearchBar";

import { useConfirm } from "@/hooks/useConfirm";

import { useTheme } from "@/theme/useTheme";

import { useSucursales } from "../hooks/useSucursales";

import { Sucursal, SucursalFormData } from "../types/sucursal.types";

import { SucursalFormModal } from "./SucursalFormModal";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface Props {
  empresaId: number;

  empresaNombre?: string;
}

/*
|--------------------------------------------------------------------------
| COLUMNAS
|--------------------------------------------------------------------------
*/

const COL = {
  sucursal: 1.8,

  responsable: 1.5,

  contacto: 1.7,

  direccion: 2,

  estado: 0.9,

  acciones: 0.8,
};

const columns: TableColumn[] = [
  {
    key: "sucursal",

    label: "SUCURSAL",

    style: {
      flex: COL.sucursal,

      minWidth: 0,
    },
  },

  {
    key: "responsable",

    label: "RESPONSABLE",

    style: {
      flex: COL.responsable,

      minWidth: 0,
    },
  },

  {
    key: "contacto",

    label: "CONTACTO",

    style: {
      flex: COL.contacto,

      minWidth: 0,
    },
  },

  {
    key: "direccion",

    label: "DIRECCIÓN",

    style: {
      flex: COL.direccion,

      minWidth: 0,
    },
  },

  {
    key: "estado",

    label: "ESTADO",

    style: {
      flex: COL.estado,

      minWidth: 0,
    },
  },

  {
    key: "acciones",

    label: "ACCIONES",

    style: {
      flex: COL.acciones,

      minWidth: 0,
    },
  },
];

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function SucursalesTab({
  empresaId,

  empresaNombre,
}: Props) {
  const { theme } = useTheme();

  const c = theme.colors;

  const confirm = useConfirm();

  const {
    sucursales,

    total,

    page,

    totalPages,

    perPage,

    search,

    loading,

    refreshing,

    saving,

    changingStatusId,

    setSearch,

    setPage,

    refrescar,

    guardar,

    cambiarEstado,
  } = useSucursales(empresaId);

  /*
  |--------------------------------------------------------------------------
  | MODAL
  |--------------------------------------------------------------------------
  */

  const [modalVisible, setModalVisible] = useState(false);

  const [selected, setSelected] = useState<Sucursal | null>(null);

  /*
  |--------------------------------------------------------------------------
  | CREATE
  |--------------------------------------------------------------------------
  */

  const openCreate = () => {
    setSelected(null);

    setModalVisible(true);
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const openEdit = (sucursal: Sucursal) => {
    setSelected(sucursal);

    setModalVisible(true);
  };

  /*
  |--------------------------------------------------------------------------
  | CLOSE
  |--------------------------------------------------------------------------
  */

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalVisible(false);

    setSelected(null);
  };

  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  const save = async (form: SucursalFormData) => {
    return guardar(form, selected);
  };

  /*
  |--------------------------------------------------------------------------
  | TOGGLE
  |--------------------------------------------------------------------------
  */

  const toggleEstado = async (sucursal: Sucursal) => {
    const activar = sucursal.estado !== "Activo";

    const ok = await confirm({
      title: activar ? "Activar sucursal" : "Desactivar sucursal",

      message: activar
        ? `¿Quieres activar "${sucursal.sucursal}"?`
        : `¿Quieres desactivar "${sucursal.sucursal}"?`,

      variant: activar ? "success" : "warning",

      confirmText: activar ? "Activar" : "Desactivar",
    });

    if (!ok) {
      return;
    }

    await cambiarEstado(sucursal);
  };
  const tokensLoaded = useEmpresaStore((s) => s.tokensLoaded);
  const sucursalesConToken = useEmpresaStore((s) => s.sucursalesConToken);

  // NEW: modal de token
  const [tokenModalSucursal, setTokenModalSucursal] = useState<Sucursal | null>(
    null,
  );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <Card padding={0} style={styles.card}>
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <View
          style={[
            styles.header,

            {
              borderBottomColor: c.border,
            },
          ]}
        >
          <View style={styles.headerCopy}>
            <View style={styles.titleRow}>
              <View
                style={[
                  styles.titleIcon,

                  {
                    backgroundColor: c.primarySubtle,
                  },
                ]}
              >
                <Building2 size={20} color={c.primary} />
              </View>

              <View style={styles.titleCopy}>
                <ThemedText style={styles.title}>Sucursales</ThemedText>

                <ThemedText
                  style={[
                    styles.subtitle,

                    {
                      color: c.textSecondary,
                    },
                  ]}
                >
                  {empresaNombre
                    ? `Sucursales de ${empresaNombre}`
                    : "Administra las sucursales de la empresa."}
                </ThemedText>
              </View>
            </View>

            <Badge
              label={`${total} sucursal${total === 1 ? "" : "es"}`}
              variant="muted"
            />
          </View>

          <View style={styles.headerActions}>
            <IconButton
              icon={RefreshCw}
              variant="secondary"
              disabled={refreshing || loading}
              accessibilityLabel="Actualizar sucursales"
              onPress={() => {
                void refrescar();
              }}
            />

            <Visibility action="Crear" selector=".sucursales-crear">
              <Button
                title="Nueva sucursal"
                disabled={saving}
                onPress={openCreate}
              />
            </Visibility>
          </View>
        </View>

        {/* ================================================= */}
        {/* SEARCH */}
        {/* ================================================= */}

        <Visibility action="Ver" selector=".sucursales-buscador">
          <View style={styles.search}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por sucursal, responsable o contacto..."
            />
          </View>
        </Visibility>

        {/* ================================================= */}
        {/* EMPTY / TABLE */}
        {/* ================================================= */}

        {!loading && sucursales.length === 0 ? (
          <View style={styles.empty}>
            <EmptyState
              icon="business-outline"
              title={
                search ? "No se encontraron sucursales" : "No hay sucursales"
              }
              subtitle={
                search
                  ? "Prueba con otro término de búsqueda."
                  : "Crea la primera sucursal para comenzar."
              }
            />
          </View>
        ) : (
          <View style={styles.table}>
            <Table<Sucursal>
              data={sucursales}
              columns={columns}
              loading={loading}
              emptyMessage="No hay sucursales."
              keyExtractor={(item) => String(item.id)}
              renderRow={(item) => {
                const tokenMeta = sucursalesConToken[item.id];
                const hasToken = !!tokenMeta?.hasToken;

                return (
                  <View style={[styles.row, { borderBottomColor: c.border }]}>
                    {/* SUCURSAL con dot de estado del token */}
                    <Cell
                      flex={COL.sucursal}
                      primary={item.sucursal}
                      secondary={`ID #${item.id}`}
                      trailing={
                        tokensLoaded ? (
                          <View
                            style={[
                              styles.tokenDot,
                              {
                                backgroundColor: hasToken
                                  ? c.success
                                  : c.textMuted,
                              },
                            ]}
                            accessible
                            accessibilityLabel={
                              hasToken ? "Token configurado" : "Sin token"
                            }
                          />
                        ) : undefined
                      }
                    />

                    {/* RESPONSABLE */}

                    <Cell
                      flex={COL.responsable}
                      primary={item.responsable || "Sin responsable"}
                    />

                    {/* CONTACTO */}

                    <Cell
                      flex={COL.contacto}
                      primary={item.email || "Sin correo"}
                      secondary={
                        item.celular || item.telefono || "Sin teléfono"
                      }
                    />

                    {/* DIRECCION */}

                    <Cell
                      flex={COL.direccion}
                      primary={item.direccion || "Sin dirección"}
                    />

                    {/* ESTADO */}

                    <View
                      style={[
                        styles.cell,

                        styles.center,

                        {
                          flex: COL.estado,
                        },
                      ]}
                    >
                      <Badge
                        label={item.estado}
                        variant={item.estado === "Activo" ? "success" : "muted"}
                        dot
                      />
                    </View>

                    {/* ACTIONS */}

                    <View
                      style={[
                        styles.cell,
                        styles.actions,
                        { flex: COL.acciones },
                      ]}
                    >
                      <Visibility action="Editar" selector=".sucursales-token">
                        <IconButton
                          icon={KeyRound}
                          size="sm"
                          variant={hasToken ? "primary" : "secondary"}
                          accessibilityLabel={`Configurar token de ${item.sucursal}`}
                          onPress={() => setTokenModalSucursal(item)}
                        />
                      </Visibility>

                      <Visibility action="Editar" selector=".sucursales-editar">
                        <IconButton
                          icon={Pencil}
                          size="sm"
                          variant="secondary"
                          accessibilityLabel={`Editar ${item.sucursal}`}
                          onPress={() => openEdit(item)}
                        />
                      </Visibility>

                      <Visibility action="Editar" selector=".sucursales-estado">
                        <IconButton
                          icon={Power}
                          size="sm"
                          variant={
                            item.estado === "Activo"
                              ? "destructive"
                              : "secondary"
                          }
                          loading={changingStatusId === item.id}
                          disabled={changingStatusId !== null}
                          accessibilityLabel={
                            item.estado === "Activo"
                              ? `Desactivar ${item.sucursal}`
                              : `Activar ${item.sucursal}`
                          }
                          onPress={() => void toggleEstado(item)}
                        />
                      </Visibility>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        )}

        {/* ================================================= */}
        {/* PAGINATION */}
        {/* ================================================= */}

        {total > 0 ? (
          <View
            style={[
              styles.pagination,

              {
                borderTopColor: c.border,
              },
            ]}
          >
            <Pagination
              meta={{
                total,

                page,

                perPage,
              }}
              itemLabel="sucursales"
              onPageChange={setPage}
            />
          </View>
        ) : null}
      </Card>

      {/* ================================================= */}
      {/* MODAL */}
      {/* ================================================= */}

      <SucursalFormModal
        visible={modalVisible}
        sucursal={selected}
        empresaId={empresaId}
        saving={saving}
        onClose={closeModal}
        onSubmit={save}
      />
      {/* NEW: modal de token */}
      {tokenModalSucursal && (
        <SucursalApiTokenModal
          visible
          sucursalId={tokenModalSucursal.id}
          sucursalNombre={tokenModalSucursal.sucursal}
          onClose={() => setTokenModalSucursal(null)}
        />
      )}
    </>
  );
}

/*
|--------------------------------------------------------------------------
| CELL (con trailing opcional)
|--------------------------------------------------------------------------
*/

function Cell({
  flex,
  primary,
  secondary,
  trailing,
}: {
  flex: number;
  primary: string;
  secondary?: string;
  trailing?: React.ReactNode;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.cell, { flex }]}>
      <View style={styles.primaryRow}>
        <ThemedText
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.primary}
        >
          {primary}
        </ThemedText>
        {trailing}
      </View>

      {!!secondary && (
        <ThemedText
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.secondary, { color: c.textSecondary }]}
        >
          {secondary}
        </ThemedText>
      )}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  card: {
    width: "100%",

    overflow: "hidden",
  },

  /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

  header: {
    padding: 16,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    flexWrap: "wrap",

    gap: 14,

    borderBottomWidth: 1,
  },

  headerCopy: {
    flex: 1,

    minWidth: 260,

    gap: 10,
  },

  titleRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 10,
  },

  titleIcon: {
    width: 42,

    height: 42,

    borderRadius: 12,

    alignItems: "center",

    justifyContent: "center",
  },

  titleCopy: {
    flex: 1,

    minWidth: 0,
  },

  title: {
    fontSize: 19,

    fontWeight: "900",
  },

  subtitle: {
    marginTop: 2,

    fontSize: 11,

    lineHeight: 16,
  },

  headerActions: {
    flexDirection: "row",

    alignItems: "center",

    gap: 8,
  },

  /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

  search: {
    padding: 14,
  },

  /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

  table: {
    width: "100%",

    height: 620,
  },

  row: {
    width: "100%",

    minHeight: 68,

    flexDirection: "row",

    borderBottomWidth: 1,
  },

  cell: {
    minWidth: 0,

    minHeight: 68,

    paddingHorizontal: 9,

    justifyContent: "center",

    gap: 2,
  },

  center: {
    alignItems: "center",
  },

  actions: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 6,
  },

  primary: {
    fontSize: 12,

    fontWeight: "700",

    lineHeight: 17,
  },

  secondary: {
    fontSize: 10,

    lineHeight: 14,
  },

  /*
    |--------------------------------------------------------------------------
    | EMPTY
    |--------------------------------------------------------------------------
    */

  empty: {
    minHeight: 300,
  },

  /*
    |--------------------------------------------------------------------------
    | PAGINATION
    |--------------------------------------------------------------------------
    */

  pagination: {
    borderTopWidth: 1,
  },
  primaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tokenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
});

export default SucursalesTab;
