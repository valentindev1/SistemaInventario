import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EmpresaService } from '../../../../core/services/empresa/empresa.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

import {
  DashboardEmpresaDTO,
  DashboardProductoCriticoDTO,
  DashboardSucursalResumenDTO
} from '../../../../core/models/empresa/empresa.model';

type TipoFiltroDashboard = 'DIA' | 'MES' | 'RANGO';

@Component({
  selector: 'app-dashboard-empresa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './dashboard-empresa.component.html',
  styleUrl: './dashboard-empresa.component.css'
})
export class DashboardEmpresaComponent implements OnInit {

  empresaId!: number;

  tipoFiltro: TipoFiltroDashboard = 'MES';

  fechaDia = '';
  fechaMes = '';
  fechaInicio = '';
  fechaFin = '';

  dashboard: DashboardEmpresaDTO | null = null;

  cargando = false;

  mensajeError = '';
  mensajeExito = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private empresaService: EmpresaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.obtenerEmpresaIdDesdeRuta();

    if (!empresaIdParam) {
      this.mensajeError = 'No se pudo identificar la empresa.';
      return;
    }

    this.empresaId = Number(empresaIdParam);

    if (Number.isNaN(this.empresaId) || this.empresaId <= 0) {
      this.mensajeError = 'El identificador de la empresa no es válido.';
      return;
    }

    this.inicializarFechas();
    this.cargarDashboard();
  }

  private obtenerEmpresaIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('empresaId') ??
      null
    );
  }

  inicializarFechas(): void {
    const hoy = new Date();

    this.fechaDia = this.formatearFecha(hoy);

    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');

    this.fechaMes = `${year}-${month}`;

    const primerDiaMes = new Date(year, hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(year, hoy.getMonth() + 1, 0);

    this.fechaInicio = this.formatearFecha(primerDiaMes);
    this.fechaFin = this.formatearFecha(ultimoDiaMes);
  }

  cambiarTipoFiltro(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    const hoy = new Date();

    if (this.tipoFiltro === 'DIA') {
      this.fechaDia = this.formatearFecha(hoy);
    }

    if (this.tipoFiltro === 'MES') {
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, '0');

      this.fechaMes = `${year}-${month}`;
    }

    if (this.tipoFiltro === 'RANGO') {
      const year = hoy.getFullYear();
      const month = hoy.getMonth();

      const primerDiaMes = new Date(year, month, 1);
      const ultimoDiaMes = new Date(year, month + 1, 0);

      this.fechaInicio = this.formatearFecha(primerDiaMes);
      this.fechaFin = this.formatearFecha(ultimoDiaMes);
    }
  }

  cargarDashboard(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    const rango = this.obtenerRangoFechas();

    if (!rango) {
      return;
    }

    if (!this.validarRangoFechas(rango.fechaInicio, rango.fechaFin)) {
      return;
    }

    this.cargando = true;

    this.empresaService.obtenerDashboardEmpresa(
      this.empresaId,
      rango.fechaInicio,
      rango.fechaFin
    ).subscribe({
      next: (data) => {
        this.dashboard = data;
        this.cargando = false;
        this.mensajeExito = 'Dashboard actualizado correctamente.';
      },
      error: (error) => {
        this.cargando = false;
        this.dashboard = null;
        this.mensajeError = this.obtenerMensajeError(error);
        console.error(error);
      }
    });
  }

  obtenerRangoFechas(): { fechaInicio: string; fechaFin: string } | null {
    if (this.tipoFiltro === 'DIA') {
      if (!this.fechaDia) {
        this.mensajeError = 'Debe seleccionar un día.';
        return null;
      }

      return {
        fechaInicio: this.fechaDia,
        fechaFin: this.fechaDia
      };
    }

    if (this.tipoFiltro === 'MES') {
      if (!this.fechaMes) {
        this.mensajeError = 'Debe seleccionar un mes.';
        return null;
      }

      const [yearTexto, monthTexto] = this.fechaMes.split('-');

      const year = Number(yearTexto);
      const month = Number(monthTexto) - 1;

      const inicio = new Date(year, month, 1);
      const fin = new Date(year, month + 1, 0);

      return {
        fechaInicio: this.formatearFecha(inicio),
        fechaFin: this.formatearFecha(fin)
      };
    }

    if (!this.fechaInicio || !this.fechaFin) {
      this.mensajeError = 'Debe seleccionar fecha inicial y fecha final.';
      return null;
    }

    return {
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin
    };
  }

  validarRangoFechas(fechaInicio: string, fechaFin: string): boolean {
    const inicio = new Date(`${fechaInicio}T00:00:00`);
    const fin = new Date(`${fechaFin}T00:00:00`);

    if (fin < inicio) {
      this.mensajeError = 'La fecha final no puede ser menor que la fecha inicial.';
      return false;
    }

    const fechaMaxima = new Date(inicio);
    fechaMaxima.setMonth(fechaMaxima.getMonth() + 12);

    if (fin > fechaMaxima) {
      this.mensajeError = 'El rango del dashboard no puede superar 12 meses.';
      return false;
    }

    return true;
  }

  volverADetalleEmpresa(): void {
    this.router.navigate(this.rutaDetalleEmpresa());
  }

  irASucursal(sucursal: DashboardSucursalResumenDTO): void {
    this.router.navigate(
      this.rutaDetalleSucursal(sucursal.sucursalId)
    );
  }

  private rutaDetalleEmpresa(): any[] {
    if (this.estaEnRutaAdmin()) {
      return [
        '/admin/empresa',
        this.empresaId,
        'dashboard'
      ];
    }

    return [
      '/super-admin/empresas',
      'detalle',
      this.empresaId
    ];
  }

  private rutaDetalleSucursal(sucursalId: number): any[] {
    if (this.estaEnRutaAdmin()) {
      return [
        '/admin/empresa',
        this.empresaId,
        'sucursales',
        'detalle',
        sucursalId
      ];
    }

    return [
      '/super-admin/empresas',
      this.empresaId,
      'sucursales',
      'detalle',
      sucursalId
    ];
  }

  private estaEnRutaAdmin(): boolean {
    return this.router.url.startsWith('/admin/empresa');
  }

  obtenerSucursales(): DashboardSucursalResumenDTO[] {
    return this.dashboard?.sucursales || [];
  }

  obtenerProductosCriticos(): DashboardProductoCriticoDTO[] {
    return this.dashboard?.productosCriticos || [];
  }

  tieneDashboard(): boolean {
    return this.dashboard !== null;
  }

  obtenerClaseAlertaProducto(tipoAlerta: string): string {
    switch (tipoAlerta) {
      case 'AGOTADO':
        return 'badge bg-danger';

      case 'BAJO_STOCK':
        return 'badge bg-warning text-dark';

      case 'ALTO_VALOR_INVENTARIO':
        return 'badge bg-primary';

      default:
        return 'badge bg-secondary';
    }
  }

  obtenerTextoAlertaProducto(tipoAlerta: string): string {
    switch (tipoAlerta) {
      case 'AGOTADO':
        return 'Agotado';

      case 'BAJO_STOCK':
        return 'Bajo stock';

      case 'ALTO_VALOR_INVENTARIO':
        return 'Alto valor';

      default:
        return tipoAlerta;
    }
  }

  esSuperAdmin(): boolean {
    return this.authService.obtenerRol() === 'SUPER_ADMIN';
  }

  esAdmin(): boolean {
    return this.authService.obtenerRol() === 'ADMIN';
  }

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private obtenerMensajeError(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }

    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.message) {
      return error.message;
    }

    return 'Ocurrió un error al cargar el dashboard de empresa.';
  }
}
