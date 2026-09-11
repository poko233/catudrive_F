import { ThemedText } from "@/components/ThemedText";
import { Table, TableColumn } from "@/components/Table";
import { Visibility } from "@/components/Visibility";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { useTheme } from "@/theme/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { Bus, CarTaxiFront, Pencil, Trash2, Wrench } from "lucide-react-native";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { CategoriasVehiculoModal } from "./components/CategoriasVehiculoModal";
import { VehiculoBajaModal } from "./components/VehiculoBajaModal";
import { VehiculoFormModal } from "./components/VehiculoFormModal";
import { useVehiculos } from "./hooks/useVehiculos";
import type { Vehiculo } from "./types/vehiculo.types";

type FiltroVehiculo = "TODOS" | "Operativo" | "En mantenimiento" | "Baja";

/*
|--------------------------------------------------------------------------
| TARJETA DE FILTRO
|--------------------------------------------------------------------------
|
| Subcomponente con su propio estado pressed y estilos 100%
| estáticos (sin callbacks de Pressable): render determinista
| en Android nativo. Mismo patrón que components/ui/Select.tsx
| (SelectOptionRow) y MobileTabBar.
|
*/

function SummaryFilterCard({
  active,
  onPress,
  icon,
  value,
  label,
}: {
  active: boolean;
  onPress: () => void;
  icon: ReactNode;
  value: number;
  label: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.summaryPressable,
        { opacity: pressed ? 0.78 : 1 },
      ]}
    >
      <Card
        style={[
          styles.summaryCard,
          active ? { borderColor: c.primary, borderWidth: 2 } : null,
        ]}
      >
        {icon}
        <View style={styles.summaryContent}>
          <ThemedText style={styles.summaryValue}>{value}</ThemedText>
          <ThemedText style={{ color: c.textSecondary }}>
            {label}
          </ThemedText>
        </View>
      </Card>
    </Pressable>
  );
}

const columns: TableColumn[] = [
  { key: "placa", label: "Placa", flex: 0.9, align: "center" },
  { key: "tipo", label: "Tipo", flex: 0.8, align: "center" },
  { key: "marca", label: "Marca", flex: 0.9, align: "center" },
  { key: "modelo", label: "Modelo", flex: 0.9, align: "center" },
  { key: "categoria", label: "Categoría", flex: 0.8, align: "center" },
  { key: "capacidad", label: "Cap.", flex: 0.6, align: "center" },
  { key: "estado", label: "Estado", flex: 0.9, align: "center" },
  { key: "propietario", label: "Propietario", flex: 1.2, align: "center" },
  { key: "acciones", label: "Acciones", flex: 1.3, align: "center" },
];

