// app/componentes.tsx

/*
|--------------------------------------------------------------------------
| COMPONENTES GENERALES
|--------------------------------------------------------------------------
*/

import { CustomToast } from "@/components/CustomToast";

import {
  DocumentUploadModal,
  DocumentUploadResult,
} from "@/components/DocumentUploadModal";

import {
  FilterGroup,
  FiltersBar,
} from "@/components/FiltersBar";

import {
  ImageUploadModal,
  ImageUploadResult,
} from "@/components/ImageUploadModal";

import {
  Table,
  TableColumn,
} from "@/components/Table";

import { ThemedText } from "@/components/ThemedText";
import { Tooltip } from "@/components/Tooltip";
import Visibility from "@/components/Visibility";

/*
|--------------------------------------------------------------------------
| UI
|--------------------------------------------------------------------------
*/

import { AnimatedBlock } from "@/components/ui/AnimatedBlock";
import { AnimatedExitBlock } from "@/components/ui/AnimatedExitBlock";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";

import {
  DatePicker,
  DatePickerMode,
  DatePickerResult,
} from "@/components/ui/DatePicker";

import { Divider } from "@/components/ui/Divider";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { PressableAnimated } from "@/components/ui/PressableAnimated";
import { ProfilePhotoState } from "@/components/ui/ProfilePhotoState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QrState } from "@/components/ui/QrState";
import { SearchBar } from "@/components/ui/SearchBar";

import {
  Select,
  SelectOption,
} from "@/components/ui/Select";

import { Shimmer } from "@/components/ui/Shimmer";

import {
  Skeleton,
  SkeletonRolCard,
} from "@/components/ui/Skeleton";

import { Switch } from "@/components/ui/Switch";
import { TabBar } from "@/components/ui/TabBar";

/*
|--------------------------------------------------------------------------
| THEME
|--------------------------------------------------------------------------
*/

import { useTheme } from "@/theme/useTheme";

/*
|--------------------------------------------------------------------------
| ICONOS
|--------------------------------------------------------------------------
*/

import {
  Bell,
  Boxes,
  CalendarDays,
  Download,
  Eye,
  FileText,
  FileUp,
  Filter,
  ImagePlus,
  LayoutDashboard,
  Menu,
  Paintbrush,
  Pencil,
  RefreshCw,
  Shield,
  Smartphone,
  Table2,
  Trash2,
} from "lucide-react-native";

/*
|--------------------------------------------------------------------------
| LIBRERÍAS
|--------------------------------------------------------------------------
*/

import { AnimatePresence } from "moti";

import React, {
  useState,
} from "react";

import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

type UsuarioDemo = {
  id: number;

  nombre: string;

  correo: string;

  estado:
    | "ACTIVO"
    | "INACTIVO";
};

type FiltroEstado =
  | "todos"
  | "activos"
  | "inactivos";

type SystemComponentType =
  | "visual"
  | "layout"
  | "security"
  | "provider"
  | "utility";

/*
|--------------------------------------------------------------------------
| DATOS DE EJEMPLO
|--------------------------------------------------------------------------
*/

const usuariosDemo: UsuarioDemo[] = [
  {
    id: 1,
    nombre: "Juan Pérez",
    correo: "juan@ejemplo.com",
    estado: "ACTIVO",
  },

  {
    id: 2,
    nombre: "María López",
    correo: "maria@ejemplo.com",
    estado: "ACTIVO",
  },

  {
    id: 3,
    nombre: "Carlos Rodríguez",
    correo: "carlos@ejemplo.com",
    estado: "INACTIVO",
  },
];

const tableColumns: TableColumn[] = [
  {
    key: "id",
    label: "ID",
    style: {
      width: 70,
    },
    skeletonWidth:
      "60%",
  },

  {
    key: "nombre",
    label: "NOMBRE",
    style: {
      flex: 1,
      minWidth: 180,
    },
    skeletonWidth:
      "80%",
  },

  {
    key: "correo",
    label: "CORREO",
    style: {
      flex: 1,
      minWidth: 220,
    },
    skeletonWidth:
      "85%",
  },

  {
    key: "estado",
    label: "ESTADO",
    style: {
      width: 130,
    },
    skeletonWidth:
      "70%",
  },
];

/*
|--------------------------------------------------------------------------
| TABS
|--------------------------------------------------------------------------
*/

const tabsDemo = [
  {
    key: "general",
    label: "General",
  },

  {
    key: "usuarios",
    label: "Usuarios",
  },

  {
    key: "reportes",
    label: "Reportes",
  },
];

/*
|--------------------------------------------------------------------------
| ANIMACIONES
|--------------------------------------------------------------------------
*/

const enteringPresets = [
  "fadeIn",
  "scaleIn",
  "slideInUp",
  "slideInDown",
  "slideInLeft",
  "slideInRight",
] as const;

/*
|--------------------------------------------------------------------------
| SELECTS
|--------------------------------------------------------------------------
*/

const estadoOptions: SelectOption<string>[] = [
  {
    label: "Activo",
    value: "ACTIVO",
    description:
      "El registro puede utilizarse normalmente.",
  },

  {
    label: "Inactivo",
    value: "INACTIVO",
    description:
      "El registro queda deshabilitado.",
  },
];

const turnoOptions: SelectOption<string>[] = [
  {
    label: "Mañana",
    value: "MAÑANA",
  },

  {
    label: "Tarde",
    value: "TARDE",
  },

  {
    label: "Noche",
    value: "NOCHE",
  },
];

const carreraOptions: SelectOption<number>[] = [
  {
    label:
      "Sistemas Informáticos",
    value: 1,
  },

  {
    label:
      "Contaduría General",
    value: 2,
  },

  {
    label:
      "Secretariado Ejecutivo",
    value: 3,
  },
];

const filterEstadoOptions:
  SelectOption<FiltroEstado>[] = [
    {
      label: "Todos",
      value: "todos",
    },

    {
      label: "Activos",
      value: "activos",
    },

    {
      label: "Inactivos",
      value: "inactivos",
    },
  ];

/*
|--------------------------------------------------------------------------
| CATEGORY HEADER
|--------------------------------------------------------------------------
*/

interface CategoryHeaderProps {
  title: string;

  description: string;

  icon:
    React.ReactNode;
}

