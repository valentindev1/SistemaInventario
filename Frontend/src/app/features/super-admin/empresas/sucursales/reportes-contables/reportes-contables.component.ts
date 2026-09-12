import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import {
  ClasificacionGasto,
  ClasificacionContableCrearDTO,
  ClasificacionContableDTO,
  ClasificacionContableEditarDTO,
  ConceptoGastoCrearDTO,
  ConceptoGastoDTO,
  RegistroContableCrearDTO,
  RegistroContableDTO,
  TipoRegistroContable
} from '../../../../../core/models/contabilidad/contabilidad.model';
import { ContabilidadService } from '../../../../../core/services/contabilidad/contabilidad.service';
import { EmpresaService } from '../../../../../core/services/empresa/empresa.service';
import { SucursalService } from '../../../../../core/services/sucursal/sucursal.service';
import { AuthService } from '../../../../../core/services/auth/auth.service';

interface OpcionClasificacion {
  clave: string;
  etiqueta: string;
  valor?: ClasificacionGasto;
  id?: number;
}

@Component({
  selector: 'app-reportes-contables',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reportes-contables.component.html',
  styleUrl: './reportes-contables.component.css'
})
export class ReportesContablesComponent implements OnInit, OnDestroy {

  empresaId!: number;
  sucursalId!: number;
  empresaNombre = 'Empresa';
  sucursalNombre = 'Sucursal';

  registros: RegistroContableDTO[] = [];
  conceptosGasto: ConceptoGastoDTO[] = [];
  clasificacionesContables: ClasificacionContableDTO[] = [];
  cargando = false;
  cargandoConceptos = false;
  cargandoClasificaciones = false;
  guardando = false;
  guardandoConcepto = false;
  guardandoClasificacion = false;

  mostrarGestionConceptos = false;
  mostrarGestionClasificaciones = false;
  conceptoGastoSeleccionadoId: number | null = null;
  mostrarSelectorConceptos = false;
  filtroSelectorConceptos = '';
  mostrarSelectorClasificaciones = false;
  filtroSelectorClasificaciones = '';
  conceptoEditandoId: number | null = null;
  clasificacionEditandoId: number | null = null;
  nombreConcepto = '';
  descripcionConcepto = '';
  nombreNuevaClasificacion = '';
  filtroConceptos = '';
  paginaConceptosActual = 1;
  readonly conceptosPorPagina = 40;
  filtroClasificacionesGasto = '';
  clasificacionConcepto = 'OPERATIVO';
  readonly clasificacionesGasto: Array<{ valor: ClasificacionGasto; etiqueta: string }> = [
    { valor: 'OPERATIVO', etiqueta: 'Operativo' },
    { valor: 'ADMINISTRATIVO', etiqueta: 'Administrativo' },
    { valor: 'VENTAS', etiqueta: 'Ventas' },
    { valor: 'PRODUCCION', etiqueta: 'Costo de producción' },
    { valor: 'PRODUCCION_INDIRECTA', etiqueta: 'Costo indirecto de producción' },
    { valor: 'OTRO', etiqueta: 'Otro' }
  ];
  readonly clasificacionesCosto: Array<{ valor: ClasificacionGasto; etiqueta: string }> = [
    { valor: 'PRODUCCION_INDIRECTA', etiqueta: 'Costo indirecto de producción' }
  ];

  tipoConcepto: TipoRegistroContable = 'GASTO';
  tipoClasificacion: TipoRegistroContable = 'GASTO';
  tipoSeleccionado: TipoRegistroContable = 'GASTO';
  clasificacionCosto: ClasificacionGasto = 'PRODUCCION_INDIRECTA';
  concepto = '';
  descripcion = '';
  valor: number | null = null;
  valorTexto = '';
  fecha = this.formatearFecha(new Date());
  mostrarCalendario = false;
  fechaCalendario = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  readonly nombresMeses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  readonly nombresDias = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'];

