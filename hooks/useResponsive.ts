import { Platform, useWindowDimensions } from "react-native";

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isMobile = Platform.OS !== "web" || width < 768;
  const isTablet = Platform.OS === "web" && width >= 768 && width < 1024;
  const isDesktop = Platform.OS === "web" && width >= 1024;

  return {
    isMobile,
    isTablet,
    isDesktop,
    width,
    height,
  };
};
