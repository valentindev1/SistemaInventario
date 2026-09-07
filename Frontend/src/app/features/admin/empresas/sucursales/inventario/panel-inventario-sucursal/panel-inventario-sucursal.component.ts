import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { InventarioService } from '../../../../../../core/services/inventario/inventario.service';
import { InventarioAdminDTO } from '../../../../../../core/models/inventario/inventario.model';

@Component({
  selector: 'app-panel-inventario-sucursal',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './panel-inventario-sucursal.component.html',
  styleUrl: './panel-inventario-sucursal.component.css'
})
export class PanelInventarioSucursalComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  inventario: InventarioAdminDTO[] = [];

  cargandoMetricas = false;
  mensajeError = '';

  valorCostoInventario = 0;
  valorComercialInventario = 0;
  utilidadProyectada = 0;
  unidadesTotales = 0;
  referenciasTotales = 0;

  constructor(
    private route: ActivatedRoute,
    private inventarioService: InventarioService
  ) {}

  ngOnInit(): void {
    this.empresaId = Number(this.route.snapshot.paramMap.get('empresaId'));
    this.sucursalId = Number(this.route.snapshot.paramMap.get('sucursalId'));

    if (!this.empresaId || !this.sucursalId) {
      this.mensajeError = 'No se pudo identificar la empresa o la sucursal.';
      return;
    }

    this.cargarMetricasInventario();
  }

  cargarMetricasInventario(): void {
    this.cargandoMetricas = true;
    this.mensajeError = '';

    this.inventarioService.listarPorSucursal(this.sucursalId).subscribe({
      next: (data) => {
        this.inventario = data;
        this.calcularMetricasInventario();
        this.cargandoMetricas = false;
      },
      error: (error) => {
        this.cargandoMetricas = false;
        this.mensajeError =
          error?.error?.message ||
          error?.error ||
          'No se pudieron cargar las métricas del inventario.';
      }
    });
  }

  calcularMetricasInventario(): void {
    this.referenciasTotales = this.inventario.length;

    this.unidadesTotales = this.inventario.reduce(
      (total, item) => total + (item.stockActual || 0),
      0
    );

    this.valorCostoInventario = this.inventario.reduce(
      (total, item) => {
        const stock = item.stockActual || 0;
        const costo = item.costoUnitario || 0;

        return total + stock * costo;
      },
      0
    );

    this.valorComercialInventario = this.inventario.reduce(
      (total, item) => {
        const stock = item.stockActual || 0;
        const precioVenta = item.precioVenta || 0;

        return total + stock * precioVenta;
      },
      0
    );

    this.utilidadProyectada =
      this.valorComercialInventario - this.valorCostoInventario;
  }

  calcularMargenProyectado(): number {
    if (this.valorComercialInventario <= 0) {
      return 0;
    }

    return this.utilidadProyectada / this.valorComercialInventario * 100;
  }

  rutaAjustarPrecio(): any[] {
    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'inventario',
      'ajustar-precio'
    ];
  }

  rutaConfigurarPorcentajes(): any[] {
    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'inventario',
      'configurar-porcentajes'
    ];
  }
}
