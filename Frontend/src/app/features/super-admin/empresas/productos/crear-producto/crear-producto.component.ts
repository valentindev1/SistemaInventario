import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import Swal from 'sweetalert2';

import { EmpresaService } from '../../../../../core/services/empresa/empresa.service';
import { ProductoService } from '../../../../../core/services/producto/producto/producto.service';

import { ColorService } from '../../../../../core/services/producto/detalles/color/color.service';
import { CategoriaService } from '../../../../../core/services/producto/detalles/categoria/categoria.service';
import { GeneroService } from '../../../../../core/services/producto/detalles/genero/genero.service';
import { TallaService } from '../../../../../core/services/producto/detalles/talla/talla.service';

import { EmpresaObtenerDTO } from '../../../../../core/models/empresa/empresa.model';
import {
  ProductoCostoDetalleCrearDTO,
  ProductoCrearDTO,
  TipoCostoProducto
} from '../../../../../core/models/producto/producto.model';
import { AtributoCostoObtenerDTO } from '../../../../../core/models/producto/atributo-costo.model';

import { ColorObtenerDTO } from '../../../../../core/models/producto/detalles/color.model';
import { CategoriaObtenerDTO } from '../../../../../core/models/producto/detalles/categoria.model';
import { GeneroObtenerDTO } from '../../../../../core/models/producto/detalles/genero.model';
import { TallaObtenerDTO } from '../../../../../core/models/producto/detalles/talla.model';

import { AuthService } from '../../../../../core/services/auth/auth.service';
import { AtributoCostoService } from '../../../../../core/services/producto/atributo-costo/atributo-costo.service';

type TipoSelectorAtributo = 'color' | 'categoria' | 'talla' | 'genero';
type CampoSelectorAtributo = 'colorId' | 'categoriaId' | 'tallaId' | 'generoId';

interface SelectorAtributoConfig {
  tipo: TipoSelectorAtributo;
  campo: CampoSelectorAtributo;
  etiqueta: string;
  placeholder: string;
  icono: string;
  error: string;
}

interface ComponenteCostoFormulario {
  atributoCostoId: number | null;
  concepto: string;
  valorTexto: string;
}

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './crear-producto.component.html',
  styleUrl: './crear-producto.component.css'
})
export class CrearProductoComponent implements OnInit {

  empresaId!: number;

  empresa: EmpresaObtenerDTO | null = null;

  colores: ColorObtenerDTO[] = [];
  categorias: CategoriaObtenerDTO[] = [];
  generos: GeneroObtenerDTO[] = [];
  tallas: TallaObtenerDTO[] = [];

  readonly selectoresAtributos: SelectorAtributoConfig[] = [
    {
      tipo: 'color',
      campo: 'colorId',
      etiqueta: 'Color',
      placeholder: 'Busca y selecciona un color',
      icono: 'bi-palette',
      error: 'Debes seleccionar un color.'
    },
    {
      tipo: 'categoria',
      campo: 'categoriaId',
      etiqueta: 'Categoría',
      placeholder: 'Busca y selecciona una categoría',
      icono: 'bi-grid',
      error: 'Debes seleccionar una categoría.'
    },
    {
      tipo: 'talla',
      campo: 'tallaId',
      etiqueta: 'Talla',
      placeholder: 'Busca y selecciona una talla',
      icono: 'bi-rulers',
      error: 'Debes seleccionar una talla.'
    },
    {
      tipo: 'genero',
      campo: 'generoId',
      etiqueta: 'Género',
      placeholder: 'Busca y selecciona un género',
      icono: 'bi-person-badge',
      error: 'Debes seleccionar un género.'
    }
  ];

  selectorAtributoAbierto: TipoSelectorAtributo | null = null;
  selectorCostoAbierto: number | null = null;
  busquedasAtributos: Record<TipoSelectorAtributo, string> = {
    color: '',
    categoria: '',
    talla: '',
    genero: ''
  };
  busquedaAtributoCosto = '';

