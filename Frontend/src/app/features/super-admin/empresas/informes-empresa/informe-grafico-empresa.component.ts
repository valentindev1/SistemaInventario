import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import {
  InformeFinancieroEmpresaDTO,
  InformeFinancieroPeriodoDTO
} from '../../../../core/models/informes/informe-financiero.model';
import { InformeFinancieroService } from '../../../../core/services/informes/informe-financiero.service';

@Component({
  selector: 'app-informe-grafico-empresa',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './informe-grafico-empresa.component.html',
  styleUrl: './informe-grafico-empresa.component.css'
})
export class InformeGraficoEmpresaComponent implements OnInit {

  empresaId!: number;
  tipoPeriodo: 'MES' | 'RANGO' = 'MES';
  fechaInicio = '';
  fechaFin = '';
  sucursalId: number | undefined;
  informe: InformeFinancieroEmpresaDTO | null = null;
  cargando = false;
  mensajeError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private informeFinancieroService: InformeFinancieroService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.obtenerEmpresaIdDesdeRuta();
    if (!empresaIdParam || Number.isNaN(Number(empresaIdParam))) {
      this.mostrarError('No se pudo identificar la empresa.');
      return;
    }

    this.empresaId = Number(empresaIdParam);
    const parametros = this.route.snapshot.queryParamMap;
    this.tipoPeriodo = parametros.get('tipoPeriodo') === 'RANGO' ? 'RANGO' : 'MES';
    this.fechaInicio = parametros.get('fechaInicio') ?? this.primerDiaMesActual();
    this.fechaFin = parametros.get('fechaFin') ?? this.ultimoDiaMesActual();

    const sucursalIdParam = parametros.get('sucursalId');
    if (sucursalIdParam && !Number.isNaN(Number(sucursalIdParam))) {
      this.sucursalId = Number(sucursalIdParam);
    }

    this.cargarInforme();
  }

  private obtenerEmpresaIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('empresaId') ??
      null
    );
  }

  cargarInforme(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.informeFinancieroService.generar(
      this.empresaId,
      this.fechaInicio,
      this.fechaFin,
      this.sucursalId
    ).subscribe({
      next: informe => {
        this.informe = informe;
        this.cargando = false;
      },
      error: error => {
        this.informe = null;
        this.cargando = false;
        this.mostrarError(this.obtenerMensajeError(error));
      }
    });
  }

  volverInformes(): any[] {
    return this.router.url.startsWith('/super-admin')
      ? ['/super-admin/empresas', this.empresaId, 'informes']
      : ['/admin/empresa', this.empresaId, 'informes'];
  }

  parametrosInforme(): Record<string, string | number> {
    return {
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      tipoPeriodo: this.tipoPeriodo,
      ...(this.sucursalId !== undefined ? { sucursalId: this.sucursalId } : {})
    };
  }

  formatearMoneda(valor: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor ?? 0);
  }

  formatearNumero(valor: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO').format(valor ?? 0);
  }

  formatearPeriodo(periodo: string): string {
    const [anio, mes] = periodo.split('-').map(Number);
    const texto = new Intl.DateTimeFormat('es-CO', {
      month: 'long',
      year: 'numeric'
    }).format(new Date(anio, mes - 1, 1));
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  formatearFecha(fecha: string): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(`${fecha}T00:00:00`));
  }

  claseResultado(valor: number): string {
    return valor < 0 ? 'negative' : 'positive';
  }

  anchoBarraGrafico(valor: number, valores: number[]): number {
    if (!valores.length || valor === 0) {
      return 0;
    }
    const maximo = Math.max(...valores.map(item => Math.abs(item)), 1);
    return Math.max(4, Math.round((Math.abs(valor) / maximo) * 100));
  }

  valoresDePeriodos(campo: 'ingresosNetos' | 'costoProductosVendidos' | 'utilidadNeta'): number[] {
    return this.informe?.periodos.map(periodo => periodo[campo]) ?? [];
  }

  valoresDeSucursales(): number[] {
    return this.informe?.sucursales.map(sucursal => sucursal.ingresosNetos) ?? [];
  }

  porcentajeTipoProducto(remanufacturado: boolean): number {
    if (!this.informe) {
      return 0;
    }
    const remanufacturados = Math.abs(this.informe.productosRemanufacturados.ingresosNetos);
    const convencionales = Math.abs(this.informe.productosConvencionales.ingresosNetos);
    const total = remanufacturados + convencionales;
    if (!total) {
      return 0;
    }
    const valor = remanufacturado ? remanufacturados : convencionales;
    return Math.round((valor / total) * 100);
  }

  estiloComposicionProductos(): string {
    const remanufacturados = Math.abs(this.informe?.productosRemanufacturados.ingresosNetos ?? 0);
    const convencionales = Math.abs(this.informe?.productosConvencionales.ingresosNetos ?? 0);
    const total = remanufacturados + convencionales;
    if (!total) {
      return 'conic-gradient(#cbd5e1 0 100%)';
    }
    const porcentajeRemanufacturados = (remanufacturados / total) * 100;
    return `conic-gradient(#fb923c 0 ${porcentajeRemanufacturados}%, #60a5fa ${porcentajeRemanufacturados}% 100%)`;
  }

  porcentajeCostoSobreIngresos(): number {
    const ingresos = Math.max(0, this.informe?.ingresosNetos ?? 0);
    if (!ingresos) {
      return 0;
    }
    const costo = Math.max(0, this.informe?.costoProductosVendidos ?? 0);
    return Math.min(100, Math.round((costo / ingresos) * 100));
  }

  porcentajeUtilidadBrutaSobreIngresos(): number {
    const ingresos = Math.max(0, this.informe?.ingresosNetos ?? 0);
    if (!ingresos) {
      return 0;
    }
    const utilidad = Math.max(0, this.informe?.utilidadBruta ?? 0);
    return Math.min(100, Math.round((utilidad / ingresos) * 100));
  }

  estiloDistribucionIngresos(): string {
    const ingresos = Math.max(0, this.informe?.ingresosNetos ?? 0);
    const costo = Math.min(ingresos, Math.max(0, this.informe?.costoProductosVendidos ?? 0));
    const utilidad = Math.min(ingresos, Math.max(0, this.informe?.utilidadBruta ?? 0));
    const total = costo + utilidad;
    if (!total) {
      return 'conic-gradient(#cbd5e1 0 100%)';
    }
    const porcentajeCosto = (costo / total) * 100;
    return `conic-gradient(#f59e0b 0 ${porcentajeCosto}%, #10b981 ${porcentajeCosto}% 100%)`;
  }

  porcentajeVisual(valor: number): number {
    return Math.min(100, Math.max(0, Math.abs(valor)));
  }

  private primerDiaMesActual(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private ultimoDiaMesActual(): string {
    const hoy = new Date();
    const mes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    return `${mes}-${String(ultimoDia).padStart(2, '0')}`;
  }

  private mostrarError(mensaje: string): void {
    this.mensajeError = mensaje;
    void Swal.fire({
      icon: 'error',
      title: 'No se pudo cargar el informe gráfico',
      text: mensaje,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#2563eb'
    });
  }

  private obtenerMensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.mensaje
        ?? error.error?.message
        ?? (typeof error.error === 'string' ? error.error : null)
        ?? 'No se pudo consultar la información financiera.';
    }
    return 'No se pudo consultar la información financiera.';
  }
}
