import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { EmpleadoInventarioService } from '../../../../core/services/empleado/empleado-inventario.service';
import { ClienteService } from '../../../../core/services/cliente/cliente.service';
import { EmpleadoVentaService } from '../../../../core/services/empleado/empleado-venta.service';

import { InventarioEmpleadoDTO } from '../../../../core/models/inventario/inventario.model';

import {
  CrearVentaDTO,
  VentaItemDTO
} from '../../../../core/models/venta/venta.model';

import { FacturaVentaEmpleadoDTO } from '../../../../core/models/venta/empleado/venta-empleado.model';

import { ClienteObtenerDTO } from '../../../../core/models/cliente/cliente.model';

interface ItemVentaTemporal {
  productoId: number;
  productoCodigo: string;
  productoNombre: string;
  stockActual: number;
  precioVenta: number;
  cantidad: number;
  subtotal: number;
}

@Component({
  selector: 'app-ventas-empleado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './ventas-empleado.component.html',
  styleUrl: './ventas-empleado.component.css'
})
export class VentasEmpleadoComponent implements OnInit {

  sucursalId!: number;
  empresaId!: number;

  inventario: InventarioEmpleadoDTO[] = [];

  productoSeleccionadoId = '';
  cantidadSeleccionada = 1;
  observacion = '';

  descuento = 0;
  porcentajesDescuento = [5, 10, 15, 20, 25, 30];
  porcentajeDescuentoSeleccionado: number | null = null;
  descuentoManualActivo = false;
  porcentajeDescuentoManual = 0;

  itemsVenta: ItemVentaTemporal[] = [];

  numeroDocumentoCliente = '';
  clienteSeleccionado: ClienteObtenerDTO | null = null;

  clientesDisponibles: ClienteObtenerDTO[] = [];
  clientesSugeridos: ClienteObtenerDTO[] = [];
  mostrarSugerenciasClientes = false;

  cargandoInventario = false;
  buscandoCliente = false;
  guardando = false;

  mensajeError = '';
  mensajeExito = '';

  ventaGenerada: FacturaVentaEmpleadoDTO | null = null;

