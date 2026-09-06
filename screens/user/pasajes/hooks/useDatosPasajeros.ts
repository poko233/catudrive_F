// hooks/useDatosPasajeros.ts
import { useState, useCallback } from "react";

export interface DatosPasajero {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nacionalidad: string;
  fechaNacimiento: string;
  genero: string;
  telefono: string;
  email: string;
  requiereAsistencia: boolean;
  viajaMenor: boolean;
}

const emptyPasajero: DatosPasajero = {
  nombres: "",
  apellidos: "",
  tipoDocumento: "CI",
  numeroDocumento: "",
  nacionalidad: "Bolivia (BO)",
  fechaNacimiento: "",
  genero: "Masculino",
  telefono: "",
  email: "",
  requiereAsistencia: false,
  viajaMenor: false,
};

export function useDatosPasajeros(cantidadPasajeros: number) {
  const [pasajeros, setPasajeros] = useState<DatosPasajero[]>(
    Array.from({ length: cantidadPasajeros }, () => ({ ...emptyPasajero })),
  );

  const actualizar = useCallback(
    (index: number, campo: keyof DatosPasajero, valor: string | boolean) => {
      setPasajeros((prev) =>
        prev.map((p, i) => (i === index ? { ...p, [campo]: valor } : p)),
      );
    },
    [],
  );

  const reset = useCallback(() => {
    setPasajeros(
      Array.from({ length: cantidadPasajeros }, () => ({ ...emptyPasajero })),
    );
  }, [cantidadPasajeros]);

  return { pasajeros, actualizar, reset };
}
