export interface IngresoInventarioItemDTO {
  productoId: number;
  cantidad: number;
  costoUnitario: number;
  precioVenta: number;
}

export interface IngresoInventarioDTO {
  sucursalId: number;
  motivo?: string;
  items: IngresoInventarioItemDTO[];
}

export interface AjusteInventarioDTO {
  sucursalId: number;
  productoId: number;
  cantidad: number;
  motivo?: string;
}

export interface InventarioAdminDTO {
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

  costoUnitario: number;
  precioVenta: number;

  valorCostoTotal: number;
  valorVentaTotal: number;
  utilidadProyectada: number;
}

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
  valorVentaTotal: number;
}

export interface MovimientoInventarioDTO {
  id: number;

  tipo: string;

  productoId: number;
  productoCodigo: string;
  productoNombre: string;

  sucursalId: number;
  sucursalNombre: string;

  cantidad: number;
  stockAntes: number;
  stockDespues: number;

  costoUnitarioMomento: number;
  precioVentaMomento: number;

  usuarioId: number;
  usuarioNombre: string;
  usuarioRol: string;

  motivo?: string;
  referenciaId?: number;

  fecha: string;
}

export interface ResumenInventarioSucursalDTO {
  sucursalId: number;
  sucursalNombre: string;

  cantidadReferencias: number;
  cantidadUnidades: number;

  valorCostoTotal: number;
  valorVentaTotal: number;
  utilidadProyectada: number;
}
