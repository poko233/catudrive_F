import Toast from "react-native-toast-message";
import { CustomToast } from "./CustomToast";
const toastConfig = {
  success: (props: any) => <CustomToast {...props} />,
  error: (props: any) => <CustomToast {...props} />,
  info: (props: any) => <CustomToast {...props} />,
};
export const Toaster = () => {
  return (
    <Toast
      config={toastConfig}
      visibilityTime={5000}
      position="top"
      topOffset={60}
      bottomOffset={0}
    />
  );
};
