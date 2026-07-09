export interface SucursalCrearDTO {
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  empresaNit: string;
}

export interface SucursalEditarDTO {
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono: string;
}

export interface SucursalObtenerDTO {
  id: number;
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  fechaCreacion: string;
  empresaNit: string;
  empresaNombre: string;
}
