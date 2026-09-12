import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import {
  InformeFinancieroEmpresaDTO,
  InformeFinancieroPeriodoDTO
} from '../../../../core/models/informes/informe-financiero.model';
import { SucursalObtenerDTO } from '../../../../core/models/sucursal/sucursal.model';
import { EmpresaService } from '../../../../core/services/empresa/empresa.service';
import { InformeFinancieroService } from '../../../../core/services/informes/informe-financiero.service';
import { SucursalService } from '../../../../core/services/sucursal/sucursal.service';

type TipoPeriodo = 'MES' | 'RANGO';
type TipoFecha = 'inicio' | 'fin';

interface DiaCalendario {
  iso: string;
  numero: number;
  mesActual: boolean;
}

@Component({
  selector: 'app-informes-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './informes-empresa.component.html',
  styleUrl: './informes-empresa.component.css'
})
export class InformesEmpresaComponent implements OnInit {

  empresaId!: number;
  empresaNombre = 'Empresa';
  sucursales: SucursalObtenerDTO[] = [];
  sucursalSeleccionadaId: number | null = null;

  tipoPeriodo: TipoPeriodo = 'MES';
  mesSeleccionado = '';
  fechaInicio = '';
  fechaFin = '';
  selectorFechaActivo: TipoFecha | null = null;
  anioCalendario = new Date().getFullYear();
  mesCalendario = new Date().getMonth();
  mostrarSelectorMes = false;
  anioSelector = new Date().getFullYear();
  readonly mesesDisponibles = [
    { valor: '01', nombre: 'Ene' },
    { valor: '02', nombre: 'Feb' },
    { valor: '03', nombre: 'Mar' },
    { valor: '04', nombre: 'Abr' },
    { valor: '05', nombre: 'May' },
    { valor: '06', nombre: 'Jun' },
    { valor: '07', nombre: 'Jul' },
    { valor: '08', nombre: 'Ago' },
    { valor: '09', nombre: 'Sep' },
    { valor: '10', nombre: 'Oct' },
    { valor: '11', nombre: 'Nov' },
    { valor: '12', nombre: 'Dic' }
  ];

  informe: InformeFinancieroEmpresaDTO | null = null;
  cargando = false;
  mensajeError = '';
  mostrarInformeGrafico = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private empresaService: EmpresaService,
    private sucursalService: SucursalService,
    private informeFinancieroService: InformeFinancieroService,
    private elementRef: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.obtenerEmpresaIdDesdeRuta();
    if (!empresaIdParam || Number.isNaN(Number(empresaIdParam))) {
      this.mostrarError('No se pudo identificar la empresa.');
      return;
    }

    this.empresaId = Number(empresaIdParam);
    const parametros = this.route.snapshot.queryParamMap;
    const fechaInicioParam = parametros.get('fechaInicio');
    const fechaFinParam = parametros.get('fechaFin');
    const tipoPeriodoParam = parametros.get('tipoPeriodo');
    const sucursalIdParam = parametros.get('sucursalId');

    if (fechaInicioParam && fechaFinParam) {
      this.tipoPeriodo = tipoPeriodoParam === 'RANGO' ? 'RANGO' : 'MES';
      this.fechaInicio = fechaInicioParam;
      this.fechaFin = fechaFinParam;
      this.mesSeleccionado = fechaInicioParam.slice(0, 7);
    } else {
      this.establecerMesActual(false);
    }