  formularioProducto: FormGroup;

  cargandoEmpresa = false;
  cargandoDetalles = false;
  guardando = false;
  cargandoAtributosCosto = false;

  mensajeError = '';

  tipoCosto: TipoCostoProducto = 'MANUAL';
  esRemanufacturado = true;
  costoPersonalizado = false;
  costoManualTexto = '';
  atributosCosto: AtributoCostoObtenerDTO[] = [];
  desgloseCosto: ComponenteCostoFormulario[] = [this.nuevoComponenteCosto()];
  mostrarErrorDesglose = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private empresaService: EmpresaService,
    private productoService: ProductoService,
    private colorService: ColorService,
    private categoriaService: CategoriaService,
    private generoService: GeneroService,
    private tallaService: TallaService,
    private authService: AuthService,
    private atributoCostoService: AtributoCostoService
  ) {
    this.formularioProducto = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      codigo: ['', [Validators.required, Validators.maxLength(80)]],
      descripcion: ['', [Validators.required, Validators.maxLength(150)]],

      colorId: ['', [Validators.required]],
      categoriaId: ['', [Validators.required]],
      tallaId: ['', [Validators.required]],
      generoId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const empresaIdParam = this.obtenerEmpresaIdDesdeRuta();

    if (!empresaIdParam) {
      this.mensajeError = 'ID de empresa no válido';
      return;
    }

    this.empresaId = Number(empresaIdParam);

    if (Number.isNaN(this.empresaId)) {
      this.mensajeError = 'ID de empresa no válido';
      return;
    }

    this.cargarEmpresa();
    this.cargarDetallesProducto();
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

  rutaAtributosCosto(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'productos',
        'atributos-costo'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'productos',
      'atributos-costo'
    ];
  }

  cargarEmpresa(): void {
    this.cargandoEmpresa = true;
    this.mensajeError = '';

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

  cargarDetallesProducto(): void {
    this.cargandoDetalles = true;
    this.mensajeError = '';

    let pendientes = 4;

    const finalizarCarga = () => {
      pendientes--;

      if (pendientes === 0) {
        this.cargandoDetalles = false;
      }
    };

    this.colorService.listarPorEmpresa(this.empresaId).subscribe({
      next: (colores) => {
        this.colores = this.ordenarOpciones(colores);
        finalizarCarga();
      },
      error: (error) => {
        finalizarCarga();
        this.mostrarErroresBackend(error, 'No se pudieron cargar los colores');
        console.error(error);
      }
    });

    this.categoriaService.listarPorEmpresa(this.empresaId).subscribe({
      next: (categorias) => {
        this.categorias = this.ordenarOpciones(categorias);
        finalizarCarga();
      },
      error: (error) => {
        finalizarCarga();
        this.mostrarErroresBackend(error, 'No se pudieron cargar las categorías');
        console.error(error);
      }
    });

    this.generoService.listarPorEmpresa(this.empresaId).subscribe({
      next: (generos) => {
        this.generos = this.ordenarOpciones(generos);
        finalizarCarga();
      },
      error: (error) => {
        finalizarCarga();
        this.mostrarErroresBackend(error, 'No se pudieron cargar los géneros');
        console.error(error);
      }
    });

    this.tallaService.listarPorEmpresa(this.empresaId).subscribe({
      next: (tallas) => {
        this.tallas = this.ordenarOpciones(tallas);
        finalizarCarga();
      },
      error: (error) => {
        finalizarCarga();
        this.mostrarErroresBackend(error, 'No se pudieron cargar las tallas');
        console.error(error);
      }
    });
  }

  crearProducto(): void {
    this.mensajeError = '';

    if (this.formularioProducto.invalid) {
      this.formularioProducto.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Debes completar correctamente todos los campos obligatorios.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ffc107'
      });

      return;
    }

    if (this.tipoCosto === 'DESGLOSE' && !this.desgloseEsValido()) {
      this.mostrarErrorDesglose = true;

      Swal.fire({
        icon: 'warning',
        title: 'Desglose incompleto',
        text: 'Selecciona un atributo de costo y agrega un valor mayor que cero para cada componente.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ffc107'
      });

      return;
    }

    this.mostrarErrorDesglose = false;

    const costoUnitario = this.tipoCosto === 'DESGLOSE'
      ? this.totalDesgloseCosto()
      : this.obtenerMontoDesdeTexto(this.costoManualTexto);

    const dto: ProductoCrearDTO = {
      nombre: this.formularioProducto.value.nombre.trim(),
      codigo: this.formularioProducto.value.codigo.trim(),
      descripcion: this.formularioProducto.value.descripcion.trim(),

      empresaId: this.empresaId,

      colorId: Number(this.formularioProducto.value.colorId),
      categoriaId: Number(this.formularioProducto.value.categoriaId),
      tallaId: Number(this.formularioProducto.value.tallaId),
      generoId: Number(this.formularioProducto.value.generoId),
      tipoCosto: this.tipoCosto,
      esRemanufacturado: this.tipoCosto === 'MANUAL' && this.esRemanufacturado,
      costoPersonalizado: this.costoPersonalizado,
      costoUnitario,
      ...(this.tipoCosto === 'DESGLOSE'
        ? { desgloseCosto: this.obtenerDesgloseParaGuardar() }
        : {})
    };

    this.guardando = true;

    this.productoService.crear(dto).subscribe({
      next: () => {
        this.guardando = false;

        Swal.fire({
          icon: 'success',
          title: 'Producto creado',
          text: this.tipoCosto === 'DESGLOSE'
            ? `El ${this.costoPersonalizado ? 'producto personalizado fue creado' : 'producto fue creado'} y su costo unitario quedó calculado en ${this.formatearMoneda(costoUnitario)}.`
            : 'El producto fue creado correctamente con el costo manual indicado. Podrás ajustarlo al ingresar mercancía.',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#0d6efd'
        }).then(() => {
          this.router.navigate(this.rutaProductos());
        });
      },
      error: (error) => {
        this.guardando = false;
        this.mostrarErroresBackend(error, 'No se pudo crear el producto');
        console.error(error);
      }
    });
  }

  cambiarTipoCosto(tipo: TipoCostoProducto): void {
    this.tipoCosto = tipo;
    this.mostrarErrorDesglose = false;

    if (tipo === 'MANUAL') {
      this.esRemanufacturado = true;
      this.costoPersonalizado = false;
    }

    if (tipo === 'DESGLOSE') {
      this.esRemanufacturado = false;
      const categoriaId = this.obtenerValorAtributo('categoria');

      if (categoriaId !== null && this.atributosCosto.length === 0) {
        this.cargarAtributosCostoDeCategoria(categoriaId);
      }
    }

    if (tipo === 'DESGLOSE' && this.desgloseCosto.length === 0) {
      this.desgloseCosto.push(this.nuevoComponenteCosto());
    }
  }

  cambiarRemanufacturado(evento: Event): void {
    this.esRemanufacturado = (evento.target as HTMLInputElement).checked;
  }

  cambiarPersonalizacionCosto(evento: Event): void {
    this.costoPersonalizado = (evento.target as HTMLInputElement).checked;
    this.mostrarErrorDesglose = false;
  }

  seleccionarAtributoCosto(indice: number, atributo: AtributoCostoObtenerDTO): void {
    this.desgloseCosto[indice].atributoCostoId = atributo?.id ?? null;
    this.desgloseCosto[indice].concepto = atributo?.nombre ?? '';
    this.mostrarErrorDesglose = false;
    this.busquedaAtributoCosto = '';
    this.selectorCostoAbierto = null;
  }

  obtenerAtributosCostoFiltrados(): AtributoCostoObtenerDTO[] {
    const busqueda = this.normalizarTexto(this.busquedaAtributoCosto);

    if (!busqueda) {
      return this.atributosCosto;
    }

    return this.atributosCosto.filter(atributo =>
      this.normalizarTexto(`${atributo.nombre} ${atributo.id}`).includes(busqueda)
    );
  }

  toggleSelectorCosto(indice: number): void {
    if (this.selectorCostoAbierto === indice) {
      this.selectorCostoAbierto = null;
      this.busquedaAtributoCosto = '';
      return;
    }

    this.selectorCostoAbierto = indice;
    this.busquedaAtributoCosto = '';
  }

  actualizarBusquedaAtributoCosto(evento: Event): void {
    this.busquedaAtributoCosto = (evento.target as HTMLInputElement).value;
  }

  actualizarCostoManual(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.costoManualTexto = this.formatearNumeroDesdeEntrada(input.value);
    input.value = this.costoManualTexto;
  }

  agregarComponenteCosto(): void {
    this.desgloseCosto.push(this.nuevoComponenteCosto());
    this.mostrarErrorDesglose = false;
  }

  eliminarComponenteCosto(indice: number): void {
    if (this.desgloseCosto.length === 1) {
      this.desgloseCosto[0] = this.nuevoComponenteCosto();
    } else {
      this.desgloseCosto.splice(indice, 1);
    }

    this.mostrarErrorDesglose = false;
  }

  actualizarConceptoCosto(indice: number, evento: Event): void {
    this.desgloseCosto[indice].concepto = (evento.target as HTMLInputElement).value;
    this.mostrarErrorDesglose = false;
  }

  actualizarValorComponente(indice: number, evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.desgloseCosto[indice].valorTexto = this.formatearNumeroDesdeEntrada(input.value);
    input.value = this.desgloseCosto[indice].valorTexto;
    this.mostrarErrorDesglose = false;
  }

  totalDesgloseCosto(): number {
    return this.desgloseCosto.reduce(
      (total, componente) => total + this.obtenerMontoDesdeTexto(componente.valorTexto),
      0
    );
  }

  desgloseEsValido(): boolean {
    return this.desgloseCosto.length > 0
      && this.desgloseCosto.every(componente =>
        componente.atributoCostoId !== null
        && componente.concepto.trim().length > 0
        && this.obtenerMontoDesdeTexto(componente.valorTexto) > 0
      );
  }

  private obtenerDesgloseParaGuardar(): ProductoCostoDetalleCrearDTO[] {
    return this.desgloseCosto.map(componente => ({
      atributoCostoId: componente.atributoCostoId,
      concepto: componente.concepto.trim(),
      valor: this.obtenerMontoDesdeTexto(componente.valorTexto)
    }));
  }

  private nuevoComponenteCosto(): ComponenteCostoFormulario {
    return {
      atributoCostoId: null,
      concepto: '',
      valorTexto: ''
    };
  }

  cargarAtributosCostoDeCategoria(categoriaId: number): void {
    this.cargandoAtributosCosto = true;
    this.atributosCosto = [];
    this.desgloseCosto = [this.nuevoComponenteCosto()];

    this.atributoCostoService.listarActivosPorCategoria(categoriaId).subscribe({
      next: (atributos) => {
        this.atributosCosto = this.ordenarOpciones(atributos || []);
        this.cargandoAtributosCosto = false;
      },
      error: (error) => {
        this.cargandoAtributosCosto = false;
        this.mostrarErroresBackend(error, 'No se pudieron cargar los atributos de costo de la categoría');
      }
    });
  }

  private obtenerMontoDesdeTexto(valor: string | null | undefined): number {
    const digitos = (valor || '').replace(/\D/g, '');
    return digitos ? Number(digitos) : 0;
  }

  private formatearNumeroDesdeEntrada(valor: string | null | undefined): string {
    const monto = this.obtenerMontoDesdeTexto(valor);

    return monto > 0
      ? new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(monto)
      : '';
  }

  private formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(valor);
  }

  obtenerOpcionesAtributo(tipo: TipoSelectorAtributo): Array<{ id: number; nombre: string }> {
    switch (tipo) {
      case 'color':
        return this.colores;
      case 'categoria':
        return this.categorias;
      case 'talla':
        return this.tallas;
      case 'genero':
        return this.generos;
    }
  }

  obtenerOpcionesFiltradas(tipo: TipoSelectorAtributo): Array<{ id: number; nombre: string }> {
    const busqueda = this.normalizarTexto(this.busquedasAtributos[tipo]);

    if (!busqueda) {
      return this.obtenerOpcionesAtributo(tipo);
    }

    return this.obtenerOpcionesAtributo(tipo).filter(opcion =>
      this.normalizarTexto(`${opcion.nombre} ${opcion.id}`).includes(busqueda)
    );
  }

  obtenerValorAtributo(tipo: TipoSelectorAtributo): number | null {
    const config = this.selectoresAtributos.find(item => item.tipo === tipo);
    const valor = config ? this.formularioProducto.get(config.campo)?.value : null;

    return valor === null || valor === undefined || valor === ''
      ? null
      : Number(valor);
  }

  obtenerNombreAtributo(tipo: TipoSelectorAtributo): string {
    const config = this.selectoresAtributos.find(item => item.tipo === tipo);
    const id = this.obtenerValorAtributo(tipo);

    if (!config || id === null) {
      return config?.placeholder ?? 'Selecciona una opción';
    }

    return this.obtenerOpcionesAtributo(tipo).find(opcion => opcion.id === id)?.nombre
      ?? config.placeholder;
  }

  toggleSelectorAtributo(tipo: TipoSelectorAtributo): void {
    if (this.selectorAtributoAbierto === tipo) {
      this.cerrarSelectorAtributo();
      return;
    }

    this.selectorAtributoAbierto = tipo;
    this.busquedasAtributos[tipo] = '';
  }

  actualizarBusquedaAtributo(tipo: TipoSelectorAtributo, evento: Event): void {
    this.busquedasAtributos[tipo] = (evento.target as HTMLInputElement).value;
  }

  seleccionarAtributo(
    tipo: TipoSelectorAtributo,
    opcion: { id: number; nombre: string }
  ): void {
    const config = this.selectoresAtributos.find(item => item.tipo === tipo);

    if (!config) {
      return;
    }

    const control = this.formularioProducto.get(config.campo);
    control?.setValue(opcion.id);
    control?.markAsDirty();
    control?.markAsTouched();
    this.busquedasAtributos[tipo] = '';
    this.selectorAtributoAbierto = null;

    if (tipo === 'categoria') {
      this.cargarAtributosCostoDeCategoria(opcion.id);
    }
  }

  @HostListener('document:click')
  cerrarSelectorAtributo(): void {
    if (this.selectorAtributoAbierto) {
      this.busquedasAtributos[this.selectorAtributoAbierto] = '';
      this.selectorAtributoAbierto = null;
    }

    this.selectorCostoAbierto = null;
    this.busquedaAtributoCosto = '';
  }

  private normalizarTexto(valor: string): string {
    return (valor || '')
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private ordenarOpciones<T extends { nombre: string }>(opciones: T[]): T[] {
    return (opciones || []).slice().sort((a, b) =>
      a.nombre.trim().localeCompare(b.nombre.trim(), 'es', { sensitivity: 'base' })
      || a.nombre.trim().localeCompare(b.nombre.trim())
    );
  }

  campoInvalido(campo: string): boolean {
    const control = this.formularioProducto.get(campo);

    return !!control && control.invalid && (control.dirty || control.touched);
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
