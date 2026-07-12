import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { EmpleadoInventarioService } from '../../../../core/services/empleado/empleado-inventario.service';

import { InventarioEmpleadoDTO } from '../../../../core/models/inventario/inventario.model';

@Component({
  selector: 'app-inventario-actual-empleado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './inventario-actual-empleado.component.html',
  styleUrl: './inventario-actual-empleado.component.css'
})
export class InventarioActualEmpleadoComponent implements OnInit {

  sucursalId!: number;
  empresaId!: number;

  inventario: InventarioEmpleadoDTO[] = [];
  inventarioFiltrado: InventarioEmpleadoDTO[] = [];

  filtro = '';
  filtroStock = 'TODOS';

  cargando = false;

  mensajeError = '';
  mensajeExito = '';

  paginaActual = 1;
  registrosPorPagina = 20;
  totalPaginas = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private empleadoInventarioService: EmpleadoInventarioService
  ) {}

  ngOnInit(): void {

    const accesoValido = this.validarAccesoEmpleado();

    if (!accesoValido) {
      return;
    }

    this.cargarInventario();
  }

  private validarAccesoEmpleado(): boolean {

    this.mensajeError = '';

    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return false;
    }

    const rol = this.authService.obtenerRol();
    const empresaIdUsuario = this.authService.obtenerEmpresaId();
    const sucursalIdUsuario = this.authService.obtenerSucursalId();

    if (!rol) {
      this.router.navigate(['/login']);
      return false;
    }

    if (rol !== 'EMPLEADO') {
      this.router.navigate(['/acceso-denegado']);
      return false;
    }

    if (!empresaIdUsuario || !sucursalIdUsuario) {
      this.mensajeError = 'No se pudo identificar la empresa o sucursal del empleado.';
      this.router.navigate(['/login']);
      return false;
    }

    const sucursalIdParam = this.obtenerSucursalIdDesdeRuta();

    if (!sucursalIdParam) {
      this.router.navigate([
        '/empleado',
        'sucursal',
        sucursalIdUsuario,
        'inventario',
        'actual'
      ]);

      return false;
    }

    const sucursalIdRuta = Number(sucursalIdParam);

    if (
      Number.isNaN(sucursalIdRuta) ||
      sucursalIdRuta <= 0
    ) {
      this.router.navigate([
        '/empleado',
        'sucursal',
        sucursalIdUsuario,
        'inventario',
        'actual'
      ]);

      return false;
    }

    if (sucursalIdRuta !== sucursalIdUsuario) {
      this.router.navigate([
        '/empleado',
        'sucursal',
        sucursalIdUsuario,
        'inventario',
        'actual'
      ]);

      return false;
    }

    this.empresaId = empresaIdUsuario;
    this.sucursalId = sucursalIdUsuario;

    return true;
  }

  private obtenerSucursalIdDesdeRuta(): string | null {
    return (
      this.route.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.parent?.snapshot.paramMap.get('sucursalId') ??
      this.route.parent?.parent?.parent?.snapshot.paramMap.get('sucursalId') ??
      null
    );
  }

  cargarInventario(): void {

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.empleadoInventarioService.listarInventarioPorSucursal(this.sucursalId)
      .subscribe({
        next: (data) => {
          this.inventario = data || [];
          this.inventarioFiltrado = [...this.inventario];

          this.paginaActual = 1;
          this.actualizarTotalPaginas();

          this.cargando = false;
        },
        error: (error) => {
          this.cargando = false;

          this.mensajeError = this.obtenerMensajeError(
            error,
            'No se pudo cargar el inventario de la sucursal.'
          );

          console.error(error);
        }
      });
  }

  filtrarInventario(): void {

    const texto = this.filtro.trim().toLowerCase();

    this.inventarioFiltrado = this.inventario.filter(item => {

      const coincideTexto =
        !texto ||
        item.codigo?.toLowerCase().includes(texto) ||
        item.nombre?.toLowerCase().includes(texto) ||
        item.descripcion?.toLowerCase().includes(texto) ||
        item.categoria?.toLowerCase().includes(texto) ||
        item.color?.toLowerCase().includes(texto) ||
        item.talla?.toLowerCase().includes(texto) ||
        item.genero?.toLowerCase().includes(texto);

      const coincideStock = this.validarFiltroStock(item);

      return coincideTexto && coincideStock;
    });

    this.paginaActual = 1;
    this.actualizarTotalPaginas();
  }

  private validarFiltroStock(item: InventarioEmpleadoDTO): boolean {

    if (this.filtroStock === 'TODOS') {
      return true;
    }

    if (this.filtroStock === 'DISPONIBLE') {
      return item.stockActual > 5;
    }

    if (this.filtroStock === 'BAJO') {
      return item.stockActual > 0 && item.stockActual <= 5;
    }

    if (this.filtroStock === 'AGOTADO') {
      return item.stockActual <= 0;
    }

    return true;
  }

  limpiarFiltros(): void {
    this.filtro = '';
    this.filtroStock = 'TODOS';
    this.filtrarInventario();
  }

  get inventarioPaginado(): InventarioEmpleadoDTO[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;

    return this.inventarioFiltrado.slice(inicio, fin);
  }

  actualizarTotalPaginas(): void {
    this.totalPaginas = Math.max(
      1,
      Math.ceil(this.inventarioFiltrado.length / this.registrosPorPagina)
    );

    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas;
    }
  }

  irPaginaAnterior(): void {
    if (this.paginaActual <= 1) {
      return;
    }

    this.paginaActual--;
    this.subirArriba();
  }

  irPaginaSiguiente(): void {
    if (this.paginaActual >= this.totalPaginas) {
      return;
    }

    this.paginaActual++;
    this.subirArriba();
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) {
      return;
    }

    this.paginaActual = pagina;
    this.subirArriba();
  }

  get paginasDisponibles(): number[] {

    const maxPaginasVisibles = 3;

    if (this.totalPaginas <= maxPaginasVisibles) {
      return Array.from(
        { length: this.totalPaginas },
        (_, index) => index + 1
      );
    }

    let inicio = this.paginaActual - 1;
    let fin = this.paginaActual + 1;

    if (this.paginaActual === 1) {
      inicio = 1;
      fin = 3;
    }

    if (this.paginaActual === this.totalPaginas) {
      inicio = this.totalPaginas - 2;
      fin = this.totalPaginas;
    }

    const paginas: number[] = [];

    for (let pagina = inicio; pagina <= fin; pagina++) {
      paginas.push(pagina);
    }

    return paginas;
  }

  calcularTotalReferencias(): number {
    return this.inventarioFiltrado.length;
  }

  calcularUnidadesDisponibles(): number {
    return this.inventarioFiltrado.reduce(
      (total, item) => total + (Number(item.stockActual) || 0),
      0
    );
  }

  calcularProductosAgotados(): number {
    return this.inventarioFiltrado.filter(
      item => item.stockActual <= 0
    ).length;
  }

  calcularProductosBajoStock(): number {
    return this.inventarioFiltrado.filter(
      item => item.stockActual > 0 && item.stockActual <= 5
    ).length;
  }

  getClaseStock(item: InventarioEmpleadoDTO): string {

    if (item.stockActual <= 0) {
      return 'stock-agotado';
    }

    if (item.stockActual <= 5) {
      return 'stock-bajo';
    }

    return 'stock-disponible';
  }

  getTextoStock(item: InventarioEmpleadoDTO): string {

    if (item.stockActual <= 0) {
      return 'Agotado';
    }

    if (item.stockActual <= 5) {
      return 'Bajo stock';
    }

    return 'Disponible';
  }

  volverPanelInventario(): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'inventario',
      'panel'
    ]);
  }

  private subirArriba(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  private obtenerMensajeError(error: any, mensajeDefecto: string): string {

    if (Array.isArray(error?.error?.errores)) {
      return error.error.errores.join(', ');
    }

    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.error?.error) {
      return error.error.error;
    }

    return mensajeDefecto;
  }
}
