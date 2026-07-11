export interface InventarioEmpleadoDTO {
  inventarioId: number;

  sucursalId: number;
  sucursalNombre: string;

  productoId: number;
  codigo: string;
  nombre: string;
  descripcion: string;

  categoria: string;
  color: string;
  talla: string;
  genero: string;

  stockActual: number;

  precioVenta: number;
}
