// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// 1. Obtén la configuración por defecto de Expo
const config = getDefaultConfig(__dirname);

// 2. Añade la regla para forzar tslib a usar la versión CommonJS (necesaria para moti/framer-motion en web)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "tslib") {
    return {
      type: "sourceFile",
      filePath: path.join(__dirname, "node_modules", "tslib", "tslib.js"),
    };
  }
  // Para el resto de módulos, delegar en la resolución por defecto
  return context.resolveRequest(context, moduleName, platform);
};

// 3. Envuelve la configuración con NativeWind y exporta
module.exports = withNativeWind(config, { input: "./global.css" });
