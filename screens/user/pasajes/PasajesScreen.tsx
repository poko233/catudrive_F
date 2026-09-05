import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/theme/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Visibility } from "@/components/Visibility";
import { usePermiso } from "@/hooks/usePermiso";
import { haptics } from "@/animations/haptics";
import { usePasajesStore } from "@/screens/user/pasajes/store/pasajesStore";
import { Viaje } from "./types/pasajes.types";
import { useViajes } from "./hooks/useViajes";
import { useAsientos, useAsientoSeleccionado } from "./hooks/useAsientos";
import { useVenta } from "./hooks/useVenta";
import { ViajeCard } from "./components/ViajeCard";
import { BusMap } from "./components/BusMap";
import { FormularioPasajero } from "./components/FormularioPasajero";
import { ResumenCompra } from "./components/ResumenCompra";
import { MetodoPagoSelector } from "./components/MetodoPagoSelector";
import { FacturacionForm } from "./components/FacturacionForm";
import { FiltroInput } from "./components/FiltroInput";
import { ModalNuevoViaje } from "./components/ModalNuevoViaje";

enum Paso {
  BuscarViaje = 1,
  SeleccionAsientos = 2,
  DatosPasajeros = 3,
  PagoConfirmacion = 4,
}

export function PasajesScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { isDesktop } = useResponsive();

  // Estado global Zustand
  const {
    viajeSeleccionado,
    setViajeSeleccionado,
    asientosSeleccionados,
    toggleAsiento,
    clearAsientos,
    pasajeros,
    actualizarPasajero,
    resetPasajeros,
    precios,
    setPrecios,
    setPrecioAsiento,
    aplicarPrecioATodos,
    metodoPago,
    setMetodoPago,
    resetAll,
  } = usePasajesStore();

  const [pasoActual, setPasoActual] = useState<Paso>(Paso.BuscarViaje);
  const [filtros, setFiltros] = useState({
    origen: "",
    destino: "",
    fecha: "",
  });
  const [modalCrearViaje, setModalCrearViaje] = useState(false);

  const { viajes, loading, error, changeFiltros } = useViajes();
  const { pisos, loading: loadingAsientos } = useAsientos(
    viajeSeleccionado?.id ?? null,
  );
  const { loading: loadingVenta, iniciar, confirmar } = useVenta();

  const puedeVer = usePermiso("Ventas", "Pasajes", "Ver");
  const puedeCrear = usePermiso("Ventas", "Pasajes", "Crear");
  const puedeEditar = usePermiso("Ventas", "Pasajes", "Editar");

  const handleSeleccionarViaje = (viaje: Viaje) => {
    haptics.selection();
    setViajeSeleccionado(viaje);
    setPasoActual(Paso.SeleccionAsientos);
  };

  const handleSeleccionarAsientos = () => {
    if (asientosSeleccionados.length === 0) return;
    haptics.selection();
    // Inicializar pasajeros
    resetPasajeros(asientosSeleccionados.length);
    // Inicializar precios con tarifa base
    const tarifa = viajeSeleccionado ? parseFloat(viajeSeleccionado.tarifa) : 0;
    const nuevosPrecios = {};
    asientosSeleccionados.forEach((a) => {
      nuevosPrecios[a.id] = tarifa;
    });
    setPrecios(nuevosPrecios);
    setPasoActual(Paso.DatosPasajeros);
  };

  const handleContinuarPago = () => {
    haptics.selection();
    setPasoActual(Paso.PagoConfirmacion);
  };

  const handleConfirmarPago = async (metodo: "qr" | "tarjeta" | "efectivo") => {
    if (!viajeSeleccionado) return;
    try {
      const asientosPayload = asientosSeleccionados.map((a) => ({
        id_asiento: a.id,
        precio_unitario: parseFloat(viajeSeleccionado.tarifa),
      }));
      const venta = await iniciar(viajeSeleccionado.id, asientosPayload);
      const formaPago =
        metodo === "qr"
          ? "QR Simple"
          : metodo === "tarjeta"
            ? "Tarjeta"
            : "Efectivo";
      await confirmar(formaPago);
      haptics.success();
      // Aquí puedes descargar PDF o mostrar modal de éxito
    } catch (err) {
      haptics.error();
    }
  };

  const handleBack = () => {
    haptics.selection();
    if (pasoActual === Paso.SeleccionAsientos) {
      setViajeSeleccionado(null);
      clearAsientos();
      setPasoActual(Paso.BuscarViaje);
    } else if (pasoActual === Paso.DatosPasajeros) {
      setPasoActual(Paso.SeleccionAsientos);
    } else if (pasoActual === Paso.PagoConfirmacion) {
      setPasoActual(Paso.DatosPasajeros);
    }
  };

  const handleViajeCreado = () => {
    changeFiltros({
      ...filtros,
      fecha: filtros.fecha || undefined,
      per_page: 15,
    });
  };

  const renderStep = () => {
    switch (pasoActual) {
      case Paso.BuscarViaje:
        return (
          <View style={styles.stepContainer}>
            <Card style={styles.filtrosCard}>
              <View style={styles.filtrosRow}>
                <FiltroInput
                  value={filtros.origen}
                  onChangeText={(v) =>
                    setFiltros((prev) => ({ ...prev, origen: v }))
                  }
                  placeholder="Origen"
                />
                <FiltroInput
                  value={filtros.destino}
                  onChangeText={(v) =>
                    setFiltros((prev) => ({ ...prev, destino: v }))
                  }
                  placeholder="Destino"
                />
                <Button
                  title={filtros.fecha || "Fecha"}
                  variant="secondary"
                  onPress={() => {
                    const hoy = new Date().toISOString().split("T")[0];
                    setFiltros((prev) => ({ ...prev, fecha: hoy }));
                  }}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button
                  title="Buscar"
                  onPress={() =>
                    changeFiltros({
                      ...filtros,
                      fecha: filtros.fecha || undefined,
                      per_page: 15,
                    })
                  }
                />
                <Visibility action="Crear">
                  <Button
                    title="Nuevo Viaje"
                    variant="secondary"
                    onPress={() => setModalCrearViaje(true)}
                  />
                </Visibility>
              </View>
            </Card>

            {loading ? (
              <ActivityIndicator color={c.primary} size="large" />
            ) : error ? (
              <Text style={{ color: c.destructive, textAlign: "center" }}>
                {error}
              </Text>
            ) : viajes.length === 0 ? (
              <Text style={{ color: c.textSecondary, textAlign: "center" }}>
                No se encontraron viajes
              </Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {viajes.map((viaje, index) => (
                  <ViajeCard
                    key={viaje.id}
                    viaje={viaje}
                    index={index}
                    onSeleccionar={handleSeleccionarViaje}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        );

      case Paso.SeleccionAsientos:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={[styles.stepTitle, { color: c.text }]}>
                Selecciona tus asientos
              </Text>
              <Badge
                label={`${asientosSeleccionados.length} seleccionados`}
                variant="info"
              />
            </View>
            {loadingAsientos ? (
              <ActivityIndicator color={c.primary} />
            ) : (
              <BusMap
                pisos={pisos}
                asientosSeleccionados={asientosSeleccionados}
                onToggleSeleccion={toggleAsiento}
              />
            )}
            <View style={styles.bottomBar}>
              <Button title="Volver" variant="secondary" onPress={handleBack} />
              <Visibility action="Crear">
                <Button
                  title="Continuar"
                  disabled={asientosSeleccionados.length === 0}
                  onPress={handleSeleccionarAsientos}
                />
              </Visibility>
            </View>
          </View>
        );

      case Paso.DatosPasajeros:
        return (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <Text style={[styles.stepTitle, { color: c.text }]}>
                  Datos de Pasajeros
                </Text>
                <Badge
                  label={`${asientosSeleccionados.length} pasajeros`}
                  variant="info"
                />
              </View>
              <View style={isDesktop ? styles.twoColumns : styles.oneColumn}>
                <View style={styles.leftColumn}>
                  {asientosSeleccionados.map((asiento, index) => (
                    <FormularioPasajero
                      key={asiento.id}
                      titulo={`Pasajero ${index + 1}`}
                      asientoLabel={`Asiento ${asiento.numero_asiento ?? asiento.id}`}
                      datos={pasajeros[index]}
                      onChange={(campo, valor) =>
                        actualizarPasajero(index, campo, valor)
                      }
                      esPrincipal={index === 0}
                      precio={
                        precios[asiento.id] ??
                        parseFloat(viajeSeleccionado?.tarifa ?? "0")
                      }
                      onPrecioChange={(precio) =>
                        setPrecioAsiento(asiento.id, precio)
                      }
                      onTodosIguales={aplicarPrecioATodos}
                    />
                  ))}
                </View>
                <View style={styles.rightColumn}>
                  <ResumenCompra
                    viaje={viajeSeleccionado}
                    asientos={asientosSeleccionados}
                    precios={precios}
                  />
                </View>
              </View>
              <View style={styles.bottomBar}>
                <Button
                  title="Volver"
                  variant="secondary"
                  onPress={handleBack}
                />
                <Button
                  title="Continuar al Pago"
                  onPress={handleContinuarPago}
                />
              </View>
            </View>
          </ScrollView>
        );

      case Paso.PagoConfirmacion:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={[styles.stepTitle, { color: c.text }]}>
                Pago y Confirmación
              </Text>
            </View>
            <View style={isDesktop ? styles.twoColumns : styles.oneColumn}>
              <View style={styles.leftColumn}>
                <MetodoPagoSelector
                  onSelect={setMetodoPago}
                  valorInicial={metodoPago}
                />
                <FacturacionForm />
              </View>
              <View style={styles.rightColumn}>
                <ResumenCompra
                  viaje={viajeSeleccionado}
                  asientos={asientosSeleccionados}
                />
                <Visibility action="Editar">
                  <Button
                    title="Confirmar y Pagar"
                    loading={loadingVenta}
                    onPress={() => handleConfirmarPago(metodoPago)}
                  />
                </Visibility>
              </View>
            </View>
            <View style={styles.bottomBar}>
              <Button title="Volver" variant="secondary" onPress={handleBack} />
            </View>
          </View>
        );
    }
  };

  if (!puedeVer) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <Text style={{ color: c.destructive }}>
          No tienes permiso para ver pasajes
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      {/* Header del wizard */}
      <View style={styles.wizardHeader}>
        <Text style={[styles.title, { color: c.text }]}>Compra de Pasajes</Text>
        <View style={styles.stepper}>
          {[1, 2, 3, 4].map((num) => (
            <View key={num} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor:
                      pasoActual === num ? c.primary : c.backgroundSecondary,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      pasoActual === num
                        ? c.primaryForeground
                        : c.textSecondary,
                  }}
                >
                  {num}
                </Text>
              </View>
              <Text style={{ fontSize: 10, color: c.textSecondary }}>
                {num === 1
                  ? "Buscar"
                  : num === 2
                    ? "Asientos"
                    : num === 3
                      ? "Datos"
                      : "Pago"}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {renderStep()}

      <ModalNuevoViaje
        visible={modalCrearViaje}
        onClose={() => setModalCrearViaje(false)}
        onViajeCreado={handleViajeCreado}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
  },
  wizardHeader: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
  },
  stepper: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 12,
  },
  stepItem: {
    alignItems: "center",
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  stepContainer: {
    gap: 16,
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  filtrosCard: {
    gap: 12,
  },
  filtrosRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  twoColumns: {
    flexDirection: "row",
    gap: 16,
  },
  oneColumn: {
    flexDirection: "column",
    gap: 16,
  },
  leftColumn: {
    flex: 3,
    gap: 16,
  },
  rightColumn: {
    flex: 2,
    gap: 16,
  },
});
