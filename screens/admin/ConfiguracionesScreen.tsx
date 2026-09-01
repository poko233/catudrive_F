import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import { FormularioModuloAdminScreen } from "./assignments/FormularioModuloAdminScreen";
import { ModuloRolAdminScreen } from "./assignments/ModuloRolAdminScreen";
import { AdminTabBar, AdminTabKey } from "./components/AdminTabBar";
import { FormulariosAdminScreen } from "./forms/FormulariosAdminScreen";
import { ModulosScreen } from "./modulos/Modulosscreen";
import { PermisosScreen } from "./permissions/PermisosScreen";
import RolScreen from "./rol/RolScreen";
import { RolPermisosScreen } from "./rol/components/RolPermisosScreen";
import { Rol } from "./rol/types/rol.types";
import { EmpresaScreen } from "./empresa/EmpresaScreen";

export function ConfiguracionesScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [activeTab, setActiveTab] = useState<AdminTabKey>("permisos");

  // Cuando se selecciona un rol para editar permisos, se muestra RolPermisosScreen
  const [rolForPermisos, setRolForPermisos] = useState<Rol | null>(null);

  const tabs = useMemo(
    () => [
      { key: "empresa" as const, label: "Empresa" },
      { key: "permisos" as const, label: "Permisos" },
      { key: "roles" as const, label: "Roles" },
      { key: "modulos" as const, label: "Módulos" },
      { key: "formularios" as const, label: "Formularios" },
      { key: "formularioModulo" as const, label: "Form → Módulo" },
      { key: "moduloRol" as const, label: "Módulo → Rol" },
    ],
    [],
  );

  const handleChangeTab = (tab: AdminTabKey) => {
    setRolForPermisos(null); // limpiar sub-vista al cambiar de tab
    setActiveTab(tab);
  };

  const handleOpenPermisos = (rol: Rol) => {
    setActiveTab("roles");
    setRolForPermisos(rol);
  };

  const handleBackFromPermisos = () => {
    setRolForPermisos(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Sólo se muestra el header principal cuando no estamos en RolPermisosScreen */}
      {!rolForPermisos && (
        <View
          style={[
            styles.header,
            { backgroundColor: c.card, borderBottomColor: c.border },
          ]}
        >
          <Text style={[styles.title, { color: c.text }]}>Configuraciones</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Administración centralizada de roles, módulos, formularios y asignaciones
          </Text>
        </View>
      )}

      {!rolForPermisos && (
        <AdminTabBar
          tabs={tabs}
          activeTab={activeTab}
          onChangeTab={handleChangeTab}
        />
      )}

      <View style={styles.content}>
        {/* Sub-vista: Permisos de un rol específico */}
        {rolForPermisos ? (
          <RolPermisosScreen
            rol={rolForPermisos}
            onBack={handleBackFromPermisos}
          />
        ) : (
          <>
            {activeTab === "empresa" && <EmpresaScreen />}
            {activeTab === "permisos" && <PermisosScreen />}
            {activeTab === "roles" && (
              <RolScreen onPermisos={handleOpenPermisos} />
            )}
            {activeTab === "modulos" && <ModulosScreen />}
            {activeTab === "formularios" && <FormulariosAdminScreen />}
            {activeTab === "formularioModulo" && <FormularioModuloAdminScreen />}
            {activeTab === "moduloRol" && <ModuloRolAdminScreen />}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
});
