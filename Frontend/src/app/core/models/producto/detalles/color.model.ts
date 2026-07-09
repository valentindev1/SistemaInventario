export interface ColorCrearDTO {
  nombre: string;
  empresaId: number;
}

export interface ColorEditarDTO {
  nombre: string;
}

export interface ColorObtenerDTO {
  id: number;
  nombre: string;
  empresaId: number;
  empresaNombre: string;
  fechaCreacion: string;
}
