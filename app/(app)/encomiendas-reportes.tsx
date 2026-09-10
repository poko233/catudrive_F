import EncomiendaReportesScreen from "../../screens/user/encomiendas/reportes/EncomiendaReportesScreen";
import { PrinterConnectionProvider } from "../../components/PrinterConnection";

export default function EncomiendaReportesRoute() {
    return (
        <PrinterConnectionProvider>
            <EncomiendaReportesScreen />
        </PrinterConnectionProvider>
    );
}
