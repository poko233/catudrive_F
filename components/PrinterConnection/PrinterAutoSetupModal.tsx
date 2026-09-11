import {
  PrinterSetupModal,
} from "./PrinterSetupModal";

import {
  usePrinterConnection,
} from "./usePrinterConnection";

/*
|--------------------------------------------------------------------------
| AUTO SETUP MODAL
|--------------------------------------------------------------------------
|
| Móntalo UNA sola vez dentro de PrinterConnectionProvider, idealmente en
| el layout raíz. Cuando print(job) detecta:
|
| - que no existe predeterminada para ese formato,
| - que la predeterminada es incompatible,
| - o que la térmica guardada no está disponible,
|
| el Provider activa configurationRequired y este modal se abre solo.
|
*/

export function PrinterAutoSetupModal() {
  const {
    configurationRequired,
    requestedRequirement,
  } =
    usePrinterConnection();

  return (
    <PrinterSetupModal
      visible={
        configurationRequired
      }
      required
      requirement={
        requestedRequirement
      }
    />
  );
}
