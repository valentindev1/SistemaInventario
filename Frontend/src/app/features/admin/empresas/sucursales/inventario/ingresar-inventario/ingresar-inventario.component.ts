import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { InventarioService } from '../../../../../../core/services/inventario/inventario.service';
import { ProductoService } from '../../../../../../core/services/producto/producto/producto.service';

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
  imports: [CommonModule, FormsModule, RouterModule],
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
  cantidad = 1;
  costoUnitario = 0;
  precioVenta = 0;

  items: IngresoInventarioItemDTO[] = [];

  cargandoProductos = false;
  guardando = false;

  private camposNumericosEnfocados = new Set<string>();

  mensajeExito = '';
  mensajeError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventarioService: InventarioService,
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    this.empresaId = Number(this.route.snapshot.paramMap.get('empresaId'));
    this.sucursalId = Number(this.route.snapshot.paramMap.get('sucursalId'));

    if (!this.empresaId || !this.sucursalId) {
      this.mensajeError = 'No se pudo identificar la empresa o la sucursal.';
      return;
    }

    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargandoProductos = true;
    this.mensajeError = '';

    this.productoService.listarPorEmpresa(this.empresaId)
      .subscribe({
        next: (data) => {
          this.productos = data.map(producto => ({
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
        }
      });
  }





  indiceEditando: number | null = null;

  itemEditando: IngresoInventarioItemDTO = {
    productoId: 0,
    cantidad: 1,
    costoUnitario: 0,
    precioVenta: 0
  };



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

    if (this.itemEditando.cantidad <= 0) {
      this.mensajeError = 'La cantidad debe ser mayor a cero.';
      return;
    }

    if (this.itemEditando.costoUnitario < 0) {
      this.mensajeError = 'El costo unitario no puede ser negativo.';
      return;
    }

    if (this.itemEditando.precioVenta < 0) {
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

















  onProductoSeleccionado(): void {
    this.camposNumericosEnfocados.clear();

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

  ponerEnCeroAlEnfocar(
    campo: 'cantidad' | 'costoUnitario' | 'precioVenta',
    evento: FocusEvent
  ): void {
    const input = evento.target as HTMLInputElement;

    if (!this.camposNumericosEnfocados.has(campo)) {
      this.camposNumericosEnfocados.add(campo);

      if (campo === 'cantidad') {
        this.cantidad = 0;
      } else if (campo === 'costoUnitario') {
        this.costoUnitario = 0;
      } else {
        this.precioVenta = 0;
      }
    }

    input.select();
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

    if (this.cantidad <= 0) {
      this.mensajeError = 'La cantidad debe ser mayor a cero.';
      return;
    }

    if (this.costoUnitario < 0) {
      this.mensajeError = 'El costo unitario no puede ser negativo.';
      return;
    }

    if (this.precioVenta < 0) {
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
      motivo: this.motivo,
      items: this.items
    };

    this.guardando = true;

    this.inventarioService.ingresarMercancia(dto)
      .subscribe({
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
        }
      });
  }

  volverADetalleSucursal(): void {
    this.router.navigate([
      '/super-admin/empresas',
      this.empresaId,
      'sucursales',
      'detalle',
      this.sucursalId
    ]);
  }

  private limpiarFormularioProducto(): void {
    this.camposNumericosEnfocados.clear();
    this.productoSeleccionadoId = null;
    this.busquedaProducto = '';
    this.productoSelectorAbierto = false;
    this.cantidad = 1;
    this.costoUnitario = 0;
    this.precioVenta = 0;
  }
}