export default function VehiculosScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { isDesktop } = useResponsive();

  const {
    vehiculos,
    loading,
    saving,
    deletingId,
    resumen,
    refresh,
    guardar,
    darBaja,
  } = useVehiculos();

  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<FiltroVehiculo>("TODOS");
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Vehiculo | null>(null);
  const [bajaVehiculo, setBajaVehiculo] = useState<Vehiculo | null>(null);
  const [categoriasVisible, setCategoriasVisible] = useState(false);

  const vehiculosFiltrados = useMemo(() => {
    const filtradosPorEstado =
      filtro === "TODOS"
        ? vehiculos
        : vehiculos.filter((v) => v.estado === filtro);

    const q = search.trim().toLowerCase();
    if (!q) return filtradosPorEstado;

    return filtradosPorEstado.filter((v) =>
      [
        v.placa,
        v.tipo,
        v.marca,
        v.modelo,
        v.categoria?.categoria ?? "",
        String(v.capacidad),
        v.estado,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [vehiculos, filtro, search]);

  const filtroTexto = useMemo(() => {
    switch (filtro) {
      case "Operativo":
        return "Operativos";
      case "En mantenimiento":
        return "Mantenimiento";
      case "Baja":
        return "Bajas";
      default:
        return "Todos";
    }
  }, [filtro]);

  const abrirCrear = () => {
    setEditing(null);
    setFormVisible(true);
  };

  const abrirEditar = (vehiculo: Vehiculo) => {
    setEditing(vehiculo);
    setFormVisible(true);
  };

  const cerrarForm = () => {
    if (saving) return;
    setFormVisible(false);
    setEditing(null);
  };

  const confirmarBaja = async (vehiculo: Vehiculo) => {
    const ok = await darBaja(vehiculo);
    if (ok) setBajaVehiculo(null);
  };

  /*
  |--------------------------------------------------------------------------
  | CUERPO COMPARTIDO
  |--------------------------------------------------------------------------
  |
  | Mismo contenido en ambas plataformas. En desktop cuelga directo
  | del View raíz (la tabla interna hace scroll). En móvil/tablet
  | va dentro de un ScrollView de página (la tabla en modo cards
  | ya es expandida sin scroll interno). El fragment no añade
  | ningún nodo nativo: desktop queda idéntico.
  |
  */
  const cuerpo = (
    <>
      <PageHeader
        title="Vehículos"
        description="Registro, modificación y baja de vehículos con configuración de pisos y asientos."
        badge={`${vehiculosFiltrados.length} · ${filtroTexto}`}
        rightContent={
          <View style={styles.headerActions}>
            <Visibility action="Ver" selector=".vehiculos-refrescar">
              <Button
                title="Actualizar"
                variant="secondary"
                loading={loading}
                disabled={saving || deletingId !== null}
                onPress={() => void refresh()}
              />
            </Visibility>
            <Visibility action="Crear" selector=".vehiculos-crear">
              <Button
                title="Nuevo vehículo"
                disabled={saving || deletingId !== null}
                onPress={abrirCrear}
              />
            </Visibility>
            <Visibility action="Ver" selector=".vehiculos-categorias">
              <Button
                title="Categorías"
                variant="secondary"
                onPress={() => setCategoriasVisible(true)}
              />
            </Visibility>
          </View>
        }
      />

      {/* Tarjetas resumen: en móvil/tablet apilan a toda la línea (patrón Pasajes) */}
      <View style={[styles.summary, !isDesktop && styles.summaryMobile]}>
        <SummaryFilterCard
          active={filtro === "TODOS"}
          onPress={() => setFiltro("TODOS")}
          icon={<Bus size={20} color={c.primary} />}
          value={resumen.total}
          label="Total"
        />
        <SummaryFilterCard
          active={filtro === "Operativo"}
          onPress={() => setFiltro("Operativo")}
          icon={<CarTaxiFront size={20} color={c.success} />}
          value={resumen.operativos}
          label="Operativos"
        />
        <SummaryFilterCard
          active={filtro === "En mantenimiento"}
          onPress={() => setFiltro("En mantenimiento")}
          icon={<Wrench size={20} color={c.warning} />}
          value={resumen.enMantenimiento}
          label="En mantenimiento"
        />
        <SummaryFilterCard
          active={filtro === "Baja"}
          onPress={() => setFiltro("Baja")}
          icon={<Trash2 size={20} color={c.destructive} />}
          value={resumen.bajas}
          label="Bajas"
        />
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por placa, tipo, marca, modelo, categoría..."
      />

      <View
        style={[styles.tableContainer, !isDesktop && styles.tableContainerMobile]}
      >
        <Table<Vehiculo>
          data={vehiculosFiltrados}
          columns={columns}
          loading={loading}
          columnGap={1}
          horizontalPadding={5}
          cellPaddingHorizontal={2}
          keyExtractor={(item) => String(item.id)}
          emptyMessage="No existen vehículos para este filtro."
          renderCell={(item, column) => {
            switch (column.key) {
              case "placa":
                return (
                  <ThemedText style={styles.cellBold}>{item.placa}</ThemedText>
                );
              case "tipo":
                return (
                  <ThemedText style={styles.cellText}>{item.tipo}</ThemedText>
                );
              case "marca":
                return (
                  <ThemedText style={styles.cellText}>{item.marca}</ThemedText>
                );
              case "modelo":
                return (
                  <ThemedText style={styles.cellText}>{item.modelo}</ThemedText>
                );
              case "categoria":
                return (
                  <Badge
                    label={item.categoria?.categoria ?? "—"}
                    variant="info"
                  />
                );
              case "capacidad":
                return (
                  <ThemedText style={styles.cellText}>
                    {item.capacidad}
                  </ThemedText>
                );
              case "estado":
                return (
                  <Badge
                    label={item.estado}
                    variant={
                      item.estado === "Operativo"
                        ? "success"
                        : item.estado === "En mantenimiento"
                          ? "warning"
                          : "destructive"
                    }
                  />
                );
              case "propietario":
                return (
                  <ThemedText style={styles.cellText}>
                    {item.propietario?.nombre_completo ?? "—"}
                  </ThemedText>
                );
              case "acciones":
                return (
                  <View style={styles.actions}>
                    <Visibility action="Editar" selector=".vehiculos-editar">
                      <IconButton
                        icon={Pencil}
                        size="sm"
                        variant="secondary"
                        accessibilityLabel="Editar vehículo"
                        disabled={saving || deletingId !== null}
                        onPress={() => abrirEditar(item)}
                      />
                    </Visibility>
                    <Visibility action="Eliminar" selector=".vehiculos-baja">
                      <IconButton
                        icon={Trash2}
                        size="sm"
                        variant="destructive"
                        accessibilityLabel="Dar de baja"
                        loading={deletingId === item.id}
                        disabled={item.estado === "Baja" || saving}
                        onPress={() => setBajaVehiculo(item)}
                      />
                    </Visibility>
                  </View>
                );
              default:
                return null;
            }
          }}
        />
      </View>
    </>
  );

  const modales = (
    <>
      <VehiculoFormModal
        visible={formVisible}
        vehiculo={editing}
        saving={saving}
        onClose={cerrarForm}
        onSubmit={guardar}
      />

      <VehiculoBajaModal
        visible={!!bajaVehiculo}
        vehiculo={bajaVehiculo}
        loading={bajaVehiculo ? deletingId === bajaVehiculo.id : false}
        onClose={() => {
          if (deletingId === null) setBajaVehiculo(null);
        }}
        onConfirm={confirmarBaja}
      />

      <CategoriasVehiculoModal
        visible={categoriasVisible}
        onClose={() => setCategoriasVisible(false)}
      />
    </>
  );

  if (!isDesktop) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <ScrollView
          style={styles.mobileScroll}
          contentContainerStyle={styles.mobileScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {cuerpo}
        </ScrollView>
        {modales}
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      {cuerpo}
      {modales}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    padding: 18,
    gap: 12,
  },
  headerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summary: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryMobile: {
    flexDirection: "column",
    flexWrap: "nowrap",
  },
  summaryPressable: {
    flex: 1,
    minWidth: 140,
  },
  summaryCard: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryContent: {
    gap: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "900",
  },
  tableContainer: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    overflow: "hidden",
  },
  tableContainerMobile: {
    flex: 0,
  },
  mobileScroll: {
    flex: 1,
    minWidth: 0,
  },
  mobileScrollContent: {
    gap: 12,
    paddingBottom: 24,
  },
  cellText: {
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  cellBold: {
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
  },
  actions: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
});
