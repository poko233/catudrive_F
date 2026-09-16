import PerfilScreen from "../../screens/admin/perfil/PerfilScreen";

import {
  PrinterConnectionProvider,
} from "../../components/PrinterConnection";

export default function PerfilRoute() {
  return (
    <PrinterConnectionProvider
      autoConnect
      detectSunmiOnStart
    >
      <PerfilScreen />
    </PrinterConnectionProvider>
  );
}
