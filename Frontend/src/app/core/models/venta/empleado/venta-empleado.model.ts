export type EstadoFactura =
  | 'ACTIVA'
  | 'CANCELADA'
  | 'DEVUELTA_PARCIAL'
  | 'DEVUELTA_TOTAL';

export interface DetalleFacturaVentaEmpleadoDTO {
  productoId: number;
  productoCodigo: string;
  productoNombre: string;

  cantidad: number;
  cantidadDevuelta: number;
  cantidadDisponibleDevolucion: number;

  precioUnitarioMomento: number;
  subtotal: number;
}

export interface FacturaVentaEmpleadoDTO {
  id: number;
  numeroVenta: string;

  sucursalId: number;
  sucursalNombre: string;

  usuarioId: number;
  usuarioNombre: string;

  clienteId: number | null;
  clienteNombre: string;
  clienteDocumento: string;

  estado: EstadoFactura;

  descuento: number;
  subtotal: number;
  total: number;

  observacion?: string;
  fechaVenta: string;

  detalles: DetalleFacturaVentaEmpleadoDTO[];
}

export interface VentaHistorialEmpleadoDTO {
  id: number;
  numeroVenta: string;

  usuarioId: number | null;
  usuarioNombre: string;

  clienteNombre: string;
  clienteDocumento: string;

  estado: EstadoFactura;

  subtotal: number;
  descuento: number;
  total: number;

  fechaVenta: string;
}
