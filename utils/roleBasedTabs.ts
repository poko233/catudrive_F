// utils/roleBasedTabs.ts
export interface TabDefinition {
  name: string; // nombre de archivo en app/(tabs)
  title: string; // etiqueta visible
  icon: string; // nombre de MaterialCommunityIcons
}

// Tabs visibles para cualquier usuario autenticado, independientemente del rol
const UNIVERSAL_TABS: TabDefinition[] = [
  { name: "venta", title: "Venta", icon: "ticket-outline" },
  { name: "encomiendas", title: "Encomiendas", icon: "cube-outline" },
  { name: "perfil", title: "Perfil", icon: "person-outline" },
];

// Nueva pestaña de Inicio solo para los roles autorizados por el backend.
const DASHBOARD_TAB: TabDefinition = {
  name: "dashboard",
  title: "Inicio",
  icon: "home-outline",
};

const roleTabMap: Record<string, TabDefinition[]> = {
  administrador: [
    { name: "perfil", title: "Perfil", icon: "person-outline" },
    { name: "marcado", title: "Marcado", icon: "create-outline" },
  ],
};

/**
 * Retorna todas las pestañas que corresponden a cualquiera de los roles del usuario.
 * Si el rol no tiene tabs específicos, retorna los tabs universales (ej. perfil).
 * Las pestañas duplicadas (por nombre) se eliminan automáticamente.
 *
 * Mantiene el comportamiento anterior y añade /dashboard a
 * Administrador, Superadmin y Chofer, sin quitar sus tabs existentes.
 */
export function getTabsForRoles(roles: string[]): TabDefinition[] {
  if (!roles || roles.length === 0) return [...UNIVERSAL_TABS];

  const tabsMap = new Map<string, TabDefinition>();
  let hasRoleMatch = false;

  for (const role of roles) {
    const tabsForRole = roleTabMap[role.toLowerCase()];
    if (tabsForRole) {
      hasRoleMatch = true;
      for (const tab of tabsForRole) {
        if (!tabsMap.has(tab.name)) {
          tabsMap.set(tab.name, tab);
        }
      }
    }
  }

  // Rol sin tabs configurados → tabs universales
  const existentes = hasRoleMatch ? Array.from(tabsMap.values()) : [...UNIVERSAL_TABS];

  const puedeVerDashboard = roles.some((rol) =>
    ["administrador", "superadmin", "chofer"].includes(rol.trim().toLowerCase()),
  );

  if (!puedeVerDashboard) return existentes;

  return [DASHBOARD_TAB, ...existentes.filter((tab) => tab.name !== "dashboard")];
}
