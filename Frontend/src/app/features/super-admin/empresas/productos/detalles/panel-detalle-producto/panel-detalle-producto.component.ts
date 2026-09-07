import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import Swal from 'sweetalert2';

import { EmpresaObtenerDTO } from '../../../../../../core/models/empresa/empresa.model';
import { EmpresaService } from '../../../../../../core/services/empresa/empresa.service';

import { ColorService } from '../../../../../../core/services/producto/detalles/color/color.service';
import { CategoriaService } from '../../../../../../core/services/producto/detalles/categoria/categoria.service';
import { GeneroService } from '../../../../../../core/services/producto/detalles/genero/genero.service';
import { TallaService } from '../../../../../../core/services/producto/detalles/talla/talla.service';

import { AuthService } from '../../../../../../core/services/auth/auth.service';

interface DetalleProductoItem {
  id: number;
  nombre: string;
  empresaId: number;
  empresaNombre: string;
  fechaCreacion: string;
  tipoGanancia?: 'PORCENTAJE' | 'DINERO' | null;
  valorGanancia?: number | null;
  porcentajeGanancia?: number | null;
}

type TipoDetalle = 'colores' | 'categorias' | 'generos' | 'tallas';

@Component({
  selector: 'app-panel-detalle-producto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './panel-detalle-producto.component.html',
  styleUrl: './panel-detalle-producto.component.css'
})
export class PanelDetalleProductoComponent implements OnInit {

  empresaId!: number;
  tipo!: TipoDetalle;

  empresa: EmpresaObtenerDTO | null = null;
  items: DetalleProductoItem[] = [];

  formulario: FormGroup;

  itemEditando: DetalleProductoItem | null = null;

  cargandoEmpresa = false;
  cargandoItems = false;
  guardando = false;

  mensajeError = '';

