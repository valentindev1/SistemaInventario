export type EstadoFactura =
  | 'ACTIVA'
  | 'CANCELADA'
  | 'DEVUELTA_PARCIAL'
  | 'DEVUELTA_TOTAL';

export type PeriodoInformeVentas =
  | 'DIA'
  | 'SEMANA'
  | 'MES';

export interface VentaItemDTO {
  productoId: number;
  cantidad: number;
}

export interface CrearVentaDTO {
  sucursalId: number;
  clienteId: number;
  observacion?: string;
  descuento?: number;
  items: VentaItemDTO[];
}

export interface DetalleFacturaVentaDTO {
  productoId: number;
  productoCodigo: string;
  productoNombre: string;

  cantidad: number;

  cantidadDevuelta: number;
  cantidadDisponibleDevolucion: number;

  costoUnitarioMomento: number;
  precioUnitarioMomento: number;

  subtotal: number;
}


export interface FacturaVentaDTO {
  id: number;
  numeroVenta: string;

  sucursalId: number;
  sucursalNombre: string;

  usuarioId: number;
  usuarioNombre: string;

  clienteId: number;
  clienteNombre: string;
  clienteDocumento: string;

  estado: EstadoFactura;
  descuento: number;
  subtotal: number;
  total: number;

  observacion?: string;

  fechaVenta: string;

  detalles: DetalleFacturaVentaDTO[];
}


export interface DevolucionVentaItemDTO {
  productoId: number;
  cantidad: number;
}

export interface DevolucionVentaDTO {
  motivo?: string;
  items: DevolucionVentaItemDTO[];
}

export interface ReporteVentasDiaDTO {
  fecha: string;

  cantidadVentas: number;
  cantidadProductosVendidos: number;

  subtotal: number;
  total: number;
  costoTotal: number;
  utilidad: number;
}

export interface InformeVentasDTO {
  periodo: PeriodoInformeVentas;

  fechaInicio: string;
  fechaFin: string;

  sucursalId: number;
  sucursalNombre: string;

  cantidadVentas: number;
  cantidadProductosVendidos: number;

  subtotal: number;
  total: number;
  costoTotal: number;
  utilidad: number;

  ventasPorDia: ReporteVentasDiaDTO[];
}

export interface CancelarVentaDTO {
  motivo?: string;
}
export interface ResumenVentasDiaDTO {
  fecha: string;

  facturas: number;
  productosVendidos: number;

  ventasBrutas: number;
  descuentos: number;
  ventasNetas: number;

  costoVendido: number;
  utilidad: number;
}

export interface InformeConsolidadoVentasDTO {
  fechaInicio: string;
  fechaFin: string;

  sucursalId: number;
  sucursalNombre: string;

  facturasEmitidas: number;
  facturasActivas: number;
  facturasCanceladas: number;
  facturasDevueltasParcial: number;
  facturasDevueltasTotal: number;

  productosVendidos: number;
  productosDevueltos: number;

  ventasBrutas: number;
  descuentos: number;
  ventasNetas: number;

  costoVendido: number;
  utilidadBruta: number;

  valorCancelado: number;
  valorDevuelto: number;

  costoAjustesNegativos: number;
  unidadesAjustadasNegativas: number;

  resultadoOperativoEstimado: number;

  unidadesInventarioActual: number;
  costoInventarioActual: number;
  valorComercialInventarioActual: number;
  utilidadProyectadaInventario: number;

  ventasPorDia: ResumenVentasDiaDTO[];
}