function CategoryHeader({
  title,
  description,
  icon,
}: CategoryHeaderProps) {
  const { theme } =
    useTheme();

  const c =
    theme.colors;

  return (
    <View
      style={[
        styles.categoryHeader,

        {
          backgroundColor:
            c.card,

          borderColor:
            c.border,
        },
      ]}
    >
      <View
        style={[
          styles.categoryIcon,

          {
            backgroundColor:
              c.primarySubtle,
          },
        ]}
      >
        {icon}
      </View>

      <View
        style={
          styles.categoryInfo
        }
      >
        <ThemedText
          style={
            styles.categoryTitle
          }
        >
          {title}
        </ThemedText>

        <ThemedText
          style={[
            styles.categoryDescription,

            {
              color:
                c.textSecondary,
            },
          ]}
        >
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| SECTION
|--------------------------------------------------------------------------
*/

interface SectionProps {
  title: string;

  description?: string;

  children:
    React.ReactNode;
}

function Section({
  title,
  description,
  children,
}: SectionProps) {
  const { theme } =
    useTheme();

  const c =
    theme.colors;

  return (
    <View
      style={[
        styles.section,

        {
          backgroundColor:
            c.card,

          borderColor:
            c.border,
        },
      ]}
    >
      <View
        style={
          styles.sectionHeader
        }
      >
        <ThemedText
          style={
            styles.sectionTitle
          }
        >
          {title}
        </ThemedText>

        {description ? (
          <ThemedText
            style={[
              styles.sectionDescription,

              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            {description}
          </ThemedText>
        ) : null}
      </View>

      <View
        style={
          styles.sectionContent
        }
      >
        {children}
      </View>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| SYSTEM COMPONENT CARD
|--------------------------------------------------------------------------
*/

interface SystemComponentCardProps {
  name: string;

  description: string;

  icon?:
    React.ReactNode;

  type?:
    SystemComponentType;
}

function SystemComponentCard({
  name,
  description,
  icon,
  type = "visual",
}: SystemComponentCardProps) {
  const { theme } =
    useTheme();

  const c =
    theme.colors;

  const variantMap = {
    visual:
      "info" as const,

    layout:
      "success" as const,

    security:
      "warning" as const,

    provider:
      "muted" as const,

    utility:
      "muted" as const,
  };

  const labelMap = {
    visual:
      "Visual",

    layout:
      "Layout",

    security:
      "Seguridad",

    provider:
      "Provider",

    utility:
      "Utilidad",
  };

  return (
    <Card
      style={
        styles.systemComponentCard
      }
    >
      <View
        style={
          styles.systemComponentHeader
        }
      >
        {icon ? (
          <View
            style={[
              styles.systemComponentIcon,

              {
                backgroundColor:
                  c.backgroundSecondary,
              },
            ]}
          >
            {icon}
          </View>
        ) : null}

        <View
          style={
            styles.systemComponentTitleContainer
          }
        >
          <ThemedText
            style={
              styles.systemComponentTitle
            }
          >
            {name}
          </ThemedText>

          <Badge
            label={
              labelMap[type]
            }
            variant={
              variantMap[type]
            }
          />
        </View>
      </View>

      <ThemedText
        style={[
          styles.systemComponentDescription,

          {
            color:
              c.textSecondary,
          },
        ]}
      >
        {description}
      </ThemedText>
    </Card>
  );
}

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export default function ComponentesScreen() {
  const { theme } =
    useTheme();

  const c =
    theme.colors;

  /*
  |--------------------------------------------------------------------------
  | INPUT
  |--------------------------------------------------------------------------
  */

  const [
    nombre,
    setNombre,
  ] =
    useState("");

  const [
    correo,
    setCorreo,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | SELECT
  |--------------------------------------------------------------------------
  */

  const [
    selectEstado,
    setSelectEstado,
  ] =
    useState(
      "ACTIVO",
    );

  const [
    selectTurno,
    setSelectTurno,
  ] =
    useState(
      "MAÑANA",
    );

  const [
    selectCarrera,
    setSelectCarrera,
  ] =
    useState<number>(
      1,
    );

  /*
  |--------------------------------------------------------------------------
  | DATE PICKER
  |--------------------------------------------------------------------------
  */

  const [
    datePickerVisible,
    setDatePickerVisible,
  ] =
    useState(false);

  const [
    datePickerMode,
    setDatePickerMode,
  ] =
    useState<DatePickerMode>(
      "single",
    );

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState("");

  const [
    selectedRange,
    setSelectedRange,
  ] =
    useState({
      start: "",
      end: "",
    });

  const [
    selectedYear,
    setSelectedYear,
  ] =
    useState(
      new Date()
        .getFullYear(),
    );

  const openDatePicker = (
    mode: DatePickerMode,
  ) => {
    setDatePickerMode(
      mode,
    );

    setDatePickerVisible(
      true,
    );
  };

  const handleDatePickerApply = (
    result:
      DatePickerResult,
  ) => {
    if (
      result.type ===
      "single"
    ) {
      setSelectedDate(
        result.date,
      );

      return;
    }

    if (
      result.type ===
      "range"
    ) {
      setSelectedRange({
        start:
          result.start,

        end:
          result.end,
      });

      return;
    }

    setSelectedYear(
      result.year,
    );
  };

  /*
  |--------------------------------------------------------------------------
  | PROGRESS BAR
  |--------------------------------------------------------------------------
  */

  const [
    progress,
    setProgress,
  ] =
    useState(65);

  /*
  |--------------------------------------------------------------------------
  | SWITCH
  |--------------------------------------------------------------------------
  */

  const [
    switchActivo,
    setSwitchActivo,
  ] =
    useState(true);

  const [
    switchNotificaciones,
    setSwitchNotificaciones,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const [
    search,
    setSearch,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | CHECKBOX
  |--------------------------------------------------------------------------
  */

  const [
    checked,
    setChecked,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | TAB BAR
  |--------------------------------------------------------------------------
  */

  const [
    activeTab,
    setActiveTab,
  ] =
    useState(
      "general",
    );

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const [
    shimmerLoading,
    setShimmerLoading,
  ] =
    useState(true);

  const [
    tableLoading,
    setTableLoading,
  ] =
    useState(false);

  const [
    iconButtonLoading,
    setIconButtonLoading,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | MODAL
  |--------------------------------------------------------------------------
  */

  const [
    modalVisible,
    setModalVisible,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | UPLOAD IMAGEN
  |--------------------------------------------------------------------------
  */

  const [
    imageUploadVisible,
    setImageUploadVisible,
  ] =
    useState(false);

  const [
    uploadedImages,
    setUploadedImages,
  ] =
    useState<
      ImageUploadResult[]
    >([]);

  /*
  |--------------------------------------------------------------------------
  | UPLOAD DOCUMENTO
  |--------------------------------------------------------------------------
  */

  const [
    documentUploadVisible,
    setDocumentUploadVisible,
  ] =
    useState(false);

  const [
    uploadedDocuments,
    setUploadedDocuments,
  ] =
    useState<
      DocumentUploadResult[]
    >([]);

  /*
  |--------------------------------------------------------------------------
  | EXIT
  |--------------------------------------------------------------------------
  */

  const [
    mostrarExitBlock,
    setMostrarExitBlock,
  ] =
    useState(true);

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const [
    paginationPage,
    setPaginationPage,
  ] =
    useState(1);

  /*
  |--------------------------------------------------------------------------
  | FILTROS
  |--------------------------------------------------------------------------
  */

  const [
    filtroSeleccionado,
    setFiltroSeleccionado,
  ] =
    useState<FiltroEstado>(
      "todos",
    );

  const [
    filtroMin,
    setFiltroMin,
  ] =
    useState("");

  const [
    filtroMax,
    setFiltroMax,
  ] =
    useState("");

  const filtrosActivos =
    (
      filtroSeleccionado !==
      "todos"
        ? 1
        : 0
    ) +
    (
      filtroMin !== "" ||
      filtroMax !== ""
        ? 1
        : 0
    );

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */

  const limpiarFiltros =
    () => {
      setFiltroSeleccionado(
        "todos",
      );

      setFiltroMin("");

      setFiltroMax("");
    };

  const simularCargaTabla =
    () => {
      setTableLoading(
        true,
      );

      setTimeout(
        () => {
          setTableLoading(
            false,
          );
        },
        1800,
      );
    };

  const simularIconButtonLoading =
    () => {
      setIconButtonLoading(
        true,
      );

      setTimeout(
        () => {
          setIconButtonLoading(
            false,
          );
        },
        1500,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

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
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator
      >
        <View
          style={
            styles.content
          }
        >
          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <View
            style={
              styles.pageHeader
            }
          >
            <ThemedText
              style={
                styles.pageTitle
              }
            >
              Catálogo de Componentes
            </ThemedText>

            <ThemedText
              style={[
                styles.pageDescription,

                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              Catálogo visual de todos los componentes UI y componentes generales reutilizables.
            </ThemedText>
          </View>

          {/* ================================================= */}
          {/* UI */}
          {/* ================================================= */}

          <CategoryHeader
            title="UI"
            description="Elementos reutilizables ubicados dentro de components/ui."
            icon={
              <Boxes
                size={25}
                color={
                  c.primary
                }
              />
            }
          />

          {/* PAGE HEADER */}

          <Section
            title="PageHeader"
            description="Cabecera reutilizable de las pantallas."
          >
            <View
              style={
                styles.column
              }
            >
              <PageHeader
                badge="Configuración"
                title="Gestión de módulos"
                description="Administra los módulos disponibles."
                action={{
                  title:
                    "Nuevo módulo",

                  onPress:
                    () => {},
                }}
              />

              <PageHeader
                badge="Recursos humanos"
                badgeVariant="success"
                title="Gestión de usuarios"
                description="Administra usuarios y datos personales."
                secondaryAction={{
                  title:
                    "Actualizar",

                  variant:
                    "secondary",

                  onPress:
                    () => {},
                }}
              />
            </View>
          </Section>

          {/* BUTTON */}

          <Section
            title="Button"
            description="Botones generales."
          >
            <View
              style={
                styles.row
              }
            >
              <Button
                title="Primary"
                onPress={() => {}}
              />

              <Button
                title="Secondary"
                variant="secondary"
                onPress={() => {}}
              />

              <Button
                title="Destructive"
                variant="destructive"
                onPress={() => {}}
              />

              <Button
                title="Ghost"
                variant="ghost"
                onPress={() => {}}
              />

              <Button
                title="Cargando"
                loading
                onPress={() => {}}
              />

              <Button
                title="Deshabilitado"
                disabled
                onPress={() => {}}
              />
            </View>
          </Section>

          {/* ICON BUTTON */}

          <Section
            title="IconButton"
            description="Botones compactos para acciones."
          >
            <View
              style={
                styles.row
              }
            >
              <IconButton
                icon={Eye}
                accessibilityLabel="Ver"
                onPress={() => {}}
              />

              <IconButton
                icon={Pencil}
                variant="secondary"
                accessibilityLabel="Editar"
                onPress={() => {}}
              />

              <IconButton
                icon={Download}
                variant="primary"
                accessibilityLabel="Descargar"
                onPress={() => {}}
              />

              <IconButton
                icon={Trash2}
                variant="destructive"
                accessibilityLabel="Eliminar"
                onPress={() => {}}
              />

              <IconButton
                icon={
                  RefreshCw
                }
                variant="secondary"
                loading={
                  iconButtonLoading
                }
                accessibilityLabel="Actualizar"
                onPress={
                  simularIconButtonLoading
                }
              />
            </View>
          </Section>

          {/* BADGE */}

          <Section
            title="Badge"
            description="Etiquetas y estados."
          >
            <View
              style={
                styles.row
              }
            >
              <Badge
                label="Activo"
                variant="success"
              />

              <Badge
                label="Pendiente"
                variant="warning"
              />

              <Badge
                label="Información"
                variant="info"
              />

              <Badge
                label="Neutral"
                variant="muted"
              />

              <Badge
                label="Error"
                variant="destructive"
              />
            </View>
          </Section>

          {/* AVATAR */}

          <Section
            title="Avatar"
            description="Avatar mediante iniciales."
          >
            <View
              style={
                styles.row
              }
            >
              <Avatar
                initials="JP"
                color={
                  c.primary
                }
                size={36}
              />

              <Avatar
                initials="ML"
                color={
                  c.success
                }
                size={46}
              />

              <Avatar
                initials="CR"
                color={
                  c.warning
                }
                size={56}
              />
            </View>
          </Section>

          {/* CARD */}

          <Section
            title="Card"
            description="Contenedor visual reutilizable."
          >
            <View
              style={
                styles.cardGrid
              }
            >
              <Card
                style={
                  styles.demoCard
                }
              >
                <ThemedText
                  style={
                    styles.cardLabel
                  }
                >
                  Usuarios
                </ThemedText>

                <ThemedText
                  style={
                    styles.cardNumber
                  }
                >
                  325
                </ThemedText>

                <Badge
                  label="Activos"
                  variant="success"
                />
              </Card>

              <Card
                style={
                  styles.demoCard
                }
              >
                <ThemedText
                  style={
                    styles.cardLabel
                  }
                >
                  Registros
                </ThemedText>

                <ThemedText
                  style={
                    styles.cardNumber
                  }
                >
                  128
                </ThemedText>

                <Badge
                  label="Registrados"
                  variant="info"
                />
              </Card>
            </View>
          </Section>

          {/* INPUT */}

          <Section
            title="Input"
            description="Campos de formulario."
          >
            <View
              style={
                styles.column
              }
            >
              <Input
                label="Nombre"
                placeholder="Ingrese su nombre"
                value={
                  nombre
                }
                onChangeText={
                  setNombre
                }
              />

              <Input
                label="Correo"
                placeholder="correo@ejemplo.com"
                value={
                  correo
                }
                onChangeText={
                  setCorreo
                }
                keyboardType="email-address"
              />

              <Input
                label="Con ayuda"
                helperText="Texto auxiliar."
              />

              <Input
                label="Con error"
                value="Valor incorrecto"
                error="Existe un error."
              />

              <Input
                label="No editable"
                value="Contenido bloqueado"
                editable={false}
              />
            </View>
          </Section>

          {/* SELECT */}

          <Section
            title="Select"
            description="Selector reutilizable."
          >
            <View
              style={
                styles.selectGrid
              }
            >
              <View
                style={
                  styles.selectItem
                }
              >
                <Select<string>
                  label="Estado"
                  value={
                    selectEstado
                  }
                  options={
                    estadoOptions
                  }
                  onValueChange={
                    setSelectEstado
                  }
                />
              </View>

              <View
                style={
                  styles.selectItem
                }
              >
                <Select<string>
                  label="Turno"
                  value={
                    selectTurno
                  }
                  options={
                    turnoOptions
                  }
                  onValueChange={
                    setSelectTurno
                  }
                />
              </View>

              <View
                style={
                  styles.selectItem
                }
              >
                <Select<number>
                  label="Carrera"
                  value={
                    selectCarrera
                  }
                  options={
                    carreraOptions
                  }
                  onValueChange={
                    setSelectCarrera
                  }
                  searchable
                />
              </View>
            </View>
          </Section>

          {/* DATE PICKER */}

          <Section
            title="DatePicker"
            description="Selector de fecha, rango de fechas y año."
          >
            <View
              style={
                styles.componentInfo
              }
            >
              <CalendarDays
                size={20}
                color={
                  c.primary
                }
              />

              <ThemedText
                style={{
                  color:
                    c.textSecondary,
                }}
              >
                components/ui/DatePicker.tsx
              </ThemedText>
            </View>

            <View
              style={
                styles.row
              }
            >
              <Button
                title="Seleccionar fecha"
                onPress={() =>
                  openDatePicker(
                    "single",
                  )
                }
              />

              <Button
                title="Seleccionar rango"
                variant="secondary"
                onPress={() =>
                  openDatePicker(
                    "range",
                  )
                }
              />

              <Button
                title="Seleccionar año"
                variant="secondary"
                onPress={() =>
                  openDatePicker(
                    "year",
                  )
                }
              />
            </View>

            <View
              style={
                styles.resultGrid
              }
            >
              <Card
                style={
                  styles.resultCard
                }
              >
                <ThemedText
                  style={
                    styles.resultLabel
                  }
                >
                  Fecha
                </ThemedText>

                <ThemedText>
                  {selectedDate ||
                    "Sin seleccionar"}
                </ThemedText>
              </Card>

              <Card
                style={
                  styles.resultCard
                }
              >
                <ThemedText
                  style={
                    styles.resultLabel
                  }
                >
                  Rango
                </ThemedText>

                <ThemedText>
                  {selectedRange.start &&
                  selectedRange.end
                    ? `${selectedRange.start} → ${selectedRange.end}`
                    : "Sin seleccionar"}
                </ThemedText>
              </Card>

              <Card
                style={
                  styles.resultCard
                }
              >
                <ThemedText
                  style={
                    styles.resultLabel
                  }
                >
                  Año
                </ThemedText>

                <ThemedText>
                  {selectedYear}
                </ThemedText>
              </Card>
            </View>

            <DatePicker
              visible={
                datePickerVisible
              }
              mode={
                datePickerMode
              }
              initialDate={
                selectedDate ||
                undefined
              }
              initialRange={
                selectedRange.start &&
                selectedRange.end
                  ? selectedRange
                  : undefined
              }
              initialYear={
                selectedYear
              }
              onClose={() =>
                setDatePickerVisible(
                  false,
                )
              }
              onApply={(
                result,
              ) => {
                handleDatePickerApply(
                  result,
                );

                setDatePickerVisible(
                  false,
                );
              }}
            />
          </Section>

          {/* PROGRESS BAR */}

          <Section
            title="ProgressBar"
            description="Barra de progreso reutilizable y animada."
          >
            <View
              style={
                styles.column
              }
            >
              <ProgressBar
                label="Progreso general"
                value={
                  progress
                }
              />

              <ProgressBar
                label="Completado"
                value={90}
                variant="success"
              />

              <ProgressBar
                label="Pendiente"
                value={55}
                variant="warning"
              />

              <ProgressBar
                label="Crítico"
                value={25}
                variant="destructive"
              />

              <ProgressBar
                value={75}
                showValue={false}
                height={6}
              />

              <View
                style={
                  styles.row
                }
              >
                <Button
                  title="-10%"
                  variant="secondary"
                  onPress={() =>
                    setProgress(
                      (
                        current,
                      ) =>
                        Math.max(
                          0,
                          current -
                            10,
                        ),
                    )
                  }
                />

                <Button
                  title="+10%"
                  onPress={() =>
                    setProgress(
                      (
                        current,
                      ) =>
                        Math.min(
                          100,
                          current +
                            10,
                        ),
                    )
                  }
                />
              </View>
            </View>
          </Section>

          {/* SWITCH */}

          <Section
            title="Switch"
            description="Interruptores booleanos."
          >
            <View
              style={
                styles.switchGrid
              }
            >
              <Card
                style={
                  styles.switchCard
                }
              >
                <Switch
                  label="Usuario activo"
                  description="Permite habilitar o deshabilitar el usuario."
                  value={
                    switchActivo
                  }
                  onValueChange={
                    setSwitchActivo
                  }
                />
              </Card>

              <Card
                style={
                  styles.switchCard
                }
              >
                <Switch
                  label="Notificaciones"
                  description="Permitir notificaciones."
                  value={
                    switchNotificaciones
                  }
                  onValueChange={
                    setSwitchNotificaciones
                  }
                />
              </Card>
            </View>
          </Section>

          {/* CHECKBOX */}

          <Section
            title="Checkbox"
            description="Selección booleana."
          >
            <View
              style={
                styles.checkboxRow
              }
            >
              <Checkbox
                checked={
                  checked
                }
                onPress={() =>
                  setChecked(
                    (
                      current,
                    ) =>
                      !current,
                  )
                }
                accessibilityLabel="Aceptar condiciones"
              />

              <ThemedText>
                Aceptar condiciones
              </ThemedText>
            </View>
          </Section>

          {/* DIVIDER */}

          <Section
            title="Divider"
            description="Separadores visuales."
          >
            <View
              style={
                styles.column
              }
            >
              <ThemedText>
                Contenido superior
              </ThemedText>

              <Divider />

              <ThemedText>
                Contenido inferior
              </ThemedText>

              <Divider
                color={
                  c.primary
                }
                thickness={2}
              />

              <Divider
                label="Información personal"
              />

              <Divider
                label="Configuración"
                labelPosition="start"
              />
            </View>
          </Section>

          {/* SEARCH BAR */}

          <Section
            title="SearchBar"
            description="Buscador reutilizable."
          >
            <SearchBar
              value={
                search
              }
              onChangeText={
                setSearch
              }
              placeholder="Buscar registros..."
            />
          </Section>

          {/* PRESSABLE */}

          <Section
            title="PressableAnimated"
            description="Elemento presionable con animación."
          >
            <PressableAnimated
              onPress={() => {}}
            >
              <View
                style={[
                  styles.pressableDemo,

                  {
                    backgroundColor:
                      c.backgroundSecondary,

                    borderColor:
                      c.border,
                  },
                ]}
              >
                <ThemedText>
                  Presióname
                </ThemedText>
              </View>
            </PressableAnimated>
          </Section>

          {/* ANIMATED BLOCK */}

          <Section
            title="AnimatedBlock"
            description="Animaciones de entrada."
          >
            <View
              style={
                styles.animationGrid
              }
            >
              {enteringPresets.map(
                (
                  preset,
                  index,
                ) => (
                  <AnimatedBlock
                    key={
                      preset
                    }
                    preset={
                      preset
                    }
                    delay={
                      index *
                      40
                    }
                  >
                    <View
                      style={[
                        styles.animationCard,

                        {
                          backgroundColor:
                            c.backgroundSecondary,

                          borderColor:
                            c.border,
                        },
                      ]}
                    >
                      <ThemedText>
                        {preset}
                      </ThemedText>
                    </View>
                  </AnimatedBlock>
                ),
              )}
            </View>
          </Section>

          {/* ANIMATED EXIT */}

          <Section
            title="AnimatedExitBlock"
            description="Animaciones de salida."
          >
            <Button
              title={
                mostrarExitBlock
                  ? "Ocultar"
                  : "Mostrar"
              }
              variant="secondary"
              onPress={() =>
                setMostrarExitBlock(
                  (
                    current,
                  ) =>
                    !current,
                )
              }
            />

            <View
              style={
                styles.exitArea
              }
            >
              <AnimatePresence>
                {mostrarExitBlock ? (
                  <AnimatedExitBlock
                    key="exit-demo"
                    preset="scaleOut"
                  >
                    <View
                      style={[
                        styles.animationCard,

                        {
                          backgroundColor:
                            c.backgroundSecondary,

                          borderColor:
                            c.border,
                        },
                      ]}
                    >
                      <ThemedText>
                        Elemento animado
                      </ThemedText>
                    </View>
                  </AnimatedExitBlock>
                ) : null}
              </AnimatePresence>
            </View>
          </Section>

          {/* SKELETON */}

          <Section
            title="Skeleton"
            description="Placeholder durante carga."
          >
            <View
              style={
                styles.column
              }
            >
              <Skeleton
                width="100%"
                height={20}
              />

              <Skeleton
                width="75%"
                height={20}
              />

              <Skeleton
                width="50%"
                height={20}
              />
            </View>
          </Section>

          <Section
            title="SkeletonRolCard"
            description="Skeleton especializado para tarjetas de roles."
          >
            <SkeletonRolCard />
          </Section>

          {/* SHIMMER */}

          <Section
            title="Shimmer"
            description="Loading animado."
          >
            <View
              style={
                styles.column
              }
            >
              <Button
                title={
                  shimmerLoading
                    ? "Mostrar contenido"
                    : "Mostrar Shimmer"
                }
                variant="secondary"
                onPress={() =>
                  setShimmerLoading(
                    (
                      current,
                    ) =>
                      !current,
                  )
                }
              />

              <Shimmer
                loading={
                  shimmerLoading
                }
                width="100%"
                height={22}
              >
                <ThemedText>
                  Contenido cargado
                </ThemedText>
              </Shimmer>
            </View>
          </Section>

          {/* TAB BAR */}

          <Section
            title="TabBar"
            description="Pestañas reutilizables."
          >
            <TabBar
              tabs={
                tabsDemo
              }
              activeTab={
                activeTab
              }
              onTabChange={
                setActiveTab
              }
            />
          </Section>

          {/* PAGINATION */}

          <Section
            title="Pagination"
            description="Paginación reutilizable."
          >
            <Card
              padding={0}
            >
              <View
                style={
                  styles.paginationContent
                }
              >
                <ThemedText>
                  Página{" "}
                  {
                    paginationPage
                  }
                </ThemedText>
              </View>

              <Pagination
                meta={{
                  total: 128,

                  page:
                    paginationPage,

                  perPage: 10,
                }}
                itemLabel="registros"
                onPageChange={
                  setPaginationPage
                }
              />
            </Card>
          </Section>

          {/* EMPTY STATE */}

          <Section
            title="EmptyState"
            description="Estado vacío."
          >
            <View
              style={
                styles.emptyContainer
              }
            >
              <EmptyState
                icon="folder-open-outline"
                title="No existen registros"
                subtitle="Todavía no existe información."
              />
            </View>
          </Section>

          {/* QR */}

          <Section
            title="QrState"
            description="Estado reutilizable para códigos QR."
          >
            <View
              style={
                styles.stateDemoGrid
              }
            >
              <View
                style={
                  styles.stateDemoItem
                }
              >
                <QrState
                  qrUri={null}
                  title="Código QR"
                  subtitle="Credencial digital asociada al usuario."
                  emptyTitle="Sin código QR"
                  emptySubtitle="Este usuario todavía no tiene un código QR registrado."
                />
              </View>
            </View>
          </Section>

          {/* PROFILE PHOTO */}

          <Section
            title="ProfilePhotoState"
            description="Estado reutilizable de fotografía de perfil."
          >
            <View
              style={
                styles.stateDemoGrid
              }
            >
              <View
                style={
                  styles.stateDemoItem
                }
              >
                <ProfilePhotoState
                  photoUrl={null}
                  title="Foto de perfil"
                  subtitle="Fotografía asociada al usuario."
                  emptyTitle="Sin foto de perfil"
                  emptySubtitle="Este usuario todavía no tiene una fotografía registrada."
                  emptyActionLabel="Agregar fotografía"
                  onAction={() => {}}
                />
              </View>
            </View>
          </Section>

          {/* MODAL */}

          <Section
            title="Modal"
            description="Modal general reutilizable."
          >
            <Button
              title="Abrir Modal"
              onPress={() =>
                setModalVisible(
                  true,
                )
              }
            />

            <Modal
              visible={
                modalVisible
              }
              title="Modal de ejemplo"
              onClose={() =>
                setModalVisible(
                  false,
                )
              }
              footer={
                <View
                  style={
                    styles.modalFooter
                  }
                >
                  <Button
                    title="Cancelar"
                    variant="secondary"
                    onPress={() =>
                      setModalVisible(
                        false,
                      )
                    }
                  />

                  <Button
                    title="Guardar"
                    onPress={() =>
                      setModalVisible(
                        false,
                      )
                    }
                  />
                </View>
              }
            >
              <View
                style={
                  styles.modalContent
                }
              >
                <Input
                  label="Nombre"
                />

                <Divider
                  label="Configuración"
                  labelPosition="start"
                />

                <Switch
                  label="Activo"
                  value={
                    switchActivo
                  }
                  onValueChange={
                    setSwitchActivo
                  }
                />
              </View>
            </Modal>
          </Section>

          {/* ================================================= */}
          {/* COMPONENTES GENERALES */}
          {/* ================================================= */}

          <View
            style={
              styles.categorySeparation
            }
          />

          <CategoryHeader
            title="Componentes"
            description="Componentes generales ubicados directamente dentro de components."
            icon={
              <LayoutDashboard
                size={25}
                color={
                  c.primary
                }
              />
            }
          />

          {/* THEMED TEXT */}

          <Section
            title="ThemedText"
            description="Texto conectado al tema global."
          >
            <View
              style={
                styles.column
              }
            >
              <ThemedText>
                Texto normal
              </ThemedText>

              <ThemedText
                style={{
                  fontSize: 22,
                  fontWeight:
                    "800",
                }}
              >
                Texto destacado
              </ThemedText>

              <ThemedText
                style={{
                  color:
                    c.textSecondary,
                }}
              >
                Texto secundario
              </ThemedText>
            </View>
          </Section>

          {/* FILTERS */}

          <Section
            title="FiltersBar"
            description="Barra de filtros reutilizable."
          >
            <View
              style={
                styles.componentInfo
              }
            >
              <Filter
                size={20}
                color={
                  c.primary
                }
              />

              <ThemedText
                style={{
                  color:
                    c.textSecondary,
                }}
              >
                components/FiltersBar.tsx
              </ThemedText>
            </View>

            <FiltersBar
              defaultOpen
              activeFiltersCount={
                filtrosActivos
              }
              onClearFilters={
                limpiarFiltros
              }
            >
              <FilterGroup label="Estado">
                <View
                  style={
                    styles.filterSelect
                  }
                >
                  <Select<FiltroEstado>
                    value={
                      filtroSeleccionado
                    }
                    options={
                      filterEstadoOptions
                    }
                    onValueChange={
                      setFiltroSeleccionado
                    }
                  />
                </View>
              </FilterGroup>

              <FilterGroup label="Monto">
                <View
                  style={
                    styles.filterInputs
                  }
                >
                  <View
                    style={
                      styles.filterInput
                    }
                  >
                    <Input
                      placeholder="Min"
                      value={
                        filtroMin
                      }
                      onChangeText={
                        setFiltroMin
                      }
                      keyboardType="numeric"
                    />
                  </View>

                  <ThemedText>
                    –
                  </ThemedText>

                  <View
                    style={
                      styles.filterInput
                    }
                  >
                    <Input
                      placeholder="Max"
                      value={
                        filtroMax
                      }
                      onChangeText={
                        setFiltroMax
                      }
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </FilterGroup>
            </FiltersBar>
          </Section>

          {/* TABLE */}

          <Section
            title="Table"
            description="Tabla general reutilizable."
          >
            <View
              style={
                styles.componentInfo
              }
            >
              <Table2
                size={20}
                color={
                  c.primary
                }
              />

              <ThemedText
                style={{
                  color:
                    c.textSecondary,
                }}
              >
                components/Table.tsx
              </ThemedText>
            </View>

            <Button
              title={
                tableLoading
                  ? "Cargando..."
                  : "Simular carga"
              }
              variant="secondary"
              disabled={
                tableLoading
              }
              onPress={
                simularCargaTabla
              }
            />

            <View
              style={
                styles.tableContainer
              }
            >
              <Table<UsuarioDemo>
                data={
                  usuariosDemo
                }
                columns={
                  tableColumns
                }
                loading={
                  tableLoading
                }
                keyExtractor={(
                  item,
                ) =>
                  item.id.toString()
                }
                renderRow={(
                  usuario,
                ) => (
                  <View
                    style={[
                      styles.tableRow,

                      {
                        borderBottomColor:
                          c.border,
                      },
                    ]}
                  >
                    <View
                      style={{
                        width: 70,
                      }}
                    >
                      <ThemedText>
                        {
                          usuario.id
                        }
                      </ThemedText>
                    </View>

                    <View
                      style={{
                        flex: 1,
                        minWidth: 180,
                      }}
                    >
                      <ThemedText>
                        {
                          usuario.nombre
                        }
                      </ThemedText>
                    </View>

                    <View
                      style={{
                        flex: 1,
                        minWidth: 220,
                      }}
                    >
                      <ThemedText>
                        {
                          usuario.correo
                        }
                      </ThemedText>
                    </View>

                    <View
                      style={{
                        width: 130,
                      }}
                    >
                      <Badge
                        label={
                          usuario.estado
                        }
                        variant={
                          usuario.estado ===
                          "ACTIVO"
                            ? "success"
                            : "destructive"
                        }
                      />
                    </View>
                  </View>
                )}
              />
            </View>
          </Section>

          {/* IMAGE UPLOAD */}

          <Section
            title="ImageUploadModal"
            description="Carga y procesamiento de imágenes."
          >
            <View
              style={
                styles.componentInfo
              }
            >
              <ImagePlus
                size={20}
                color={
                  c.primary
                }
              />

              <ThemedText
                style={{
                  color:
                    c.textSecondary,
                }}
              >
                components/ImageUploadModal.tsx
              </ThemedText>
            </View>

            <View
              style={
                styles.row
              }
            >
              <Button
                title="Abrir cargador"
                onPress={() =>
                  setImageUploadVisible(
                    true,
                  )
                }
              />

              <Badge
                label={`${uploadedImages.length} imagen(es)`}
                variant={
                  uploadedImages.length >
                  0
                    ? "success"
                    : "muted"
                }
              />
            </View>

            <ImageUploadModal
              visible={
                imageUploadVisible
              }
              title="Subir imágenes"
              maxInputSizeMB={15}
              maxImages={10}
              initialSelectionMode="single"
              allowModeChange
              initialFormat="webp"
              initialQuality={90}
              onClose={() =>
                setImageUploadVisible(
                  false,
                )
              }
              onSave={(
                result,
              ) => {
                setUploadedImages(
                  Array.isArray(
                    result,
                  )
                    ? result
                    : result
                      ? [
                          result,
                        ]
                      : [],
                );

                setImageUploadVisible(
                  false,
                );
              }}
            />
          </Section>

          {/* DOCUMENT UPLOAD */}

          <Section
            title="DocumentUploadModal"
            description="Carga de documentos."
          >
            <View
              style={
                styles.componentInfo
              }
            >
              <FileUp
                size={20}
                color={
                  c.primary
                }
              />

              <ThemedText
                style={{
                  color:
                    c.textSecondary,
                }}
              >
                components/DocumentUploadModal.tsx
              </ThemedText>
            </View>

            <View
              style={
                styles.row
              }
            >
              <Button
                title="Abrir cargador"
                onPress={() =>
                  setDocumentUploadVisible(
                    true,
                  )
                }
              />

              <Badge
                label={`${uploadedDocuments.length} documento(s)`}
                variant={
                  uploadedDocuments.length >
                  0
                    ? "success"
                    : "muted"
                }
              />
            </View>

            <DocumentUploadModal
              visible={
                documentUploadVisible
              }
              title="Subir documentos"
              initialSelectionMode="single"
              allowModeChange
              maxFiles={10}
              maxFileSizeMB={15}
              maxTotalSizeMB={50}
              acceptedExtensions={[
                "pdf",
                "doc",
                "docx",
                "xls",
                "xlsx",
                "csv",
                "txt",
                "md",
                "json",
                "zip",
              ]}
              onClose={() =>
                setDocumentUploadVisible(
                  false,
                )
              }
              onSave={(
                result,
              ) => {
                setUploadedDocuments(
                  Array.isArray(
                    result,
                  )
                    ? result
                    : result
                      ? [
                          result,
                        ]
                      : [],
                );

                setDocumentUploadVisible(
                  false,
                );
              }}
            />
          </Section>

          {/* TOOLTIP */}

          <Section
            title="Tooltip"
            description="Información contextual."
          >
            <View
              style={
                styles.tooltipDemo
              }
            >
              <ThemedText>
                Información
              </ThemedText>

              <Tooltip
                message="Información contextual."
                position="right"
                icon={
                  <Eye
                    size={20}
                    color={
                      c.primary
                    }
                  />
                }
              />
            </View>
          </Section>

          {/* TOAST */}

          <Section
            title="CustomToast"
            description="Diseños utilizados por las notificaciones."
          >
            <View
              style={
                styles.toastExamples
              }
            >
              <CustomToast
                type="success"
                text1="Operación realizada"
                text2="Los cambios fueron guardados."
              />

              <CustomToast
                type="warning"
                text1="Advertencia"
                text2="Revise la información."
              />

              <CustomToast
                type="error"
                text1="Error"
                text2="No fue posible completar la operación."
              />

              <CustomToast
                type="info"
                text1="Información"
                text2="Mensaje informativo."
              />
            </View>
          </Section>

          {/* VISIBILITY */}

          <Section
            title="Visibility"
            description="Control visual por permisos y selectores."
          >
            <Visibility>
              <View
                style={[
                  styles.visibilityBox,

                  {
                    backgroundColor:
                      c.backgroundSecondary,

                    borderColor:
                      c.border,
                  },
                ]}
              >
                <Shield
                  size={20}
                  color={
                    c.success
                  }
                />

                <ThemedText>
                  Contenido visible
                </ThemedText>
              </View>
            </Visibility>
          </Section>

          {/* ================================================= */}
          {/* ESTRUCTURA DEL SISTEMA */}
          {/* ================================================= */}

          <Section
            title="Componentes estructurales"
            description="Componentes generales que forman parte de la arquitectura y no necesitan una demo directa."
          >
            <View
              style={
                styles.systemComponentsGrid
              }
            >
              <SystemComponentCard
                name="AppLayout"
                type="layout"
                icon={
                  <LayoutDashboard
                    size={22}
                    color={
                      c.primary
                    }
                  />
                }
                description="Layout principal del sistema."
              />

              <SystemComponentCard
                name="MobileHeader"
                type="layout"
                icon={
                  <Menu
                    size={22}
                    color={
                      c.primary
                    }
                  />
                }
                description="Header para dispositivos móviles."
              />

              <SystemComponentCard
                name="MobileDrawer"
                type="layout"
                icon={
                  <Smartphone
                    size={22}
                    color={
                      c.primary
                    }
                  />
                }
                description="Drawer lateral para móviles."
              />

              <SystemComponentCard
                name="ProtectedRoute"
                type="security"
                icon={
                  <Shield
                    size={22}
                    color={
                      c.warning
                    }
                  />
                }
                description="Protección de navegación según autenticación y permisos."
              />

              <SystemComponentCard
                name="DatePickerModal"
                type="utility"
                icon={
                  <CalendarDays
                    size={22}
                    color={
                      c.primary
                    }
                  />
                }
                description="Wrapper de compatibilidad para components/ui/DatePicker."
              />

              <SystemComponentCard
                name="Toaster"
                type="provider"
                icon={
                  <Bell
                    size={22}
                    color={
                      c.info
                    }
                  />
                }
                description="Proveedor global de notificaciones."
              />

              <SystemComponentCard
                name="globalScrollbar"
                type="utility"
                icon={
                  <Paintbrush
                    size={22}
                    color={
                      c.textSecondary
                    }
                  />
                }
                description="Scrollbar tematizado utilizado en web."
              />

              <SystemComponentCard
                name="CustomToast"
                description="Diseño visual de notificaciones."
              />

              <SystemComponentCard
                name="FiltersBar"
                description="Sistema reutilizable de filtros."
              />

              <SystemComponentCard
                name="ImageUploadModal"
                description="Procesamiento y carga de imágenes."
              />

              <SystemComponentCard
                name="DocumentUploadModal"
                description="Carga y validación de documentos."
              />

              <SystemComponentCard
                name="Table"
                description="Tabla genérica reutilizable."
              />

              <SystemComponentCard
                name="ThemedText"
                description="Texto conectado al sistema de temas."
              />

              <SystemComponentCard
                name="Tooltip"
                description="Información contextual."
              />

              <SystemComponentCard
                name="Visibility"
                type="security"
                description="Control visual mediante permisos RBAC y selectores."
              />
            </View>
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| ESTILOS
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    scrollContent: {
      width: "100%",
      padding: 24,
      paddingBottom: 100,
    },

    content: {
      width: "100%",
      maxWidth: 1400,
      alignSelf: "center",
      gap: 20,
    },

    pageHeader: {
      marginBottom: 6,
    },

    pageTitle: {
      fontSize: 30,
      fontWeight: "800",
    },

    pageDescription: {
      marginTop: 6,
      fontSize: 14,
      lineHeight: 21,
    },

    categoryHeader: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderWidth: 1,
      borderRadius: 18,
      paddingHorizontal: 20,
      paddingVertical: 18,
    },

    categoryIcon: {
      width: 50,
      height: 50,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },

    categoryInfo: {
      flex: 1,
    },

    categoryTitle: {
      fontSize: 24,
      fontWeight: "900",
    },

    categoryDescription: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 20,
    },

    categorySeparation: {
      height: 16,
    },

    section: {
      width: "100%",
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
    },

    sectionHeader: {
      marginBottom: 18,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
    },

    sectionDescription: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 20,
    },

    sectionContent: {
      width: "100%",
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 10,
    },

    column: {
      width: "100%",
      gap: 14,
    },

    componentInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
    },

    resultGrid: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: 16,
    },

    resultCard: {
      flexGrow: 1,
      flexBasis: 220,
      minWidth: 200,
      gap: 8,
    },

    resultLabel: {
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
    },

    switchGrid: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
    },

    switchCard: {
      width: "48%",
      minWidth: 280,
      flexGrow: 1,
    },

    selectGrid: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },

    selectItem: {
      width: "48%",
      minWidth: 270,
      flexGrow: 1,
    },

    filterSelect: {
      width: 190,
    },

    filterInputs: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    filterInput: {
      width: 90,
    },

    checkboxRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    cardGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },

    demoCard: {
      width: 220,
      gap: 10,
    },

    cardLabel: {
      fontSize: 13,
      fontWeight: "600",
    },

    cardNumber: {
      fontSize: 30,
      fontWeight: "800",
    },

    pressableDemo: {
      minWidth: 150,
      paddingHorizontal: 24,
      paddingVertical: 18,
      borderWidth: 1,
      borderRadius: 12,
      alignItems: "center",
    },

    animationGrid: {
      width: "100%",
      gap: 12,
    },

    animationCard: {
      width: "100%",
      padding: 20,
      borderWidth: 1,
      borderRadius: 12,
      alignItems: "center",
    },

    exitArea: {
      minHeight: 100,
      marginTop: 16,
    },

    paginationContent: {
      padding: 20,
    },

    emptyContainer: {
      minHeight: 230,
    },

    modalContent: {
      gap: 16,
    },

    modalFooter: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 10,
    },

    tableContainer: {
      width: "100%",
      height: 330,
      marginTop: 16,
    },

    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },

    tooltipDemo: {
      minHeight: 100,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      overflow: "visible",
      zIndex: 100,
    },

    toastExamples: {
      width: "100%",
      alignItems: "center",
      gap: 14,
    },

    visibilityBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderRadius: 10,
      padding: 14,
    },

    stateDemoGrid: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
      alignItems: "stretch",
    },

    stateDemoItem: {
      flex: 1,
      minWidth: 300,
      maxWidth: 560,
    },

    systemComponentsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
    },

    systemComponentCard: {
      width: 300,
      minHeight: 150,
      gap: 12,
    },

    systemComponentHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    systemComponentIcon: {
      width: 42,
      height: 42,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    systemComponentTitleContainer: {
      flex: 1,
      alignItems: "flex-start",
      gap: 5,
    },

    systemComponentTitle: {
      fontSize: 15,
      fontWeight: "800",
    },

    systemComponentDescription: {
      fontSize: 13,
      lineHeight: 20,
    },
  });