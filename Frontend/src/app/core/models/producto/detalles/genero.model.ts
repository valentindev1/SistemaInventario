export interface GeneroCrearDTO {
  nombre: string;
  empresaId: number;
}

export interface GeneroEditarDTO {
  nombre: string;
}

export interface GeneroObtenerDTO {
  id: number;
  nombre: string;
  empresaId: number;
  empresaNombre: string;
  fechaCreacion: string;
}
