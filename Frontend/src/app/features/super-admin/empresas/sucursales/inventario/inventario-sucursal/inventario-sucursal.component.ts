import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { InventarioService } from '../../../../../../core/services/inventario/inventario.service';
import { VentaService } from '../../../../../../core/services/venta/venta.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';

import { InventarioAdminDTO } from '../../../../../../core/models/inventario/inventario.model';

import {
  ProductoRankingVentasDTO,
  RankingProductosVentasDTO
} from '../../../../../../core/models/producto/producto.model';

type FiltroStock = 'TODOS' | 'BAJO' | 'NORMAL' | 'ALTO' | 'AGOTADO';
type OrdenStock = 'MENOR_MAYOR' | 'MAYOR_MENOR' | 'NOMBRE_ASC';
type ColumnaOrdenInventario = 'STOCK' | 'NOMBRE' | 'CATEGORIA' | 'COLOR';
type DireccionOrden = 'ASC' | 'DESC';

@Component({
  selector: 'app-inventario-sucursal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './inventario-sucursal.component.html',
  styleUrl: './inventario-sucursal.component.css'
})
export class InventarioSucursalComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  inventario: InventarioAdminDTO[] = [];

  textoBusqueda = '';
  filtroStock: FiltroStock = 'TODOS';
  ordenStock: OrdenStock = 'MENOR_MAYOR';
  columnaOrden: ColumnaOrdenInventario = 'STOCK';
  direccionOrden: DireccionOrden = 'ASC';
  filtroStockAbierto = false;
  ordenStockAbierto = false;

  stockBajoLimite = 5;
  stockAltoLimite = 20;

  cargando = false;
  mensajeError = '';

  rankingVentas: RankingProductosVentasDTO | null = null;

  cargandoRanking = false;
  mensajeErrorRanking = '';

  fechaInicioRanking = '';
  fechaFinRanking = '';

  paginaActual = 1;
  tamanoPagina = 20;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventarioService: InventarioService,
    private ventaService: VentaService,
    private authService: AuthService
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

    this.inicializarFechasRanking();

    this.cargarInventario();
    this.cargarRankingProductosVentas();
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

  rutaIngresoInventario(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'inventario',
        'ingresar'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'inventario',
      'ingresar'
    ];
  }

  rutaAjusteInventario(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'inventario',
        'ajustar'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'inventario',
      'ajustar'
    ];
  }

  cargarInventario(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.inventarioService.listarPorSucursal(this.sucursalId)
      .subscribe({
        next: (data) => {
          this.inventario = data || [];
          this.paginaActual = 1;
          this.cargando = false;
        },
        error: (error) => {
          this.cargando = false;
          this.mensajeError =
            error?.error?.message ||
            error?.error ||
            'No se pudo cargar el inventario de la sucursal.';

          console.error(error);
        }
      });
  }

  inicializarFechasRanking(): void {
    const hoy = new Date();

    const primerDiaMes = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      1
    );

    const ultimoDiaMes = new Date(
      hoy.getFullYear(),
      hoy.getMonth() + 1,
      0
    );

    this.fechaInicioRanking = this.formatearFechaRanking(primerDiaMes);
    this.fechaFinRanking = this.formatearFechaRanking(ultimoDiaMes);
  }

  cargarRankingProductosVentas(): void {
    this.mensajeErrorRanking = '';

    if (!this.fechaInicioRanking || !this.fechaFinRanking) {
      this.mensajeErrorRanking = 'Debe seleccionar fecha inicial y fecha final para consultar el ranking.';
      return;
    }

    const inicio = new Date(`${this.fechaInicioRanking}T00:00:00`);
    const fin = new Date(`${this.fechaFinRanking}T00:00:00`);

    if (fin < inicio) {
      this.mensajeErrorRanking = 'La fecha final no puede ser menor que la fecha inicial.';
      return;
    }

    this.cargandoRanking = true;

    this.ventaService.obtenerRankingProductosVentas(
      this.sucursalId,
      this.fechaInicioRanking,
      this.fechaFinRanking
    ).subscribe({
      next: (data) => {
        this.rankingVentas = data;
        this.cargandoRanking = false;
      },
      error: (error) => {
        this.cargandoRanking = false;
        this.rankingVentas = null;

        this.mensajeErrorRanking =
          error?.error?.message ||
          error?.error ||
          'No se pudo cargar el ranking de productos vendidos.';

        console.error(error);
      }
    });
  }

  obtenerProductosMasVendidos(): ProductoRankingVentasDTO[] {
    return this.rankingVentas?.productosMasVendidos || [];
  }

  obtenerProductosMenosVendidos(): ProductoRankingVentasDTO[] {
    return this.rankingVentas?.productosMenosVendidos || [];
  }

  hayProductosMasVendidos(): boolean {
    return this.obtenerProductosMasVendidos().length > 0;
  }

  hayProductosMenosVendidos(): boolean {
    return this.obtenerProductosMenosVendidos().length > 0;
  }

  calcularValorCostoItem(item: InventarioAdminDTO): number {
    const stock = item.stockActual || 0;
    const costo = item.costoUnitario || 0;

    return stock * costo;
  }

  calcularValorVentaItem(item: InventarioAdminDTO): number {
    const stock = item.stockActual || 0;
    const precioVenta = item.precioVenta || 0;

    return stock * precioVenta;
  }

  calcularPorcentajeGanancia(item: InventarioAdminDTO): number | null {
    const costo = Number(item.costoUnitario || 0);
    const precioVenta = Number(item.precioVenta || 0);

    if (costo <= 0) {
      return null;
    }

    return (precioVenta - costo) / costo * 100;
  }

  calcularValorCostoTotal(): number {
    return this.obtenerInventarioFiltradoSinPaginacion().reduce(
      (total, item) => total + this.calcularValorCostoItem(item),
      0
    );
  }

  calcularValorVentaTotal(): number {
    return this.obtenerInventarioFiltradoSinPaginacion().reduce(
      (total, item) => total + this.calcularValorVentaItem(item),
      0
    );
  }

  obtenerInventarioFiltradoSinPaginacion(): InventarioAdminDTO[] {
    let resultado = [...this.inventario];

    const busqueda = this.textoBusqueda.trim().toLowerCase();

    if (busqueda) {
      resultado = resultado.filter(item =>
        item.nombre?.toLowerCase().includes(busqueda) ||
        item.codigo?.toLowerCase().includes(busqueda) ||
        item.categoria?.toLowerCase().includes(busqueda) ||
        item.color?.toLowerCase().includes(busqueda) ||
        item.talla?.toLowerCase().includes(busqueda) ||
        item.genero?.toLowerCase().includes(busqueda)
      );
    }

    if (this.filtroStock !== 'TODOS') {
      resultado = resultado.filter(item =>
        this.obtenerEstadoStock(item.stockActual) === this.filtroStock
      );
    }

    resultado.sort((a, b) => {
      if (this.columnaOrden === 'NOMBRE') {
        return this.compararTextoOrdenado(a.nombre, b.nombre);
      }

      if (this.columnaOrden === 'CATEGORIA') {
        const porCategoria = this.compararTextoOrdenado(a.categoria, b.categoria);

        if (porCategoria !== 0) {
          return porCategoria;
        }

        const porColor = this.compararTextoOrdenado(a.color, b.color, false);

        if (porColor !== 0) {
          return porColor;
        }

        return this.compararTextoOrdenado(a.nombre, b.nombre, false);
      }

      if (this.columnaOrden === 'COLOR') {
        const porColor = this.compararTextoOrdenado(a.color, b.color);

        if (porColor !== 0) {
          return porColor;
        }

        return this.compararTextoOrdenado(a.nombre, b.nombre, false);
      }

      const stockA = a.stockActual || 0;
      const stockB = b.stockActual || 0;

      if (this.ordenStock === 'MENOR_MAYOR') {
        return stockA - stockB;
      }

      if (this.ordenStock === 'MAYOR_MENOR') {
        return stockB - stockA;
      }

      return (a.nombre || '').localeCompare(b.nombre || '');
    });

    return resultado;
  }

  obtenerInventarioFiltrado(): InventarioAdminDTO[] {
    const datos = this.obtenerInventarioFiltradoSinPaginacion();

    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    const fin = inicio + this.tamanoPagina;

    return datos.slice(inicio, fin);
  }

  obtenerTotalPaginas(): number {
    const totalRegistros = this.obtenerInventarioFiltradoSinPaginacion().length;

    if (totalRegistros === 0) {
      return 1;
    }

    return Math.ceil(totalRegistros / this.tamanoPagina);
  }

  obtenerPaginas(): number[] {
    const totalPaginas = this.obtenerTotalPaginas();

    return Array.from(
      { length: totalPaginas },
      (_, i) => i + 1
    );
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.obtenerTotalPaginas()) {
      this.paginaActual++;
    }
  }

  irAPagina(numero: number): void {
    this.paginaActual = numero;
  }

  reiniciarPaginacion(): void {
    this.paginaActual = 1;
  }

  obtenerEstadoStock(stock: number): FiltroStock {
    if (stock <= 0) {
      return 'AGOTADO';
    }

    if (stock <= this.stockBajoLimite) {
      return 'BAJO';
    }

    if (stock >= this.stockAltoLimite) {
      return 'ALTO';
    }

    return 'NORMAL';
  }

  obtenerTextoEstadoStock(stock: number): string {
    const estado = this.obtenerEstadoStock(stock);

    switch (estado) {
      case 'AGOTADO':
        return 'Agotado';

      case 'BAJO':
        return 'Bajo stock';

      case 'ALTO':
        return 'Alto inventario';

      case 'NORMAL':
        return 'Stock normal';

      default:
        return 'Stock normal';
    }
  }

  obtenerClaseEstadoStock(stock: number): string {
    const estado = this.obtenerEstadoStock(stock);

    switch (estado) {
      case 'AGOTADO':
        return 'badge-stock badge-agotado';

      case 'BAJO':
        return 'badge-stock badge-bajo';

      case 'ALTO':
        return 'badge-stock badge-alto';

      case 'NORMAL':
        return 'badge-stock badge-normal';

      default:
        return 'badge-stock badge-normal';
    }
  }

  contarReferencias(): number {
    return this.inventario.length;
  }

  contarUnidades(): number {
    return this.inventario.reduce(
      (total, item) => total + (item.stockActual || 0),
      0
    );
  }

  contarBajoStock(): number {
    return this.inventario.filter(
      item => this.obtenerEstadoStock(item.stockActual) === 'BAJO'
    ).length;
  }

  contarAltoStock(): number {
    return this.inventario.filter(
      item => this.obtenerEstadoStock(item.stockActual) === 'ALTO'
    ).length;
  }

  contarAgotados(): number {
    return this.inventario.filter(
      item => this.obtenerEstadoStock(item.stockActual) === 'AGOTADO'
    ).length;
  }

  limpiarFiltros(): void {
    this.textoBusqueda = '';
    this.filtroStock = 'TODOS';
    this.ordenStock = 'MENOR_MAYOR';
    this.columnaOrden = 'STOCK';
    this.direccionOrden = 'ASC';
    this.paginaActual = 1;
    this.filtroStockAbierto = false;
    this.ordenStockAbierto = false;
  }

  alternarFiltroStock(): void {
    this.filtroStockAbierto = !this.filtroStockAbierto;
    this.ordenStockAbierto = false;
  }

  alternarOrdenStock(): void {
    this.ordenStockAbierto = !this.ordenStockAbierto;
    this.filtroStockAbierto = false;
  }

  seleccionarFiltroStock(filtro: FiltroStock): void {
    this.filtroStock = filtro;
    this.filtroStockAbierto = false;
    this.reiniciarPaginacion();
  }

  seleccionarOrdenStock(orden: OrdenStock): void {
    this.ordenStock = orden;
    this.ordenStockAbierto = false;

    if (orden === 'NOMBRE_ASC') {
      this.columnaOrden = 'NOMBRE';
      this.direccionOrden = 'ASC';
    } else {
      this.columnaOrden = 'STOCK';
      this.direccionOrden = orden === 'MAYOR_MENOR' ? 'DESC' : 'ASC';
    }

    this.reiniciarPaginacion();
  }

  alternarOrdenColumna(columna: Exclude<ColumnaOrdenInventario, 'STOCK'>): void {
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.columnaOrden = columna;
      this.direccionOrden = 'ASC';
    }

    this.reiniciarPaginacion();
  }

  obtenerClaseIconoOrden(columna: Exclude<ColumnaOrdenInventario, 'STOCK'>): string {
    if (this.columnaOrden !== columna) {
      return 'bi bi-arrow-down-up';
    }

    return this.direccionOrden === 'ASC' ? 'bi bi-arrow-up' : 'bi bi-arrow-down';
  }

  obtenerAriaOrden(columna: Exclude<ColumnaOrdenInventario, 'STOCK'>): string {
    if (this.columnaOrden !== columna) {
      return 'none';
    }

    return this.direccionOrden === 'ASC' ? 'ascending' : 'descending';
  }

  private compararTextoOrdenado(
    valorA: string | null | undefined,
    valorB: string | null | undefined,
    aplicarDireccion = true
  ): number {
    const resultado = (valorA || '').localeCompare(valorB || '', 'es', {
      sensitivity: 'base',
      numeric: true
    });

    if (!aplicarDireccion) {
      return resultado;
    }

    return this.direccionOrden === 'ASC' ? resultado : resultado * -1;
  }

  obtenerNombreFiltroStock(): string {
    switch (this.filtroStock) {
      case 'BAJO':
        return 'Bajo stock';
      case 'NORMAL':
        return 'Stock normal';
      case 'ALTO':
        return 'Alto inventario';
      case 'AGOTADO':
        return 'Agotado';
      default:
        return 'Todos';
    }
  }

  obtenerNombreOrdenStock(): string {
    if (this.columnaOrden === 'NOMBRE') {
      return this.direccionOrden === 'ASC' ? 'Producto A-Z' : 'Producto Z-A';
    }

    if (this.columnaOrden === 'CATEGORIA') {
      return this.direccionOrden === 'ASC' ? 'Categoría A-Z' : 'Categoría Z-A';
    }

    if (this.columnaOrden === 'COLOR') {
      return this.direccionOrden === 'ASC' ? 'Color A-Z' : 'Color Z-A';
    }

    switch (this.ordenStock) {
      case 'MAYOR_MENOR':
        return 'Mayor stock primero';
      case 'NOMBRE_ASC':
        return 'Nombre A-Z';
      default:
        return 'Menor stock primero';
    }
  }

  @HostListener('document:click')
  cerrarSelectores(): void {
    this.filtroStockAbierto = false;
    this.ordenStockAbierto = false;
  }

  volverAlPanel(): void {
    this.router.navigate(this.rutaPanelInventario());
  }

  irAAjuste(): void {
    this.router.navigate(this.rutaAjusteInventario());
  }

  irAIngreso(): void {
    this.router.navigate(this.rutaIngresoInventario());
  }

  private formatearFechaRanking(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
