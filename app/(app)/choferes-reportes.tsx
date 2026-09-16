import ChoferReportesScreen from "../../screens/user/choferes/reportes/ChoferReportesScreen";

import {
  PrinterConnectionProvider,
} from "../../components/PrinterConnection";

export default function ChoferReportesRoute() {
  return (
    <PrinterConnectionProvider>
      <ChoferReportesScreen />
    </PrinterConnectionProvider>
  );
}
