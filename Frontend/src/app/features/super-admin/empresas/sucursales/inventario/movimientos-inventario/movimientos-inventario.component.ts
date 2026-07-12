import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { InventarioService } from '../../../../../../core/services/inventario/inventario.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';

import { MovimientoInventarioDTO } from '../../../../../../core/models/inventario/inventario.model';

type TipoFiltroFecha = 'TODOS' | 'DIA' | 'MES' | 'RANGO';

@Component({
  selector: 'app-movimientos-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './movimientos-inventario.component.html',
  styleUrl: './movimientos-inventario.component.css'
})
export class MovimientosInventarioComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  movimientos: MovimientoInventarioDTO[] = [];
  movimientosFiltrados: MovimientoInventarioDTO[] = [];
  movimientosPaginados: MovimientoInventarioDTO[] = [];

  usuariosMovimiento: string[] = [];

  cargando = false;
  mensajeError = '';

  filtroTipo = '';
  filtroCodigoProducto = '';
  filtroUsuarioNombre = '';

  filtroFecha: TipoFiltroFecha = 'TODOS';
  fechaDia = '';
  fechaMes = '';
  fechaInicio = '';
  fechaFin = '';

  paginaActual = 1;
  tamanioPagina = 20;
  totalPaginas = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventarioService: InventarioService,
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

    this.cargarMovimientos();
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

  volverAlPanel(): void {
    this.router.navigate(this.rutaPanelInventario());
  }

  cargarMovimientos(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.inventarioService.listarMovimientosPorSucursal(this.sucursalId)
      .subscribe({
        next: (data) => {
          this.movimientos = (data || []).sort((a, b) => {
            const fechaA = new Date(a.fecha).getTime();
            const fechaB = new Date(b.fecha).getTime();

            return fechaB - fechaA;
          });

          this.usuariosMovimiento = this.obtenerUsuariosUnicos(this.movimientos);

          this.aplicarFiltros();

          this.cargando = false;
        },
        error: (error) => {
          this.cargando = false;
          this.mensajeError =
            error?.error?.message ||
            error?.error ||
            'No se pudieron cargar los movimientos del inventario.';

          console.error(error);
        }
      });
  }

  aplicarFiltros(): void {
    this.mensajeError = '';

    let resultado = [...this.movimientos];

    if (this.filtroTipo) {
      resultado = resultado.filter(movimiento =>
        movimiento.tipo === this.filtroTipo
      );
    }

    const codigo = this.filtroCodigoProducto.trim().toLowerCase();

    if (codigo) {
      resultado = resultado.filter(movimiento =>
        movimiento.productoCodigo?.toLowerCase().includes(codigo)
      );
    }

    const usuario = this.filtroUsuarioNombre.trim().toLowerCase();

    if (usuario) {
      resultado = resultado.filter(movimiento =>
        movimiento.usuarioNombre?.toLowerCase().includes(usuario)
      );
    }

    if (this.filtroFecha === 'DIA') {
      if (!this.fechaDia) {
        this.movimientosFiltrados = resultado;
        this.reiniciarPaginacion();
        return;
      }

      resultado = resultado.filter(movimiento =>
        this.obtenerFechaYYYYMMDD(movimiento.fecha) === this.fechaDia
      );
    }

    if (this.filtroFecha === 'MES') {
      if (!this.fechaMes) {
        this.movimientosFiltrados = resultado;
        this.reiniciarPaginacion();
        return;
      }

      resultado = resultado.filter(movimiento =>
        this.obtenerFechaYYYYMM(movimiento.fecha) === this.fechaMes
      );
    }

    if (this.filtroFecha === 'RANGO') {
      if (!this.fechaInicio || !this.fechaFin) {
        this.movimientosFiltrados = resultado;
        this.reiniciarPaginacion();
        return;
      }

      if (!this.validarRangoFechas()) {
        this.movimientosFiltrados = [];
        this.reiniciarPaginacion();
        return;
      }

      const inicio = new Date(`${this.fechaInicio}T00:00:00`);
      const fin = new Date(`${this.fechaFin}T23:59:59`);

      resultado = resultado.filter(movimiento => {
        const fechaMovimiento = new Date(movimiento.fecha);
        return fechaMovimiento >= inicio && fechaMovimiento <= fin;
      });
    }

    this.movimientosFiltrados = resultado;
    this.reiniciarPaginacion();
  }

  limpiarFiltros(): void {
    this.filtroTipo = '';
    this.filtroCodigoProducto = '';
    this.filtroUsuarioNombre = '';
    this.filtroFecha = 'TODOS';
    this.fechaDia = '';
    this.fechaMes = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.mensajeError = '';

    this.movimientosFiltrados = [...this.movimientos];
    this.reiniciarPaginacion();
  }

  cambiarFiltroFecha(): void {
    this.fechaDia = '';
    this.fechaMes = '';
    this.fechaInicio = '';
    this.fechaFin = '';

    this.aplicarFiltros();
  }

  validarRangoFechas(): boolean {
    const inicio = new Date(`${this.fechaInicio}T00:00:00`);
    const fin = new Date(`${this.fechaFin}T00:00:00`);

    if (fin < inicio) {
      this.mensajeError = 'La fecha final no puede ser menor que la fecha inicial.';
      return false;
    }

    const fechaMaxima = new Date(inicio);
    fechaMaxima.setMonth(fechaMaxima.getMonth() + 1);

    if (fin > fechaMaxima) {
      this.mensajeError = 'El rango personalizado no puede superar 1 mes.';
      return false;
    }

    return true;
  }

  reiniciarPaginacion(): void {
    this.paginaActual = 1;
    this.calcularPaginacion();
  }

  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(
      this.movimientosFiltrados.length / this.tamanioPagina
    );

    if (this.totalPaginas === 0) {
      this.totalPaginas = 1;
    }

    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    const fin = inicio + this.tamanioPagina;

    this.movimientosPaginados = this.movimientosFiltrados.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) {
      return;
    }

    this.paginaActual = pagina;
    this.calcularPaginacion();
  }

  obtenerTextoTipo(tipo: string): string {
    switch (tipo) {
      case 'INGRESO_MERCANCIA':
        return 'Ingreso de mercancía';

      case 'AJUSTE_POSITIVO':
        return 'Ajuste positivo';

      case 'AJUSTE_NEGATIVO':
        return 'Ajuste negativo';

      case 'VENTA':
        return 'Venta';

      case 'DEVOLUCION':
        return 'Devolución';

      case 'CANCELACION_FACTURA':
        return 'Cancelación factura';

      default:
        return tipo;
    }
  }

  obtenerClaseTipo(tipo: string): string {
    switch (tipo) {
      case 'INGRESO_MERCANCIA':
        return 'badge badge-primary';

      case 'AJUSTE_POSITIVO':
        return 'badge badge-success';

      case 'AJUSTE_NEGATIVO':
        return 'badge badge-danger';

      case 'VENTA':
        return 'badge badge-warning';

      case 'DEVOLUCION':
        return 'badge badge-info';

      case 'CANCELACION_FACTURA':
        return 'badge badge-secondary';

      default:
        return 'badge badge-secondary';
    }
  }

  obtenerClaseCantidad(cantidad: number): string {
    if (cantidad > 0) {
      return 'cantidad-positiva';
    }

    if (cantidad < 0) {
      return 'cantidad-negativa';
    }

    return '';
  }

  contarIngresos(): number {
    return this.movimientosFiltrados.filter(
      movimiento => movimiento.tipo === 'INGRESO_MERCANCIA'
    ).length;
  }

  contarAjustesPositivos(): number {
    return this.movimientosFiltrados.filter(
      movimiento => movimiento.tipo === 'AJUSTE_POSITIVO'
    ).length;
  }

  contarAjustesNegativos(): number {
    return this.movimientosFiltrados.filter(
      movimiento => movimiento.tipo === 'AJUSTE_NEGATIVO'
    ).length;
  }

  contarVentas(): number {
    return this.movimientosFiltrados.filter(
      movimiento => movimiento.tipo === 'VENTA'
    ).length;
  }

  private obtenerUsuariosUnicos(movimientos: MovimientoInventarioDTO[]): string[] {
    const usuarios = movimientos
      .map(movimiento => movimiento.usuarioNombre)
      .filter((usuario): usuario is string => !!usuario && usuario.trim() !== '');

    return Array.from(new Set(usuarios)).sort((a, b) =>
      a.localeCompare(b)
    );
  }

  private obtenerFechaYYYYMMDD(fecha: string): string {
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private obtenerFechaYYYYMM(fecha: string): string {
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}`;
  }
}
