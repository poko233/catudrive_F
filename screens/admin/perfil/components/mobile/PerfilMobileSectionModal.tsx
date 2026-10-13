// screens/admin/perfil/components/mobile/PerfilMobileSectionModal.tsx
//
// Wrapper delgado sobre components/ui/Modal para las secciones del perfil
// que NO cambian de tema desde dentro (Información Personal, QR).
// Se usa el Modal nativo porque tiene mejor comportamiento full-screen,
// scroll y dismissal en mobile.

import type { ReactNode } from "react";
import { useWindowDimensions } from "react-native";

import { Modal } from "@/components/ui/Modal";

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function PerfilMobileSectionModal({
  visible,
  title,
  onClose,
  children,
}: Props) {
  const { height } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      title={title}
      onClose={onClose}
      width="100%"
      maxWidth={640}
      maxHeight={Math.round(height * 0.92)}
      contentPadding={16}
      closeOnBackdropPress
      scrollable
    >
      {children}
    </Modal>
  );
}

export default PerfilMobileSectionModal;
