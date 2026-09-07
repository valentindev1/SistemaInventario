import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

import { InventarioService } from '../../../../../../core/services/inventario/inventario.service';
import { ProductoService } from '../../../../../../core/services/producto/producto/producto.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';

import {
  IngresoInventarioDTO,
  IngresoInventarioItemDTO
} from '../../../../../../core/models/inventario/inventario.model';

interface ProductoInventarioOption {
  id: number;
  nombre: string;
  codigo: string;
  costoUnitario: number;
  precioVenta: number;
  categoriaId: number;
  categoriaNombre: string;
  categoriaTipoGanancia: 'PORCENTAJE' | 'DINERO' | null;
  categoriaValorGanancia: number | null;
  tipoGananciaProducto: 'PORCENTAJE' | 'DINERO' | null;
  valorGananciaProducto: number | null;
  categoriaPorcentajeGanancia: number | null;
}

@Component({
  selector: 'app-ingresar-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './ingresar-inventario.component.html',
  styleUrl: './ingresar-inventario.component.css'
})
export class IngresarInventarioComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  productos: ProductoInventarioOption[] = [];

  motivo = '';

  productoSeleccionadoId: number | null = null;
  busquedaProducto = '';
  productoSelectorAbierto = false;
  cantidad: number | null = 1;
  costoUnitario: number | null = 0;
  costoUnitarioTexto = '';
  precioVenta = 0;

  modoUtilidad: 'PORCENTAJE' | 'DINERO' = 'PORCENTAJE';
  valorUtilidad: number | null = 0;
  reglaCategoriaActiva = false;
  reglaArticuloActiva = false;
  asignarReglaManual = false;

  items: IngresoInventarioItemDTO[] = [];

  cargandoProductos = false;
  guardando = false;

  private camposNumericosEnfocados = new Set<string>();

  mensajeExito = '';
  mensajeError = '';

  indiceEditando: number | null = null;

  itemEditando: IngresoInventarioItemDTO = {
    productoId: 0,
    cantidad: 1,
    costoUnitario: 0,
    precioVenta: 0,
    modoUtilidad: 'PORCENTAJE',
    valorUtilidad: 0,
    reglaUtilidadModificada: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventarioService: InventarioService,
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
      this.mensajeError = 'No se pudo identificar la empresa o la sucursal.';
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
    const rol = this.authService.obtenerRol();
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
    return this.authService.obtenerRol() === 'SUPER_ADMIN';
  }

  esAdmin(): boolean {
    return this.authService.obtenerRol() === 'ADMIN';
  }

  rutaDetalleSucursal(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        'detalle',
        this.sucursalId
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      'detalle',
      this.sucursalId
    ];
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

  rutaConfigurarPorcentajes(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'inventario',
        'configurar-porcentajes'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'inventario',
      'configurar-porcentajes'
    ];
  }

  cargarProductos(): void {
    this.cargandoProductos = true;
    this.mensajeError = '';

    this.productoService.listarPorEmpresa(this.empresaId).subscribe({
      next: (data) => {
        this.productos = (data || []).map(producto => ({
          id: producto.id,
          nombre: producto.nombre,
          codigo: producto.codigo,
          costoUnitario: Number(producto.costoUnitario ?? 0),
          precioVenta: Number(producto.precioVenta ?? 0),
          categoriaId: producto.categoriaId,
          categoriaNombre: producto.categoriaNombre,
          categoriaTipoGanancia: producto.categoriaTipoGanancia ?? null,
          categoriaValorGanancia: producto.categoriaValorGanancia ?? producto.categoriaPorcentajeGanancia ?? null,
          tipoGananciaProducto: producto.tipoGananciaProducto ?? null,
          valorGananciaProducto: producto.valorGananciaProducto ?? null,
          categoriaPorcentajeGanancia: producto.categoriaPorcentajeGanancia ?? null
        }));

        this.cargandoProductos = false;
      },
      error: (error) => {
        this.cargandoProductos = false;
        this.mensajeError =
          error?.error?.message ||
          error?.error ||
          'No se pudieron cargar los productos de la empresa.';

        console.error(error);
      }
    });
  }

  onProductoSeleccionado(): void {
    this.camposNumericosEnfocados.clear();

    if (!this.productoSeleccionadoId) {
      this.costoUnitario = 0;
      this.costoUnitarioTexto = '';
      this.precioVenta = 0;
      this.asignarReglaManual = false;
      return;
    }

    const producto = this.productos.find(
      item => item.id === Number(this.productoSeleccionadoId)
    );

    if (!producto) {
      this.costoUnitario = 0;
      this.costoUnitarioTexto = '';
      this.precioVenta = 0;
      this.asignarReglaManual = false;
      return;
    }

    this.costoUnitario = producto.costoUnitario;
    this.costoUnitarioTexto = this.formatearNumero(producto.costoUnitario);

    this.reglaArticuloActiva = producto.tipoGananciaProducto !== null
      && producto.valorGananciaProducto !== null;
    this.reglaCategoriaActiva = !this.reglaArticuloActiva
      && producto.categoriaTipoGanancia !== null
      && producto.categoriaValorGanancia !== null;
    this.asignarReglaManual = this.reglaArticuloActiva;

    if (this.reglaArticuloActiva || this.reglaCategoriaActiva) {
      this.modoUtilidad = this.reglaArticuloActiva
        ? producto.tipoGananciaProducto ?? 'PORCENTAJE'
        : producto.categoriaTipoGanancia ?? 'PORCENTAJE';
      this.valorUtilidad = this.reglaArticuloActiva
        ? producto.valorGananciaProducto ?? 0
        : producto.categoriaValorGanancia ?? 0;
    } else {
      // Si no hay una regla preconfigurada, conservamos como referencia
      // el porcentaje implícito del precio vigente del producto.
      this.modoUtilidad = 'PORCENTAJE';
      const costo = producto.costoUnitario;
      this.valorUtilidad = costo > 0
        ? Math.max((producto.precioVenta - costo) / costo * 100, 0)
        : 0;
    }

    this.recalcularPrecioVenta();
  }

  ponerEnCeroAlEnfocar(
    campo: 'cantidad' | 'costoUnitario' | 'valorUtilidad' | 'precioVenta',
    evento: FocusEvent
  ): void {
    const input = evento.target as HTMLInputElement;

    if (!this.camposNumericosEnfocados.has(campo)) {
      this.camposNumericosEnfocados.add(campo);

      if (campo === 'cantidad') {
        this.cantidad = null;
      } else if (campo === 'costoUnitario') {
        this.costoUnitario = null;
        this.costoUnitarioTexto = '';
        this.recalcularPrecioVenta();
      } else if (campo === 'valorUtilidad') {
        this.valorUtilidad = null;
        this.recalcularPrecioVenta();
      }
    }

    input.select();
  }

  actualizarCostoUnitario(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const digitos = input.value.replace(/\D/g, '');

    if (!digitos) {
      this.costoUnitario = null;
      this.costoUnitarioTexto = '';
      input.value = '';
      this.recalcularPrecioVenta();
      return;
    }

    this.costoUnitario = Number(digitos);
    this.costoUnitarioTexto = this.formatearNumero(this.costoUnitario);
    input.value = this.costoUnitarioTexto;
    this.recalcularPrecioVenta();
  }

  recalcularPrecioVenta(): void {
    const costo = Math.max(Number(this.costoUnitario) || 0, 0);
    const utilidad = Math.max(Number(this.valorUtilidad) || 0, 0);
    const precio = this.modoUtilidad === 'PORCENTAJE'
      ? costo + (costo * utilidad / 100)
      : costo + utilidad;

    this.precioVenta = Number(precio.toFixed(2));
  }

  cambioManualDeUtilidad(): void {
    this.recalcularPrecioVenta();
  }

  cambiarAsignacionReglaManual(asignar: boolean): void {
    if (!asignar && this.reglaArticuloActiva) {
      this.asignarReglaManual = true;
      return;
    }

    this.asignarReglaManual = asignar;

    if (!asignar) {
      const producto = this.productoSeleccionado;

      if (producto && this.reglaCategoriaActiva) {
        this.modoUtilidad = producto.categoriaTipoGanancia ?? 'PORCENTAJE';
        this.valorUtilidad = producto.categoriaValorGanancia ?? 0;
      } else if (producto) {
        this.modoUtilidad = 'PORCENTAJE';
        const costo = producto.costoUnitario;
        this.valorUtilidad = costo > 0
          ? Math.max((producto.precioVenta - costo) / costo * 100, 0)
          : 0;
      }
    }

    this.recalcularPrecioVenta();
  }

  get reglaUtilidadActiva(): boolean {
    return this.reglaArticuloActiva || this.reglaCategoriaActiva;
  }

  cambiarModoUtilidad(modo: 'PORCENTAJE' | 'DINERO'): void {
    if (!this.asignarReglaManual || modo === this.modoUtilidad) {
      return;
    }

    const utilidadActual = this.obtenerUtilidadUnitario();
    const porcentajeActual = this.obtenerPorcentajeUtilidad();

    this.modoUtilidad = modo;
    this.valorUtilidad = modo === 'PORCENTAJE' ? porcentajeActual : utilidadActual;
    this.recalcularPrecioVenta();
  }

  utilidadModificadaEnEsteIngreso(): boolean {
    return this.asignarReglaManual;
  }

  obtenerUtilidadUnitario(): number {
    return Math.max(Number(this.precioVenta) - Number(this.costoUnitario), 0);
  }

  obtenerPorcentajeUtilidad(): number {
    const costo = Number(this.costoUnitario) || 0;

    if (costo <= 0) {
      return 0;
    }

    return this.obtenerUtilidadUnitario() / costo * 100;
  }

  obtenerBeneficioProyectado(): number {
    return this.obtenerUtilidadUnitario() * (Number(this.cantidad) || 0);
  }

  get productoSeleccionado(): ProductoInventarioOption | null {
    return this.productos.find(
      producto => producto.id === Number(this.productoSeleccionadoId)
    ) ?? null;
  }

  get productosFiltrados(): ProductoInventarioOption[] {
    const termino = this.normalizarTexto(this.busquedaProducto);

    if (!termino) {
      return this.productos;
    }

    return this.productos.filter(producto =>
      this.normalizarTexto(`${producto.codigo} ${producto.nombre}`).includes(termino)
    );
  }

  toggleProductoSelector(): void {
    this.productoSelectorAbierto = !this.productoSelectorAbierto;

    if (!this.productoSelectorAbierto) {
      this.busquedaProducto = '';
    }
  }

  seleccionarProducto(producto: ProductoInventarioOption): void {
    this.productoSeleccionadoId = producto.id;
    this.onProductoSeleccionado();
    this.productoSelectorAbierto = false;
    this.busquedaProducto = '';
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

  private normalizarTexto(valor: string): string {
    return valor
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  agregarItem(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.productoSeleccionadoId) {
      this.mensajeError = 'Debe seleccionar un producto.';
      return;
    }

    if (Number(this.cantidad) <= 0) {
      this.mensajeError = 'La cantidad debe ser mayor a cero.';
      return;
    }

    if (Number(this.costoUnitario) < 0) {
      this.mensajeError = 'El costo unitario no puede ser negativo.';
      return;
    }

    if (Number(this.precioVenta) < 0) {
      this.mensajeError = 'El precio de venta no puede ser negativo.';
      return;
    }

    this.recalcularPrecioVenta();

    const productoId = Number(this.productoSeleccionadoId);

    const yaExiste = this.items.some(item => item.productoId === productoId);

    if (yaExiste) {
      this.mensajeError = 'Este producto ya fue agregado al ingreso.';
      return;
    }

    this.items.push({
      productoId,
      cantidad: Number(this.cantidad),
      costoUnitario: Number(this.costoUnitario),
      precioVenta: Number(this.precioVenta),
      modoUtilidad: this.modoUtilidad,
      valorUtilidad: Number(this.valorUtilidad) || 0,
      reglaUtilidadModificada: this.utilidadModificadaEnEsteIngreso()
    });

    this.limpiarFormularioProducto();
  }

  editarItem(index: number): void {
    this.indiceEditando = index;

    this.itemEditando = {
      productoId: this.items[index].productoId,
      cantidad: this.items[index].cantidad,
      costoUnitario: this.items[index].costoUnitario,
      precioVenta: this.items[index].precioVenta,
      modoUtilidad: this.items[index].modoUtilidad,
      valorUtilidad: this.items[index].valorUtilidad,
      reglaUtilidadModificada: this.items[index].reglaUtilidadModificada
    };

    this.mensajeError = '';
    this.mensajeExito = '';
  }

  guardarEdicion(): void {
    if (this.indiceEditando === null) {
      return;
    }

    if (Number(this.itemEditando.cantidad) <= 0) {
      this.mensajeError = 'La cantidad debe ser mayor a cero.';
      return;
    }

    if (Number(this.itemEditando.costoUnitario) < 0) {
      this.mensajeError = 'El costo unitario no puede ser negativo.';
      return;
    }

    if (Number(this.itemEditando.precioVenta) < 0) {
      this.mensajeError = 'El precio de venta no puede ser negativo.';
      return;
    }

    this.recalcularPrecioEdicion();

    this.items[this.indiceEditando] = {
      productoId: this.itemEditando.productoId,
      cantidad: Number(this.itemEditando.cantidad),
      costoUnitario: Number(this.itemEditando.costoUnitario),
      precioVenta: Number(this.itemEditando.precioVenta),
      modoUtilidad: this.itemEditando.modoUtilidad,
      valorUtilidad: Number(this.itemEditando.valorUtilidad) || 0,
      reglaUtilidadModificada: this.itemEditando.reglaUtilidadModificada
    };

    this.cancelarEdicion();
  }

  cancelarEdicion(): void {
    this.indiceEditando = null;

    this.itemEditando = {
      productoId: 0,
      cantidad: 1,
      costoUnitario: 0,
      precioVenta: 0,
      modoUtilidad: 'PORCENTAJE',
      valorUtilidad: 0,
      reglaUtilidadModificada: false
    };

    this.mensajeError = '';
  }

  eliminarItem(index: number): void {
    this.items.splice(index, 1);

    if (this.indiceEditando === index) {
      this.cancelarEdicion();
    }

    this.mensajeError = '';
    this.mensajeExito = '';
  }

  obtenerProductoNombre(productoId: number): string {
    const producto = this.productos.find(item => item.id === productoId);

    if (!producto) {
      return 'Producto no encontrado';
    }

    return `${producto.codigo} - ${producto.nombre}`;
  }

  calcularTotalCosto(): number {
    return this.items.reduce(
      (total, item) => total + item.costoUnitario * item.cantidad,
      0
    );
  }

  calcularTotalVenta(): number {
    return this.items.reduce(
      (total, item) => total + item.precioVenta * item.cantidad,
      0
    );
  }

  guardarIngreso(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (this.items.length === 0) {
      this.mensajeError = 'Debe agregar al menos un producto al ingreso.';
      return;
    }

    const dto: IngresoInventarioDTO = {
      sucursalId: this.sucursalId,
      motivo: this.motivo?.trim() || undefined,
      items: this.items
    };

    this.guardando = true;

    this.inventarioService.ingresarMercancia(dto).subscribe({
      next: () => {
        this.guardando = false;
        const cantidadProductos = this.items.length;
        const cantidadUnidades = this.items.reduce(
          (total, item) => total + item.cantidad,
          0
        );
        const totalCosto = this.calcularTotalCosto();
        const totalVenta = this.calcularTotalVenta();

        this.items = [];
        this.motivo = '';
        this.limpiarFormularioProducto();

        Swal.fire({
          icon: 'success',
          title: '¡Ingreso registrado!',
          html: `
            <div class="inventory-success-content">
              <p>La mercancía se agregó correctamente al inventario.</p>
              <div class="inventory-success-summary">
                <div>
                  <span>Referencias</span>
                  <strong>${cantidadProductos}</strong>
                </div>
                <div>
                  <span>Unidades</span>
                  <strong>${cantidadUnidades}</strong>
                </div>
              </div>
              <p class="inventory-success-totals">
                Costo registrado: <strong>${this.formatearMoneda(totalCosto)}</strong><br>
                Venta proyectada: <strong>${this.formatearMoneda(totalVenta)}</strong>
              </p>
            </div>
          `,
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#2563eb',
          allowOutsideClick: false
        }).then(() => {
          this.volverADetalleSucursal();
        });
      },
      error: (error) => {
        this.guardando = false;
        this.mensajeError =
          error?.error?.message ||
          error?.error ||
          'No se pudo ingresar la mercancía.';

        console.error(error);
      }
    });
  }

  recalcularPrecioEdicion(): void {
    const costo = Math.max(Number(this.itemEditando.costoUnitario) || 0, 0);
    const utilidad = Math.max(Number(this.itemEditando.valorUtilidad) || 0, 0);
    const precio = this.itemEditando.modoUtilidad === 'PORCENTAJE'
      ? costo + costo * utilidad / 100
      : costo + utilidad;

    this.itemEditando.precioVenta = Number(precio.toFixed(2));
  }

  private formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(valor);
  }

  private formatearNumero(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
      return '';
    }

    return new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: 0
    }).format(Number(valor));
  }

  volverADetalleSucursal(): void {
    this.router.navigate(this.rutaDetalleSucursal());
  }

  volverPanelInventario(): void {
    this.router.navigate(this.rutaPanelInventario());
  }

  private limpiarFormularioProducto(): void {
    this.camposNumericosEnfocados.clear();
    this.productoSeleccionadoId = null;
    this.busquedaProducto = '';
    this.productoSelectorAbierto = false;
    this.cantidad = 1;
    this.costoUnitario = 0;
    this.costoUnitarioTexto = '';
    this.precioVenta = 0;
    this.reglaCategoriaActiva = false;
    this.reglaArticuloActiva = false;
    this.modoUtilidad = 'PORCENTAJE';
    this.valorUtilidad = 0;
    this.asignarReglaManual = false;
  }
}
