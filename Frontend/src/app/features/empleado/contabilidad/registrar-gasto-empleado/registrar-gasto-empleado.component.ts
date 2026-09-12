import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import {
  RegistroContableDTO,
  RegistroGastoEmpleadoDTO
} from '../../../../core/models/contabilidad/contabilidad.model';
import { ContabilidadService } from '../../../../core/services/contabilidad/contabilidad.service';

type TipoFiltroFechaEmpleado = 'TODOS' | 'DIA' | 'INTERVALO';

@Component({
  selector: 'app-registrar-gasto-empleado',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registrar-gasto-empleado.component.html',
  styleUrl: './registrar-gasto-empleado.component.css'
})
export class RegistrarGastoEmpleadoComponent implements OnInit {

  sucursalId!: number;
  registros: RegistroContableDTO[] = [];
  valor: number | null = null;
  valorTexto = '';
  fecha = this.formatearFecha(new Date());
  mostrarCalendario = false;
  fechaCalendario = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  descripcion = '';
  cargandoRegistros = false;
  guardando = false;
  editandoRegistroId: number | null = null;
  mensajeError = '';
  tipoFiltroFecha: TipoFiltroFechaEmpleado = 'TODOS';
  fechaConsultaFiltro = '';
  fechaInicioFiltro = '';
  fechaFinFiltro = '';
  menuFiltroFechaAbierto = false;

  readonly nombresMeses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  readonly nombresDias = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'];
  readonly opcionesFiltroFecha: Array<{
    valor: TipoFiltroFechaEmpleado;
    etiqueta: string;
    descripcion: string;
    icono: string;
    clase: string;
  }> = [
    {
      valor: 'TODOS',
      etiqueta: 'Todos los registros',
      descripcion: 'Muestra todo tu historial',
      icono: 'bi-calendar3',
      clase: 'filtro-todos'
    },
    {
      valor: 'DIA',
      etiqueta: 'Un día específico',
      descripcion: 'Consulta los gastos de una fecha',
      icono: 'bi-calendar-day',
      clase: 'filtro-dia'
    },
    {
      valor: 'INTERVALO',
      etiqueta: 'Intervalo personalizado',
      descripcion: 'Busca entre dos fechas',
      icono: 'bi-calendar-range',
      clase: 'filtro-intervalo'
    }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly contabilidadService: ContabilidadService
  ) {}

  @HostListener('document:click')
  cerrarCalendarioAlHacerClickFuera(): void {
    this.mostrarCalendario = false;
    this.menuFiltroFechaAbierto = false;
  }

  ngOnInit(): void {
    const sucursalIdParam = this.obtenerSucursalIdDesdeRuta();
    const sucursalId = Number(sucursalIdParam);

    if (!sucursalIdParam || !Number.isInteger(sucursalId) || sucursalId <= 0) {
      this.mostrarError('No se pudo identificar la sucursal del empleado.');
      return;
    }

    this.sucursalId = sucursalId;
    this.cargarRegistros();
  }

  cargarRegistros(): void {
    this.cargandoRegistros = true;
    this.mensajeError = '';

    this.contabilidadService.listarGastosEmpleado(this.sucursalId).subscribe({
      next: registros => {
        this.registros = (registros ?? []).map(registro => ({
          ...registro,
          valor: Number(registro.valor)
        }));
        this.cargandoRegistros = false;
      },
      error: error => {
        this.cargandoRegistros = false;
        this.mostrarError(error?.error?.message
          ?? 'No se pudieron cargar tus registros de gasto.');
      }
    });
  }

