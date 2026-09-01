import { Ionicons } from "@expo/vector-icons";

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  "ti-cart":          "cart-outline",
  "ti-home":          "home-outline",
  "ti-settings":      "settings-outline",
  "ti-user":          "person-outline",
  "ti-users":         "people-outline",
  "ti-chart-bar":     "bar-chart-outline",
  "ti-report":        "document-text-outline",
  "ti-file":          "document-outline",
  "ti-folder":        "folder-outline",
  "ti-bell":          "notifications-outline",
  "ti-lock":          "lock-closed-outline",
  "ti-shield":        "shield-outline",
  "ti-building":      "business-outline",
  "ti-package":       "cube-outline",
  "ti-truck":         "car-outline",
  "ti-cash":          "cash-outline",
  "ti-calculator":    "calculator-outline",
  "ti-calendar":      "calendar-outline",
  "ti-mail":          "mail-outline",
  "ti-search":        "search-outline",
  "ti-tools":         "construct-outline",
  "ti-database":      "server-outline",
  "ti-logout":        "log-out-outline",
  "ti-dashboard":     "grid-outline",

  "car":              "car-outline",
  "home":             "home-outline",
  "settings":         "settings-outline",
  "user":             "person-outline",
  "users":            "people-outline",
  "chart":            "bar-chart-outline",
  "report":           "document-text-outline",
  "file":             "document-outline",
  "folder":           "folder-outline",
  "bell":             "notifications-outline",
  "lock":             "lock-closed-outline",
  "shield":           "shield-outline",
  "building":         "business-outline",
  "package":          "cube-outline",
  "truck":            "car-outline",
  "cash":             "cash-outline",
  "calendar":         "calendar-outline",
  "mail":             "mail-outline",
  "search":           "search-outline",
  "tools":            "construct-outline",
  "database":         "server-outline",
  "grid":             "grid-outline",
  "configuracion":    "settings-outline",
  "recursos humanos": "people-outline",
  "rrhh":             "people-outline",
  "ventas":           "cart-outline",
  "compras":          "bag-outline",
  "contabilidad":     "calculator-outline",
  "finanzas":         "cash-outline",
  "almacen":          "cube-outline",
  "inventario":       "layers-outline",
};

const DEFAULT_ICON: keyof typeof Ionicons.glyphMap = "grid-outline";

export function resolveIcon(iconKey: string): keyof typeof Ionicons.glyphMap {
  if (!iconKey) return DEFAULT_ICON;
  const key = iconKey.toLowerCase().trim();
  return ICON_MAP[key] ?? DEFAULT_ICON;
}