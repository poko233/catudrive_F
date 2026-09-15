import VentaReportesScreen from "../../screens/user/pasajes/reportes/VentaReportesScreen";
import { PrinterConnectionProvider } from "../../components/PrinterConnection";

export default function VentaReportesRoute() {
    return (
        <PrinterConnectionProvider>
            <VentaReportesScreen />
        </PrinterConnectionProvider>
    );
}
