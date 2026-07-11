import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { AuthTemporalService } from '../../../core/services/auth/auth-temporal.service';
import { UsuarioAuthTemporal } from '../../../core/models/auth/usuario-auth.model';

import { EmpleadoVentaService } from '../../../core/services/empleado/empleado-venta.service';

import {
  VentaHistorialEmpleadoDTO
} from '../../../core/models/venta/empleado/venta-empleado.model';

interface ModuloEmpleado {
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
  ruta: string[];
  disponible: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  sucursalId!: number;

  usuarioActual!: UsuarioAuthTemporal;

  modulos: ModuloEmpleado[] = [];

  mensajeError = '';

  ventasSucursal: VentaHistorialEmpleadoDTO[] = [];
  ventasHoy: VentaHistorialEmpleadoDTO[] = [];

  cargandoMetricas = false;

  totalVendidoHoy = 0;
  cantidadVentasHoy = 0;
  ventasActivasHoy = 0;
  ventasCanceladasHoy = 0;
  ventasDevueltasHoy = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authTemporalService: AuthTemporalService,
    private empleadoVentaService: EmpleadoVentaService
  ) {}

  ngOnInit(): void {

    const sucursalIdParam = this.route.snapshot.paramMap.get('sucursalId');

    if (!sucursalIdParam) {
      this.mensajeError = 'No se pudo identificar la sucursal del empleado.';
      return;
    }

    this.sucursalId = Number(sucursalIdParam);

    if (!this.sucursalId) {
      this.mensajeError = 'El identificador de la sucursal no es válido.';
      return;
    }

    this.usuarioActual = this.authTemporalService.obtenerUsuarioActual();

    this.inicializarModulos();

    this.cargarMetricasDashboard();
  }

  private inicializarModulos(): void {

    this.modulos = [
      {
        titulo: 'Ventas',
        descripcion: 'Generar ventas, consultar facturas y gestionar devoluciones.',
        icono: 'bi bi-cart-check',
        color: 'modulo-ventas',
        ruta: [
          '/empleado',
          'sucursal',
          String(this.sucursalId),
          'ventas',
          'panel'
        ],
        disponible: true
      },
      {
        titulo: 'Inventario',
        descripcion: 'Consultar productos disponibles, stock actual y precios de venta.',
        icono: 'bi bi-box-seam',
        color: 'modulo-inventario',
        ruta: [
          '/empleado',
          'sucursal',
          String(this.sucursalId),
          'inventario',
          'panel'
        ],
        disponible: true
      },
      {
        titulo: 'Clientes',
        descripcion: 'Buscar, crear y gestionar clientes de la empresa.',
        icono: 'bi bi-people',
        color: 'modulo-clientes',
        ruta: [
          '/empleado',
          'sucursal',
          String(this.sucursalId),
          'clientes',
          'panel'
        ],
        disponible: true
      }
    ];
  }

  cargarMetricasDashboard(): void {

    this.cargandoMetricas = true;
    this.mensajeError = '';

    this.empleadoVentaService.listarPorSucursal(this.sucursalId)
      .subscribe({
        next: (ventas) => {
          this.ventasSucursal = ventas || [];

          this.calcularMetricasDelDia();

          this.cargandoMetricas = false;
        },
        error: (error) => {
          this.cargandoMetricas = false;

          this.mensajeError =
            error?.error?.message ||
            error?.error ||
            'No se pudieron cargar las métricas del dashboard.';
        }
      });
  }

  private calcularMetricasDelDia(): void {

    const hoy = this.obtenerFechaLocalFormato(new Date());

    this.ventasHoy = this.ventasSucursal.filter(venta => {
      const fechaVenta = this.obtenerFechaLocalFormato(
        new Date(venta.fechaVenta)
      );

      return fechaVenta === hoy;
    });

    this.cantidadVentasHoy = this.ventasHoy.length;

    this.totalVendidoHoy = this.ventasHoy
      .filter(venta => venta.estado !== 'CANCELADA')
      .reduce(
        (total, venta) => total + (Number(venta.total) || 0),
        0
      );

    this.ventasActivasHoy = this.ventasHoy.filter(
      venta => venta.estado === 'ACTIVA'
    ).length;

    this.ventasCanceladasHoy = this.ventasHoy.filter(
      venta => venta.estado === 'CANCELADA'
    ).length;

    this.ventasDevueltasHoy = this.ventasHoy.filter(
      venta =>
        venta.estado === 'DEVUELTA_PARCIAL' ||
        venta.estado === 'DEVUELTA_TOTAL'
    ).length;
  }

  private obtenerFechaLocalFormato(fecha: Date): string {

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  navegarModulo(modulo: ModuloEmpleado): void {

    if (!modulo.disponible) {
      return;
    }

    this.router.navigate(modulo.ruta);
  }

  irCrearVenta(): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'ventas',
      'generar'
    ]);
  }

  irVerFacturas(): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'ventas',
      'facturas'
    ]);
  }

  irInventarioActual(): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'inventario',
      'actual'
    ]);
  }
}
