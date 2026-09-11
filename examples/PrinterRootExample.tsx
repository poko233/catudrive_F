import type {
  ReactNode,
} from "react";

import {
  PrinterAutoSetupModal,
  PrinterConnectionProvider,
} from "@/components/PrinterConnection";

interface Props {
  children:
    ReactNode;
}

/**
 * Ejemplo de integración global.
 *
 * Si ya tienes PrinterConnectionProvider en app/_layout.tsx,
 * solamente agrega PrinterAutoSetupModal dentro de él.
 */
export function PrinterRootExample({
  children,
}: Props) {
  return (
    <PrinterConnectionProvider
      autoConnect
      detectSunmiOnStart
    >
      {
        children
      }

      <PrinterAutoSetupModal />
    </PrinterConnectionProvider>
  );
}
