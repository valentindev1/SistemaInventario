import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { EmpleadoVentaService } from '../../../../core/services/empleado/empleado-venta.service';

import {
  DetalleFacturaVentaEmpleadoDTO,
  FacturaVentaEmpleadoDTO
} from '../../../../core/models/venta/empleado/venta-empleado.model';

import {
  DevolucionVentaDTO,
  DevolucionVentaItemDTO
} from '../../../../core/models/venta/venta.model';

interface ItemDevolucionTemporal {
  productoId: number;
  productoCodigo: string;
  productoNombre: string;

  cantidadVendida: number;
  cantidadDevuelta: number;
  cantidadDisponibleDevolucion: number;

  precioUnitarioMomento: number;

  cantidadADevolver: number;
}

@Component({
  selector: 'app-devolucion-venta-empleado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './devolucion-venta-empleado.component.html',
  styleUrl: './devolucion-venta-empleado.component.css'
})
export class DevolucionVentaEmpleadoComponent implements OnInit {

  sucursalId!: number;
  empresaId!: number;

  numeroVenta = '';
  motivo = '';

  factura: FacturaVentaEmpleadoDTO | null = null;
  itemsDevolucion: ItemDevolucionTemporal[] = [];

  buscando = false;
  guardando = false;

  mensajeError = '';
  mensajeExito = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private empleadoVentaService: EmpleadoVentaService
  ) {}

  ngOnInit(): void {

    const accesoValido = this.validarAccesoEmpleado();

    if (!accesoValido) {
      return;
    }

    const numeroVentaQuery = this.route.snapshot.queryParamMap.get('numeroVenta');

    if (numeroVentaQuery) {
      this.numeroVenta = numeroVentaQuery;
      this.buscarFactura();
    }
  }

  private validarAccesoEmpleado(): boolean {

    this.mensajeError = '';

    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return false;
    }

    const rol = this.authService.obtenerRol();
    const empresaIdUsuario = this.authService.obtenerEmpresaId();
    const sucursalIdUsuario = this.authService.obtenerSucursalId();

    if (!rol) {
      this.router.navigate(['/login']);
      return false;
    }

    if (rol !== 'EMPLEADO') {
      this.router.navigate(['/acceso-denegado']);
      return false;
    }

    if (!empresaIdUsuario || !sucursalIdUsuario) {
      this.mensajeError = 'No se pudo identificar la empresa o sucursal del empleado.';
      this.router.navigate(['/login']);
      return false;
    }

    const sucursalIdParam = this.obtenerSucursalIdDesdeRuta();

    if (!sucursalIdParam) {
      this.router.navigate([
        '/empleado',
        'sucursal',
        sucursalIdUsuario,
        'ventas',
        'devolucion'
      ]);

      return false;
    }

    const sucursalIdRuta = Number(sucursalIdParam);

    if (
      Number.isNaN(sucursalIdRuta) ||
      sucursalIdRuta <= 0
    ) {
      this.router.navigate([
        '/empleado',
        'sucursal',
        sucursalIdUsuario,
        'ventas',
        'devolucion'
      ]);

      return false;
    }

    if (sucursalIdRuta !== sucursalIdUsuario) {
      this.router.navigate([
        '/empleado',
        'sucursal',
        sucursalIdUsuario,
        'ventas',
        'devolucion'
      ]);

      return false;
    }

    this.empresaId = empresaIdUsuario;
    this.sucursalId = sucursalIdUsuario;

    return true;
  }

  private obtenerSucursalIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.parent?.parent?.snapshot.paramMap.get('sucursalId') ??
      null
    );
  }

  buscarFactura(): void {

    this.mensajeError = '';
    this.mensajeExito = '';
    this.factura = null;
    this.itemsDevolucion = [];

    const numero = this.numeroVenta.trim();

    if (!numero) {
      this.mensajeError = 'Debe ingresar el numero de la factura.';
      return;
    }

    this.buscando = true;

    this.empleadoVentaService.obtenerPorNumero(numero)
      .subscribe({
        next: (factura) => {

          this.buscando = false;

          if (factura.sucursalId !== this.sucursalId) {
            this.mensajeError = 'La factura no pertenece a esta sucursal.';
            return;
          }

          if (factura.estado === 'CANCELADA') {
            this.mensajeError = 'No se puede generar devolucion sobre una factura cancelada.';
            return;
          }

          if (factura.estado === 'DEVUELTA_TOTAL') {
            this.mensajeError = 'Esta factura ya fue devuelta totalmente.';
            return;
          }

          this.factura = factura;

          this.itemsDevolucion = factura.detalles
            .filter(detalle => detalle.cantidadDisponibleDevolucion > 0)
            .map(detalle => this.mapDetalleAItemDevolucion(detalle));

          if (this.itemsDevolucion.length === 0) {
            this.mensajeError = 'Esta factura no tiene productos disponibles para devolucion.';
          }
        },
        error: (error) => {

          this.buscando = false;

          this.mensajeError = this.obtenerMensajeError(
            error,
            'No se pudo consultar la factura.'
          );

          console.error(error);
        }
      });
  }

  private mapDetalleAItemDevolucion(
    detalle: DetalleFacturaVentaEmpleadoDTO
  ): ItemDevolucionTemporal {

    return {
      productoId: detalle.productoId,
      productoCodigo: detalle.productoCodigo,
      productoNombre: detalle.productoNombre,

      cantidadVendida: detalle.cantidad,
      cantidadDevuelta: detalle.cantidadDevuelta,
      cantidadDisponibleDevolucion: detalle.cantidadDisponibleDevolucion,

      precioUnitarioMomento: detalle.precioUnitarioMomento,

      cantidadADevolver: 0
    };
  }

  actualizarCantidad(index: number): void {

    const item = this.itemsDevolucion[index];

    if (item.cantidadADevolver < 0) {
      item.cantidadADevolver = 0;
    }

    if (item.cantidadADevolver > item.cantidadDisponibleDevolucion) {
      item.cantidadADevolver = item.cantidadDisponibleDevolucion;

      this.mensajeError =
        `No puedes devolver mas de ${item.cantidadDisponibleDevolucion} unidades de ${item.productoNombre}.`;

      return;
    }

    this.mensajeError = '';
  }

  seleccionarCantidadMaxima(index: number): void {

    const item = this.itemsDevolucion[index];

    item.cantidadADevolver = item.cantidadDisponibleDevolucion;

    this.actualizarCantidad(index);
  }

  limpiarCantidad(index: number): void {

    this.itemsDevolucion[index].cantidadADevolver = 0;

    this.mensajeError = '';
  }

  calcularTotalEstimadoDevolucion(): number {

    return this.itemsDevolucion.reduce(
      (total, item) =>
        total + (item.cantidadADevolver * item.precioUnitarioMomento),
      0
    );
  }

  hayItemsSeleccionados(): boolean {

    return this.itemsDevolucion.some(
      item => item.cantidadADevolver > 0
    );
  }

  generarDevolucion(): void {

    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.factura) {
      this.mensajeError = 'Debe buscar una factura antes de generar la devolucion.';
      return;
    }

    if (this.factura.sucursalId !== this.sucursalId) {
      this.mensajeError = 'La factura no pertenece a esta sucursal.';
      return;
    }

    const items: DevolucionVentaItemDTO[] = this.itemsDevolucion
      .filter(item => item.cantidadADevolver > 0)
      .map(item => ({
        productoId: item.productoId,
        cantidad: item.cantidadADevolver
      }));

    if (items.length === 0) {
      this.mensajeError = 'Debe seleccionar al menos un producto para devolver.';
      return;
    }

    const dto: DevolucionVentaDTO = {
      motivo: this.motivo.trim(),
      items
    };

    this.guardando = true;

    this.empleadoVentaService.generarDevolucion(
      this.factura.id,
      dto
    ).subscribe({
      next: (facturaActualizada) => {

        this.guardando = false;
        this.factura = facturaActualizada;

        this.itemsDevolucion = facturaActualizada.detalles
          .filter(detalle => detalle.cantidadDisponibleDevolucion > 0)
          .map(detalle => this.mapDetalleAItemDevolucion(detalle));

        this.motivo = '';

        this.mensajeExito =
          `Devolucion generada correctamente. Estado actual: ${facturaActualizada.estado}`;

        if (this.itemsDevolucion.length === 0) {
          this.mensajeError = '';
        }
      },
      error: (error) => {

        this.guardando = false;

        this.mensajeError = this.obtenerMensajeError(
          error,
          'No se pudo generar la devolucion.'
        );

        console.error(error);
      }
    });
  }

  limpiarBusqueda(): void {

    this.numeroVenta = '';
    this.motivo = '';
    this.factura = null;
    this.itemsDevolucion = [];
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  volverPanelVentas(): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'ventas',
      'panel'
    ]);
  }

  volverFacturas(): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'ventas',
      'facturas'
    ]);
  }

  getClaseEstado(estado: string): string {

    switch (estado) {
      case 'ACTIVA':
        return 'estado-activa';

      case 'CANCELADA':
        return 'estado-cancelada';

      case 'DEVUELTA_PARCIAL':
        return 'estado-devuelta-parcial';

      case 'DEVUELTA_TOTAL':
        return 'estado-devuelta-total';

      default:
        return 'estado-default';
    }
  }

  private obtenerMensajeError(error: any, mensajeDefecto: string): string {

    if (Array.isArray(error?.error?.errores)) {
      return error.error.errores.join(', ');
    }

    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.error?.error) {
      return error.error.error;
    }

    return mensajeDefecto;
  }
}
