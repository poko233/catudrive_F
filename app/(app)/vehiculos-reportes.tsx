import VehiculoReportesScreen from "../../screens/user/vehiculos/reportes/VehiculoReportesScreen";
import { PrinterConnectionProvider } from "../../components/PrinterConnection";

export default function VehiculoReportesRoute() {
    return (
        <PrinterConnectionProvider>
            <VehiculoReportesScreen />
        </PrinterConnectionProvider>
    );
}
