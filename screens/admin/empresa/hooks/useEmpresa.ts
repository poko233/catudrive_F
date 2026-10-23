// screens/admin/empresa/hooks/useEmpresa.ts

import { useCallback, useEffect, useState } from "react";
import Toast from "react-native-toast-message";

import { useEmpresaStore } from "@/store/empresaStore";

import { empresaService, getEmpresaCache } from "../services/empresaService";

import {
  Empresa,
  EmpresaFormData,
  EmpresaImageType,
  EmpresaUploadFile,
} from "../types/empresa.types";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useEmpresa() {
  const { updateIcono } = useEmpresaStore();

  const cached = getEmpresaCache();

  const [empresa, setEmpresa] = useState<Empresa | null>(() => cached);
  const [loading, setLoading] = useState(() => !cached);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processingImage, setProcessingImage] =
    useState<EmpresaImageType | null>(null);

  const cargarEmpresa = useCallback(
    async (force = false) => {
      if (force) setRefreshing(true);
      else if (!getEmpresaCache()) setLoading(true);

      try {
        const payload = await empresaService.getMiEmpresa({ force });
        setEmpresa(payload.empresa);
        updateIcono(payload.empresa.logos?.icono ?? null);
        return payload.empresa;
      } catch (error: unknown) {
        Toast.show({
          type: "error",
          text1: "Error al cargar empresa",
          text2: errorMessage(error, "Intenta nuevamente."),
        });
        return null;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [updateIcono],
  );

  const refrescarEmpresa = useCallback(async () => {
    await cargarEmpresa(true);
  }, [cargarEmpresa]);

  const guardarEmpresa = useCallback(
    async (form: EmpresaFormData): Promise<Empresa | null> => {
      if (!empresa) return null;

      try {
        setSaving(true);
        const updated = await empresaService.update(empresa.id, form);
        setEmpresa(updated);
        updateIcono(updated.logos?.icono ?? null);
        Toast.show({
          type: "success",
          text1: "Empresa actualizada",
          text2: "Los cambios fueron guardados correctamente.",
        });
        return updated;
      } catch (error: unknown) {
        Toast.show({
          type: "error",
          text1: "No se pudo guardar",
          text2: errorMessage(error, "Revisa los datos ingresados."),
        });
        return null;
      } finally {
        setSaving(false);
      }
    },
    [empresa, updateIcono],
  );

  const subirImagen = useCallback(
    async (
      tipo: EmpresaImageType,
      archivo: EmpresaUploadFile,
    ): Promise<Empresa | null> => {
      if (!empresa) return null;

      try {
        setProcessingImage(tipo);
        const updated = await empresaService.uploadImagen(
          empresa.id,
          tipo,
          archivo,
        );
        setEmpresa(updated);
        if (tipo === "icono") {
          updateIcono(updated.logos?.icono ?? null);
        }
        Toast.show({ type: "success", text1: "Imagen actualizada" });
        return updated;
      } catch (error: unknown) {
        Toast.show({
          type: "error",
          text1: "No se pudo subir la imagen",
          text2: errorMessage(error, "Intenta nuevamente."),
        });
        return null;
      } finally {
        setProcessingImage(null);
      }
    },
    [empresa, updateIcono],
  );

  const eliminarImagen = useCallback(
    async (tipo: EmpresaImageType): Promise<Empresa | null> => {
      if (!empresa) return null;

      try {
        setProcessingImage(tipo);
        const updated = await empresaService.deleteImagen(empresa.id, tipo);
        setEmpresa(updated);
        if (tipo === "icono") updateIcono(null);
        Toast.show({ type: "success", text1: "Imagen eliminada" });
        return updated;
      } catch (error: unknown) {
        Toast.show({
          type: "error",
          text1: "No se pudo eliminar la imagen",
          text2: errorMessage(error, "Intenta nuevamente."),
        });
        return null;
      } finally {
        setProcessingImage(null);
      }
    },
    [empresa, updateIcono],
  );

  useEffect(() => {
    void cargarEmpresa();
  }, [cargarEmpresa]);

  return {
    empresa,
    loading,
    refreshing,
    saving,
    processingImage,
    refrescarEmpresa,
    guardarEmpresa,
    subirImagen,
    eliminarImagen,
    // ⚠️ guardarApiToken se ELIMINÓ de aquí. Vive en sucursalService
    // y se consume desde SucursalApiTokenModal.
  };
}

export default useEmpresa;