    if (sucursalIdParam && !Number.isNaN(Number(sucursalIdParam))) {
      this.sucursalSeleccionadaId = Number(sucursalIdParam);
    }
    this.cargarEmpresaYSucursales();
  }

  private obtenerEmpresaIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('empresaId') ??
      null
    );
  }

  seleccionarTipoPeriodo(tipo: TipoPeriodo): void {
    this.tipoPeriodo = tipo;
    this.mostrarSelectorMes = false;
    this.selectorFechaActivo = null;
    this.mensajeError = '';
    if (tipo === 'MES') {
      this.aplicarMesSeleccionado();
    }
  }

  establecerMesActual(generar = true): void {
    const hoy = new Date();
    this.mesSeleccionado = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    this.tipoPeriodo = 'MES';
    this.aplicarMesSeleccionado();
    if (generar && this.empresaId) {
      this.generarInforme();
    }
  }

  aplicarMesSeleccionado(): void {
    if (!this.mesSeleccionado) {
      return;
    }
    const [anio, mes] = this.mesSeleccionado.split('-').map(Number);
    const ultimoDia = new Date(anio, mes, 0).getDate();
    this.fechaInicio = `${this.mesSeleccionado}-01`;
    this.fechaFin = `${this.mesSeleccionado}-${String(ultimoDia).padStart(2, '0')}`;
  }

  abrirSelectorFecha(tipo: TipoFecha): void {
    this.mostrarSelectorMes = false;
    this.selectorFechaActivo = tipo;
    const fechaSeleccionada = this.parsearFechaLocal(tipo === 'inicio' ? this.fechaInicio : this.fechaFin) ?? new Date();
    this.anioCalendario = fechaSeleccionada.getFullYear();
    this.mesCalendario = fechaSeleccionada.getMonth();
  }

  cambiarMesCalendario(direccion: number): void {
    const fecha = new Date(this.anioCalendario, this.mesCalendario + direccion, 1);
    this.anioCalendario = fecha.getFullYear();
    this.mesCalendario = fecha.getMonth();
  }

  seleccionarFechaDesdeSelector(iso: string): void {
    if (this.selectorFechaActivo === 'inicio') {
      this.fechaInicio = iso;
    } else if (this.selectorFechaActivo === 'fin') {
      this.fechaFin = iso;
    }
    this.selectorFechaActivo = null;
  }

  seleccionarHoyDesdeSelector(): void {
    const hoy = this.formatearFechaISO(new Date());
    this.seleccionarFechaDesdeSelector(hoy);
  }

  limpiarFechaDesdeSelector(): void {
    if (this.selectorFechaActivo === 'inicio') {
      this.fechaInicio = '';
    } else if (this.selectorFechaActivo === 'fin') {
      this.fechaFin = '';
    }
    this.selectorFechaActivo = null;
  }

  formatearFechaControl(fecha: string): string {
    const fechaLocal = this.parsearFechaLocal(fecha);
    if (!fechaLocal) {
      return 'Selecciona una fecha';
    }
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(fechaLocal);
  }

  nombreMesCalendario(): string {
    const texto = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' })
      .format(new Date(this.anioCalendario, this.mesCalendario, 1));
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  get diasCalendario(): DiaCalendario[] {
    const primerDia = new Date(this.anioCalendario, this.mesCalendario, 1);
    const desplazamiento = (primerDia.getDay() + 6) % 7;
    const fechaInicial = new Date(this.anioCalendario, this.mesCalendario, 1 - desplazamiento);

    return Array.from({ length: 42 }, (_, indice) => {
      const fecha = new Date(fechaInicial);
      fecha.setDate(fechaInicial.getDate() + indice);
      return {
        iso: this.formatearFechaISO(fecha),
        numero: fecha.getDate(),
        mesActual: fecha.getMonth() === this.mesCalendario && fecha.getFullYear() === this.anioCalendario
      };
    });
  }

  esFechaSeleccionada(iso: string): boolean {
    return this.selectorFechaActivo === 'inicio'
      ? this.fechaInicio === iso
      : this.selectorFechaActivo === 'fin' && this.fechaFin === iso;
  }

  esFechaHoy(iso: string): boolean {
    return this.formatearFechaISO(new Date()) === iso;
  }

  abrirSelectorMes(): void {
    const anioSeleccionado = Number(this.mesSeleccionado.slice(0, 4));
    this.anioSelector = anioSeleccionado || new Date().getFullYear();
    this.mostrarSelectorMes = true;
  }

  cambiarAnioSelector(direccion: number): void {
    this.anioSelector += direccion;
  }

  seleccionarMesDesdeSelector(mes: string): void {
    this.mesSeleccionado = `${this.anioSelector}-${mes}`;
    this.aplicarMesSeleccionado();
    this.mostrarSelectorMes = false;
  }

  seleccionarMesActualDesdeSelector(): void {
    const hoy = new Date();
    this.anioSelector = hoy.getFullYear();
    this.mesSeleccionado = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    this.aplicarMesSeleccionado();
    this.mostrarSelectorMes = false;
  }

  limpiarMesSeleccionado(): void {
    this.mesSeleccionado = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.mostrarSelectorMes = false;
  }

  formatearMesSeleccionado(): string {
    if (!this.mesSeleccionado) {
      return 'Selecciona un mes';
    }
    const [anio, mes] = this.mesSeleccionado.split('-').map(Number);
    const texto = new Intl.DateTimeFormat('es-CO', {
      month: 'long',
      year: 'numeric'
    }).format(new Date(anio, mes - 1, 1));
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  esMesSeleccionado(anio: number, mes: string): boolean {
    return this.mesSeleccionado === `${anio}-${mes}`;
  }

  esMesActual(anio: number, mes: string): boolean {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}` === `${anio}-${mes}`;
  }

  @HostListener('document:click', ['$event'])
  cerrarSelectorMesAlHacerClickFuera(evento: MouseEvent): void {
    if ((this.mostrarSelectorMes || this.selectorFechaActivo) && !this.elementRef.nativeElement.contains(evento.target as Node)) {
      this.mostrarSelectorMes = false;
      this.selectorFechaActivo = null;
    }
  }

  private parsearFechaLocal(fecha: string): Date | null {
    if (!fecha) {
      return null;
    }
    const [anio, mes, dia] = fecha.split('-').map(Number);
    if (!anio || !mes || !dia) {
      return null;
    }
    return new Date(anio, mes - 1, dia);
  }

  private formatearFechaISO(fecha: Date): string {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  }

  generarInforme(): void {
    if (this.tipoPeriodo === 'MES') {
      this.aplicarMesSeleccionado();
    }
    if (!this.validarRango()) {
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    this.mostrarInformeGrafico = false;

    this.informeFinancieroService.generar(
      this.empresaId,
      this.fechaInicio,
      this.fechaFin,
      this.sucursalSeleccionadaId ?? undefined
    ).subscribe({
      next: informe => {
        this.informe = informe;
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        this.informe = null;
        this.mostrarError(this.obtenerMensajeError(error));
      }
    });
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

  anchoBarra(periodo: InformeFinancieroPeriodoDTO): number {
    if (!this.informe?.periodos.length) {
      return 0;
    }
    const maximo = Math.max(...this.informe.periodos.map(item => Math.abs(item.ingresosNetos)), 1);
    return Math.max(4, Math.round((Math.abs(periodo.ingresosNetos) / maximo) * 100));
  }

  claseResultado(valor: number): string {
    return valor < 0 ? 'negative' : 'positive';
  }

  generarInformeGrafico(): void {
    if (!this.informe) {
      this.mostrarError('Primero genera un informe financiero.');
      return;
    }

    void this.router.navigate(this.rutaInformeGrafico(), {
      queryParams: {
        fechaInicio: this.fechaInicio,
        fechaFin: this.fechaFin,
        tipoPeriodo: this.tipoPeriodo,
        ...(this.sucursalSeleccionadaId !== null
          ? { sucursalId: this.sucursalSeleccionadaId }
          : {})
      }
    });
  }

  ocultarInformeGrafico(): void {
    this.mostrarInformeGrafico = false;
  }

  private rutaInformeGrafico(): any[] {
    return this.router.url.startsWith('/super-admin')
      ? ['/super-admin/empresas', this.empresaId, 'informes', 'grafico']
      : ['/admin/empresa', this.empresaId, 'informes', 'grafico'];
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

  valoresDeSucursales(campo: 'ingresosNetos'): number[] {
    return this.informe?.sucursales.map(sucursal => sucursal[campo]) ?? [];
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

  porcentajeVisual(valor: number): number {
    return Math.min(100, Math.max(0, Math.abs(valor)));
  }

  async descargarExcel(): Promise<void> {
    if (!this.informe) {
      this.mostrarError('Primero genera un informe para descargarlo.');
      return;
    }

    const XLSX = await import('xlsx');
    const informe = this.informe;
    const libro = XLSX.utils.book_new();

    const resumen = XLSX.utils.aoa_to_sheet([
      ['Informe financiero'],
      ['Empresa', informe.empresaNombre],
      ['Alcance', informe.sucursalNombre],
      ['Fecha inicial', informe.fechaInicio],
      ['Fecha final', informe.fechaFin],
      ['Compras varias', 'Excluidas del informe'],
      [],
      ['Estado de resultados', 'Valor'],
      ['Ventas brutas', informe.ventasBrutas],
      ['Descuentos', informe.descuentos],
      ['Ingresos netos', informe.ingresosNetos],
      ['Costo de productos vendidos', informe.costoProductosVendidos],
      ['Utilidad bruta', informe.utilidadBruta],
      ['Costos indirectos', informe.costosIndirectos],
      ['Gastos', informe.gastos],
      ['Pérdidas por ajustes de inventario', informe.perdidasAjustesInventario],
      ['Egresos operativos', informe.egresosOperativos],
      ['Utilidad neta', informe.utilidadNeta],
      ['Margen bruto', `${informe.margenBruto}%`],
      ['Margen neto', `${informe.margenNeto}%`],
      [],
      ['Actividad', 'Cantidad'],
      ['Facturas emitidas', informe.facturasEmitidas],
      ['Facturas efectivas', informe.facturasEfectivas],
      ['Facturas canceladas', informe.facturasCanceladas],
      ['Unidades vendidas netas', informe.unidadesVendidas],
      ['Unidades devueltas', informe.unidadesDevueltas]
    ]);
    resumen['!cols'] = [{ wch: 38 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(libro, resumen, 'Resumen financiero');

    const periodos = XLSX.utils.json_to_sheet(informe.periodos.map(item => ({
      Periodo: this.formatearPeriodo(item.periodo),
      Facturas: item.facturasEfectivas,
      Unidades: item.unidadesVendidas,
      'Ingresos netos': item.ingresosNetos,
      'Costo vendido': item.costoProductosVendidos,
      'Utilidad bruta': item.utilidadBruta,
      'Costos indirectos': item.costosIndirectos,
      Gastos: item.gastos,
      'Ajustes de inventario': item.perdidasAjustesInventario,
      'Utilidad neta': item.utilidadNeta
    })));
    periodos['!cols'] = Array.from({ length: 10 }, () => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(libro, periodos, 'Evolucion mensual');

    const sucursales = XLSX.utils.json_to_sheet(informe.sucursales.map(item => ({
      Sucursal: item.sucursalNombre,
      Facturas: item.facturasEfectivas,
      Unidades: item.unidadesVendidas,
      'Ingresos netos': item.ingresosNetos,
      'Costo vendido': item.costoProductosVendidos,
      'Utilidad bruta': item.utilidadBruta,
      'Costos indirectos': item.costosIndirectos,
      Gastos: item.gastos,
      'Ajustes de inventario': item.perdidasAjustesInventario,
      'Utilidad neta': item.utilidadNeta
    })));
    sucursales['!cols'] = Array.from({ length: 10 }, () => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(libro, sucursales, 'Sucursales');

    const egresos = XLSX.utils.json_to_sheet(informe.egresosPorClasificacion.map(item => ({
      Tipo: item.tipo,
      Clasificacion: item.clasificacion,
      Valor: item.valor,
      'Participacion egresos': `${item.porcentajeEgresos}%`
    })));
    egresos['!cols'] = [{ wch: 20 }, { wch: 34 }, { wch: 22 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(libro, egresos, 'Egresos');

    const productos = XLSX.utils.json_to_sheet([
      informe.productosRemanufacturados,
      informe.productosConvencionales
    ].map(item => ({
      Tipo: item.tipo,
      Unidades: item.unidadesVendidas,
      'Ingresos netos': item.ingresosNetos,
      'Costo vendido': item.costoVendido,
      'Utilidad bruta': item.utilidadBruta
    })));
    productos['!cols'] = Array.from({ length: 5 }, () => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(libro, productos, 'Tipo de producto');

    XLSX.writeFile(libro, this.nombreArchivo('xlsx'));
  }

  async descargarPdf(): Promise<void> {
    if (!this.informe) {
      this.mostrarError('Primero genera un informe para descargarlo.');
      return;
    }

    const jsPdfModule = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const jsPDF = jsPdfModule.default;
    const autoTable = autoTableModule.default;
    const informe = this.informe;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('Informe financiero', 14, 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${informe.empresaNombre} · ${informe.sucursalNombre}`, 14, 23);
    doc.text(`Periodo: ${informe.fechaInicio} a ${informe.fechaFin}`, 14, 29);
    doc.setTextColor(180, 83, 9);
    doc.text('Compras varias: excluidas de todos los cálculos', 14, 35);
    doc.setTextColor(15, 23, 42);

    autoTable(doc, {
      startY: 42,
      head: [['Estado de resultados', 'Valor']],
      body: [
        ['Ingresos netos', this.formatearMoneda(informe.ingresosNetos)],
        ['(-) Costo de productos vendidos', this.formatearMoneda(informe.costoProductosVendidos)],
        ['Utilidad bruta', this.formatearMoneda(informe.utilidadBruta)],
        ['(-) Costos indirectos', this.formatearMoneda(informe.costosIndirectos)],
        ['(-) Gastos', this.formatearMoneda(informe.gastos)],
        ['(-) Pérdidas por ajustes de inventario', this.formatearMoneda(informe.perdidasAjustesInventario)],
        ['Utilidad neta', this.formatearMoneda(informe.utilidadNeta)],
        ['Margen neto', `${informe.margenNeto.toFixed(2)}%`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175] }
    });

    const siguienteY = (doc as any).lastAutoTable.finalY + 8;
    autoTable(doc, {
      startY: siguienteY,
      head: [['Mes', 'Ingresos', 'Costo vendido', 'Costos indirectos', 'Gastos', 'Ajustes', 'Utilidad neta']],
      body: informe.periodos.map(item => [
        this.formatearPeriodo(item.periodo),
        this.formatearMoneda(item.ingresosNetos),
        this.formatearMoneda(item.costoProductosVendidos),
        this.formatearMoneda(item.costosIndirectos),
        this.formatearMoneda(item.gastos),
        this.formatearMoneda(item.perdidasAjustesInventario),
        this.formatearMoneda(item.utilidadNeta)
      ]),
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 118, 110] }
    });

    doc.addPage('landscape');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Resultados por sucursal', 14, 16);
    autoTable(doc, {
      startY: 23,
      head: [['Sucursal', 'Ingresos', 'Costo vendido', 'Utilidad bruta', 'Costos indirectos', 'Gastos', 'Ajustes', 'Utilidad neta']],
      body: informe.sucursales.map(item => [
        item.sucursalNombre,
        this.formatearMoneda(item.ingresosNetos),
        this.formatearMoneda(item.costoProductosVendidos),
        this.formatearMoneda(item.utilidadBruta),
        this.formatearMoneda(item.costosIndirectos),
        this.formatearMoneda(item.gastos),
        this.formatearMoneda(item.perdidasAjustesInventario),
        this.formatearMoneda(item.utilidadNeta)
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] }
    });

    doc.save(this.nombreArchivo('pdf'));
  }

  volverDetalleEmpresa(): any[] {
    return this.router.url.startsWith('/super-admin')
      ? ['/super-admin/empresas/detalle', this.empresaId]
      : ['/admin/empresas', this.empresaId, 'dashboard'];
  }

  private cargarEmpresaYSucursales(): void {
    this.empresaService.obtenerPorId(this.empresaId).subscribe({
      next: empresa => {
        this.empresaNombre = empresa.nombre;
        this.sucursalService.listarPorEmpresaNit(empresa.nit).subscribe({
          next: sucursales => {
            this.sucursales = [...sucursales].sort((a, b) =>
              a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
            );
          },
          error: () => this.mostrarError('No se pudieron cargar las sucursales de la empresa.')
        });
        this.generarInforme();
      },
      error: error => this.mostrarError(this.obtenerMensajeError(error))
    });
  }

  private validarRango(): boolean {
    this.mensajeError = '';
    if (!this.fechaInicio || !this.fechaFin) {
      this.mostrarError('Selecciona una fecha inicial y una fecha final.');
      return false;
    }
    if (this.fechaInicio > this.fechaFin) {
      this.mostrarError('La fecha inicial no puede ser posterior a la fecha final.');
      return false;
    }
    return true;
  }

  private mostrarError(mensaje: string): void {
    this.mensajeError = mensaje;
    void Swal.fire({
      icon: 'error',
      title: 'No se pudo generar el informe',
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

  private nombreArchivo(extension: string): string {
    const alcance = this.informe?.sucursalNombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'empresa';
    return `informe-financiero-${alcance}-${this.fechaInicio}-${this.fechaFin}.${extension}`;
  }
}
