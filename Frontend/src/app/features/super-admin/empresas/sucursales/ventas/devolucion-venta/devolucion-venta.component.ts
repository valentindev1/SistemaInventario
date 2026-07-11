import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { VentaService } from '../../../../../../core/services/venta/venta.service';

import {
  DevolucionVentaDTO,
  DevolucionVentaItemDTO,
  DetalleFacturaVentaDTO,
  FacturaVentaDTO
} from '../../../../../../core/models/venta/venta.model';

interface ItemDevolucionTemporal {
  productoId: number;
  productoCodigo: string;
  productoNombre: string;
  cantidadVendida: number;
  cantidadDevuelta: number;
  cantidadDisponibleDevolucion: number;
  cantidadADevolver: number;
  precioUnitarioMomento: number;
  subtotalDevolucion: number;
}

@Component({
  selector: 'app-devolucion-venta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './devolucion-venta.component.html',
  styleUrl: './devolucion-venta.component.css'
})
export class DevolucionVentaComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  tipoBusqueda: 'NUMERO' | 'ID' = 'NUMERO';
  valorBusqueda = '';

  factura: FacturaVentaDTO | null = null;

  motivo = '';

  itemsDevolucion: ItemDevolucionTemporal[] = [];

  cargandoFactura = false;
  guardando = false;

  mensajeError = '';
  mensajeExito = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ventaService: VentaService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.route.snapshot.paramMap.get('empresaId');
    const sucursalIdParam = this.route.snapshot.paramMap.get('sucursalId');

    if (!empresaIdParam || !sucursalIdParam) {
      this.mensajeError = 'No se pudo identificar la empresa o la sucursal.';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);

    if (!this.empresaId || !this.sucursalId) {
      this.mensajeError = 'Los identificadores de empresa o sucursal no son válidos.';
      return;
    }
  }

  buscarFactura(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
    this.factura = null;
    this.itemsDevolucion = [];

    const valor = this.valorBusqueda.trim();

    if (!valor) {
      this.mensajeError = 'Debe ingresar un valor para buscar la factura.';
      return;
    }

    this.cargandoFactura = true;

    if (this.tipoBusqueda === 'ID') {
      const ventaId = Number(valor);

      if (!ventaId || ventaId <= 0) {
        this.cargandoFactura = false;
        this.mensajeError = 'El ID de venta debe ser un número válido.';
        return;
      }

      this.ventaService.obtenerPorId(ventaId).subscribe({
        next: (factura) => {
          this.procesarFactura(factura);
          this.cargandoFactura = false;
        },
        error: (error) => {
          this.cargandoFactura = false;
          this.mensajeError =
            error?.error?.message ||
            error?.error ||
            'No se encontró la factura.';
        }
      });

      return;
    }

    this.ventaService.obtenerPorNumero(valor).subscribe({
      next: (factura) => {
        this.procesarFactura(factura);
        this.cargandoFactura = false;
      },
      error: (error) => {
        this.cargandoFactura = false;
        this.mensajeError =
          error?.error?.message ||
          error?.error ||
          'No se encontró la factura.';
      }
    });
  }

  procesarFactura(factura: FacturaVentaDTO): void {
    this.factura = factura;

    if (factura.sucursalId !== this.sucursalId) {
      this.factura = null;
      this.mensajeError = 'La factura consultada no pertenece a esta sucursal.';
      return;
    }

    if (factura.estado === 'CANCELADA') {
      this.mensajeError = 'No se pueden generar devoluciones sobre una factura cancelada.';
      return;
    }

    if (factura.estado === 'DEVUELTA_TOTAL') {
      this.mensajeError = 'Esta factura ya fue devuelta totalmente.';
      return;
    }

    this.itemsDevolucion = factura.detalles
      .filter(detalle => detalle.cantidadDisponibleDevolucion > 0)
      .map(detalle => this.mapearDetalleAItemDevolucion(detalle));
  }

  private mapearDetalleAItemDevolucion(
    detalle: DetalleFacturaVentaDTO
  ): ItemDevolucionTemporal {
    return {
      productoId: detalle.productoId,
      productoCodigo: detalle.productoCodigo,
      productoNombre: detalle.productoNombre,
      cantidadVendida: detalle.cantidad,
      cantidadDevuelta: detalle.cantidadDevuelta,
      cantidadDisponibleDevolucion: detalle.cantidadDisponibleDevolucion,
      cantidadADevolver: 0,
      precioUnitarioMomento: detalle.precioUnitarioMomento,
      subtotalDevolucion: 0
    };
  }

  actualizarCantidad(index: number): void {
    const item = this.itemsDevolucion[index];

    if (item.cantidadADevolver < 0) {
      item.cantidadADevolver = 0;
    }

    if (item.cantidadADevolver > item.cantidadDisponibleDevolucion) {
      item.cantidadADevolver = item.cantidadDisponibleDevolucion;
      this.mensajeError = `No puedes devolver más de ${item.cantidadDisponibleDevolucion} unidades de ${item.productoNombre}.`;
    } else {
      this.mensajeError = '';
    }

    item.subtotalDevolucion = item.cantidadADevolver * item.precioUnitarioMomento;
  }

  calcularTotalDevolucion(): number {
    return this.itemsDevolucion.reduce(
      (total, item) => total + item.subtotalDevolucion,
      0
    );
  }

  generarDevolucion(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.factura) {
      this.mensajeError = 'Debe consultar una factura antes de generar la devolución.';
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

    this.ventaService.generarDevolucion(this.factura.id, dto).subscribe({
      next: (facturaActualizada) => {
        this.guardando = false;
        this.factura = facturaActualizada;
        this.mensajeExito = 'Devolución registrada correctamente.';

        this.itemsDevolucion = facturaActualizada.detalles
          .filter(detalle => detalle.cantidadDisponibleDevolucion > 0)
          .map(detalle => this.mapearDetalleAItemDevolucion(detalle));

        this.motivo = '';
      },
      error: (error) => {
        this.guardando = false;
        this.mensajeError =
          error?.error?.message ||
          error?.error ||
          'No se pudo registrar la devolución.';
      }
    });
  }

  limpiarConsulta(): void {
    this.valorBusqueda = '';
    this.factura = null;
    this.itemsDevolucion = [];
    this.motivo = '';
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  volverAlPanel(): void {
    this.router.navigate([
      '/super-admin/empresas',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'ventas',
      'panel'
    ]);
  }






  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'ACTIVA':
        return 'badge bg-success';

      case 'CANCELADA':
        return 'badge bg-danger';

      case 'DEVUELTA_PARCIAL':
        return 'badge bg-warning text-dark';

      case 'DEVUELTA_TOTAL':
        return 'badge bg-secondary';

      default:
        return 'badge bg-light text-dark';
    }
  }
}
