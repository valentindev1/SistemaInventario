import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

import { AuthService } from '../../../../../../core/services/auth/auth.service';
import { CategoriaService } from '../../../../../../core/services/producto/detalles/categoria/categoria.service';
import { ProductoService } from '../../../../../../core/services/producto/producto/producto.service';
import {
  CategoriaObtenerDTO,
  TipoGananciaCategoria
} from '../../../../../../core/models/producto/detalles/categoria.model';
import { ProductoAdminObtenerDTO } from '../../../../../../core/models/producto/producto.model';

@Component({
  selector: 'app-configurar-porcentajes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './configurar-porcentajes.component.html',
  styleUrl: './configurar-porcentajes.component.css'
})
export class ConfigurarPorcentajesComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  tipoGanancia: TipoGananciaCategoria = 'PORCENTAJE';
  valorGanancia: number | null = 0;

  tipoGananciaArticulo: TipoGananciaCategoria = 'PORCENTAJE';
  valorGananciaArticulo = 0;

  categorias: CategoriaObtenerDTO[] = [];
  categoriaSeleccionadaId: number | null = null;
  busquedaCategoria = '';
  categoriaSelectorAbierto = false;
  cargandoCategorias = false;

  productos: ProductoAdminObtenerDTO[] = [];
  productoSeleccionadoId: number | null = null;
  busquedaArticulo = '';
  articuloSelectorAbierto = false;
  cargandoProductos = false;
  guardandoReglaCategoria = false;
  guardandoReglaArticulo = false;

  mensajeExito = '';
  mensajeError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private categoriaService: CategoriaService,
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.obtenerEmpresaIdDesdeRuta();
    const sucursalIdParam = this.obtenerSucursalIdDesdeRuta();

    if (!empresaIdParam || !sucursalIdParam) {
      this.mensajeError = 'No se pudo identificar la empresa o la sucursal.';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);

    if (
      Number.isNaN(this.empresaId) ||
      Number.isNaN(this.sucursalId) ||
      this.empresaId <= 0 ||
      this.sucursalId <= 0
    ) {
      this.mensajeError = 'Los identificadores de empresa o sucursal no son válidos.';
      return;
    }

    if (!this.validarAccesoLocal()) {
      return;
    }

    this.cargarCategorias();
    this.cargarProductos();
  }

  private obtenerEmpresaIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.snapshot.paramMap.get('empresaId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('empresaId') ??
      null
    );
  }

  private obtenerSucursalIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('sucursalId') ??
      null
    );
  }

  private validarAccesoLocal(): boolean {
    const rol = this.authService.obtenerRol()?.replace('ROLE_', '');
    const empresaIdUsuario = this.authService.obtenerEmpresaId();

    if (rol === 'SUPER_ADMIN') {
      return true;
    }

    if (rol === 'ADMIN' && empresaIdUsuario === this.empresaId) {
      return true;
    }

    this.router.navigate(['/acceso-denegado']);
    return false;
  }

  seleccionarTipoGanancia(tipo: TipoGananciaCategoria): void {
    this.tipoGanancia = tipo;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  cargarCategorias(): void {
    this.cargandoCategorias = true;

    this.categoriaService.listarPorEmpresa(this.empresaId).subscribe({
      next: categorias => {
        this.categorias = (categorias || []).sort((a, b) =>
          a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
        );
        this.cargandoCategorias = false;
      },
      error: error => {
        this.cargandoCategorias = false;
        this.mensajeError =
          error?.error?.message ||
          error?.error ||
          'No se pudieron cargar las categorías de la empresa.';
      }
    });
  }

  cargarProductos(): void {
    this.cargandoProductos = true;

    this.productoService.listarPorEmpresa(this.empresaId).subscribe({
      next: productos => {
        this.productos = (productos || []).sort((a, b) =>
          a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
        );
        this.cargandoProductos = false;
      },
      error: error => {
        this.cargandoProductos = false;
        this.mensajeError =
          error?.error?.message ||
          error?.error ||
          'No se pudieron cargar las referencias de la empresa.';
      }
    });
  }

  get categoriaSeleccionada(): CategoriaObtenerDTO | null {
    return this.categorias.find(
      categoria => categoria.id === Number(this.categoriaSeleccionadaId)
    ) ?? null;
  }

  get categoriasFiltradas(): CategoriaObtenerDTO[] {
    const termino = this.busquedaCategoria.trim().toLocaleLowerCase();

    if (!termino) {
      return this.categorias;
    }

    return this.categorias.filter(categoria =>
      categoria.nombre.toLocaleLowerCase().includes(termino) ||
      String(categoria.id).includes(termino)
    );
  }

  toggleCategoriaSelector(): void {
    this.categoriaSelectorAbierto = !this.categoriaSelectorAbierto;

    if (!this.categoriaSelectorAbierto) {
      this.busquedaCategoria = '';
    }
  }

  seleccionarCategoria(categoria: CategoriaObtenerDTO): void {
    this.categoriaSeleccionadaId = categoria.id;
    this.busquedaCategoria = '';
    this.categoriaSelectorAbierto = false;
    this.categoriaCambio();
  }

  obtenerResumenRegla(categoria: CategoriaObtenerDTO): string {
    if (categoria.tipoGanancia === 'PORCENTAJE') {
      return `${Number(categoria.valorGanancia ?? categoria.porcentajeGanancia ?? 0)}% sobre costo`;
    }

    if (categoria.tipoGanancia === 'DINERO') {
      return `$${Number(categoria.valorGanancia ?? 0).toLocaleString('es-CO')} por unidad`;
    }

    return 'Sin configurar';
  }

  get productoSeleccionado(): ProductoAdminObtenerDTO | null {
    return this.productos.find(
      producto => producto.id === Number(this.productoSeleccionadoId)
    ) ?? null;
  }

  get productosFiltrados(): ProductoAdminObtenerDTO[] {
    const termino = this.normalizarTexto(this.busquedaArticulo);

    if (!termino) {
      return this.productos;
    }

    return this.productos.filter(producto =>
      this.normalizarTexto(`${producto.codigo} ${producto.nombre}`).includes(termino)
    );
  }

  toggleArticuloSelector(): void {
    this.articuloSelectorAbierto = !this.articuloSelectorAbierto;

    if (!this.articuloSelectorAbierto) {
      this.busquedaArticulo = '';
    }
  }

  seleccionarArticulo(producto: ProductoAdminObtenerDTO): void {
    this.productoSeleccionadoId = producto.id;
    this.busquedaArticulo = '';
    this.articuloSelectorAbierto = false;
    this.articuloCambio();
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  articuloCambio(): void {
    const producto = this.productoSeleccionado;

    this.tipoGananciaArticulo = producto?.tipoGananciaProducto
      ?? producto?.categoriaTipoGanancia
      ?? 'PORCENTAJE';
    this.valorGananciaArticulo = Number(
      producto?.valorGananciaProducto
      ?? producto?.categoriaValorGanancia
      ?? producto?.categoriaPorcentajeGanancia
      ?? 0
    );
  }

  obtenerResumenReglaArticulo(producto: ProductoAdminObtenerDTO): string {
    if (producto.tipoGananciaProducto === 'PORCENTAJE') {
      return `${Number(producto.valorGananciaProducto ?? 0)}% propia`;
    }

    if (producto.tipoGananciaProducto === 'DINERO') {
      return `$${Number(producto.valorGananciaProducto ?? 0).toLocaleString('es-CO')} propia`;
    }

    return producto.categoriaTipoGanancia
      ? `Hereda ${producto.categoriaNombre}`
      : 'Sin regla';
  }

  guardarReglaArticulo(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    const producto = this.productoSeleccionado;
    const valor = Number(this.valorGananciaArticulo);

    if (!producto) {
      this.mensajeError = 'Selecciona una referencia antes de guardar la regla.';
      return;
    }

    if (!Number.isFinite(valor) || valor < 0) {
      this.mensajeError = 'Ingresa un valor de utilidad válido.';
      return;
    }

    if (this.tipoGananciaArticulo === 'PORCENTAJE' && valor > 1000) {
      this.mensajeError = 'Ingresa un porcentaje entre 0% y 1000%.';
      return;
    }

    this.guardandoReglaArticulo = true;

    this.productoService.actualizarReglaGanancia(producto.id, {
      tipoGanancia: this.tipoGananciaArticulo,
      valorGanancia: valor
    }).subscribe({
      next: productoActualizado => {
        const indice = this.productos.findIndex(item => item.id === productoActualizado.id);

        if (indice >= 0) {
          this.productos[indice] = productoActualizado;
        }

        this.tipoGananciaArticulo = productoActualizado.tipoGananciaProducto ?? this.tipoGananciaArticulo;
        this.valorGananciaArticulo = Number(
          productoActualizado.valorGananciaProducto ?? valor
        );
        this.guardandoReglaArticulo = false;

        const resumenRegla = this.tipoGananciaArticulo === 'PORCENTAJE'
          ? `${this.valorGananciaArticulo}% sobre el costo`
          : `$${Number(this.valorGananciaArticulo).toLocaleString('es-CO')} por unidad`;

        this.mensajeExito = '';
        Swal.fire({
          icon: 'success',
          title: '¡Regla propia guardada!',
          html: `
            <div class="utility-rule-success-content">
              <p>La referencia <strong>${productoActualizado.codigo} · ${productoActualizado.nombre}</strong> quedó configurada con:</p>
              <div class="utility-rule-success-value">${resumenRegla}</div>
              <p class="utility-rule-success-help">Esta regla tendrá prioridad sobre la utilidad definida en su categoría.</p>
            </div>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#2563eb',
          allowOutsideClick: false
        });
      },
      error: error => {
        this.guardandoReglaArticulo = false;
        this.mensajeError =
          error?.error?.message ||
          error?.error ||
          'No se pudo guardar la regla de la referencia.';
      }
    });
  }

  usarReglaCategoriaEnArticulo(): void {
    const producto = this.productoSeleccionado;

    if (!producto) {
      this.mensajeError = 'Selecciona una referencia antes de quitar la regla propia.';
      return;
    }

    this.guardandoReglaArticulo = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.productoService.actualizarReglaGanancia(producto.id, {
      tipoGanancia: null,
      valorGanancia: null
    }).subscribe({
      next: productoActualizado => {
        const indice = this.productos.findIndex(item => item.id === productoActualizado.id);

        if (indice >= 0) {
          this.productos[indice] = productoActualizado;
        }

        this.articuloCambio();
        this.guardandoReglaArticulo = false;
        this.mensajeExito = `La referencia ${productoActualizado.codigo} ahora heredará la regla de su categoría.`;
      },
      error: error => {
        this.guardandoReglaArticulo = false;
        this.mensajeError =
          error?.error?.message ||
          error?.error ||
          'No se pudo quitar la regla propia de la referencia.';
      }
    });
  }

  @HostListener('document:click')
  cerrarSelectorCategoria(): void {
    if (this.categoriaSelectorAbierto) {
      this.categoriaSelectorAbierto = false;
      this.busquedaCategoria = '';
    }
  }

  @HostListener('document:click')
  cerrarSelectorArticulo(): void {
    if (this.articuloSelectorAbierto) {
      this.articuloSelectorAbierto = false;
      this.busquedaArticulo = '';
    }
  }

  categoriaCambio(): void {
    const categoria = this.categoriaSeleccionada;
    this.tipoGanancia = categoria?.tipoGanancia ?? 'PORCENTAJE';
    this.valorGanancia = Number(
      categoria?.valorGanancia ?? categoria?.porcentajeGanancia ?? 0
    );
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  limpiarPorcentajeAlEnfocar(evento: FocusEvent): void {
    const input = evento.target as HTMLInputElement;

    if (Number(this.valorGanancia) === 0) {
      this.valorGanancia = null;
    }

    input.select();
  }

  guardarReglaCategoria(): void {
    this.procesarGuardadoReglaCategoria(false);
  }

  guardarReglaCategoriaGlobal(): void {
    this.procesarGuardadoReglaCategoria(true);
  }

  private procesarGuardadoReglaCategoria(aplicarGlobalmente: boolean): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    const categoria = this.categoriaSeleccionada;
    const valor = Number(this.valorGanancia);

    if (!categoria) {
      this.mensajeError = 'Selecciona una categoría antes de guardar la regla.';
      return;
    }

    if (!Number.isFinite(valor) || valor < 0) {
      this.mensajeError = 'Ingresa un valor de utilidad válido.';
      return;
    }

    if (this.tipoGanancia === 'PORCENTAJE' && valor > 1000) {
      this.mensajeError = 'Ingresa un porcentaje entre 0% y 1000%.';
      return;
    }

    const reglaActual = categoria.tipoGanancia;
    const valorActual = Number(
      categoria.valorGanancia ?? categoria.porcentajeGanancia ?? 0
    );
    const reglaCambio = reglaActual !== this.tipoGanancia || valorActual !== valor;
    const articulosConReglaPropia = this.productos.filter(producto =>
      producto.categoriaId === categoria.id &&
      producto.tipoGananciaProducto !== null &&
      producto.tipoGananciaProducto !== undefined &&
      producto.valorGananciaProducto !== null &&
      producto.valorGananciaProducto !== undefined
    ).length;

    if (aplicarGlobalmente) {
      this.confirmarAplicacionGlobalReglaCategoria(
        categoria,
        valor,
        articulosConReglaPropia
      );
      return;
    }

    if (reglaCambio && articulosConReglaPropia > 0) {
      this.confirmarAplicacionReglaCategoria(categoria, valor, articulosConReglaPropia);
      return;
    }

    this.persistirReglaCategoria(categoria, valor, false);
  }

  private confirmarAplicacionGlobalReglaCategoria(
    categoria: CategoriaObtenerDTO,
    valor: number,
    articulosConReglaPropia: number
  ): void {
    const reglaNueva = this.tipoGanancia === 'PORCENTAJE'
      ? `${valor}% sobre el costo`
      : `$${valor.toLocaleString('es-CO')} por unidad`;
    const articulosDeCategoria = this.productos.filter(producto =>
      producto.categoriaId === categoria.id
    ).length;

    Swal.fire({
      icon: 'warning',
      title: '¿Aplicar esta regla de forma global?',
      html: `
        <div class="utility-rule-alert-content">
          <p class="utility-rule-alert-intro">
            La categoría <strong>${categoria.nombre}</strong> quedará configurada con
            <strong>${reglaNueva}</strong>.
          </p>
          <div class="utility-rule-alert-preview">
            <span>Productos afectados</span>
            <strong>${articulosDeCategoria} artículo(s)</strong>
          </div>
          <p class="utility-rule-alert-help">
            Se aplicará a todos los productos de la categoría, incluidos los
            <strong>${articulosConReglaPropia} con regla manual</strong>.
            Sus reglas propias se reemplazarán y sus precios de venta se recalcularán.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-globe2"></i> Sí, aplicar a todos',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      focusCancel: true,
      allowOutsideClick: false
    }).then(resultado => {
      if (resultado.isConfirmed) {
        this.persistirReglaCategoria(categoria, valor, true);
      }
    });
  }

  private confirmarAplicacionReglaCategoria(
    categoria: CategoriaObtenerDTO,
    valor: number,
    articulosConReglaPropia: number
  ): void {
    const reglaNueva = this.tipoGanancia === 'PORCENTAJE'
      ? `${valor}% sobre el costo`
      : `$${valor.toLocaleString('es-CO')} por unidad`;

    Swal.fire({
      icon: 'warning',
      title: '¿Cómo quieres aplicar este cambio?',
      html: `
        <div class="utility-rule-alert-content">
          <p class="utility-rule-alert-intro">
            La categoría <strong>${categoria.nombre}</strong> tiene
            <strong>${articulosConReglaPropia} artículo(s)</strong> con una regla propia.
          </p>
          <div class="utility-rule-alert-preview">
            <span>Nueva regla de categoría</span>
            <strong>${reglaNueva}</strong>
          </div>
          <p class="utility-rule-alert-help">
            Elige si deseas conservar o reemplazar las reglas configuradas directamente en los artículos.
          </p>
        </div>
      `,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-arrow-repeat"></i> Aplicar a todos',
      denyButtonText: '<i class="bi bi-shield-check"></i> Respetar reglas propias',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      denyButtonColor: '#16a34a',
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      focusDeny: true,
      allowOutsideClick: false
    }).then(resultado => {
      if (resultado.isConfirmed) {
        this.persistirReglaCategoria(categoria, valor, true);
      } else if (resultado.isDenied) {
        this.persistirReglaCategoria(categoria, valor, false);
      }
    });
  }

  private persistirReglaCategoria(
    categoria: CategoriaObtenerDTO,
    valor: number,
    aplicarAArticulosConReglaPropia: boolean
  ): void {
    this.guardandoReglaCategoria = true;

    this.categoriaService.editar(categoria.id, {
      nombre: categoria.nombre,
      tipoGanancia: this.tipoGanancia,
      valorGanancia: valor,
      aplicarAArticulosConReglaPropia
    }).subscribe({
      next: categoriaActualizada => {
        const indice = this.categorias.findIndex(item => item.id === categoriaActualizada.id);

        if (indice >= 0) {
          this.categorias[indice] = categoriaActualizada;
        }

        this.tipoGanancia = categoriaActualizada.tipoGanancia ?? this.tipoGanancia;
        this.valorGanancia = Number(
          categoriaActualizada.valorGanancia ?? valor
        );
        this.guardandoReglaCategoria = false;
        this.cargarProductos();

        const resumenRegla = this.tipoGanancia === 'PORCENTAJE'
          ? `${this.valorGanancia}% sobre el costo`
          : `$${Number(this.valorGanancia).toLocaleString('es-CO')} por unidad`;
        const resumenAlcance = aplicarAArticulosConReglaPropia
          ? 'Se aplicó a todos los productos de la categoría, incluidos los que tenían una regla manual.'
          : 'Se conservaron las reglas propias configuradas en los artículos.';

        this.mensajeExito = '';
        Swal.fire({
          icon: 'success',
          title: '¡Regla guardada!',
          html: `
            <div class="utility-rule-success-content">
              <p>La categoría <strong>${categoriaActualizada.nombre}</strong> quedó configurada con:</p>
              <div class="utility-rule-success-value">${resumenRegla}</div>
              <p class="utility-rule-success-help">${resumenAlcance}</p>
            </div>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#2563eb',
          allowOutsideClick: false
        });
      },
      error: error => {
        this.guardandoReglaCategoria = false;
        this.mensajeError =
          error?.error?.message ||
          error?.error ||
          'No se pudo guardar la regla de la categoría.';
      }
    });
  }

  private normalizarTexto(valor: string): string {
    return (valor || '')
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  volverAlPanel(): void {
    if (this.authService.obtenerRol()?.replace('ROLE_', '') === 'SUPER_ADMIN') {
      this.router.navigate([
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'inventario',
        'panel'
      ]);
      return;
    }

    this.router.navigate([
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'inventario',
      'panel'
    ]);
  }
}