  filtroNombre = '';
  filtroTipo: 'TODOS' | TipoRegistroContable = 'TODOS';
  filtroDesde = this.formatearFecha(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  filtroHasta = this.formatearFecha(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  paginaActual = 1;
  readonly registrosPorPagina = 40;
  private temporizadorOcultarConceptos: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private empresaService: EmpresaService,
    private sucursalService: SucursalService,
    private contabilidadService: ContabilidadService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.obtenerParametroRuta('empresaId');
    const sucursalIdParam = this.obtenerParametroRuta('sucursalId');

    if (!empresaIdParam || !sucursalIdParam) {
      this.mostrarError('No se pudo identificar la empresa o la sucursal.');
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);

    if (!Number.isInteger(this.empresaId) || !Number.isInteger(this.sucursalId)
      || this.empresaId <= 0 || this.sucursalId <= 0) {
      this.mostrarError('La ruta contiene parámetros inválidos.');
      return;
    }

    this.empresaService.obtenerPorId(this.empresaId).subscribe({
      next: empresa => this.empresaNombre = empresa.nombre,
      error: () => this.mostrarError('No se pudo cargar la información de la empresa.')
    });

    this.sucursalService.obtenerPorId(this.sucursalId).subscribe({
      next: sucursal => this.sucursalNombre = sucursal.nombre,
      error: () => this.mostrarError('No se pudo cargar la información de la sucursal.')
    });

    this.cargarConceptos();
    this.cargarClasificaciones();
    this.cargarRegistros();
  }

  ngOnDestroy(): void {
    this.cancelarOcultamientoConceptos();
  }

  cargarConceptos(): void {
    this.cargandoConceptos = true;

    this.contabilidadService.listarConceptos(this.empresaId).subscribe({
      next: conceptos => {
        this.conceptosGasto = conceptos;
        this.paginaConceptosActual = 1;
        this.cargandoConceptos = false;
      },
      error: error => {
        this.cargandoConceptos = false;
        this.mostrarError(error?.error?.message
          ?? 'No se pudieron cargar los conceptos de gasto.');
      }
    });
  }

  cargarClasificaciones(): void {
    this.cargandoClasificaciones = true;
    this.contabilidadService.listarClasificaciones(this.empresaId).subscribe({
      next: clasificaciones => {
        this.clasificacionesContables = clasificaciones || [];
        this.cargandoClasificaciones = false;
      },
      error: error => {
        this.cargandoClasificaciones = false;
        this.mostrarError(error?.error?.message
          ?? 'No se pudieron cargar las clasificaciones contables.');
      }
    });
  }

  cargarRegistros(): void {
    this.cargando = true;

    this.contabilidadService.listarPorSucursal(this.sucursalId).subscribe({
      next: registros => {
        this.registros = registros;
        if (registros.length > 0) {
          this.sucursalNombre = registros[0].sucursalNombre;
        }
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        this.mostrarError(error?.error?.message
          ?? 'No se pudieron cargar los reportes contables.');
      }
    });
  }

  seleccionarTipo(tipo: TipoRegistroContable): void {
    this.tipoSeleccionado = tipo;
    this.mostrarSelectorConceptos = false;
    this.filtroSelectorConceptos = '';
    this.mostrarCalendario = false;
    if (tipo === 'COSTO') {
      this.conceptoGastoSeleccionadoId = null;
      this.clasificacionCosto = 'PRODUCCION_INDIRECTA';
    }
  }

  seleccionarTipoConcepto(tipo: TipoRegistroContable): void {
    this.tipoConcepto = tipo;
    this.clasificacionConcepto = tipo === 'COSTO'
      ? 'PRODUCCION_INDIRECTA'
      : 'OPERATIVO';
    this.mostrarSelectorClasificaciones = false;
    this.filtroSelectorClasificaciones = '';
  }

  alternarSelectorClasificaciones(): void {
    if (this.clasificacionesParaConcepto.length === 0) {
      return;
    }

    this.mostrarSelectorClasificaciones = !this.mostrarSelectorClasificaciones;
    if (!this.mostrarSelectorClasificaciones) {
      this.filtroSelectorClasificaciones = '';
    }
  }

  get conceptoGastoSeleccionado(): ConceptoGastoDTO | null {
    return this.conceptosGasto.find(
      concepto => concepto.id === this.conceptoGastoSeleccionadoId
    ) ?? null;
  }

  alternarSelectorConceptos(): void {
    if (this.conceptosActivos.length === 0) {
      return;
    }

    this.mostrarSelectorConceptos = !this.mostrarSelectorConceptos;
    if (this.mostrarSelectorConceptos) {
      this.mostrarCalendario = false;
    } else {
      this.filtroSelectorConceptos = '';
    }
  }

  seleccionarConceptoRegistro(concepto: ConceptoGastoDTO): void {
    this.conceptoGastoSeleccionadoId = concepto.id;
    this.mostrarSelectorConceptos = false;
    this.filtroSelectorConceptos = '';
  }

  alternarCalendario(): void {
    this.mostrarCalendario = !this.mostrarCalendario;
    if (this.mostrarCalendario) {
      this.mostrarSelectorConceptos = false;
      this.filtroSelectorConceptos = '';
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
    return `${this.nombresMeses[this.fechaCalendario.getMonth()]} de ${this.fechaCalendario.getFullYear()}`;
  }

  get fechaVisible(): string {
    const fecha = this.fechaDesdeCadena(this.fecha);
    if (!fecha) {
      return 'Selecciona una fecha';
    }
    return `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;
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
      return {
        fecha: this.formatearFecha(dia),
        dia: dia.getDate(),
        otroMes: dia.getMonth() !== mes,
        seleccionada: this.formatearFecha(dia) === this.fecha,
        hoy: this.formatearFecha(dia) === hoy
      };
    });
  }

  guardarRegistro(): void {
    const conceptoSeleccionado = this.conceptosGasto.find(
      concepto => concepto.id === this.conceptoGastoSeleccionadoId
    );

    if (!conceptoSeleccionado) {
      this.mostrarError(this.tipoSeleccionado === 'COSTO'
        ? 'Selecciona un concepto de costo indirecto del catálogo.'
        : 'Selecciona un concepto de gasto del catálogo.');
      return;
    }

    if (!this.fecha) {
      this.mostrarError('Selecciona la fecha del registro.');
      return;
    }

    if (this.valor === null || Number(this.valor) <= 0) {
      this.mostrarError('Ingresa un valor mayor que cero.');
      return;
    }

    const dto: RegistroContableCrearDTO = {
      tipo: this.tipoSeleccionado,
      concepto: conceptoSeleccionado.nombre,
      clasificacion: conceptoSeleccionado.clasificacion,
      conceptoGastoId: conceptoSeleccionado.id,
      descripcion: this.descripcion.trim() || undefined,
      valor: Number(this.valor),
      fecha: this.fecha
    };

    this.guardando = true;

    this.contabilidadService.registrar(this.sucursalId, dto).subscribe({
      next: () => {
        this.guardando = false;
        this.limpiarFormulario();
        this.cargarRegistros();

        Swal.fire({
          icon: 'success',
          title: 'Registro guardado',
          text: `${dto.tipo === 'COSTO' ? 'El costo' : 'El gasto'} quedó registrado en ${this.sucursalNombre}.`,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#2563eb'
        });
      },
      error: error => {
        this.guardando = false;
        this.mostrarError(error?.error?.message
          ?? 'No se pudo guardar el registro contable.');
      }
    });
  }

  limpiarFormulario(): void {
    this.tipoSeleccionado = 'GASTO';
    this.clasificacionCosto = 'PRODUCCION_INDIRECTA';
    this.concepto = '';
    this.conceptoGastoSeleccionadoId = null;
    this.mostrarSelectorConceptos = false;
    this.filtroSelectorConceptos = '';
    this.descripcion = '';
    this.valor = null;
    this.valorTexto = '';
    this.fecha = this.formatearFecha(new Date());
    this.mostrarCalendario = false;
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

  get registrosFiltrados(): RegistroContableDTO[] {
    const nombre = this.normalizarTexto(this.filtroNombre);

    return [...this.registros].filter(registro => {
      const coincideNombre = !nombre
        || this.normalizarTexto(registro.concepto).includes(nombre)
        || this.normalizarTexto(registro.conceptoGastoNombre ?? '').includes(nombre)
        || this.normalizarTexto(registro.descripcion ?? '').includes(nombre)
        || this.normalizarTexto(this.nombreClasificacionRegistro(registro)).includes(nombre);
      const coincideTipo = this.filtroTipo === 'TODOS'
        || registro.tipo === this.filtroTipo;
      const coincideDesde = !this.filtroDesde || registro.fecha >= this.filtroDesde;
      const coincideHasta = !this.filtroHasta || registro.fecha <= this.filtroHasta;

      return coincideNombre && coincideTipo && coincideDesde && coincideHasta;
    }).sort((a, b) => b.fecha.localeCompare(a.fecha)
      || String(b.fechaCreacion).localeCompare(String(a.fechaCreacion)));
  }

  get registrosPaginados(): RegistroContableDTO[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.registrosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.registrosFiltrados.length / this.registrosPorPagina));
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
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
    this.filtroNombre = '';
    this.filtroTipo = 'TODOS';
    this.establecerPeriodoMesActual();
    this.paginaActual = 1;
  }

  alternarGestionConceptos(): void {
    this.cancelarOcultamientoConceptos();
    this.mostrarGestionConceptos = !this.mostrarGestionConceptos;
    if (this.mostrarGestionConceptos && this.conceptosGasto.length === 0) {
      this.cargarConceptos();
    }
  }

  cerrarGestionConceptos(): void {
    this.cancelarOcultamientoConceptos();
    this.mostrarGestionConceptos = false;
  }

  guardarConcepto(): void {
    if (!this.nombreConcepto.trim()) {
      this.mostrarError('Escribe el nombre del concepto.');
      return;
    }

    const datos: ConceptoGastoCrearDTO = {
      nombre: this.nombreConcepto.trim(),
      tipo: this.tipoConcepto,
      descripcion: this.descripcionConcepto.trim() || undefined,
      clasificacion: this.opcionClasificacionSeleccionada?.valor ?? 'OTRO',
      clasificacionId: this.opcionClasificacionSeleccionada?.id,
      empresaId: this.empresaId
    };

    if (!this.opcionClasificacionSeleccionada) {
      this.mostrarError('Selecciona una clasificación contable.');
      return;
    }

    const editando = this.conceptoEditandoId !== null;
    this.guardandoConcepto = true;
    const operacion = this.conceptoEditandoId === null
      ? this.contabilidadService.crearConcepto(datos)
      : this.contabilidadService.editarConcepto(this.conceptoEditandoId, {
          nombre: datos.nombre,
          tipo: datos.tipo,
          clasificacionId: datos.clasificacionId,
          descripcion: datos.descripcion,
          clasificacion: datos.clasificacion
        });

    operacion.subscribe({
      next: () => {
        this.guardandoConcepto = false;
        this.limpiarFormularioConcepto();
        this.cargarConceptos();
        if (!editando) {
          this.programarOcultamientoConceptos();
        }
        Swal.fire({
          icon: 'success',
          title: editando ? 'Concepto actualizado' : '¡Concepto agregado!',
          html: editando
            ? `El concepto <strong>${datos.nombre}</strong> fue actualizado correctamente.`
            : `El concepto <strong>${datos.nombre}</strong> quedó disponible para registrar gastos.<br><small>Clasificación: ${this.etiquetaClasificacion(datos.clasificacion)}</small>`,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#2563eb',
          timer: editando ? undefined : 3500,
          timerProgressBar: !editando
        });
      },
      error: error => {
        this.guardandoConcepto = false;
        this.mostrarError(error?.error?.message
          ?? 'No se pudo guardar el concepto de gasto.');
      }
    });
  }

  editarConcepto(concepto: ConceptoGastoDTO): void {
    this.conceptoEditandoId = concepto.id;
    this.nombreConcepto = concepto.nombre;
    this.tipoConcepto = concepto.tipo
      ?? (concepto.clasificacion === 'PRODUCCION_INDIRECTA' ? 'COSTO' : 'GASTO');
    this.descripcionConcepto = concepto.descripcion ?? '';
    this.clasificacionConcepto = concepto.clasificacionId
      ? this.claveClasificacionPersonalizada(concepto.clasificacionId)
      : concepto.clasificacion;
    this.mostrarSelectorClasificaciones = false;
    this.filtroSelectorClasificaciones = '';
    this.mostrarGestionConceptos = true;
  }

  eliminarConcepto(concepto: ConceptoGastoDTO): void {
    if (!confirm(`¿Deseas desactivar el concepto "${concepto.nombre}"?`)) {
      return;
    }

    this.contabilidadService.eliminarConcepto(concepto.id).subscribe({
      next: () => {
        if (this.conceptoGastoSeleccionadoId === concepto.id) {
          this.conceptoGastoSeleccionadoId = null;
        }
        this.cargarConceptos();
      },
      error: error => {
        this.mostrarError(error?.error?.message
          ?? 'No se pudo desactivar el concepto de gasto.');
      }
    });
  }

  limpiarFormularioConcepto(): void {
    this.conceptoEditandoId = null;
    this.tipoConcepto = 'GASTO';
    this.nombreConcepto = '';
    this.descripcionConcepto = '';
    this.clasificacionConcepto = 'OPERATIVO';
    this.mostrarSelectorClasificaciones = false;
    this.filtroSelectorClasificaciones = '';
  }

  abrirGestionClasificaciones(): void {
    this.cerrarGestionConceptos();
    const ruta = this.esSuperAdmin()
      ? ['/super-admin/empresas', this.empresaId, 'sucursales', this.sucursalId, 'clasificaciones-contables']
      : ['/admin/empresa', this.empresaId, 'sucursales', this.sucursalId, 'clasificaciones-contables'];
    this.router.navigate(ruta);
  }

  guardarClasificacion(): void {
    const nombre = this.nombreNuevaClasificacion.trim();

    if (!nombre) {
      this.mostrarError('Escribe el nombre de la clasificación.');
      return;
    }

    const editando = this.clasificacionEditandoId !== null;
    const datos: ClasificacionContableCrearDTO = {
      nombre,
      tipo: this.tipoClasificacion,
      empresaId: this.empresaId
    };
    const operacion = editando
      ? this.contabilidadService.editarClasificacion(
          this.clasificacionEditandoId!,
          { nombre } satisfies ClasificacionContableEditarDTO
        )
      : this.contabilidadService.crearClasificacion(datos);

    this.guardandoClasificacion = true;
    operacion.subscribe({
      next: clasificacion => {
        this.guardandoClasificacion = false;
        this.limpiarFormularioClasificacion();
        this.cargarClasificaciones();
        if (!editando && clasificacion.tipo === this.tipoConcepto) {
          this.clasificacionConcepto = this.claveClasificacionPersonalizada(clasificacion.id);
        }
        Swal.fire({
          icon: 'success',
          title: editando ? 'Clasificación actualizada' : 'Clasificación creada',
          text: `La clasificación "${clasificacion.nombre}" quedó disponible para nuevos conceptos.`,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#2563eb'
        });
      },
      error: error => {
        this.guardandoClasificacion = false;
        this.mostrarError(error?.error?.message
          ?? 'No se pudo guardar la clasificación contable.');
      }
    });
  }

  editarClasificacion(clasificacion: ClasificacionContableDTO): void {
    this.clasificacionEditandoId = clasificacion.id;
    this.nombreNuevaClasificacion = clasificacion.nombre;
    this.tipoClasificacion = clasificacion.tipo;
    this.mostrarGestionClasificaciones = true;
  }

  eliminarClasificacion(clasificacion: ClasificacionContableDTO): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar clasificación?',
      text: `"${clasificacion.nombre}" no aparecerá para nuevos conceptos, pero se conservará en los conceptos y movimientos existentes. Si la creas nuevamente, se reactivará sin perder las relaciones.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b'
    }).then(resultado => {
      if (!resultado.isConfirmed) {
        return;
      }

      this.contabilidadService.eliminarClasificacion(clasificacion.id).subscribe({
        next: () => {
          this.cargarClasificaciones();
          this.cargarConceptos();
          Swal.fire({
            icon: 'success',
            title: 'Clasificación eliminada',
            text: 'La clasificación se conservó para mantener la trazabilidad y no se eliminaron datos relacionados.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#2563eb'
          });
        },
        error: error => {
          this.mostrarError(error?.error?.message
            ?? 'No se pudo eliminar la clasificación contable.');
        }
      });
    });
  }

