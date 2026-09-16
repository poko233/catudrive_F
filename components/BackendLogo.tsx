// components/BackendLogo.tsx
// Logo largo de empresa desde backend con fallback local.
// Mismo patron que SidebarFooter: pide
//   {PUBLIC_BACKEND_URL}/empresa/empresa_1_logo_largo.webp
// y si falla muestra el icon local de assets.
import { Image } from "expo-image";
import React, { useState } from "react";
import { ImageStyle, StyleProp } from "react-native";
import iconImg from "../assets/images/icon.png";

const RAW_API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

const PUBLIC_BACKEND_URL = RAW_API_URL.replace(/\/api$/i, "");

export const LOGO_LARGO_URL = PUBLIC_BACKEND_URL
  ? `${PUBLIC_BACKEND_URL}/empresa/empresa_1_logo_largo.webp`
  : null;

interface Props {
  style?: StyleProp<ImageStyle>;
  contentFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

export const BackendLogo: React.FC<Props> = ({
  style,
  contentFit = "contain",
}) => {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <Image
      source={logoFailed || !LOGO_LARGO_URL ? iconImg : { uri: LOGO_LARGO_URL }}
      style={style}
      contentFit={contentFit}
      contentPosition="center"
      cachePolicy="memory-disk"
      transition={200}
      onError={() => setLogoFailed(true)}
    />
  );
};

export default BackendLogo;
