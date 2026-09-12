import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { InventarioService } from '../../../../../../core/services/inventario/inventario.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';

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
    private router: Router,
    private inventarioService: InventarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.obtenerEmpresaIdDesdeRuta();
    const sucursalIdParam = this.obtenerSucursalIdDesdeRuta();

    if (!empresaIdParam || !sucursalIdParam) {
      this.mensajeError = 'No se pudo identificar la empresa o la sucursal.';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);

    if (
      Number.isNaN(this.empresaId) ||
      Number.isNaN(this.sucursalId) ||
      this.empresaId <= 0 ||
      this.sucursalId <= 0
    ) {
      this.mensajeError = 'No se pudo identificar la empresa o la sucursal.';
      return;
    }

    if (!this.validarAccesoLocal()) {
      return;
    }

    this.cargarMetricasInventario();
  }

  private obtenerEmpresaIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('empresaId') ??
      null
    );
  }

  private obtenerSucursalIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('sucursalId') ??
      null
    );
  }

  private validarAccesoLocal(): boolean {
    const rol = this.authService.obtenerRol();
    const empresaIdUsuario = this.authService.obtenerEmpresaId();

    if (rol === 'SUPER_ADMIN') {
      return true;
    }

    if (rol === 'ADMIN' && empresaIdUsuario === this.empresaId) {
      return true;
    }

    this.router.navigate(['/acceso-denegado']);
    return false;
  }

  esSuperAdmin(): boolean {
    return this.authService.obtenerRol() === 'SUPER_ADMIN';
  }

  esAdmin(): boolean {
    return this.authService.obtenerRol() === 'ADMIN';
  }

  rutaDetalleSucursal(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        'detalle',
        this.sucursalId
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      'detalle',
      this.sucursalId
    ];
  }

  rutaIngresarInventario(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'inventario',
        'ingresar'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'inventario',
      'ingresar'
    ];
  }

  rutaAjustarInventario(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'inventario',
        'ajustar'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'inventario',
      'ajustar'
    ];
  }

  rutaAjustarPrecio(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'inventario',
        'ajustar-precio'
      ];
    }

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
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'inventario',
        'configurar-porcentajes'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'inventario',
      'configurar-porcentajes'
    ];
  }

  rutaDefinirCosto(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'productos'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'productos'
    ];
  }

  rutaResumenInventario(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'inventario',
        'resumen'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'inventario',
      'resumen'
    ];
  }

  rutaMovimientosInventario(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'inventario',
        'movimientos'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'inventario',
      'movimientos'
    ];
  }

  cargarMetricasInventario(): void {
    this.cargandoMetricas = true;
    this.mensajeError = '';

    this.inventarioService.listarPorSucursal(this.sucursalId).subscribe({
      next: (data) => {
        this.inventario = data || [];
        this.calcularMetricasInventario();
        this.cargandoMetricas = false;
      },
      error: (error) => {
        this.cargandoMetricas = false;
        this.mensajeError =
          error?.error?.message ||
          error?.error ||
          'No se pudieron cargar las métricas del inventario.';

        console.error(error);
      }
    });
  }

  rutaInventarioSucursal(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'inventario'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'inventario'
    ];
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

    return (this.utilidadProyectada / this.valorComercialInventario) * 100;
  }
}
