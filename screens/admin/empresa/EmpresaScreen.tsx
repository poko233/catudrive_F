// screens/admin/empresa/EmpresaScreen.tsx

import React, {
  useState,
} from "react";

import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Visibility from "@/components/Visibility";

import {
  Badge,
} from "@/components/ui/Badge";

import {
  PageHeader,
} from "@/components/ui/PageHeader";

import {
  TabBar,
} from "@/components/ui/TabBar";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  InformacionEmpresaTab,
} from "./components/InformacionEmpresaTab";

import {
  SucursalesTab,
} from "./components/SucursalesTab";

import {
  useEmpresa,
} from "./hooks/useEmpresa";

type TabKey =
  | "informacion"
  | "sucursales";

const tabs = [
  {
    key:
      "informacion",

    label:
      "Información",
  },

  {
    key:
      "sucursales",

    label:
      "Sucursales",
  },
];

export const EmpresaScreen:
  React.FC = () => {
    const {
      theme,
    } =
      useTheme();

    const c =
      theme.colors;

    const [
      activeTab,
      setActiveTab,
    ] =
      useState<TabKey>(
        "informacion",
      );

    const {
      empresa,

      loading,

      refreshing,

      saving,

      processingImage,

      refrescarEmpresa,

      guardarEmpresa,

      subirImagen,

      eliminarImagen,
    } =
      useEmpresa();

    return (
      <View
        style={[
          styles.screen,

          {
            backgroundColor:
              c.background,
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.content
          }
        >
          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <Visibility
            action="Ver"
            selector=".empresa-header"
          >
            <PageHeader
              badge="Configuración"
              badgeVariant="info"
              title={
                empresa?.empresa ||
                "Empresa"
              }
              description="Administra la información institucional, identidad visual y sucursales."
              rightContent={
                <Badge
                  label={
                    loading
                      ? "Cargando"
                      : refreshing
                        ? "Actualizando"
                        : empresa?.estado ||
                          "Sin estado"
                  }
                  variant={
                    loading ||
                    refreshing
                      ? "warning"
                      : empresa?.estado ===
                          "Activo"
                        ? "success"
                        : "muted"
                  }
                />
              }
            />
          </Visibility>

          {/* ================================================= */}
          {/* TABS */}
          {/* ================================================= */}

          <Visibility
            action="Ver"
            selector=".empresa-tabs"
          >
            <TabBar
              tabs={
                tabs
              }
              activeTab={
                activeTab
              }
              onTabChange={(
                key,
              ) =>
                setActiveTab(
                  key as TabKey,
                )
              }
            />
          </Visibility>

          {/* ================================================= */}
          {/* INFORMACIÓN */}
          {/* ================================================= */}

          {activeTab ===
            "informacion" && (
            <Visibility
              action="Ver"
              selector=".empresa-informacion"
            >
              <InformacionEmpresaTab
                empresa={
                  empresa
                }
                loading={
                  loading
                }
                refreshing={
                  refreshing
                }
                saving={
                  saving
                }
                processingImage={
                  processingImage
                }
                onRefresh={
                  refrescarEmpresa
                }
                onSave={
                  guardarEmpresa
                }
                onUploadImage={
                  subirImagen
                }
                onDeleteImage={
                  eliminarImagen
                }
              />
            </Visibility>
          )}

          {/* ================================================= */}
          {/* SUCURSALES */}
          {/* ================================================= */}

          {activeTab ===
            "sucursales" &&
            empresa && (
              <SucursalesTab
                empresaId={
                  empresa.id
                }
                empresaNombre={
                  empresa.empresa
                }
              />
            )}
        </ScrollView>
      </View>
    );
  };

const styles =
  StyleSheet.create({
    screen: {
      flex:
        1,
    },

    content: {
      width:
        "100%",

      maxWidth:
        1500,

      alignSelf:
        "center",

      padding:
        18,

      gap:
        16,

      flexGrow:
        1,
    },
  });

export default EmpresaScreen;