  limpiarFormularioClasificacion(): void {
    this.clasificacionEditandoId = null;
    this.nombreNuevaClasificacion = '';
    this.tipoClasificacion = 'GASTO';
  }

  private programarOcultamientoConceptos(): void {
    this.cancelarOcultamientoConceptos();
    this.temporizadorOcultarConceptos = setTimeout(() => {
      this.mostrarGestionConceptos = false;
      this.temporizadorOcultarConceptos = null;
    }, 10000);
  }

  private cancelarOcultamientoConceptos(): void {
    if (this.temporizadorOcultarConceptos !== null) {
      clearTimeout(this.temporizadorOcultarConceptos);
      this.temporizadorOcultarConceptos = null;
    }
  }

  private mostrarError(mensaje: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Ocurrió un error',
      text: mensaje,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc2626'
    });
  }

  get conceptosActivos(): ConceptoGastoDTO[] {
    return this.conceptosGasto
      .filter(concepto => concepto.activo
        && (concepto.tipo ?? 'GASTO') === this.tipoSeleccionado)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  }

  get conceptosSelectorFiltrados(): ConceptoGastoDTO[] {
    const filtro = this.normalizarTexto(this.filtroSelectorConceptos);

    return this.conceptosActivos.filter(concepto =>
      !filtro || this.normalizarTexto(concepto.nombre).includes(filtro)
    );
  }

  get clasificacionesParaConcepto(): OpcionClasificacion[] {
    return this.tipoConcepto === 'COSTO'
      ? this.opcionesCostoDisponibles
      : this.opcionesGastoDisponibles;
  }

  get clasificacionesParaConceptoFiltradas(): OpcionClasificacion[] {
    const filtro = this.normalizarTexto(this.filtroSelectorClasificaciones);
    return this.clasificacionesParaConcepto.filter(clasificacion =>
      !filtro || this.normalizarTexto(clasificacion.etiqueta).includes(filtro)
    );
  }

  get opcionesGastoDisponibles(): OpcionClasificacion[] {
    const predeterminadas = this.clasificacionesGastoVisibles.map(clasificacion => ({
      clave: clasificacion.valor,
      etiqueta: clasificacion.etiqueta,
      valor: clasificacion.valor
    }));
    const personalizadas = this.clasificacionesGastoPersonalizadas
      .map(clasificacion => ({
        clave: this.claveClasificacionPersonalizada(clasificacion.id),
        etiqueta: clasificacion.nombre,
        id: clasificacion.id
      }));

    return [...predeterminadas, ...personalizadas]
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es', { sensitivity: 'base' }));
  }

  get opcionesCostoDisponibles(): OpcionClasificacion[] {
    const predeterminadas = this.clasificacionesCosto.map(clasificacion => ({
      clave: clasificacion.valor,
      etiqueta: clasificacion.etiqueta,
      valor: clasificacion.valor
    }));
    const personalizadas = this.clasificacionesCostoPersonalizadas
      .map(clasificacion => ({
        clave: this.claveClasificacionPersonalizada(clasificacion.id),
        etiqueta: clasificacion.nombre,
        id: clasificacion.id
      }));

    return [...predeterminadas, ...personalizadas]
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es', { sensitivity: 'base' }));
  }

  get clasificacionesGastoFiltradas(): OpcionClasificacion[] {
    const filtro = this.normalizarTexto(this.filtroClasificacionesGasto);
    return this.opcionesGastoDisponibles.filter(clasificacion =>
      !filtro || this.normalizarTexto(clasificacion.etiqueta).includes(filtro)
    );
  }

  get clasificacionesGastoVisibles(): Array<{ valor: ClasificacionGasto; etiqueta: string }> {
    return this.clasificacionesGasto.filter(clasificacion =>
      clasificacion.valor !== 'PRODUCCION'
      && clasificacion.valor !== 'PRODUCCION_INDIRECTA'
    );
  }

  get clasificacionesGastoPersonalizadas(): ClasificacionContableDTO[] {
    return this.clasificacionesContables.filter(clasificacion =>
      clasificacion.activo && clasificacion.tipo === 'GASTO'
    );
  }

  get clasificacionesCostoPersonalizadas(): ClasificacionContableDTO[] {
    return this.clasificacionesContables.filter(clasificacion =>
      clasificacion.activo && clasificacion.tipo === 'COSTO'
    );
  }

  get opcionClasificacionSeleccionada(): OpcionClasificacion | undefined {
    return this.clasificacionesParaConcepto.find(
      clasificacion => clasificacion.clave === this.clasificacionConcepto
    );
  }

  seleccionarClasificacionConcepto(clasificacion: OpcionClasificacion | ClasificacionGasto): void {
    this.clasificacionConcepto = typeof clasificacion === 'string'
      ? clasificacion
      : clasificacion.clave;
    this.mostrarSelectorClasificaciones = false;
    this.filtroSelectorClasificaciones = '';
  }

  private claveClasificacionPersonalizada(id: number): string {
    return `PERSONALIZADA_${id}`;
  }

  get conceptosFiltrados(): ConceptoGastoDTO[] {
    const texto = this.normalizarTexto(this.filtroConceptos);

    return this.conceptosGasto
      .filter(concepto => !texto
        || this.normalizarTexto(concepto.nombre).includes(texto)
        || this.normalizarTexto(concepto.descripcion ?? '').includes(texto)
        || this.normalizarTexto(this.nombreClasificacion(concepto)).includes(texto))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  }

  get conceptosFiltradosPaginados(): ConceptoGastoDTO[] {
    const inicio = (this.paginaConceptosActual - 1) * this.conceptosPorPagina;
    return this.conceptosFiltrados.slice(inicio, inicio + this.conceptosPorPagina);
  }

  get totalPaginasConceptos(): number {
    return Math.max(1, Math.ceil(this.conceptosFiltrados.length / this.conceptosPorPagina));
  }

  get paginasConceptos(): number[] {
    return Array.from({ length: this.totalPaginasConceptos }, (_, indice) => indice + 1);
  }

  actualizarPaginacionConceptos(): void {
    this.paginaConceptosActual = 1;
  }

  cambiarPaginaConceptos(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginasConceptos) {
      this.paginaConceptosActual = pagina;
    }
  }

  etiquetaClasificacion(clasificacion: ClasificacionGasto): string {
    return this.clasificacionesGasto.find(item => item.valor === clasificacion)?.etiqueta
      ?? clasificacion;
  }

  nombreClasificacion(concepto: ConceptoGastoDTO): string {
    return concepto.clasificacionNombre ?? this.etiquetaClasificacion(concepto.clasificacion);
  }

  nombreClasificacionRegistro(registro: RegistroContableDTO): string {
    return registro.clasificacionNombre
      ?? registro.clasificacionGasto
      ?? (registro.clasificacion ? this.etiquetaClasificacion(registro.clasificacion) : 'Sin clasificación');
  }

  get totalGeneral(): number {
    return this.registrosFiltrados.reduce((total, registro) => total + Number(registro.valor), 0);
  }

  get totalCostos(): number {
    return this.registrosFiltrados
      .filter(registro => registro.tipo === 'COSTO')
      .reduce((total, registro) => total + Number(registro.valor), 0);
  }

  get totalGastos(): number {
    return this.registrosFiltrados
      .filter(registro => registro.tipo === 'GASTO')
      .reduce((total, registro) => total + Number(registro.valor), 0);
  }

  formatearValor(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Number(valor));
  }

  private formatearNumeroIngresado(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      useGrouping: true,
      minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
      maximumFractionDigits: 2
    }).format(valor);
  }

  private numeroDesdeTexto(valor: string): number | null {
    const normalizado = valor.trim().replace(/\./g, '').replace(',', '.');
    if (!normalizado || normalizado === '-') {
      return null;
    }
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : null;
  }

  get etiquetaPeriodoResumen(): string {
    const desde = this.fechaDesdeCadena(this.filtroDesde);
    const hasta = this.fechaDesdeCadena(this.filtroHasta);

    if (!desde && !hasta) {
      return 'para todos los períodos';
    }

    if (desde && hasta
      && desde.getFullYear() === hasta.getFullYear()
      && desde.getMonth() === hasta.getMonth()
      && desde.getDate() === 1
      && hasta.getDate() === new Date(hasta.getFullYear(), hasta.getMonth() + 1, 0).getDate()) {
      const mes = this.nombresMeses[desde.getMonth()];
      return `para el mes de ${mes} de ${desde.getFullYear()}`;
    }

    if (desde && hasta) {
      return `para el rango ${this.formatearFechaVisible(desde)} - ${this.formatearFechaVisible(hasta)}`;
    }

    return desde
      ? `desde el ${this.formatearFechaVisible(desde)}`
      : `hasta el ${this.formatearFechaVisible(hasta!)}`;
  }

  esSuperAdmin(): boolean {
    return this.authService.obtenerRol() === 'SUPER_ADMIN';
  }

  volverSucursal(): any[] {
    return this.esSuperAdmin()
      ? ['/super-admin/empresas', this.empresaId, 'sucursales', 'detalle', this.sucursalId]
      : ['/admin/empresa', this.empresaId, 'sucursales', 'detalle', this.sucursalId];
  }

  etiquetaTipo(tipo: TipoRegistroContable, clasificacion?: ClasificacionGasto): string {
    return tipo === 'COSTO' && clasificacion === 'PRODUCCION_INDIRECTA'
      ? 'Costo indirecto'
      : tipo === 'COSTO' ? 'Costo' : 'Gasto';
  }

  etiquetaTipoConcepto(tipo?: TipoRegistroContable): string {
    return tipo === 'COSTO' ? 'Costo indirecto' : 'Gasto';
  }

  private normalizarTexto(valor: string): string {
    return valor
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private formatearFecha(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  private formatearFechaVisible(fecha: Date): string {
    return `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;
  }

  private establecerPeriodoMesActual(): void {
    const hoy = new Date();
    this.filtroDesde = this.formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    this.filtroHasta = this.formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
  }

  private fechaDesdeCadena(valor: string): Date | null {
    if (!valor) {
      return null;
    }
    const partes = valor.split('-').map(Number);
    if (partes.length !== 3 || partes.some(parte => !Number.isInteger(parte))) {
      return null;
    }
    const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  private obtenerParametroRuta(nombre: string): string | null {
    return this.route.snapshot.paramMap.get(nombre)
      ?? this.route.parent?.snapshot.paramMap.get(nombre)
      ?? this.route.parent?.parent?.snapshot.paramMap.get(nombre)
      ?? null;
  }
}
