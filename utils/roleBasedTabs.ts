// utils/roleBasedTabs.ts
export interface TabDefinition {
  name: string; // nombre de archivo en app/(tabs)
  title: string; // etiqueta visible
  icon: string; // nombre de MaterialCommunityIcons
}

// Tabs visibles para cualquier usuario autenticado, independientemente del rol
const UNIVERSAL_TABS: TabDefinition[] = [
  { name: "perfil", title: "Perfil", icon: "person-outline" },
];

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
  if (!hasRoleMatch) return [...UNIVERSAL_TABS];

  return Array.from(tabsMap.values());
}
