import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { InventarioService } from '../../../../../../core/services/inventario/inventario.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';

import {
  AjusteInventarioDTO,
  InventarioAdminDTO
} from '../../../../../../core/models/inventario/inventario.model';

@Component({
  selector: 'app-ajustar-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './ajustar-inventario.component.html',
  styleUrl: './ajustar-inventario.component.css'
})
export class AjustarInventarioComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  inventario: InventarioAdminDTO[] = [];

  productoSeleccionadoId = '';
  busquedaProducto = '';
  productoSelectorAbierto = false;
  busquedaInventario = '';
  filtroStock: 'TODOS' | 'CON_STOCK' | 'SIN_STOCK' = 'TODOS';
  cantidadAjuste = 0;
  motivo = '';

  cargandoInventario = false;
  guardando = false;

  mensajeExito = '';
  mensajeError = '';

  paginaActual = 1;
  registrosPorPagina = 20;

  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventarioService: InventarioService,
    private authService: AuthService,
    private elementRef: ElementRef<HTMLElement>
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

    this.cargarInventario();
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

  private obtenerRolNormalizado(): string | null {
    const rol = this.authService.obtenerRol();

    if (!rol) {
      return null;
    }

    return rol.replace('ROLE_', '');
  }

  private validarAccesoLocal(): boolean {
    const rol = this.obtenerRolNormalizado();
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

  esSuperAdmin(): boolean {
    return this.obtenerRolNormalizado() === 'SUPER_ADMIN';
  }

  esAdmin(): boolean {
    return this.obtenerRolNormalizado() === 'ADMIN';
  }

  rutaPanelInventario(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'inventario',
        'panel'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'inventario',
      'panel'
    ];
  }

  cargarInventario(): void {
    this.cargandoInventario = true;
    this.mensajeError = '';

    this.inventarioService
      .listarPorSucursal(this.sucursalId)
      .subscribe({
        next: (data) => {
          this.inventario = data || [];
          this.paginaActual = 1;
          this.cargandoInventario = false;
        },
        error: (error) => {
          this.cargandoInventario = false;

          this.mensajeError =
            error?.error?.message ||
            error?.error ||
            'No se pudo cargar el inventario de la sucursal.';

          console.error(error);
        }
      });
  }

  get productosFiltrados(): InventarioAdminDTO[] {
    const termino = this.normalizarTexto(this.busquedaInventario);

    return this.inventario.filter(item => {
      const coincideTexto = !termino || this.normalizarTexto([
        item.codigo,
        item.nombre,
        item.categoria,
        item.color,
        item.talla,
        item.genero
      ].join(' ')).includes(termino);
      const coincideStock = this.filtroStock === 'TODOS'
        || (this.filtroStock === 'CON_STOCK' && item.stockActual > 0)
        || (this.filtroStock === 'SIN_STOCK' && item.stockActual === 0);

      return coincideTexto && coincideStock;
    });
  }

  get productosSelectorFiltrados(): InventarioAdminDTO[] {
    const termino = this.normalizarTexto(this.busquedaProducto);
    if (!termino) {
      return this.inventario.slice(0, 80);
    }

    return this.inventario.filter(item => this.normalizarTexto([
      item.codigo,
      item.nombre,
      item.categoria,
      item.color,
      item.talla
    ].join(' ')).includes(termino)).slice(0, 80);
  }

  get inventarioPaginado(): InventarioAdminDTO[] {
    const inicio =
      (this.paginaActual - 1) * this.registrosPorPagina;

    const fin =
      inicio + this.registrosPorPagina;

    return this.productosFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    const total = Math.ceil(
      this.productosFiltrados.length / this.registrosPorPagina
    );

    return total > 0 ? total : 1;
  }

  cambiarPagina(pagina: number): void {
    if (
      pagina < 1 ||
      pagina > this.totalPaginas
    ) {
      return;
    }

    this.paginaActual = pagina;
  }

  cambiarBusquedaInventario(): void {
    this.paginaActual = 1;
  }

  cambiarFiltroStock(filtro: 'TODOS' | 'CON_STOCK' | 'SIN_STOCK'): void {
    this.filtroStock = filtro;
    this.paginaActual = 1;
  }

  get totalUnidades(): number {
    return this.inventario.reduce((total, item) => total + Number(item.stockActual || 0), 0);
  }

  get referenciasConStock(): number {
    return this.inventario.filter(item => item.stockActual > 0).length;
  }

  get referenciasSinStock(): number {
    return this.inventario.filter(item => item.stockActual === 0).length;
  }

  toggleProductoSelector(): void {
    this.productoSelectorAbierto = !this.productoSelectorAbierto;
    if (!this.productoSelectorAbierto) {
      this.busquedaProducto = '';
    }
  }

  seleccionarProducto(item: InventarioAdminDTO): void {
    this.productoSeleccionadoId = String(item.productoId);
    this.productoSelectorAbierto = false;
    this.busquedaProducto = '';
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  @HostListener('document:click', ['$event'])
  cerrarSelectorAlHacerClickFuera(evento: MouseEvent): void {
    if (
      this.productoSelectorAbierto
      && !this.elementRef.nativeElement.contains(evento.target as Node)
    ) {
      this.productoSelectorAbierto = false;
      this.busquedaProducto = '';
    }
  }

  obtenerProductoSeleccionado(): InventarioAdminDTO | undefined {
    if (!this.productoSeleccionadoId) {
      return undefined;
    }

    return this.inventario.find(
      item =>
        item.productoId === Number(this.productoSeleccionadoId)
    );
  }

  calcularStockResultado(): number | null {
    const producto = this.obtenerProductoSeleccionado();

    if (!producto) {
      return null;
    }

    return producto.stockActual +
      Number(this.cantidadAjuste || 0);
  }

  obtenerTipoAjuste(): string {
    if (this.cantidadAjuste > 0) {
      return 'Ajuste positivo';
    }

    if (this.cantidadAjuste < 0) {
      return 'Ajuste negativo';
    }

    return 'Sin ajuste';
  }

  obtenerClaseTipoAjuste(): string {
    if (this.cantidadAjuste > 0) {
      return 'badge bg-success';
    }

    if (this.cantidadAjuste < 0) {
      return 'badge bg-danger';
    }

    return 'badge bg-secondary';
  }

  realizarAjuste(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    const producto = this.obtenerProductoSeleccionado();

    if (!producto) {
      this.mensajeError = 'Debe seleccionar un producto.';
      return;
    }

    if (Number(this.cantidadAjuste) === 0) {
      this.mensajeError = 'La cantidad del ajuste no puede ser cero.';
      return;
    }

    const stockResultado =
      producto.stockActual +
      Number(this.cantidadAjuste);

    if (stockResultado < 0) {
      this.mensajeError =
        `El ajuste no puede dejar el inventario en negativo. Stock actual: ${producto.stockActual}.`;
      return;
    }

    if (!this.motivo || !this.motivo.trim()) {
      this.mensajeError = 'Debe ingresar un motivo para el ajuste.';
      return;
    }

    const dto: AjusteInventarioDTO = {
      sucursalId: this.sucursalId,
      productoId: producto.productoId,
      cantidad: Number(this.cantidadAjuste),
      motivo: this.motivo.trim()
    };

    this.guardando = true;

    this.inventarioService
      .ajustarInventario(dto)
      .subscribe({
        next: () => {
          this.guardando = false;

          this.mensajeExito =
            'Ajuste de inventario registrado correctamente.';

          this.limpiarFormulario();

          this.cargarInventario();
        },
        error: (error) => {
          this.guardando = false;

          this.mensajeError =
            error?.error?.message ||
            error?.error ||
            'No se pudo registrar el ajuste de inventario.';

          console.error(error);
        }
      });
  }

  limpiarFormulario(): void {
    this.productoSeleccionadoId = '';
    this.busquedaProducto = '';
    this.productoSelectorAbierto = false;
    this.cantidadAjuste = 0;
    this.motivo = '';
  }

  private normalizarTexto(valor: string | null | undefined): string {
    return (valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  volverAlPanel(): void {
    this.router.navigate(this.rutaPanelInventario());
  }
}
