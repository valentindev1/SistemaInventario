import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

import { AuthService } from '../../../../../../core/services/auth/auth.service';
import { ProductoService } from '../../../../../../core/services/producto/producto/producto.service';
import { ProductoAdminObtenerDTO } from '../../../../../../core/models/producto/producto.model';

@Component({
  selector: 'app-ajustar-precio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './ajustar-precio.component.html',
  styleUrl: './ajustar-precio.component.css'
})
export class AjustarPrecioComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  productos: ProductoAdminObtenerDTO[] = [];
  productoSeleccionadoId: number | null = null;
  busquedaProducto = '';
  productoSelectorAbierto = false;
  nuevoPrecio = 0;
  nuevoCosto = 0;
  modoAjuste: 'PORCENTAJE' | 'DINERO' = 'PORCENTAJE';
  valorAjuste: number | null = 0;
  actualizarCosto = false;

  cargandoProductos = false;
  guardando = false;

  mensajeExito = '';
  mensajeError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productoService: ProductoService,
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

  esSuperAdmin(): boolean {
    return this.authService.obtenerRol()?.replace('ROLE_', '') === 'SUPER_ADMIN';
  }

  get productoSeleccionado(): ProductoAdminObtenerDTO | null {
    return this.productos.find(
      producto => producto.id === Number(this.productoSeleccionadoId)
    ) ?? null;
  }

  get productosFiltrados(): ProductoAdminObtenerDTO[] {
    const termino = this.normalizarTexto(this.busquedaProducto);

    if (!termino) {
      return this.productos;
    }

    return this.productos.filter(producto =>
      this.normalizarTexto(`${producto.codigo} ${producto.nombre}`).includes(termino)
    );
  }

  cargarProductos(): void {
    this.cargandoProductos = true;
    this.mensajeError = '';

    this.productoService.listarPorEmpresa(this.empresaId).subscribe({
      next: productos => {
        this.productos = productos || [];
        this.cargandoProductos = false;
      },
      error: error => {
        this.cargandoProductos = false;
        this.mensajeError =
          error?.error?.message ||
          error?.error ||
          'No se pudieron cargar los productos de la empresa.';
      }
    });
  }

  toggleProductoSelector(): void {
    this.productoSelectorAbierto = !this.productoSelectorAbierto;

    if (!this.productoSelectorAbierto) {
      this.busquedaProducto = '';
    }
  }

  seleccionarProducto(producto: ProductoAdminObtenerDTO): void {
    this.productoSeleccionadoId = producto.id;
    this.nuevoCosto = Number(producto.costoUnitario ?? 0);
    this.modoAjuste = producto.tipoGananciaProducto
      ?? producto.categoriaTipoGanancia
      ?? 'PORCENTAJE';
    this.valorAjuste = producto.tipoGananciaProducto !== null
      && producto.tipoGananciaProducto !== undefined
      ? Number(producto.valorGananciaProducto ?? 0)
      : producto.categoriaTipoGanancia !== null
        && producto.categoriaTipoGanancia !== undefined
        ? Number(producto.categoriaValorGanancia ?? 0)
        : this.obtenerPorcentajeDesdePrecio(
            Number(producto.precioVenta ?? 0),
            Number(producto.costoUnitario ?? 0)
          );
    this.actualizarCosto = false;
    this.recalcularNuevoPrecio();
    this.productoSelectorAbierto = false;
    this.busquedaProducto = '';
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  manejarTeclaSelector(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.productoSelectorAbierto = false;
      this.busquedaProducto = '';
      return;
    }

    if (
      event.key === 'Enter' &&
      this.busquedaProducto.trim() &&
      this.productosFiltrados.length === 1
    ) {
      event.preventDefault();
      this.seleccionarProducto(this.productosFiltrados[0]);
    }
  }

  @HostListener('document:click')
  cerrarSelectorAlHacerClickFuera(): void {
    if (this.productoSelectorAbierto) {
      this.productoSelectorAbierto = false;
      this.busquedaProducto = '';
    }
  }

  actualizarPrecio(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.productoSeleccionadoId) {
      this.mensajeError = 'Selecciona una referencia antes de actualizar el precio.';
      return;
    }

    this.recalcularNuevoPrecio();

    const precio = Number(this.nuevoPrecio);
    const costo = Number(this.nuevoCosto);
    const productoActual = this.productoSeleccionado;
    const porcentajeReglaPropia = this.porcentajeReglaPropia;

    if (!Number.isFinite(precio) || precio < 0) {
      this.mensajeError = 'El precio calculado no es válido.';
      return;
    }

    if (!Number.isFinite(Number(this.valorAjuste)) || Number(this.valorAjuste) < 0) {
      this.mensajeError = 'Ingresa un ajuste de utilidad válido.';
      return;
    }

    if (!Number.isFinite(porcentajeReglaPropia) || porcentajeReglaPropia < 0) {
      this.mensajeError = 'No se pudo calcular el porcentaje equivalente.';
      return;
    }

    if (porcentajeReglaPropia > 1000) {
      this.mensajeError = 'El porcentaje equivalente no puede superar 1000%.';
      return;
    }

    if (this.actualizarCosto && (!Number.isFinite(costo) || costo < 0)) {
      this.mensajeError = 'Ingresa un costo unitario válido.';
      return;
    }

    const costoActual = Number(productoActual?.costoUnitario ?? 0);
    const precioActual = Number(productoActual?.precioVenta ?? 0);
    const cambiaPrecio = precio !== precioActual;
    const cambiaCosto = this.actualizarCosto && costo !== costoActual;
    const reglaActualEsPorcentaje = productoActual?.tipoGananciaProducto === 'PORCENTAJE';
    const valorReglaActual = Number(productoActual?.valorGananciaProducto ?? 0);
    const cambiaRegla = !reglaActualEsPorcentaje
      || Math.abs(valorReglaActual - porcentajeReglaPropia) > 0.005;

    if (!cambiaPrecio && !cambiaCosto && !cambiaRegla) {
      this.mensajeError = 'No hay cambios para guardar.';
      return;
    }

    this.guardando = true;

    this.productoService.actualizarPrecioVenta(
      this.productoSeleccionadoId,
      {
        precioVenta: precio,
        tipoGanancia: 'PORCENTAJE',
        valorGanancia: porcentajeReglaPropia,
        ...(this.actualizarCosto ? { costoUnitario: costo } : {})
      }
    ).subscribe({
      next: productoActualizado => {
        const indice = this.productos.findIndex(
          producto => producto.id === productoActualizado.id
        );

        if (indice >= 0) {
          this.productos[indice] = productoActualizado;
        }

        this.nuevoPrecio = Number(productoActualizado.precioVenta);
        this.nuevoCosto = Number(productoActualizado.costoUnitario);
        this.modoAjuste = 'PORCENTAJE';
        this.valorAjuste = Number(productoActualizado.valorGananciaProducto ?? porcentajeReglaPropia);
        this.actualizarCosto = false;
        this.guardando = false;
        this.mensajeExito = '';

        Swal.fire({
          icon: 'success',
          title: '¡Precio actualizado!',
          html: `
            <p>La referencia <strong>${productoActualizado.codigo}</strong> fue actualizada correctamente.</p>
            <div class="swal-price-summary">
              <strong>Precio de venta: ${this.formatearMoneda(this.nuevoPrecio)}</strong>
              <span>Regla propia: ${this.porcentajeReglaPropia.toFixed(2)}% sobre el costo.</span>
            </div>
            <small>El cambio se reflejará en todas las sucursales de la empresa.</small>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#2563eb',
          allowOutsideClick: false
        });
      },
      error: error => {
        this.guardando = false;
        const mensaje = error?.error?.message ||
          error?.error ||
          'No se pudo actualizar el precio del producto.';

        this.mensajeError = '';
        Swal.fire({
          icon: 'error',
          title: 'No se pudo actualizar',
          text: mensaje,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#2563eb'
        });
      }
    });
  }

  volverAlPanel(): void {
    if (this.esSuperAdmin()) {
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

  get costoParaCalculo(): number {
    return this.actualizarCosto
      ? Math.max(Number(this.nuevoCosto) || 0, 0)
      : Number(this.productoSeleccionado?.costoUnitario ?? 0);
  }

  get utilidadAjuste(): number {
    const valor = this.valorAjusteRedondeado;

    return this.modoAjuste === 'PORCENTAJE'
      ? this.costoParaCalculo * valor / 100
      : valor;
  }

  get valorAjusteRedondeado(): number {
    return Number((Math.max(Number(this.valorAjuste) || 0, 0)).toFixed(2));
  }

  get porcentajeReglaPropia(): number {
    if (this.costoParaCalculo <= 0) {
      return 0;
    }

    return Number((this.utilidadAjuste / this.costoParaCalculo * 100).toFixed(2));
  }

  recalcularNuevoPrecio(): void {
    this.nuevoPrecio = Number((this.costoParaCalculo + this.utilidadAjuste).toFixed(2));
  }

  cambiarModoAjuste(modo: 'PORCENTAJE' | 'DINERO'): void {
    if (modo === this.modoAjuste) {
      return;
    }

    const utilidadActual = this.utilidadAjuste;
    const porcentajeActual = this.porcentajeReglaPropia;

    this.modoAjuste = modo;
    this.valorAjuste = modo === 'PORCENTAJE' ? porcentajeActual : utilidadActual;
    this.recalcularNuevoPrecio();
  }

  get utilidadEnDinero(): number {
    return this.utilidadAjuste;
  }

  get utilidadEnPorcentaje(): number {
    return this.porcentajeReglaPropia;
  }

  private obtenerPorcentajeDesdePrecio(precio: number, costo: number): number {
    if (costo <= 0) {
      return 0;
    }

    return Math.max((precio - costo) / costo * 100, 0);
  }

  private normalizarTexto(valor: string): string {
    return valor
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Number(valor) || 0);
  }
}
