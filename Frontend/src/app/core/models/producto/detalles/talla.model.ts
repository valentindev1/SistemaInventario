export interface TallaCrearDTO {
  nombre: string;
  empresaId: number;
}

export interface TallaEditarDTO {
  nombre: string;
}

export interface TallaObtenerDTO {
  id: number;
  nombre: string;
  empresaId: number;
  empresaNombre: string;
  fechaCreacion: string;
}