  filtroCategorias = '';
  paginaActual = 1;
  readonly elementosPorPagina = 40;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private empresaService: EmpresaService,
    private colorService: ColorService,
    private categoriaService: CategoriaService,
    private generoService: GeneroService,
    private tallaService: TallaService,
    private authService: AuthService
  ) {
    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(80)]],
      tipoGanancia: ['PORCENTAJE'],
      valorGanancia: [null, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    const empresaIdParam = this.obtenerEmpresaIdDesdeRuta();
    const tipoParam = this.route.snapshot.paramMap.get('tipo') as TipoDetalle | null;

    if (!empresaIdParam || !tipoParam) {
      this.mensajeError = 'Parámetros no válidos';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.tipo = tipoParam;

    if (Number.isNaN(this.empresaId)) {
      this.mensajeError = 'ID de empresa no válido';
      return;
    }

    if (!this.tipoEsValido(this.tipo)) {
      this.mensajeError = 'Tipo de catálogo no válido';
      return;
    }

    this.cargarEmpresa();
    this.cargarItems();
  }

  private obtenerEmpresaIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('empresaId') ??
      null
    );
  }

  esSuperAdmin(): boolean {
    return this.authService.obtenerRol() === 'SUPER_ADMIN';
  }

  esAdmin(): boolean {
    return this.authService.obtenerRol() === 'ADMIN';
  }

  rutaProductos(): any[] {
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

  cargarEmpresa(): void {
    this.cargandoEmpresa = true;

    this.empresaService.obtenerPorId(this.empresaId).subscribe({
      next: (empresa) => {
        this.empresa = empresa;
        this.cargandoEmpresa = false;
      },
      error: (error) => {
        this.cargandoEmpresa = false;
        this.mostrarErroresBackend(error, 'No se pudo cargar la empresa');
        console.error(error);
      }
    });
  }

  cargarItems(): void {
    this.cargandoItems = true;

    this.servicioActual().listarPorEmpresa(this.empresaId).subscribe({
      next: (data: DetalleProductoItem[]) => {
        this.items = data;
        this.ajustarPagina();
        this.cargandoItems = false;
      },
      error: (error: any) => {
        this.cargandoItems = false;
        this.mostrarErroresBackend(error, `No se pudieron cargar ${this.nombrePluralMinuscula()}`);
        console.error(error);
      }
    });
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: this.esCategoria()
          ? 'Debes ingresar un nombre válido y una regla de utilidad válida.'
          : 'Debes ingresar un nombre válido.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ffc107'
      });

      return;
    }

    if (this.itemEditando) {
      this.editar();
    } else {
      this.crear();
    }
  }

  crear(): void {
    const dto = {
      nombre: this.formulario.value.nombre,
      empresaId: this.empresaId,
      ...(this.esCategoria() ? {
        tipoGanancia: this.tipoGananciaDesdeFormulario(),
        valorGanancia: this.valorGananciaDesdeFormulario()
      } : {})
    };

    this.guardando = true;

    this.servicioActual().crear(dto).subscribe({
      next: () => {
        this.guardando = false;
        this.formulario.reset();
        this.cargarItems();

        Swal.fire({
          icon: 'success',
          title: `${this.nombreSingular()} creado`,
          text: `${this.nombreSingular()} fue creado correctamente.`,
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#0d6efd'
        });
      },
      error: (error: any) => {
        this.guardando = false;
        this.mostrarErroresBackend(error, `No se pudo crear ${this.nombreSingularMinuscula()}`);
        console.error(error);
      }
    });
  }

  activarEdicion(item: DetalleProductoItem): void {
    this.itemEditando = item;

    this.formulario.patchValue({
      nombre: item.nombre,
      tipoGanancia: this.esCategoria() ? (item.tipoGanancia ?? 'PORCENTAJE') : 'PORCENTAJE',
      valorGanancia: this.esCategoria()
        ? (item.valorGanancia ?? item.porcentajeGanancia ?? null)
        : null
    });
  }

  cancelarEdicion(): void {
    this.itemEditando = null;
    this.formulario.reset();
  }

  editar(): void {
    if (!this.itemEditando) {
      return;
    }

    const dto = {
      nombre: this.formulario.value.nombre,
      ...(this.esCategoria() ? {
        tipoGanancia: this.tipoGananciaDesdeFormulario(),
        valorGanancia: this.valorGananciaDesdeFormulario()
      } : {})
    };

    this.guardando = true;

    this.servicioActual().editar(this.itemEditando.id, dto).subscribe({
      next: () => {
        this.guardando = false;
        this.itemEditando = null;
        this.formulario.reset();
        this.cargarItems();

        Swal.fire({
          icon: 'success',
          title: `${this.nombreSingular()} actualizado`,
          text: `${this.nombreSingular()} fue actualizado correctamente.`,
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#0d6efd'
        });
      },
      error: (error: any) => {
        this.guardando = false;
        this.mostrarErroresBackend(error, `No se pudo editar ${this.nombreSingularMinuscula()}`);
        console.error(error);
      }
    });
  }

  eliminar(item: DetalleProductoItem): void {
    Swal.fire({
      icon: 'warning',
      title: `¿Eliminar ${this.nombreSingularMinuscula()}?`,
      text: `Se eliminará: ${item.nombre}`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicioActual().eliminar(item.id).subscribe({
          next: () => {
            this.items = this.items.filter(i => i.id !== item.id);
            this.ajustarPagina();

            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: `${this.nombreSingular()} fue eliminado correctamente.`,
              confirmButtonText: 'Continuar',
              confirmButtonColor: '#0d6efd'
            });
          },
          error: (error: any) => {
            this.mostrarErroresBackend(error, `No se pudo eliminar ${this.nombreSingularMinuscula()}`);
            console.error(error);
          }
        });
      }
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  servicioActual(): any {
    switch (this.tipo) {
      case 'colores':
        return this.colorService;
      case 'categorias':
        return this.categoriaService;
      case 'generos':
        return this.generoService;
      case 'tallas':
        return this.tallaService;
    }
  }

  esCategoria(): boolean {
    return this.tipo === 'categorias';
  }

  get itemsFiltrados(): DetalleProductoItem[] {
    if (!this.esCategoria()) {
      return this.items;
    }

    const termino = this.normalizarTexto(this.filtroCategorias);

    if (!termino) {
      return this.items;
    }

    return this.items.filter(item =>
      this.normalizarTexto(item.nombre).includes(termino) ||
      String(item.id).includes(termino)
    );
  }

  get itemsPaginados(): DetalleProductoItem[] {
    if (!this.esCategoria()) {
      return this.items;
    }

    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    return this.itemsFiltrados.slice(inicio, inicio + this.elementosPorPagina);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.itemsFiltrados.length / this.elementosPorPagina));
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  get primerRegistroVisible(): number {
    if (this.itemsFiltrados.length === 0) {
      return 0;
    }

    return (this.paginaActual - 1) * this.elementosPorPagina + 1;
  }

  get ultimoRegistroVisible(): number {
    return Math.min(this.paginaActual * this.elementosPorPagina, this.itemsFiltrados.length);
  }

  actualizarFiltroCategorias(valor: string): void {
    this.filtroCategorias = valor;
    this.paginaActual = 1;
  }

  irAPagina(pagina: number): void {
    this.paginaActual = Math.min(Math.max(pagina, 1), this.totalPaginas);
  }

  paginaAnterior(): void {
    this.irAPagina(this.paginaActual - 1);
  }

  paginaSiguiente(): void {
    this.irAPagina(this.paginaActual + 1);
  }

  private ajustarPagina(): void {
    this.paginaActual = Math.min(this.paginaActual, this.totalPaginas);
  }

  seleccionarTipoGanancia(tipo: 'PORCENTAJE' | 'DINERO'): void {
    this.formulario.patchValue({ tipoGanancia: tipo });
    this.formulario.get('valorGanancia')?.markAsTouched();
  }

  private tipoGananciaDesdeFormulario(): 'PORCENTAJE' | 'DINERO' | null {
    if (this.valorGananciaDesdeFormulario() === null) {
      return null;
    }

    const tipo = this.formulario.value.tipoGanancia;

    return tipo === 'DINERO' ? 'DINERO' : 'PORCENTAJE';
  }

  private valorGananciaDesdeFormulario(): number | null {
    const valor = this.formulario.value.valorGanancia;

    if (valor === null || valor === undefined || valor === '') {
      return null;
    }

    return Number(valor);
  }

  private normalizarTexto(valor: string): string {
    return (valor || '')
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  tipoEsValido(tipo: string): tipo is TipoDetalle {
    return ['colores', 'categorias', 'generos', 'tallas'].includes(tipo);
  }

  nombreSingular(): string {
    switch (this.tipo) {
      case 'colores':
        return 'Color';
      case 'categorias':
        return 'Categoría';
      case 'generos':
        return 'Género';
      case 'tallas':
        return 'Talla';
    }
  }

  nombreSingularMinuscula(): string {
    return this.nombreSingular().toLowerCase();
  }

  nombrePlural(): string {
    switch (this.tipo) {
      case 'colores':
        return 'Colores';
      case 'categorias':
        return 'Categorías';
      case 'generos':
        return 'Géneros';
      case 'tallas':
        return 'Tallas';
    }
  }

  nombrePluralMinuscula(): string {
    return this.nombrePlural().toLowerCase();
  }

  icono(): string {
    switch (this.tipo) {
      case 'colores':
        return 'bi-palette';
      case 'categorias':
        return 'bi-grid';
      case 'generos':
        return 'bi-person-badge';
      case 'tallas':
        return 'bi-rulers';
    }
  }

  private obtenerErroresBackend(error: any): string[] {
    if (Array.isArray(error.error?.errores)) {
      return error.error.errores;
    }

    if (typeof error.error === 'string') {
      return [error.error];
    }

    if (error.error?.message) {
      return [error.error.message];
    }

    if (error.error?.error) {
      return [error.error.error];
    }

    return ['Ocurrió un error inesperado'];
  }

  private mostrarErroresBackend(error: any, mensajeDefecto: string): void {
    const errores = this.obtenerErroresBackend(error);

    const erroresFinales = errores.length > 0
      ? errores
      : [mensajeDefecto];

    Swal.fire({
      icon: 'error',
      title: 'Error',
      html: `
        <ul style="text-align: left; margin-bottom: 0;">
          ${erroresFinales.map(e => `<li>${e}</li>`).join('')}
        </ul>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc3545'
    });
  }
}
