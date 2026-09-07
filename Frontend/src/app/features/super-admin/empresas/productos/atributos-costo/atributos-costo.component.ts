import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';

import { EmpresaObtenerDTO } from '../../../../../core/models/empresa/empresa.model';
import { CategoriaObtenerDTO } from '../../../../../core/models/producto/detalles/categoria.model';
import {
  AtributoCostoCrearDTO,
  AtributoCostoEditarDTO,
  AtributoCostoObtenerDTO
} from '../../../../../core/models/producto/atributo-costo.model';
import { EmpresaService } from '../../../../../core/services/empresa/empresa.service';
import { CategoriaService } from '../../../../../core/services/producto/detalles/categoria/categoria.service';
import { AtributoCostoService } from '../../../../../core/services/producto/atributo-costo/atributo-costo.service';
import { AuthService } from '../../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-atributos-costo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './atributos-costo.component.html',
  styleUrl: './atributos-costo.component.css'
})
export class AtributosCostoComponent implements OnInit {

  empresaId!: number;
  empresa: EmpresaObtenerDTO | null = null;
  categorias: CategoriaObtenerDTO[] = [];
  atributos: AtributoCostoObtenerDTO[] = [];

  formulario: FormGroup;
  atributoEditando: AtributoCostoObtenerDTO | null = null;

  filtroNombre = '';
  filtroCategoria: number | 'TODAS' = 'TODAS';
  selectorCategoriaAbierto = false;
  busquedaCategoria = '';
  selectorFiltroCategoriaAbierto = false;
  busquedaFiltroCategoria = '';
  paginaActual = 1;
  readonly elementosPorPagina = 40;

