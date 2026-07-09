import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { InventarioService } from '../../../../../../core/services/inventario/inventario.service';

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
  cantidadAjuste = 0;
  motivo = '';

  cargandoInventario = false;
  guardando = false;

  mensajeExito = '';
  mensajeError = '';

  // PAGINACIÓN
  paginaActual = 1;
  registrosPorPagina = 20;

  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventarioService: InventarioService
  ) {}

  ngOnInit(): void {

    const empresaIdParam =
      this.route.snapshot.paramMap.get('empresaId');

    const sucursalIdParam =
      this.route.snapshot.paramMap.get('sucursalId');

    if (!empresaIdParam || !sucursalIdParam) {
      this.mensajeError =
        'No se pudo identificar la empresa o la sucursal.';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);

    if (!this.empresaId || !this.sucursalId) {
      this.mensajeError =
        'Los identificadores de empresa o sucursal no son válidos.';
      return;
    }

    this.cargarInventario();
  }

  cargarInventario(): void {

    this.cargandoInventario = true;
    this.mensajeError = '';

    this.inventarioService
      .listarPorSucursal(this.sucursalId)
      .subscribe({
        next: (data) => {

          this.inventario = data || [];

          // Reiniciar a la primera página cada vez que se recarga el inventario
          this.paginaActual = 1;

          this.cargandoInventario = false;
        },
        error: (error) => {

          this.cargandoInventario = false;

          this.mensajeError =
            error?.error?.message ||
            error?.error ||
            'No se pudo cargar el inventario de la sucursal.';
        }
      });
  }

  get inventarioPaginado(): InventarioAdminDTO[] {

    const inicio =
      (this.paginaActual - 1) * this.registrosPorPagina;

    const fin =
      inicio + this.registrosPorPagina;

    return this.inventario.slice(inicio, fin);
  }

  get totalPaginas(): number {

    return Math.ceil(
      this.inventario.length / this.registrosPorPagina
    );
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
      this.mensajeError =
        'Debe seleccionar un producto.';
      return;
    }

    if (this.cantidadAjuste === 0) {
      this.mensajeError =
        'La cantidad del ajuste no puede ser cero.';
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
      this.mensajeError =
        'Debe ingresar un motivo para el ajuste.';
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
        }
      });
  }

  limpiarFormulario(): void {

    this.productoSeleccionadoId = '';
    this.cantidadAjuste = 0;
    this.motivo = '';
  }

  volverAlPanel(): void {

    this.router.navigate([
      '/super-admin/empresas',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'inventario',
      'panel'
    ]);
  }
}
