
export type Estado = "Activo" | "Inactivo";

export interface Modulo {
  id: number;

  modulo: string;

  descripcion?: string | null;

  icono?: string | null;

  orden: number;

  estado: Estado;

  formularios?: Formulario[];

  created_at?: string | null;

  updated_at?: string | null;
}

export interface Formulario {
  id: number;
  formulario: string;
  descripcion: string | null;
  ruta: string | null;
  estado?: Estado;
}

export interface CreateModuloPayload {
  modulo: string;
  descripcion?: string;
  icono?: string;
  estado: Estado;
  formularios?: number[];
}

export type UpdateModuloPayload = CreateModuloPayload;

export interface IconOption {
  key: string;
  ionicon: string;
  category: IconCategory;
}

export type IconCategory =
  | "Académico"
  | "Personas"
  | "Administración"
  | "Sistema"
  | "Seguridad"
  | "Finanzas"
  | "Tiempo"
  | "Comunicación"
  | "Ubicación"
  | "General";

export const ICON_CATEGORIES: IconCategory[] = [
  "Académico", "Personas", "Administración", "Sistema",
  "Seguridad", "Finanzas", "Tiempo", "Comunicación", "Ubicación", "General",
];

export const AVAILABLE_ICONS: IconOption[] = [
  { key: "school",          ionicon: "school-outline",           category: "Académico" },
  { key: "book",            ionicon: "book-outline",             category: "Académico" },
  { key: "library",         ionicon: "library-outline",          category: "Académico" },
  { key: "journal",         ionicon: "journal-outline",          category: "Académico" },
  { key: "pencil",          ionicon: "pencil-outline",           category: "Académico" },
  { key: "clipboard",       ionicon: "clipboard-outline",        category: "Académico" },
  { key: "reader",          ionicon: "reader-outline",           category: "Académico" },
  { key: "newspaper",       ionicon: "newspaper-outline",        category: "Académico" },
  { key: "bookmarks",       ionicon: "bookmarks-outline",        category: "Académico" },
  { key: "ribbon",          ionicon: "ribbon-outline",           category: "Académico" },
  { key: "trophy",          ionicon: "trophy-outline",           category: "Académico" },
  { key: "medal",           ionicon: "medal-outline",            category: "Académico" },
  { key: "flask",           ionicon: "flask-outline",            category: "Académico" },
  { key: "telescope",       ionicon: "telescope-outline",        category: "Académico" },
  { key: "compass",         ionicon: "compass-outline",          category: "Académico" },
  { key: "language",        ionicon: "language-outline",         category: "Académico" },
  { key: "color-palette",   ionicon: "color-palette-outline",    category: "Académico" },
  { key: "brush",           ionicon: "brush-outline",            category: "Académico" },
  { key: "musical-notes",   ionicon: "musical-notes-outline",    category: "Académico" },
  { key: "mic",             ionicon: "mic-outline",              category: "Académico" },
  { key: "calculator",      ionicon: "calculator-outline",       category: "Académico" },
  { key: "prism",           ionicon: "prism-outline",            category: "Académico" },
  { key: "infinite",        ionicon: "infinite-outline",         category: "Académico" },
  { key: "eye",             ionicon: "eye-outline",              category: "Académico" },

  // ── Personas ──
  { key: "person",          ionicon: "person-outline",           category: "Personas" },
  { key: "people",          ionicon: "people-outline",           category: "Personas" },
  { key: "person-add",      ionicon: "person-add-outline",       category: "Personas" },
  { key: "person-circle",   ionicon: "person-circle-outline",    category: "Personas" },
  { key: "body",            ionicon: "body-outline",             category: "Personas" },
  { key: "accessibility",   ionicon: "accessibility-outline",    category: "Personas" },
  { key: "id-card",         ionicon: "id-card-outline",          category: "Personas" },
  { key: "happy",           ionicon: "happy-outline",            category: "Personas" },

  // ── Administración ──
  { key: "document",        ionicon: "document-outline",         category: "Administración" },
  { key: "document-text",   ionicon: "document-text-outline",    category: "Administración" },
  { key: "documents",       ionicon: "documents-outline",        category: "Administración" },
  { key: "folder",          ionicon: "folder-outline",           category: "Administración" },
  { key: "folder-open",     ionicon: "folder-open-outline",      category: "Administración" },
  { key: "archive",         ionicon: "archive-outline",          category: "Administración" },
  { key: "filing",          ionicon: "filing-outline",           category: "Administración" },
  { key: "duplicate",       ionicon: "duplicate-outline",        category: "Administración" },
  { key: "list",            ionicon: "list-outline",             category: "Administración" },
  { key: "layers",          ionicon: "layers-outline",           category: "Administración" },
  { key: "grid",            ionicon: "grid-outline",             category: "Administración" },
  { key: "apps",            ionicon: "apps-outline",             category: "Administración" },
  { key: "cube",            ionicon: "cube-outline",             category: "Administración" },
  { key: "extension-puzzle",ionicon: "extension-puzzle-outline", category: "Administración" },
  { key: "print",           ionicon: "print-outline",            category: "Administración" },
  { key: "scan",            ionicon: "scan-outline",             category: "Administración" },
  { key: "qr-code",         ionicon: "qr-code-outline",          category: "Administración" },

  // ── Sistema ──
  { key: "settings",        ionicon: "settings-outline",         category: "Sistema" },
  { key: "cog",             ionicon: "cog-outline",              category: "Sistema" },
  { key: "build",           ionicon: "build-outline",            category: "Sistema" },
  { key: "hammer",          ionicon: "hammer-outline",           category: "Sistema" },
  { key: "construct",       ionicon: "construct-outline",        category: "Sistema" },
  { key: "options",         ionicon: "options-outline",          category: "Sistema" },
  { key: "hardware-chip",   ionicon: "hardware-chip-outline",    category: "Sistema" },
  { key: "server",          ionicon: "server-outline",           category: "Sistema" },
  { key: "terminal",        ionicon: "terminal-outline",         category: "Sistema" },
  { key: "code-slash",      ionicon: "code-slash-outline",       category: "Sistema" },
  { key: "laptop",          ionicon: "laptop-outline",           category: "Sistema" },
  { key: "desktop",         ionicon: "desktop-outline",          category: "Sistema" },
  { key: "phone-portrait",  ionicon: "phone-portrait-outline",   category: "Sistema" },
  { key: "wifi",            ionicon: "wifi-outline",             category: "Sistema" },
  { key: "cloud",           ionicon: "cloud-outline",            category: "Sistema" },
  { key: "cloud-upload",    ionicon: "cloud-upload-outline",     category: "Sistema" },

  // ── Seguridad ──
  { key: "shield",          ionicon: "shield-outline",           category: "Seguridad" },
  { key: "shield-checkmark",ionicon: "shield-checkmark-outline", category: "Seguridad" },
  { key: "lock-closed",     ionicon: "lock-closed-outline",      category: "Seguridad" },
  { key: "lock-open",       ionicon: "lock-open-outline",        category: "Seguridad" },
  { key: "key",             ionicon: "key-outline",              category: "Seguridad" },
  { key: "finger-print",    ionicon: "finger-print-outline",     category: "Seguridad" },
  { key: "alert-circle",    ionicon: "alert-circle-outline",     category: "Seguridad" },
  { key: "warning",         ionicon: "warning-outline",          category: "Seguridad" },
  { key: "information-circle", ionicon: "information-circle-outline", category: "Seguridad" },
  { key: "checkmark-circle",ionicon: "checkmark-circle-outline", category: "Seguridad" },

  // ── Finanzas ──
  { key: "wallet",          ionicon: "wallet-outline",           category: "Finanzas" },
  { key: "cash",            ionicon: "cash-outline",             category: "Finanzas" },
  { key: "card",            ionicon: "card-outline",             category: "Finanzas" },
  { key: "pricetag",        ionicon: "pricetag-outline",         category: "Finanzas" },
  { key: "pricetags",       ionicon: "pricetags-outline",        category: "Finanzas" },
  { key: "bar-chart",       ionicon: "bar-chart-outline",        category: "Finanzas" },
  { key: "trending-up",     ionicon: "trending-up-outline",      category: "Finanzas" },
  { key: "pie-chart",       ionicon: "pie-chart-outline",        category: "Finanzas" },
  { key: "analytics",       ionicon: "analytics-outline",        category: "Finanzas" },

  // ── Tiempo ──
  { key: "calendar",        ionicon: "calendar-outline",         category: "Tiempo" },
  { key: "calendar-number", ionicon: "calendar-number-outline",  category: "Tiempo" },
  { key: "calendar-clear",  ionicon: "calendar-clear-outline",   category: "Tiempo" },
  { key: "time",            ionicon: "time-outline",             category: "Tiempo" },
  { key: "alarm",           ionicon: "alarm-outline",            category: "Tiempo" },
  { key: "hourglass",       ionicon: "hourglass-outline",        category: "Tiempo" },
  { key: "stopwatch",       ionicon: "stopwatch-outline",        category: "Tiempo" },
  { key: "timer",           ionicon: "timer-outline",            category: "Tiempo" },

  // ── Comunicación ──
  { key: "mail",            ionicon: "mail-outline",             category: "Comunicación" },
  { key: "mail-open",       ionicon: "mail-open-outline",        category: "Comunicación" },
  { key: "notifications",   ionicon: "notifications-outline",    category: "Comunicación" },
  { key: "chatbubble",      ionicon: "chatbubble-outline",       category: "Comunicación" },
  { key: "chatbubbles",     ionicon: "chatbubbles-outline",      category: "Comunicación" },
  { key: "megaphone",       ionicon: "megaphone-outline",        category: "Comunicación" },
  { key: "send",            ionicon: "send-outline",             category: "Comunicación" },
  { key: "call",            ionicon: "call-outline",             category: "Comunicación" },
  { key: "at",              ionicon: "at-outline",               category: "Comunicación" },
  { key: "paper-plane",     ionicon: "paper-plane-outline",      category: "Comunicación" },

  // ── Ubicación ──
  { key: "home",            ionicon: "home-outline",             category: "Ubicación" },
  { key: "business",        ionicon: "business-outline",         category: "Ubicación" },
  { key: "storefront",      ionicon: "storefront-outline",       category: "Ubicación" },
  { key: "location",        ionicon: "location-outline",         category: "Ubicación" },
  { key: "navigate",        ionicon: "navigate-outline",         category: "Ubicación" },
  { key: "map",             ionicon: "map-outline",              category: "Ubicación" },
  { key: "globe",           ionicon: "globe-outline",            category: "Ubicación" },
  { key: "earth",           ionicon: "earth-outline",            category: "Ubicación" },
  { key: "car",             ionicon: "car-outline",              category: "Ubicación" },
  { key: "bus",             ionicon: "bus-outline",              category: "Ubicación" },
  { key: "walk",            ionicon: "walk-outline",             category: "Ubicación" },
  { key: "cafe",            ionicon: "cafe-outline",             category: "Ubicación" },
  { key: "restaurant",      ionicon: "restaurant-outline",       category: "Ubicación" },

  // ── General ──
  { key: "star",            ionicon: "star-outline",             category: "General" },
  { key: "heart",           ionicon: "heart-outline",            category: "General" },
  { key: "thumbs-up",       ionicon: "thumbs-up-outline",        category: "General" },
  { key: "flag",            ionicon: "flag-outline",             category: "General" },
  { key: "bookmark",        ionicon: "bookmark-outline",         category: "General" },
  { key: "tag",             ionicon: "tag-outline",              category: "General" },
  { key: "share",           ionicon: "share-outline",            category: "General" },
  { key: "download",        ionicon: "download-outline",         category: "General" },
  { key: "image",           ionicon: "image-outline",            category: "General" },
  { key: "camera",          ionicon: "camera-outline",           category: "General" },
  { key: "search",          ionicon: "search-outline",           category: "General" },
  { key: "filter",          ionicon: "filter-outline",           category: "General" },
  { key: "trash",           ionicon: "trash-outline",            category: "General" },
  { key: "refresh",         ionicon: "refresh-outline",          category: "General" },
  { key: "add-circle",      ionicon: "add-circle-outline",       category: "General" },
  { key: "cart",            ionicon: "cart-outline",             category: "General" },
  { key: "fitness",         ionicon: "fitness-outline",          category: "General" },
  { key: "pulse",           ionicon: "pulse-outline",            category: "General" },
  { key: "medical",         ionicon: "medical-outline",          category: "General" },
];

export function getIonicon(key: string): string {
  return AVAILABLE_ICONS.find((i) => i.key === key)?.ionicon ?? "apps-outline";
}

export function getIconsByCategory(cat: IconCategory): IconOption[] {
  return AVAILABLE_ICONS.filter((i) => i.category === cat);
}

export interface ReordenarModulosPayload {
  modulo_ids: number[];
}