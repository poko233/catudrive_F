// screens/admin/empresa/types/empresa.types.ts

export type EstadoEmpresa =
  | "Activo"
  | "Inactivo";

export type EmpresaImageType =
  | "logo_cuadrado"
  | "logo_largo"
  | "icono"
  | "banner";

export type EmpresaUploadFile = {
  uri: string;
  name: string;
  type: string;
};

export interface Empresa {
  id: number;

  empresa: string;

  slogan?: string | null;

  sigla?: string | null;

  telefono?: string | null;

  celular?: string | null;

  email?: string | null;

  direccion?: string | null;

  responsable?: string | null;

  latitud?: string | null;

  longitud?: string | null;

  objeto?: string | null;

  mision?: string | null;

  vision?: string | null;

  estado: EstadoEmpresa;

  redes: {
    facebook?: string | null;
    instagram?: string | null;
    tiktok?: string | null;
    linkedin?: string | null;
  };

  carrito?: string | null;

  tipo_cambio?: number | null;

  logos: {
    cuadrado?: string | null;
    largo?: string | null;
    baner?: string | null;
    icono?: string | null;
  };

  cierre: {
    titulo?: string | null;
    mensaje?: string | null;
  };

  inicio: {
    titulo?: string | null;
    mensaje?: string | null;
  };

  dominio?: string | null;

  smtp_correo?: string | null;

  correo_institucional?: string | null;
}

export interface EmpresaFormData {
  empresa: string;

  sigla?: string;

  responsable?: string;

  email?: string;

  telefono?: string;

  celular?: string;

  direccion?: string;

  tipo_cambio?:
    | number
    | string;
}

export interface EmpresaApiResponse {
  data: Empresa;

  message?: string;
}