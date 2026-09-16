import AsignacionReportesScreen from "../../screens/user/asignacionesVehiculos/reportes/AsignacionReportesScreen";

import {
  PrinterConnectionProvider,
} from "../../components/PrinterConnection";

export default function AsignacionReportesRoute() {
  return (
    <PrinterConnectionProvider>
      <AsignacionReportesScreen />
    </PrinterConnectionProvider>
  );
}