  cargandoEmpresa = false;
  cargandoDatos = false;
  guardando = false;
  mensajeError = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private empresaService: EmpresaService,
    private categoriaService: CategoriaService,
    private atributoCostoService: AtributoCostoService,
    private authService: AuthService
  ) {
    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      descripcion: ['', [Validators.maxLength(200)]],
      categoriaId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const empresaIdParam = this.obtenerEmpresaIdDesdeRuta();

    if (!empresaIdParam || Number.isNaN(Number(empresaIdParam))) {
      this.mensajeError = 'ID de empresa no válido';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.cargarEmpresa();
    this.cargarDatos();
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

  rutaProductos(): any[] {
    return this.esSuperAdmin()
      ? ['/super-admin/empresas', this.empresaId, 'productos']
      : ['/admin/empresa', this.empresaId, 'productos'];
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
      }
    });
  }

  cargarDatos(): void {
    this.cargandoDatos = true;
    let pendientes = 2;

    const finalizar = () => {
      pendientes--;
      if (pendientes === 0) {
        this.cargandoDatos = false;
        this.ajustarPagina();
      }
    };

    this.categoriaService.listarPorEmpresa(this.empresaId).subscribe({
      next: (categorias) => {
        this.categorias = this.ordenarCategorias(categorias);
        finalizar();
      },
      error: (error) => {
        finalizar();
        this.mostrarErroresBackend(error, 'No se pudieron cargar las categorías');
      }
    });

    this.atributoCostoService.listarPorEmpresa(this.empresaId).subscribe({
      next: (atributos) => {
        this.atributos = this.ordenarAtributos(atributos);
        finalizar();
      },
      error: (error) => {
        finalizar();
        this.mostrarErroresBackend(error, 'No se pudieron cargar los atributos de costo');
      }
    });
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Ingresa un nombre y selecciona la categoría del atributo de costo.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ffc107'
      });

      return;
    }

    if (this.atributoEditando) {
      this.editar();
      return;
    }

    const dto: AtributoCostoCrearDTO = {
      nombre: this.formulario.value.nombre.trim(),
      descripcion: this.formulario.value.descripcion?.trim() || null,
      empresaId: this.empresaId,
      categoriaId: Number(this.formulario.value.categoriaId)
    };

    this.guardando = true;
    this.atributoCostoService.crear(dto).subscribe({
      next: (atributo) => {
        this.guardando = false;
        this.atributos = this.ordenarAtributos([...this.atributos, atributo]);
        this.formulario.reset();
        this.cerrarSelectorCategoria();
        this.ajustarPagina();
        this.mostrarConfirmacion('Atributo creado', 'El atributo quedó disponible para los productos de su categoría.');
      },
      error: (error) => {
        this.guardando = false;
        this.mostrarErroresBackend(error, 'No se pudo crear el atributo de costo');
      }
    });
  }

  iniciarEdicion(atributo: AtributoCostoObtenerDTO): void {
    this.atributoEditando = atributo;
    this.cerrarSelectorCategoria();
    this.formulario.patchValue({
      nombre: atributo.nombre,
      descripcion: atributo.descripcion ?? '',
      categoriaId: atributo.categoriaId
    });
  }

  cancelarEdicion(): void {
    this.atributoEditando = null;
    this.formulario.reset();
    this.cerrarSelectorCategoria();
  }

  get categoriaSeleccionada(): CategoriaObtenerDTO | null {
    const categoriaId = Number(this.formulario.get('categoriaId')?.value);
    return this.categorias.find(categoria => categoria.id === categoriaId) ?? null;
  }

  get categoriasFiltradas(): CategoriaObtenerDTO[] {
    const termino = this.normalizar(this.busquedaCategoria);

    if (!termino) {
      return this.categorias;
    }

    return this.categorias.filter(categoria =>
      this.normalizar(categoria.nombre).includes(termino)
    );
  }

  get nombreFiltroCategoria(): string {
    if (this.filtroCategoria === 'TODAS') {
      return 'Todas las categorías';
    }

    return this.categorias.find(categoria => categoria.id === this.filtroCategoria)?.nombre
      || 'Selecciona una categoría';
  }

  get categoriasFiltroFiltradas(): CategoriaObtenerDTO[] {
    const termino = this.normalizar(this.busquedaFiltroCategoria);

    if (!termino) {
      return this.categorias;
    }

    return this.categorias.filter(categoria =>
      this.normalizar(categoria.nombre).includes(termino)
    );
  }

  alternarSelectorCategoria(): void {
    this.selectorCategoriaAbierto = !this.selectorCategoriaAbierto;

    if (!this.selectorCategoriaAbierto) {
      this.busquedaCategoria = '';
    }
  }

  seleccionarCategoria(categoria: CategoriaObtenerDTO): void {
    this.formulario.get('categoriaId')?.setValue(categoria.id);
    this.formulario.get('categoriaId')?.markAsTouched();
    this.cerrarSelectorCategoria();
  }

  cerrarSelectorCategoria(): void {
    this.selectorCategoriaAbierto = false;
    this.busquedaCategoria = '';
  }

  alternarSelectorFiltroCategoria(): void {
    this.selectorFiltroCategoriaAbierto = !this.selectorFiltroCategoriaAbierto;

    if (!this.selectorFiltroCategoriaAbierto) {
      this.busquedaFiltroCategoria = '';
    }
  }

  seleccionarFiltroCategoria(categoria: CategoriaObtenerDTO | null): void {
    this.actualizarFiltroCategoria(categoria?.id ?? 'TODAS');
    this.cerrarSelectorFiltroCategoria();
  }

  cerrarSelectorFiltroCategoria(): void {
    this.selectorFiltroCategoriaAbierto = false;
    this.busquedaFiltroCategoria = '';
  }

  @HostListener('document:click', ['$event'])
  cerrarSelectorCategoriaDesdeFuera(evento: MouseEvent): void {
    const objetivo = evento.target as HTMLElement;

    if (!objetivo.closest('.category-picker')) {
      this.cerrarSelectorCategoria();
    }

    if (!objetivo.closest('.filter-category-picker')) {
      this.cerrarSelectorFiltroCategoria();
    }
  }

  private editar(): void {
    if (!this.atributoEditando) {
      return;
    }

    const dto: AtributoCostoEditarDTO = {
      nombre: this.formulario.value.nombre.trim(),
      descripcion: this.formulario.value.descripcion?.trim() || null,
      categoriaId: Number(this.formulario.value.categoriaId)
    };

    this.guardando = true;
    this.atributoCostoService.editar(this.atributoEditando.id, dto).subscribe({
      next: (actualizado) => {
        this.guardando = false;
        this.atributos = this.ordenarAtributos(this.atributos.map(item =>
          item.id === actualizado.id ? actualizado : item
        ));
        this.cancelarEdicion();
        this.mostrarConfirmacion('Atributo actualizado', 'Los cambios fueron guardados correctamente.');
      },
      error: (error) => {
        this.guardando = false;
        this.mostrarErroresBackend(error, 'No se pudo actualizar el atributo de costo');
      }
    });
  }

  eliminar(atributo: AtributoCostoObtenerDTO): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Desactivar atributo?',
      text: `“${atributo.nombre}” no aparecerá al crear nuevos productos, pero se conservará en los desgloses existentes.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.atributoCostoService.eliminar(atributo.id).subscribe({
        next: () => {
          this.atributos = this.atributos.map(item =>
            item.id === atributo.id ? { ...item, activo: false } : item
          );
          this.mostrarConfirmacion('Atributo desactivado', 'Los productos existentes conservarán su desglose.');
        },
        error: (error) => {
          this.mostrarErroresBackend(error, 'No se pudo desactivar el atributo de costo');
        }
      });
    });
  }

  activar(atributo: AtributoCostoObtenerDTO): void {
    this.atributoCostoService.activar(atributo.id).subscribe({
      next: (actualizado) => {
        this.atributos = this.ordenarAtributos(this.atributos.map(item =>
          item.id === actualizado.id ? actualizado : item
        ));
        this.mostrarConfirmacion('Atributo activado', 'Volverá a estar disponible para nuevos productos.');
      },
      error: (error) => {
        this.mostrarErroresBackend(error, 'No se pudo activar el atributo de costo');
      }
    });
  }

  actualizarFiltroNombre(valor: string): void {
    this.filtroNombre = valor;
    this.paginaActual = 1;
  }

  actualizarFiltroCategoria(valor: number | 'TODAS'): void {
    this.filtroCategoria = valor;
    this.paginaActual = 1;
  }

  get atributosFiltrados(): AtributoCostoObtenerDTO[] {
    const termino = this.normalizar(this.filtroNombre);

    return this.atributos.filter(atributo => {
      const coincideNombre = !termino
        || this.normalizar(atributo.nombre).includes(termino)
        || this.normalizar(atributo.descripcion ?? '').includes(termino);
      const coincideCategoria = this.filtroCategoria === 'TODAS'
        || atributo.categoriaId === this.filtroCategoria;

      return coincideNombre && coincideCategoria;
    });
  }

  get atributosPaginados(): AtributoCostoObtenerDTO[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    return this.atributosFiltrados.slice(inicio, inicio + this.elementosPorPagina);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.atributosFiltrados.length / this.elementosPorPagina));
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, indice) => indice + 1);
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = Math.min(Math.max(pagina, 1), this.totalPaginas);
  }

  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroCategoria = 'TODAS';
    this.paginaActual = 1;
    this.cerrarSelectorFiltroCategoria();
  }

  campoInvalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  private ajustarPagina(): void {
    this.paginaActual = Math.min(this.paginaActual, this.totalPaginas);
  }

  private ordenarCategorias(categorias: CategoriaObtenerDTO[]): CategoriaObtenerDTO[] {
    return (categorias || []).slice().sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );
  }

  private ordenarAtributos(atributos: AtributoCostoObtenerDTO[]): AtributoCostoObtenerDTO[] {
    return (atributos || []).slice().sort((a, b) => {
      const categoria = a.categoriaNombre.localeCompare(b.categoriaNombre, 'es', { sensitivity: 'base' });
      return categoria || a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
    });
  }

  private normalizar(valor: string): string {
    return valor.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private mostrarConfirmacion(titulo: string, texto: string): void {
    Swal.fire({
      icon: 'success',
      title: titulo,
      text: texto,
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#2563eb'
    });
  }

  private mostrarErroresBackend(error: any, mensajeDefecto: string): void {
    const errores = Array.isArray(error.error?.errores)
      ? error.error.errores
      : [error.error?.message || error.error?.error || mensajeDefecto];

    Swal.fire({
      icon: 'error',
      title: 'Error',
      html: `<ul style="text-align:left;margin-bottom:0;">${errores.map((e: string) => `<li>${e}</li>`).join('')}</ul>`,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc3545'
    });
  }
}