  guardarGasto(): void {
    if (!this.descripcion.trim()) {
      this.mostrarError('Escribe la descripción del gasto.');
      return;
    }

    if (!this.fecha) {
      this.mostrarError('Selecciona la fecha del gasto.');
      return;
    }

    if (this.valor === null || !Number.isFinite(this.valor) || this.valor <= 0) {
      this.mostrarError('Ingresa un valor mayor que cero.');
      return;
    }

    const dto: RegistroGastoEmpleadoDTO = {
      descripcion: this.descripcion.trim(),
      valor: this.valor,
      fecha: this.fecha
    };

    const registroId = this.editandoRegistroId;
    this.guardando = true;
    this.mensajeError = '';

    const operacion = registroId === null
      ? this.contabilidadService.registrarGastoEmpleado(this.sucursalId, dto)
      : this.contabilidadService.editarGastoEmpleado(this.sucursalId, registroId, dto);

    operacion.subscribe({
      next: () => {
        this.guardando = false;
        this.limpiarFormulario();
        this.cargarRegistros();

        Swal.fire({
          icon: 'success',
          title: registroId === null ? 'Gasto registrado' : 'Gasto actualizado',
          text: registroId === null
            ? 'El gasto quedó guardado como Registro del empleado.'
            : 'La corrección quedó guardada correctamente.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#0f766e'
        });
      },
      error: error => {
        this.guardando = false;
        this.mostrarError(error?.error?.message
          ?? 'No se pudo guardar el gasto.');
      }
    });
  }

  limpiarFormulario(): void {
    this.editandoRegistroId = null;
    this.valor = null;
    this.valorTexto = '';
    this.fecha = this.formatearFecha(new Date());
    this.mostrarCalendario = false;
    const hoy = new Date();
    this.fechaCalendario = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.descripcion = '';
  }

