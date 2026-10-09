import { useWindowDimensions } from "react-native";
import { ArqueoScreen } from "../../screens/admin/arqueo/ArqueoScreen";
import { ArqueoMobileView } from "../../screens/admin/arqueo/components/ArqueoMobileView";

export default function ArqueoRoute() {
  const { width } = useWindowDimensions();
  return width < 768 ? <ArqueoMobileView /> : <ArqueoScreen />;
}
