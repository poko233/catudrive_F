import { create } from "zustand";
import {
  Viaje,
  Asiento,
  Venta,
} from "@/screens/user/pasajes/types/pasajes.types";

export interface DatosPasajero {
  id_pasajero: number | null;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  ci: string;
}

const initialPasajero: DatosPasajero = {
  id_pasajero: null,
  nombres: "",
  apellido_paterno: "",
  apellido_materno: "",
  ci: "",
};

export interface PreciosAsiento {
  [asientoId: number]: number;
}

type ValorDatoPasajero =
  | string
  | number
  | null;

interface PasajesState {
  viajeSeleccionado: Viaje | null;
  setViajeSeleccionado: (viaje: Viaje | null) => void;

  asientosSeleccionados: Asiento[];
  setAsientosSeleccionados: (asientos: Asiento[]) => void;
  toggleAsiento: (asiento: Asiento) => void;
  clearAsientos: () => void;

  precios: PreciosAsiento;
  setPrecios: (precios: PreciosAsiento) => void;
  setPrecioAsiento: (asientoId: number, precio: number) => void;
  aplicarPrecioATodos: (precio: number) => void;

  ventaActual: Venta | null;
  setVentaActual: (venta: Venta | null) => void;
  clearVenta: () => void;

  pasajeros: DatosPasajero[];
  setPasajeros: (pasajeros: DatosPasajero[]) => void;
  actualizarPasajero: (
    index: number,
    campo: keyof DatosPasajero,
    valor: ValorDatoPasajero,
  ) => void;
  aplicarDatoATodos: (campo: keyof DatosPasajero, valor: string) => void;
  resetPasajeros: (cantidad?: number) => void;

  metodoPago: "qr" | "tarjeta" | "efectivo";
  setMetodoPago: (metodo: "qr" | "tarjeta" | "efectivo") => void;

  datosFacturacion: {
    emitirFactura: boolean;
    razonSocial: string;
    nit: string;
    email: string;
  };
  setDatosFacturacion: (
    datos: Partial<{
      emitirFactura: boolean;
      razonSocial: string;
      nit: string;
      email: string;
    }>,
  ) => void;

  resetAll: () => void;
}

export const usePasajesStore = create<PasajesState>((set, get) => ({
  viajeSeleccionado: null,
  setViajeSeleccionado: (viaje) => set({ viajeSeleccionado: viaje }),

  asientosSeleccionados: [],
  setAsientosSeleccionados: (asientos) =>
    set({ asientosSeleccionados: asientos }),

  toggleAsiento: (asiento) => {
    const existe =
      get().asientosSeleccionados.some((a) => a.id === asiento.id);

    if (existe) {
      set({
        asientosSeleccionados:
          get().asientosSeleccionados.filter((a) => a.id !== asiento.id),
      });
    } else {
      set({
        asientosSeleccionados: [
          ...get().asientosSeleccionados,
          asiento,
        ],
      });
    }
  },

  clearAsientos: () => set({ asientosSeleccionados: [] }),

  precios: {},
  setPrecios: (precios) => set({ precios }),

  setPrecioAsiento: (asientoId, precio) => {
    set({
      precios: {
        ...get().precios,
        [asientoId]: precio,
      },
    });
  },

  aplicarPrecioATodos: (precio) => {
    const nuevosPrecios: PreciosAsiento = {};

    get().asientosSeleccionados.forEach((asiento) => {
      nuevosPrecios[asiento.id] = precio;
    });

    set({ precios: nuevosPrecios });
  },

  ventaActual: null,
  setVentaActual: (venta) => set({ ventaActual: venta }),
  clearVenta: () => set({ ventaActual: null }),

  pasajeros: [],
  setPasajeros: (pasajeros) => set({ pasajeros }),

  actualizarPasajero: (index, campo, valor) => {
    set({
      pasajeros:
        get().pasajeros.map((p, i) =>
          i === index
            ? {
                ...p,
                [campo]: valor,
              }
            : p,
        ),
    });
  },

  aplicarDatoATodos: (campo, valor) => {
    if (campo === "id_pasajero") {
      return;
    }

    set({
      pasajeros:
        get().pasajeros.map((p) => ({
          ...p,
          [campo]: valor,
        })),
    });
  },

  resetPasajeros: (cantidad = 0) => {
    set({
      pasajeros:
        Array.from(
          { length: cantidad },
          () => ({ ...initialPasajero }),
        ),
    });
  },

  metodoPago: "qr",
  setMetodoPago: (metodo) => set({ metodoPago: metodo }),

  datosFacturacion: {
    emitirFactura: false,
    razonSocial: "",
    nit: "",
    email: "",
  },

  setDatosFacturacion: (datos) =>
    set({
      datosFacturacion: {
        ...get().datosFacturacion,
        ...datos,
      },
    }),

  resetAll: () =>
    set({
      viajeSeleccionado: null,
      asientosSeleccionados: [],
      precios: {},
      ventaActual: null,
      pasajeros: [],
      metodoPago: "qr",
      datosFacturacion: {
        emitirFactura: false,
        razonSocial: "",
        nit: "",
        email: "",
      },
    }),
}));