  editarRegistro(registro: RegistroContableDTO): void {
    this.editandoRegistroId = registro.id;
    this.descripcion = registro.descripcion ?? '';
    const valorNumerico = Number(registro.valor);
    this.valor = Number.isFinite(valorNumerico) ? valorNumerico : null;
    this.valorTexto = this.valor === null
      ? ''
      : this.formatearNumeroIngresado(this.valor);
    this.fecha = registro.fecha;
    this.mensajeError = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eliminarRegistro(registro: RegistroContableDTO): void {
    if (!registro.id || this.guardando) {
      return;
    }

    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar este gasto?',
      text: 'Se quitará de tus registros y de los informes financieros.',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      reverseButtons: true
    }).then(resultado => {
      if (!resultado.isConfirmed) {
        return;
      }

      this.guardando = true;
      this.mensajeError = '';

      this.contabilidadService.eliminarGastoEmpleado(this.sucursalId, registro.id!).subscribe({
        next: () => {
          this.guardando = false;
          if (this.editandoRegistroId === registro.id) {
            this.limpiarFormulario();
          }
          this.cargarRegistros();

          Swal.fire({
            icon: 'success',
            title: 'Gasto eliminado',
            text: 'El registro se eliminó correctamente.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#0f766e'
          });
        },
        error: error => {
          this.guardando = false;
          this.mostrarError(error?.error?.message
            ?? 'No se pudo eliminar el gasto.');
        }
      });
    });
  }

  alternarMenuFiltroFecha(): void {
    this.menuFiltroFechaAbierto = !this.menuFiltroFechaAbierto;
  }

  seleccionarFiltroFecha(tipo: TipoFiltroFechaEmpleado): void {
    this.tipoFiltroFecha = tipo;
    this.menuFiltroFechaAbierto = false;

    if (tipo === 'TODOS') {
      this.fechaConsultaFiltro = '';
      this.fechaInicioFiltro = '';
      this.fechaFinFiltro = '';
      return;
    }

    if (tipo === 'DIA') {
      this.fechaInicioFiltro = '';
      this.fechaFinFiltro = '';
    } else {
      this.fechaConsultaFiltro = '';
    }
  }

  limpiarFiltroFecha(): void {
    this.tipoFiltroFecha = 'TODOS';
    this.fechaConsultaFiltro = '';
    this.fechaInicioFiltro = '';
    this.fechaFinFiltro = '';
    this.menuFiltroFechaAbierto = false;
  }

  get registrosFiltrados(): RegistroContableDTO[] {
    if (this.tipoFiltroFecha === 'TODOS') {
      return this.registros;
    }

    if (this.tipoFiltroFecha === 'DIA') {
      return this.fechaConsultaFiltro
        ? this.registros.filter(registro => registro.fecha === this.fechaConsultaFiltro)
        : [];
    }

    if (!this.fechaInicioFiltro && !this.fechaFinFiltro) {
      return [];
    }

    if (this.fechaInicioFiltro && this.fechaFinFiltro
        && this.fechaInicioFiltro > this.fechaFinFiltro) {
      return [];
    }

    return this.registros.filter(registro => {
      const cumpleInicio = !this.fechaInicioFiltro
        || registro.fecha >= this.fechaInicioFiltro;
      const cumpleFin = !this.fechaFinFiltro
        || registro.fecha <= this.fechaFinFiltro;
      return cumpleInicio && cumpleFin;
    });
  }

  get etiquetaFiltroFecha(): string {
    return this.opcionesFiltroFecha.find(opcion => opcion.valor === this.tipoFiltroFecha)?.etiqueta
      ?? 'Todos los registros';
  }

  get iconoFiltroFecha(): string {
    return this.opcionesFiltroFecha.find(opcion => opcion.valor === this.tipoFiltroFecha)?.icono
      ?? 'bi-calendar3';
  }

  get claseFiltroFecha(): string {
    return this.opcionesFiltroFecha.find(opcion => opcion.valor === this.tipoFiltroFecha)?.clase
      ?? 'filtro-todos';
  }

  get filtroFechaActivo(): boolean {
    return this.tipoFiltroFecha !== 'TODOS';
  }

  get intervaloFiltroInvalido(): boolean {
    return this.tipoFiltroFecha === 'INTERVALO'
      && !!this.fechaInicioFiltro
      && !!this.fechaFinFiltro
      && this.fechaInicioFiltro > this.fechaFinFiltro;
  }

  formatearValorRegistro(valor: number | string | null | undefined): string {
    const valorNumerico = Number(valor ?? 0);

    if (!Number.isFinite(valorNumerico)) {
      return '$ 0';
    }

    return '$ ' + new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(valorNumerico);
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
    return this.nombresMeses[this.fechaCalendario.getMonth()]
      + ' de ' + this.fechaCalendario.getFullYear();
  }

  get fechaRegistroVisible(): string {
    const fecha = this.fechaDesdeCadena(this.fecha);
    if (!fecha) {
      return 'Selecciona una fecha';
    }
    return String(fecha.getDate()).padStart(2, '0') + '/'
      + String(fecha.getMonth() + 1).padStart(2, '0') + '/' + fecha.getFullYear();
  }

  get diasCalendario(): Array<{
    fecha: string;
    dia: number;
    otroMes: boolean;
    seleccionada: boolean;
    hoy: boolean;
  }> {
    const año = this.fechaCalendario.getFullYear();
    const mes = this.fechaCalendario.getMonth();
    const primerDia = new Date(año, mes, 1);
    const desplazamiento = (primerDia.getDay() + 6) % 7;
    const inicio = new Date(año, mes, 1 - desplazamiento);
    const hoy = this.formatearFecha(new Date());

    return Array.from({ length: 42 }, (_, indice) => {
      const dia = new Date(
        inicio.getFullYear(),
        inicio.getMonth(),
        inicio.getDate() + indice
      );
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

  actualizarValorDesdeTexto(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const entrada = input.value;
    const tieneComa = entrada.includes(',');
    const partes = entrada.replace(/[^0-9,\-]/g, '').split(',');
    const signo = partes[0].startsWith('-') ? '-' : '';
    const entero = partes[0].replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
    const decimales = tieneComa
      ? partes.slice(1).join('').replace(/[^0-9]/g, '').slice(0, 2)
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
      this.valorTexto = this.formatearNumeroIngresado(this.valor);
    }
  }

  volverDashboard(): void {
    this.router.navigate(['/empleado', 'sucursal', this.sucursalId, 'dashboard']);
  }

  private mostrarError(mensaje: string): void {
    this.mensajeError = mensaje;
    Swal.fire({
      icon: 'error',
      title: 'No se pudo completar la acción',
      text: mensaje,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc2626'
    });
  }

  private obtenerSucursalIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('sucursalId') ??
      null
    );
  }

  private formatearFecha(fecha: Date): string {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  }

  private fechaDesdeCadena(fecha: string): Date | null {
    if (!fecha) {
      return null;
    }

    const partes = fecha.split('-').map(Number);
    if (partes.length !== 3 || partes.some(Number.isNaN)) {
      return null;
    }

    return new Date(partes[0], partes[1] - 1, partes[2]);
  }

  private numeroDesdeTexto(texto: string): number | null {
    const valor = Number(texto.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(valor) && valor > 0 ? valor : null;
  }

  private formatearNumeroIngresado(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
      maximumFractionDigits: 2
    }).format(valor);
  }
}
