// screens/user/pasajes/components/ResponsiveActionButton.tsx

import React from "react";
import type { LucideIcon } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import {
  IconButton,
  type IconButtonVariant,
} from "@/components/ui/IconButton";
import { useResponsive } from "@/hooks/useResponsive";

/*
|--------------------------------------------------------------------------
| BOTÓN RESPONSIVE (solo móvil cambia)
|--------------------------------------------------------------------------
|
| Desktop: Button con texto (sin cambios visuales).
| Móvil: IconButton circular grande (pill) con micro-
| interacción de pulsación (scale nativo de IconButton),
| sin texto donde el icono es intuitivo. Sensación de
| app nativa en vez de web adaptada.
|
*/

interface Props {
  title: string;
  icon: LucideIcon;
  onPress: () => void;
  variant?: IconButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function ResponsiveActionButton({
  title,
  icon,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  accessibilityLabel,
}: Props) {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return (
      <IconButton
        icon={icon}
        size="lg"
        rounded
        variant={variant}
        loading={loading}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel ?? title}
        onPress={onPress}
      />
    );
  }

  return (
    <Button
      title={title}
      variant={variant}
      loading={loading}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    />
  );
}
