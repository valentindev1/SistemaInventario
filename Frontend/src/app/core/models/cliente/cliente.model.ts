export interface ClienteCrearDTO {
  empresaId: number;
  numeroDocumento: string;
  nombre: string;
  correo?: string | null;
  telefono?: string | null;
}

export interface ClienteEditarDTO {
  nombre: string;
  correo?: string | null;
  telefono?: string | null;
}

export interface ClienteObtenerDTO {
  id: number;

  empresaId: number;
  empresaNombre: string;

  numeroDocumento: string;
  nombre: string;

  correo?: string | null;
  telefono?: string | null;

  fechaCreacion: string;

  puedeModificar?: boolean;
  motivoBloqueo?: string | null;
}
