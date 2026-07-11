import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

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
    private empleadoVentaService: EmpleadoVentaService
  ) {}

  ngOnInit(): void {

    const sucursalIdParam = this.route.snapshot.paramMap.get('sucursalId');

    if (!sucursalIdParam) {
      this.mensajeError = 'No se pudo identificar la sucursal.';
      return;
    }

    this.sucursalId = Number(sucursalIdParam);

    if (!this.sucursalId) {
      this.mensajeError = 'El identificador de la sucursal no es válido.';
      return;
    }

    const numeroVentaQuery = this.route.snapshot.queryParamMap.get('numeroVenta');

    if (numeroVentaQuery) {
      this.numeroVenta = numeroVentaQuery;
      this.buscarFactura();
    }
  }

  buscarFactura(): void {

    this.mensajeError = '';
    this.mensajeExito = '';
    this.factura = null;
    this.itemsDevolucion = [];

    const numero = this.numeroVenta.trim();

    if (!numero) {
      this.mensajeError = 'Debe ingresar el número de la factura.';
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
            this.mensajeError = 'No se puede generar devolución sobre una factura cancelada.';
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
            this.mensajeError = 'Esta factura no tiene productos disponibles para devolución.';
          }
        },
        error: (error) => {

          this.buscando = false;

          this.mensajeError =
            error?.error?.message ||
            error?.error ||
            'No se pudo consultar la factura.';
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
        `No puedes devolver más de ${item.cantidadDisponibleDevolucion} unidades de ${item.productoNombre}.`;

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
      this.mensajeError = 'Debe buscar una factura antes de generar la devolución.';
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
      motivo: this.motivo,
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
          `Devolución generada correctamente. Estado actual: ${facturaActualizada.estado}`;

        if (this.itemsDevolucion.length === 0) {
          this.mensajeError = '';
        }
      },
      error: (error) => {

        this.guardando = false;

        this.mensajeError =
          error?.error?.message ||
          error?.error ||
          'No se pudo generar la devolución.';
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
}
