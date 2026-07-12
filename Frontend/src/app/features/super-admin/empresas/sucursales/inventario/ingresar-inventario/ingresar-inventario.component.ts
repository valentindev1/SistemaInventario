import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

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
  cantidad = 1;
  costoUnitario = 0;
  precioVenta = 0;

  items: IngresoInventarioItemDTO[] = [];

  cargandoProductos = false;
  guardando = false;

  mensajeExito = '';
  mensajeError = '';

  indiceEditando: number | null = null;

  itemEditando: IngresoInventarioItemDTO = {
    productoId: 0,
    cantidad: 1,
    costoUnitario: 0,
    precioVenta: 0
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
          precioVenta: Number(producto.precioVenta ?? 0)
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
    if (!this.productoSeleccionadoId) {
      this.costoUnitario = 0;
      this.precioVenta = 0;
      return;
    }

    const producto = this.productos.find(
      item => item.id === Number(this.productoSeleccionadoId)
    );

    if (!producto) {
      this.costoUnitario = 0;
      this.precioVenta = 0;
      return;
    }

    this.costoUnitario = producto.costoUnitario;
    this.precioVenta = producto.precioVenta;
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
      precioVenta: Number(this.precioVenta)
    });

    this.limpiarFormularioProducto();
  }

  editarItem(index: number): void {
    this.indiceEditando = index;

    this.itemEditando = {
      productoId: this.items[index].productoId,
      cantidad: this.items[index].cantidad,
      costoUnitario: this.items[index].costoUnitario,
      precioVenta: this.items[index].precioVenta
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

    this.items[this.indiceEditando] = {
      productoId: this.itemEditando.productoId,
      cantidad: Number(this.itemEditando.cantidad),
      costoUnitario: Number(this.itemEditando.costoUnitario),
      precioVenta: Number(this.itemEditando.precioVenta)
    };

    this.cancelarEdicion();
  }

  cancelarEdicion(): void {
    this.indiceEditando = null;

    this.itemEditando = {
      productoId: 0,
      cantidad: 1,
      costoUnitario: 0,
      precioVenta: 0
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
        this.mensajeExito = 'Mercancía ingresada correctamente.';

        this.items = [];
        this.motivo = '';
        this.limpiarFormularioProducto();

        setTimeout(() => {
          this.volverADetalleSucursal();
        }, 800);
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

  volverADetalleSucursal(): void {
    this.router.navigate(this.rutaDetalleSucursal());
  }

  volverPanelInventario(): void {
    this.router.navigate(this.rutaPanelInventario());
  }

  private limpiarFormularioProducto(): void {
    this.productoSeleccionadoId = null;
    this.cantidad = 1;
    this.costoUnitario = 0;
    this.precioVenta = 0;
  }
}
