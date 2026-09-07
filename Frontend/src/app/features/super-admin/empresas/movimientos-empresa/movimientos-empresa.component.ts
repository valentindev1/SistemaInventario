import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { InventarioService } from '../../../../core/services/inventario/inventario.service';
import { EmpresaService } from '../../../../core/services/empresa/empresa.service';
import { MovimientoInventarioDTO } from '../../../../core/models/inventario/inventario.model';

@Component({
  selector: 'app-movimientos-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './movimientos-empresa.component.html',
  styleUrl: './movimientos-empresa.component.css'
})
export class MovimientosEmpresaComponent implements OnInit {

  empresaId!: number;
  sucursalId: number | null = null;
  empresaNombre = 'Empresa';

  movimientos: MovimientoInventarioDTO[] = [];
  movimientosFiltrados: MovimientoInventarioDTO[] = [];
  movimientosPaginados: MovimientoInventarioDTO[] = [];

  usuarios: string[] = [];
  sucursales: string[] = [];
  tipos: string[] = [];

  filtroTexto = '';
  filtroTipo = '';
  filtroUsuario = '';
  filtroSucursal = '';
  fechaInicio = '';
  fechaFin = '';

  paginaActual = 1;
  tamanioPagina = 15;
  totalPaginas = 1;
  cargando = false;
  revirtiendoId: number | null = null;
  mensajeError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventarioService: InventarioService,
    private empresaService: EmpresaService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.route.snapshot.paramMap.get('empresaId');
    const sucursalIdParam = this.route.snapshot.paramMap.get('sucursalId');

    if (!empresaIdParam || Number.isNaN(Number(empresaIdParam))) {
      this.mensajeError = 'No se pudo identificar la empresa.';
      return;
    }

    this.empresaId = Number(empresaIdParam);

    if (sucursalIdParam !== null) {
      this.sucursalId = Number(sucursalIdParam);

      if (Number.isNaN(this.sucursalId) || this.sucursalId <= 0) {
        this.mensajeError = 'No se pudo identificar la tienda.';
        return;
      }
    }

