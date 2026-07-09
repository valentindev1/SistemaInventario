export interface CategoriaCrearDTO {
  nombre: string;
  empresaId: number;
}

export interface CategoriaEditarDTO {
  nombre: string;
}

export interface CategoriaObtenerDTO {
  id: number;
  nombre: string;
  empresaId: number;
  empresaNombre: string;
  fechaCreacion: string;
}
