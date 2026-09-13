import { useCallback, useState } from "react";
import { useAuth } from "@/store/authStore";
import { registerUser } from "../services/register.service";
import type {
  RegisterFormData,
  RegisterResponse,
  ValidationErrors,
} from "../types/register.types";

const TOTAL_STEPS = 3;

// Validación por campo según el backend
const validateField = (name: keyof RegisterFormData, value: any): string => {
  switch (name) {
    case "usuario":
      if (!value.trim()) return "El usuario es obligatorio";
      if (value.length > 40) return "Máximo 40 caracteres";
      return "";
    case "password":
      if (!value) return "La contraseña es obligatoria";
      if (value.length < 6) return "Mínimo 6 caracteres";
      return "";
    case "roles":
      if (!value || value.length === 0) return "Seleccione al menos un rol";
      return "";
    case "nombres":
      if (!value.trim()) return "Obligatorio";
      if (value.length > 40) return "Máximo 40 caracteres";
      return "";
    case "apellidoPaterno":
      if (!value.trim()) return "Obligatorio";
      if (value.length > 50) return "Máximo 50 caracteres";
      return "";
    case "apellidoMaterno":
      if (value && value.length > 50) return "Máximo 50 caracteres";
      return "";
    case "ci":
      if (!value.trim()) return "Obligatorio";
      if (value.length > 12) return "Máximo 12 caracteres";
      return "";
    case "expedido":
      // opcional en backend, pero en el mockup es obligatorio; lo dejamos obligatorio
      if (!value) return "Seleccione un departamento";
      return "";
    case "genero":
      if (!value) return "Seleccione un género";
      return "";
    case "fecha_nac":
      if (!value) return "Obligatorio";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Formato inválido";
      return "";
    case "email":
      if (value && value.length > 80) return "Máximo 80 caracteres";
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Email inválido";
      return "";
    case "telefono":
    case "celular":
      if (value && value.length > 10) return "Máximo 10 caracteres";
      return "";
    case "direccion":
      if (value && value.length > 50) return "Máximo 50 caracteres";
      return "";
    default:
      return "";
  }
};

const initialForm: RegisterFormData = {
  usuario: "",
  password: "",
  roles: [],
  nombres: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  ci: "",
  expedido: "",
  genero: "",
  fecha_nac: "",
  email: "",
  telefono: "",
  celular: "",
  direccion: "",
};

export function useRegisterWizard() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [form, setForm] = useState<RegisterFormData>(initialForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<
    RegisterResponse["data"] | null
  >(null);
  const { user } = useAuth(); // por si se necesita

  const updateField = useCallback(
    (field: keyof RegisterFormData, value: any) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Limpiar error del campo si existe
      setErrors((prev) => {
        if (prev[field]) {
          const copy = { ...prev };
          delete copy[field];
          return copy;
        }
        return prev;
      });
      setServerError(null);
    },
    [],
  );

  const validateStep = useCallback(
    (stepIndex: number): boolean => {
      const newErrors: ValidationErrors = {};
      let fieldsToCheck: (keyof RegisterFormData)[] = [];
      if (stepIndex === 0) fieldsToCheck = ["usuario", "password", "roles"];
      else if (stepIndex === 1)
        fieldsToCheck = [
          "nombres",
          "apellidoPaterno",
          "ci",
          "expedido",
          "genero",
          "fecha_nac",
        ];
      else if (stepIndex === 2) fieldsToCheck = []; // todos opcionales aquí, pero igual podemos validar formato si hay datos

      // Para paso 3 solo validar si hay contenido incorrecto
      if (stepIndex === 2) {
        // validar email, teléfono, celular, dirección solo si no están vacíos
        ["email", "telefono", "celular", "direccion"].forEach((field) => {
          const val = form[field as keyof RegisterFormData];
          const error = validateField(field as keyof RegisterFormData, val);
          if (error) newErrors[field as keyof RegisterFormData] = error;
        });
      } else {
        fieldsToCheck.forEach((field) => {
          const val = form[field];
          const error = validateField(field, val);
          if (error) newErrors[field] = error;
        });
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [form],
  );

  const goNext = useCallback(() => {
    if (validateStep(step)) {
      setDirection("forward");
      setStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
    }
  }, [step, validateStep]);

  const goPrev = useCallback(() => {
    setDirection("backward");
    setStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setErrors({});
    setStep(0);
    setSuccessData(null);
    setServerError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(2)) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const response = await registerUser(form);
      setSuccessData(response.data);
      // Opcional: haptic
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      const message = err?.message || "Error inesperado";
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validateStep]);

  const isLastStep = step === TOTAL_STEPS - 1;
  const isFirstStep = step === 0;

  return {
    step,
    direction,
    form,
    errors,
    updateField,
    goNext,
    goPrev,
    handleSubmit,
    submitting,
    serverError,
    successData,
    resetForm,
    isLastStep,
    isFirstStep,
  };
}