    this.empresaService.obtenerPorId(this.empresaId).subscribe({
      next: empresa => this.empresaNombre = empresa.nombre
    });
    this.cargarMovimientos();
  }

  cargarMovimientos(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.inventarioService.listarMovimientosPorEmpresa(this.empresaId).subscribe({
      next: movimientos => {
        const movimientosVisibles = this.sucursalId === null
          ? movimientos || []
          : (movimientos || []).filter(movimiento =>
              movimiento.origen === 'CATALOGO' || movimiento.sucursalId === this.sucursalId
            );

        this.movimientos = [...movimientosVisibles].sort((a, b) =>
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );

        this.usuarios = this.obtenerValoresUnicos(this.movimientos.map(m => m.usuarioNombre));
        this.sucursales = this.obtenerValoresUnicos(this.movimientos.map(m => m.sucursalNombre));
        this.tipos = this.obtenerValoresUnicos(this.movimientos.map(m => m.tipo));
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        this.mensajeError = error?.error?.message || error?.error ||
          'No se pudieron cargar los movimientos de la empresa.';
      }
    });
  }

  aplicarFiltros(): void {
    const texto = this.filtroTexto.trim().toLowerCase();
    const usuario = this.filtroUsuario.trim().toLowerCase();
    const sucursal = this.filtroSucursal.trim().toLowerCase();

    this.movimientosFiltrados = this.movimientos.filter(movimiento => {
      const textoCoincide = !texto || [
        movimiento.productoCodigo,
        movimiento.productoNombre,
        movimiento.motivo,
        movimiento.tipo
      ].some(valor => valor?.toLowerCase().includes(texto));

      const tipoCoincide = !this.filtroTipo || movimiento.tipo === this.filtroTipo;
      const usuarioCoincide = !usuario || movimiento.usuarioNombre?.toLowerCase().includes(usuario);
      const sucursalCoincide = !sucursal || movimiento.sucursalNombre?.toLowerCase().includes(sucursal);
      const fecha = new Date(movimiento.fecha);
      const inicioCoincide = !this.fechaInicio || fecha >= new Date(`${this.fechaInicio}T00:00:00`);
      const finCoincide = !this.fechaFin || fecha <= new Date(`${this.fechaFin}T23:59:59`);

      return textoCoincide && tipoCoincide && usuarioCoincide && sucursalCoincide
        && inicioCoincide && finCoincide;
    });

    this.paginaActual = 1;
    this.calcularPaginacion();
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroTipo = '';
    this.filtroUsuario = '';
    this.filtroSucursal = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.aplicarFiltros();
  }

  calcularPaginacion(): void {
    this.totalPaginas = Math.max(1, Math.ceil(this.movimientosFiltrados.length / this.tamanioPagina));
    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    this.movimientosPaginados = this.movimientosFiltrados.slice(inicio, inicio + this.tamanioPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) {
      return;
    }

    this.paginaActual = pagina;
    this.calcularPaginacion();
  }

  async revertirMovimiento(movimiento: MovimientoInventarioDTO): Promise<void> {
    if (!movimiento.puedeRevertirse || movimiento.id <= 0) {
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Cancelar este movimiento?',
      html: `Se generará un movimiento compensatorio de stock para <strong>${movimiento.productoNombre || 'este producto'}</strong>.<br><small>El registro original permanecerá visible como histórico; no se borrará una venta o factura.</small>`,
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar movimiento',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#64748b'
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.revirtiendoId = movimiento.id;

    this.inventarioService.revertirMovimiento(this.empresaId, movimiento.id).subscribe({
      next: () => {
        this.revirtiendoId = null;
        Swal.fire({
          icon: 'success',
          title: 'Movimiento cancelado',
          text: 'Se registró la compensación y se actualizó el stock.',
          confirmButtonColor: '#2563eb'
        }).then(() => this.cargarMovimientos());
      },
      error: error => {
        this.revirtiendoId = null;
        Swal.fire({
          icon: 'error',
          title: 'No se pudo cancelar',
          text: error?.error?.message || error?.error || 'El movimiento no pudo ser cancelado.',
          confirmButtonColor: '#2563eb'
        });
      }
    });
  }

  volverDetalleEmpresa(): any[] {
    if (this.sucursalId !== null) {
      return this.router.url.startsWith('/super-admin')
        ? ['/super-admin/empresas', this.empresaId, 'sucursales', 'detalle', this.sucursalId]
        : ['/admin/empresa', this.empresaId, 'sucursales', 'detalle', this.sucursalId];
    }

    return this.router.url.startsWith('/super-admin')
      ? ['/super-admin/empresas/detalle', this.empresaId]
      : ['/admin/empresa', this.empresaId, 'dashboard'];
  }

  obtenerTextoTipo(tipo: string): string {
    const textos: Record<string, string> = {
      INGRESO_MERCANCIA: 'Ingreso de mercancía',
      AJUSTE_POSITIVO: 'Ajuste positivo',
      AJUSTE_NEGATIVO: 'Ajuste negativo',
      VENTA: 'Venta',
      DEVOLUCION: 'Devolución',
      CANCELACION_FACTURA: 'Cancelación de factura',
      REVERSO: 'Reversión de movimiento',
      PRODUCTO_CREADO: 'Producto creado',
      PRODUCTO_ACTUALIZADO: 'Producto actualizado',
      PRECIO_ACTUALIZADO: 'Precio actualizado',
      REGLA_UTILIDAD_ACTUALIZADA: 'Regla de utilidad actualizada'
    };

    return textos[tipo] || tipo;
  }

  obtenerClaseTipo(tipo: string): string {
    if (tipo === 'VENTA') return 'tipo-badge tipo-venta';
    if (tipo === 'DEVOLUCION') return 'tipo-badge tipo-devolucion';
    if (tipo === 'REVERSO') return 'tipo-badge tipo-reverso';
    if (tipo === 'PRODUCTO_CREADO'
        || tipo === 'PRODUCTO_ACTUALIZADO'
        || tipo === 'PRECIO_ACTUALIZADO'
        || tipo === 'REGLA_UTILIDAD_ACTUALIZADA') {
      return 'tipo-badge tipo-catalogo';
    }
    if (tipo === 'AJUSTE_NEGATIVO') return 'tipo-badge tipo-negativo';
    if (tipo === 'AJUSTE_POSITIVO' || tipo === 'INGRESO_MERCANCIA') return 'tipo-badge tipo-positivo';
    return 'tipo-badge tipo-neutral';
  }

  contar(tipo: string): number {
    return this.movimientosFiltrados.filter(movimiento => movimiento.tipo === tipo).length;
  }

  obtenerCantidad(movimiento: MovimientoInventarioDTO): string {
    if (movimiento.cantidad === undefined || movimiento.cantidad === null) return '—';
    return movimiento.cantidad > 0 ? `+${movimiento.cantidad}` : `${movimiento.cantidad}`;
  }

  obtenerClaseCantidad(movimiento: MovimientoInventarioDTO): string {
    if (movimiento.cantidad === undefined || movimiento.cantidad === null) return 'impacto-neutral';
    return movimiento.cantidad >= 0 ? 'impacto-positivo' : 'impacto-negativo';
  }

  esActividadCatalogo(movimiento: MovimientoInventarioDTO): boolean {
    return movimiento.origen === 'CATALOGO';
  }

  trackMovimiento(movimiento: MovimientoInventarioDTO): string {
    return `${movimiento.origen || 'INVENTARIO'}-${movimiento.id}`;
  }

  private obtenerValoresUnicos(valores: Array<string | undefined>): string[] {
    return Array.from(new Set(
      valores.filter((valor): valor is string => !!valor && valor.trim() !== '')
    )).sort((a, b) => a.localeCompare(b));
  }
}
