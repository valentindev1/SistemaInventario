import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { CompraVariasCrearDTO, CompraVariasDTO } from '../../../../../core/models/compras-varias/compras-varias.model';
import { ComprasVariasService } from '../../../../../core/services/compras-varias/compras-varias.service';
import { EmpresaService } from '../../../../../core/services/empresa/empresa.service';
import { SucursalService } from '../../../../../core/services/sucursal/sucursal.service';

type ModoFiltroCompras = 'MES' | 'DIA' | 'RANGO';

@Component({
  selector: 'app-compras-varias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './compras-varias.component.html',
  styleUrl: './compras-varias.component.css'
})
export class ComprasVariasComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;
  empresaNombre = 'Empresa';
  sucursalNombre = 'Sucursal';

  registros: CompraVariasDTO[] = [];
  cargando = false;
  guardando = false;
  eliminandoId: number | null = null;
  mensajeError = '';

  concepto = '';
  descripcion = '';
  valor: number | null = null;
  valorTexto = '';
  fecha = this.formatearFecha(new Date());
  mostrarCalendario = false;
  fechaCalendario = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  filtroConcepto = '';
  modoFiltro: ModoFiltroCompras = 'MES';
  filtroMes = this.formatearMes(new Date());
  filtroDia = this.formatearFecha(new Date());
  filtroDesde = this.formatearFecha(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  filtroHasta = this.formatearFecha(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  paginaActual = 1;
  readonly registrosPorPagina = 40;
  readonly Math = Math;

  readonly nombresMeses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  readonly nombresDias = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private empresaService: EmpresaService,
    private sucursalService: SucursalService,
    private comprasVariasService: ComprasVariasService
  ) {}

  @HostListener('document:click')
  cerrarCalendarioAlHacerClickFuera(): void {
    this.mostrarCalendario = false;
  }

  ngOnInit(): void {
    const empresaIdParam = this.obtenerParametroRuta('empresaId');
    const sucursalIdParam = this.obtenerParametroRuta('sucursalId');

    if (!empresaIdParam || !sucursalIdParam) {
      this.mensajeError = 'No se pudo identificar la empresa o la sucursal.';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);

    if (!Number.isInteger(this.empresaId) || !Number.isInteger(this.sucursalId)
      || this.empresaId <= 0 || this.sucursalId <= 0) {
      this.mensajeError = 'La ruta contiene parámetros inválidos.';
      return;
    }

    this.empresaService.obtenerPorId(this.empresaId).subscribe({
      next: empresa => this.empresaNombre = empresa.nombre,
      error: () => undefined
    });
    this.sucursalService.obtenerPorId(this.sucursalId).subscribe({
      next: sucursal => this.sucursalNombre = sucursal.nombre,
      error: () => undefined
    });
    this.cargarRegistros();
  }

  cargarRegistros(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.comprasVariasService.listarPorSucursal(this.sucursalId).subscribe({
      next: registros => {
        this.registros = registros || [];
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        this.mensajeError = error?.error?.message
          ?? 'No se pudieron cargar las compras varias.';
      }
    });
  }

  registrar(): void {
    this.mensajeError = '';

    if (!this.concepto.trim()) {
      this.mensajeError = 'Escribe el concepto de la compra.';
      return;
    }

    if (this.valor === null || Number.isNaN(Number(this.valor)) || Number(this.valor) === 0) {
      this.mensajeError = 'Ingresa un valor positivo o negativo, distinto de cero.';
      return;
    }

    if (!this.fecha) {
      this.mensajeError = 'Selecciona la fecha del registro.';
      return;
    }

    const dto: CompraVariasCrearDTO = {
      concepto: this.concepto.trim(),
      descripcion: this.descripcion.trim() || undefined,
      valor: Number(this.valor),
      fecha: this.fecha
    };

    this.guardando = true;
    this.comprasVariasService.registrar(this.sucursalId, dto).subscribe({
      next: () => {
        this.guardando = false;
        this.limpiarFormulario();
        this.cargarRegistros();
        Swal.fire({
          icon: 'success',
          title: 'Registro guardado',
          text: 'Se guardó únicamente en Compras varias.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#0f766e'
        });
      },
      error: error => {
        this.guardando = false;
        this.mensajeError = error?.error?.message
          ?? 'No se pudo guardar el registro.';
      }
    });
  }

  limpiarFormulario(): void {
    this.concepto = '';
    this.descripcion = '';
    this.valor = null;
    this.valorTexto = '';
    this.fecha = this.formatearFecha(new Date());
    this.mostrarCalendario = false;
    const hoy = new Date();
    this.fechaCalendario = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }

  actualizarValorDesdeTexto(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const entrada = input.value;
    const tieneComa = entrada.includes(',');
    const partes = entrada.replace(/[^0-9,\-]/g, '').split(',');
    const signo = partes[0].startsWith('-') ? '-' : '';
    const entero = partes[0].replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
    const decimales = tieneComa
      ? (partes.slice(1).join('').replace(/[^0-9]/g, '').slice(0, 2))
      : '';
    const enteroVisible = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    this.valorTexto = signo + (enteroVisible || (tieneComa ? '0' : ''))
      + (tieneComa ? ',' + decimales : '');
    this.valor = this.numeroDesdeTexto(this.valorTexto);

    input.value = this.valorTexto;
    input.setSelectionRange(input.value.length, input.value.length);
  }

  formatearValorIngresado(): void {
    if (this.valor !== null && Number.isFinite(this.valor)) {
      this.valorTexto = this.formatearNumeroMiles(this.valor);
    }
  }

  alternarCalendario(): void {
    this.mostrarCalendario = !this.mostrarCalendario;
    if (this.mostrarCalendario) {
      const fechaSeleccionada = this.fechaDesdeCadena(this.fecha);
      const base = fechaSeleccionada ?? new Date();
      this.fechaCalendario = new Date(base.getFullYear(), base.getMonth(), 1);
    }
  }

  cambiarMesCalendario(cambio: number): void {
    this.fechaCalendario = new Date(
      this.fechaCalendario.getFullYear(),
      this.fechaCalendario.getMonth() + cambio,
      1
    );
  }

  seleccionarFechaCalendario(fecha: string): void {
    this.fecha = fecha;
    this.mostrarCalendario = false;
  }

  seleccionarHoy(): void {
    const hoy = new Date();
    this.fecha = this.formatearFecha(hoy);
    this.fechaCalendario = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.mostrarCalendario = false;
  }

  limpiarFecha(): void {
    this.fecha = '';
    this.mostrarCalendario = false;
  }

  get etiquetaMesCalendario(): string {
    return this.nombresMeses[this.fechaCalendario.getMonth()] + ' de ' + this.fechaCalendario.getFullYear();
  }

  get fechaRegistroVisible(): string {
    const fecha = this.fechaDesdeCadena(this.fecha);
    if (!fecha) {
      return 'Selecciona una fecha';
    }
    return String(fecha.getDate()).padStart(2, '0') + '/'
      + String(fecha.getMonth() + 1).padStart(2, '0') + '/' + fecha.getFullYear();
  }

  get diasCalendario(): Array<{ fecha: string; dia: number; otroMes: boolean; seleccionada: boolean; hoy: boolean }> {
    const año = this.fechaCalendario.getFullYear();
    const mes = this.fechaCalendario.getMonth();
    const primerDia = new Date(año, mes, 1);
    const desplazamiento = (primerDia.getDay() + 6) % 7;
    const inicio = new Date(año, mes, 1 - desplazamiento);
    const hoy = this.formatearFecha(new Date());

    return Array.from({ length: 42 }, (_, indice) => {
      const dia = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + indice);
      const fecha = this.formatearFecha(dia);
      return {
        fecha,
        dia: dia.getDate(),
        otroMes: dia.getMonth() !== mes,
        seleccionada: fecha === this.fecha,
        hoy: fecha === hoy
      };
    });
  }

  async eliminar(registro: CompraVariasDTO): Promise<void> {
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar este registro?',
      html: 'Se eliminará <strong>' + this.escapeHtml(registro.concepto)
        + '</strong> por valor de <strong>' + this.formatearValor(registro.valor)
        + '</strong>.<br><small>Esta acción solo afecta el módulo Compras varias.</small>',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b'
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.eliminandoId = registro.id;
    this.comprasVariasService.eliminar(this.sucursalId, registro.id).subscribe({
      next: () => {
        this.eliminandoId = null;
        this.cargarRegistros();
        Swal.fire({
          icon: 'success',
          title: 'Registro eliminado',
          text: 'El registro fue eliminado sin afectar otros módulos.',
          confirmButtonColor: '#0f766e'
        });
      },
      error: error => {
        this.eliminandoId = null;
        Swal.fire({
          icon: 'error',
          title: 'No se pudo eliminar',
          text: error?.error?.message ?? 'El registro no pudo ser eliminado.',
          confirmButtonColor: '#0f766e'
        });
      }
    });
  }

  get registrosFiltrados(): CompraVariasDTO[] {
    const concepto = this.normalizarTexto(this.filtroConcepto);

    return [...this.registros]
      .filter(registro => {
        const coincideConcepto = !concepto
          || this.normalizarTexto(registro.concepto).includes(concepto)
          || this.normalizarTexto(registro.descripcion ?? '').includes(concepto);
        return coincideConcepto && this.coincidePeriodo(registro.fecha);
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha)
        || String(b.fechaCreacion).localeCompare(String(a.fechaCreacion)));
  }

  get registrosPaginados(): CompraVariasDTO[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.registrosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.registrosFiltrados.length / this.registrosPorPagina));
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  get totalNeto(): number {
    return this.registrosFiltrados.reduce((total, registro) => total + Number(registro.valor), 0);
  }

  get totalPositivo(): number {
    return this.registrosFiltrados
      .filter(registro => Number(registro.valor) > 0)
      .reduce((total, registro) => total + Number(registro.valor), 0);
  }

  get totalNegativo(): number {
    return this.registrosFiltrados
      .filter(registro => Number(registro.valor) < 0)
      .reduce((total, registro) => total + Math.abs(Number(registro.valor)), 0);
  }

  actualizarFiltros(): void {
    this.paginaActual = 1;
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  limpiarFiltros(): void {
    const hoy = new Date();
    this.filtroConcepto = '';
    this.modoFiltro = 'MES';
    this.filtroMes = this.formatearMes(hoy);
    this.filtroDia = this.formatearFecha(hoy);
    this.filtroDesde = this.formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    this.filtroHasta = this.formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
    this.paginaActual = 1;
  }

  etiquetaPeriodo(): string {
    if (this.modoFiltro === 'MES') {
      const partes = this.filtroMes.split('-');
      const año = Number(partes[0]);
      const mes = Number(partes[1]);
      return año && mes ? 'Para ' + this.nombresMeses[mes - 1] + ' de ' + año : 'Mes no seleccionado';
    }
    if (this.modoFiltro === 'DIA') {
      return this.filtroDia ? 'Para el ' + this.formatearFechaVisible(this.filtroDia) : 'Día no seleccionado';
    }
    if (this.filtroDesde && this.filtroHasta) {
      return 'Del ' + this.formatearFechaVisible(this.filtroDesde)
        + ' al ' + this.formatearFechaVisible(this.filtroHasta);
    }
    return 'Rango personalizado';
  }

  fechaVisible(fecha: string): string {
    return this.formatearFechaVisible(fecha);
  }

  formatearValor(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Number(valor));
  }

  private formatearNumeroMiles(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      useGrouping: true,
      minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
      maximumFractionDigits: 2
    }).format(valor);
  }

  claseValor(valor: number): string {
    return Number(valor) >= 0 ? 'value-positive' : 'value-negative';
  }

  textoValor(valor: number): string {
    return Number(valor) > 0 ? 'Entrada' : 'Salida';
  }

  volverSucursal(): any[] {
    return this.router.url.startsWith('/super-admin')
      ? ['/super-admin/empresas', this.empresaId, 'sucursales', 'detalle', this.sucursalId]
      : ['/admin/empresa', this.empresaId, 'sucursales', 'detalle', this.sucursalId];
  }

  private coincidePeriodo(fecha: string): boolean {
    if (this.modoFiltro === 'MES') {
      return !!this.filtroMes && fecha.startsWith(this.filtroMes);
    }
    if (this.modoFiltro === 'DIA') {
      return !!this.filtroDia && fecha === this.filtroDia;
    }
    return (!this.filtroDesde || fecha >= this.filtroDesde)
      && (!this.filtroHasta || fecha <= this.filtroHasta);
  }

  private normalizarTexto(valor: string): string {
    return valor.toLocaleLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();
  }

  private formatearFecha(fecha: Date): string {
    return fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0')
      + '-' + String(fecha.getDate()).padStart(2, '0');
  }

  private formatearMes(fecha: Date): string {
    return fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0');
  }

  private fechaDesdeCadena(valor: string): Date | null {
    if (!valor) {
      return null;
    }
    const partes = valor.split('-').map(Number);
    if (partes.length !== 3 || partes.some(Number.isNaN)) {
      return null;
    }
    return new Date(partes[0], partes[1] - 1, partes[2]);
  }

  private numeroDesdeTexto(valor: string): number | null {
    const normalizado = valor.trim().replace(/\./g, '').replace(',', '.');
    if (!normalizado || normalizado === '-') {
      return null;
    }
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : null;
  }

  private formatearFechaVisible(fecha: string): string {
    const partes = fecha.split('-');
    return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : fecha;
  }

  private obtenerParametroRuta(nombre: string): string | null {
    return this.route.snapshot.paramMap.get(nombre)
      ?? this.route.parent?.snapshot.paramMap.get(nombre)
      ?? this.route.parent?.parent?.snapshot.paramMap.get(nombre)
      ?? null;
  }

  private escapeHtml(valor: string): string {
    const reemplazos: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return valor.replace(/[&<>'"]/g, caracter => reemplazos[caracter] ?? caracter);
  }
}