  ventaHabilitada = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private empleadoInventarioService: EmpleadoInventarioService,
    private empleadoVentaService: EmpleadoVentaService,
    private clienteService: ClienteService
  ) {}

  ngOnInit(): void {

    const accesoValido = this.validarAccesoEmpleado();

    if (!accesoValido) {
      return;
    }

    const documentoQuery = this.route.snapshot.queryParamMap.get('documento');

    if (documentoQuery) {
      this.numeroDocumentoCliente = documentoQuery;
    }

    this.cargarInventario();
    this.cargarClientesDisponibles();
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
        'ventas',
        'generar'
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
        'ventas',
        'generar'
      ]);

      return false;
    }

    if (sucursalIdRuta !== sucursalIdUsuario) {
      this.router.navigate([
        '/empleado',
        'sucursal',
        sucursalIdUsuario,
        'ventas',
        'generar'
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

  get clienteVentaSeleccionado(): boolean {
    return this.clienteSeleccionado !== null &&
      this.clienteSeleccionado.id !== null &&
      this.clienteSeleccionado.id !== undefined;
  }

  cargarInventario(): void {

    this.cargandoInventario = true;
    this.mensajeError = '';

    this.empleadoInventarioService.listarInventarioPorSucursal(this.sucursalId)
      .subscribe({
        next: (data) => {
          this.inventario = (data || [])
            .filter(item => item.stockActual > 0) as InventarioEmpleadoDTO[];

          this.cargandoInventario = false;
        },
        error: (error) => {
          this.cargandoInventario = false;

          this.mensajeError = this.obtenerMensajeError(
            error,
            'No se pudo cargar el inventario de la sucursal.'
          );

          console.error(error);
        }
      });
  }

  cargarClientesDisponibles(): void {

    this.clienteService.listar().subscribe({
      next: (clientes) => {
        this.clientesDisponibles = clientes || [];

        if (this.numeroDocumentoCliente.trim().length >= 3) {
          this.onDocumentoClienteChange();
        }
      },
      error: (error) => {
        console.error(error);

        this.mensajeError = this.obtenerMensajeError(
          error,
          'No se pudieron cargar los clientes para búsqueda.'
        );
      }
    });
  }

  onDocumentoClienteChange(): void {

    this.mensajeError = '';
    this.mensajeExito = '';
    this.ventaGenerada = null;

    const texto = this.numeroDocumentoCliente.trim();

    if (
      this.clienteSeleccionado &&
      texto === this.clienteSeleccionado.numeroDocumento
    ) {
      return;
    }

    if (this.clienteSeleccionado) {
      this.clienteSeleccionado = null;
      this.ventaHabilitada = false;
      this.itemsVenta = [];
      this.observacion = '';
      this.limpiarDescuento();
      this.limpiarSeleccionProducto();
    }

    if (texto.length < 3) {
      this.clientesSugeridos = [];
      this.mostrarSugerenciasClientes = false;
      return;
    }

    const textoNormalizado = texto.toLowerCase();

    this.clientesSugeridos = this.clientesDisponibles
      .filter(cliente =>
        cliente.numeroDocumento.toLowerCase().includes(textoNormalizado) ||
        cliente.nombre.toLowerCase().includes(textoNormalizado)
      )
      .slice(0, 8);

    this.mostrarSugerenciasClientes = this.clientesSugeridos.length > 0;
  }

  seleccionarClienteSugerido(cliente: ClienteObtenerDTO): void {

    this.clienteSeleccionado = cliente;
    this.numeroDocumentoCliente = cliente.numeroDocumento;

    this.ventaHabilitada = true;

    this.clientesSugeridos = [];
    this.mostrarSugerenciasClientes = false;

    this.mensajeError = '';
    this.mensajeExito = `Cliente seleccionado: ${cliente.nombre}`;

    this.ventaGenerada = null;
  }

  buscarClientePorDocumento(): void {

    this.mensajeError = '';
    this.mensajeExito = '';
    this.ventaGenerada = null;

    const documento = this.numeroDocumentoCliente.trim();

    if (!documento) {
      this.mensajeError = 'Debe ingresar el número de documento del cliente.';
      return;
    }

    const clienteLocal = this.clientesDisponibles.find(
      cliente => cliente.numeroDocumento === documento
    );

    if (clienteLocal) {
      this.seleccionarClienteSugerido(clienteLocal);
      return;
    }

    this.buscandoCliente = true;

    this.clienteService.obtenerPorDocumento(documento).subscribe({
      next: (cliente) => {

        this.clienteSeleccionado = cliente;
        this.numeroDocumentoCliente = cliente.numeroDocumento;

        this.ventaHabilitada = true;

        this.clientesSugeridos = [];
        this.mostrarSugerenciasClientes = false;

        this.buscandoCliente = false;
        this.mensajeExito = `Cliente seleccionado: ${cliente.nombre}`;
      },
      error: (error) => {

        this.buscandoCliente = false;
        this.clienteSeleccionado = null;
        this.ventaHabilitada = false;

        this.clientesSugeridos = [];
        this.mostrarSugerenciasClientes = false;

        const confirmar = confirm(
          'Cliente no encontrado. Debes crearlo antes de generar la venta. ¿Deseas crearlo ahora?'
        );

        if (confirmar) {
          this.irCrearClienteConDocumento(documento);
        } else {
          this.mensajeError = 'Cliente no encontrado. Debes seleccionar o crear un cliente para continuar.';
        }

        console.error(error);
      }
    });
  }

  limpiarClienteSeleccionado(): void {

    this.numeroDocumentoCliente = '';
    this.clienteSeleccionado = null;
    this.ventaHabilitada = false;

    this.clientesSugeridos = [];
    this.mostrarSugerenciasClientes = false;

    this.mensajeError = '';
    this.mensajeExito = '';
    this.ventaGenerada = null;

    this.itemsVenta = [];
    this.observacion = '';

    this.limpiarDescuento();
    this.limpiarSeleccionProducto();
  }

  irCrearCliente(): void {

    const documento = this.numeroDocumentoCliente.trim();

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'clientes',
      'panel'
    ], {
      queryParams: {
        accion: 'crear',
        documento: documento || null,
        retorno: 'venta'
      }
    });
  }

  private irCrearClienteConDocumento(documento: string): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'clientes',
      'panel'
    ], {
      queryParams: {
        accion: 'crear',
        documento,
        retorno: 'venta'
      }
    });
  }

  obtenerProductoSeleccionado(): InventarioEmpleadoDTO | undefined {

    if (!this.productoSeleccionadoId) {
      return undefined;
    }

    return this.inventario.find(
      item => item.productoId === Number(this.productoSeleccionadoId)
    );
  }

  agregarProducto(): void {

    this.mensajeError = '';
    this.mensajeExito = '';
    this.ventaGenerada = null;

    if (!this.ventaHabilitada || !this.clienteSeleccionado) {
      this.mensajeError = 'Debe seleccionar un cliente antes de agregar productos.';
      return;
    }

    const producto = this.obtenerProductoSeleccionado();

    if (!producto) {
      this.mensajeError = 'Debe seleccionar un producto.';
      return;
    }

    if (this.cantidadSeleccionada <= 0) {
      this.mensajeError = 'La cantidad debe ser mayor a cero.';
      return;
    }

    if (producto.precioVenta <= 0) {
      this.mensajeError = 'El producto seleccionado no tiene precio de venta definido.';
      return;
    }

    const itemExistente = this.itemsVenta.find(
      item => item.productoId === producto.productoId
    );

    const cantidadActualEnCarrito =
      itemExistente ? itemExistente.cantidad : 0;

    const nuevaCantidadTotal =
      cantidadActualEnCarrito + Number(this.cantidadSeleccionada);

    if (nuevaCantidadTotal > producto.stockActual) {
      this.mensajeError = `Stock insuficiente. Disponible: ${producto.stockActual}`;
      return;
    }

    if (itemExistente) {
      itemExistente.cantidad = nuevaCantidadTotal;
      itemExistente.subtotal =
        itemExistente.cantidad * itemExistente.precioVenta;
    } else {
      this.itemsVenta.push({
        productoId: producto.productoId,
        productoCodigo: producto.codigo,
        productoNombre: producto.nombre,
        stockActual: producto.stockActual,
        precioVenta: producto.precioVenta,
        cantidad: Number(this.cantidadSeleccionada),
        subtotal: Number(this.cantidadSeleccionada) * producto.precioVenta
      });
    }

    this.validarDescuentoActual();
    this.limpiarSeleccionProducto();
  }

  eliminarItem(index: number): void {

    this.itemsVenta.splice(index, 1);

    this.mensajeError = '';
    this.mensajeExito = '';
    this.ventaGenerada = null;

    this.validarDescuentoActual();
  }

  actualizarCantidad(index: number): void {

    const item = this.itemsVenta[index];

    if (item.cantidad <= 0) {
      item.cantidad = 1;
    }

    if (item.cantidad > item.stockActual) {
      item.cantidad = item.stockActual;
      this.mensajeError =
        `No puedes vender más de ${item.stockActual} unidades de ${item.productoNombre}.`;
    } else {
      this.mensajeError = '';
    }

    item.subtotal = item.cantidad * item.precioVenta;

    this.validarDescuentoActual();
  }

  calcularSubtotal(): number {

    return this.itemsVenta.reduce(
      (total, item) => total + item.subtotal,
      0
    );
  }

  calcularTotalConDescuento(): number {

    const subtotal = this.calcularSubtotal();
    const descuentoAplicado = Number(this.descuento) || 0;

    if (descuentoAplicado > subtotal) {
      return 0;
    }

    return subtotal - descuentoAplicado;
  }

  aplicarDescuentoPorcentaje(porcentaje: number): void {

    const subtotal = this.calcularSubtotal();

    if (subtotal <= 0) {
      this.mensajeError = 'Debe agregar productos antes de aplicar un descuento.';
      return;
    }

    this.descuento = Math.round(subtotal * porcentaje / 100);
    this.porcentajeDescuentoSeleccionado = porcentaje;
    this.descuentoManualActivo = false;
    this.mensajeError = '';
  }

  activarDescuentoManual(): void {

    this.descuentoManualActivo = true;
    this.porcentajeDescuentoSeleccionado = null;
    this.porcentajeDescuentoManual = 0;
    this.descuento = 0;
    this.mensajeError = '';
  }

  actualizarDescuentoManual(): void {

    const subtotal = this.calcularSubtotal();
    const porcentaje = Number(this.porcentajeDescuentoManual) || 0;

    this.porcentajeDescuentoSeleccionado = null;

    if (subtotal <= 0) {
      this.porcentajeDescuentoManual = 0;
      this.descuento = 0;
      this.mensajeError = 'Debe agregar productos antes de aplicar un descuento.';
      return;
    }

    if (porcentaje < 0) {
      this.porcentajeDescuentoManual = 0;
      this.descuento = 0;
      this.mensajeError = 'El porcentaje de descuento no puede ser negativo.';
      return;
    }

    if (porcentaje > 100) {
      this.porcentajeDescuentoManual = 100;
      this.mensajeError = 'El porcentaje de descuento no puede ser mayor al 100%.';
    } else {
      this.mensajeError = '';
    }

    this.descuento = Math.round(
      subtotal * this.porcentajeDescuentoManual / 100
    );
  }

  limpiarDescuento(): void {

    this.descuento = 0;
    this.porcentajeDescuentoSeleccionado = null;
    this.descuentoManualActivo = false;
    this.porcentajeDescuentoManual = 0;
    this.mensajeError = '';
  }

  private validarDescuentoActual(): void {

    const subtotal = this.calcularSubtotal();
    const descuentoAplicado = Number(this.descuento) || 0;

    if (descuentoAplicado > subtotal) {
      this.limpiarDescuento();
      this.mensajeError = 'El descuento fue reiniciado porque superaba el subtotal.';
      return;
    }

    if (this.porcentajeDescuentoSeleccionado !== null) {
      this.aplicarDescuentoPorcentaje(this.porcentajeDescuentoSeleccionado);
      return;
    }

    if (this.descuentoManualActivo) {
      this.actualizarDescuentoManual();
    }
  }

  generarVenta(): void {

    this.mensajeError = '';
    this.mensajeExito = '';
    this.ventaGenerada = null;

    if (!this.ventaHabilitada || !this.clienteSeleccionado) {
      this.mensajeError = 'Debe buscar y seleccionar un cliente antes de generar la venta.';
      return;
    }

    if (this.itemsVenta.length === 0) {
      this.mensajeError = 'Debe agregar al menos un producto a la venta.';
      return;
    }

    const subtotal = this.calcularSubtotal();
    const descuentoAplicado = Number(this.descuento) || 0;

    if (descuentoAplicado < 0) {
      this.mensajeError = 'El descuento no puede ser negativo.';
      return;
    }

    if (descuentoAplicado > subtotal) {
      this.mensajeError = 'El descuento no puede ser mayor al subtotal de la venta.';
      return;
    }

    const items: VentaItemDTO[] = this.itemsVenta.map(item => ({
      productoId: item.productoId,
      cantidad: item.cantidad
    }));

    const dto: CrearVentaDTO = {
      sucursalId: this.sucursalId,
      clienteId: this.clienteSeleccionado.id,
      descuento: descuentoAplicado,
      observacion: this.observacion,
      items
    };

    this.guardando = true;

    this.empleadoVentaService.crearVenta(dto)
      .subscribe({
        next: (venta) => {

          this.guardando = false;
          this.ventaGenerada = venta;

          this.mensajeExito =
            `Venta generada correctamente. Número: ${venta.numeroVenta}`;

          this.itemsVenta = [];
          this.observacion = '';
          this.numeroDocumentoCliente = '';
          this.clienteSeleccionado = null;
          this.ventaHabilitada = false;

          this.clientesSugeridos = [];
          this.mostrarSugerenciasClientes = false;

          this.limpiarDescuento();
          this.limpiarSeleccionProducto();

          this.cargarInventario();
          this.cargarClientesDisponibles();
        },
        error: (error) => {

          this.guardando = false;

          this.mensajeError = this.obtenerMensajeError(
            error,
            'No se pudo generar la venta.'
          );
        }
      });
  }

  volverAlPanel(): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'ventas',
      'panel'
    ]);
  }

  private limpiarSeleccionProducto(): void {

    this.productoSeleccionadoId = '';
    this.cantidadSeleccionada = 1;
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
