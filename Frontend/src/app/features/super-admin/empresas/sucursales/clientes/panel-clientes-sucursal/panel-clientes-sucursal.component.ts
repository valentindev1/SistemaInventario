import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';

import { ClienteService } from '../../../../../../core/services/cliente/cliente.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';

import { ClienteObtenerDTO } from '../../../../../../core/models/cliente/cliente.model';

@Component({
  selector: 'app-panel-clientes-sucursal',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './panel-clientes-sucursal.component.html',
  styleUrl: './panel-clientes-sucursal.component.css'
})
export class PanelClientesSucursalComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  clientes: ClienteObtenerDTO[] = [];
  clientesFiltrados: ClienteObtenerDTO[] = [];

  numeroDocumentoBusqueda = '';

  cargando = false;
  buscando = false;

  mensajeError = '';
  mensajeExito = '';

  paginaActual = 1;
  registrosPorPagina = 20;

  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clienteService: ClienteService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.obtenerEmpresaIdDesdeRuta();
    const sucursalIdParam = this.obtenerSucursalIdDesdeRuta();

    if (!empresaIdParam || !sucursalIdParam) {
      this.mensajeError = 'Parámetros no válidos';
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
      this.mensajeError = 'Parámetros no válidos';
      return;
    }

    if (!this.validarAccesoLocal()) {
      return;
    }

    this.cargarClientes();
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

  rutaCrearCliente(): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'clientes',
        'crear'
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'clientes',
      'crear'
    ];
  }

  rutaEditarCliente(clienteId: number): any[] {
    if (this.esSuperAdmin()) {
      return [
        '/super-admin/empresas',
        this.empresaId,
        'sucursales',
        this.sucursalId,
        'clientes',
        'editar',
        clienteId
      ];
    }

    return [
      '/admin/empresa',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'clientes',
      'editar',
      clienteId
    ];
  }

  cargarClientes(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.clienteService.listar().subscribe({
      next: (clientes) => {
        this.clientes = clientes || [];
        this.clientesFiltrados = clientes || [];

        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = 'No se pudieron cargar los clientes';

        console.error(error);
      }
    });
  }

  get clientesPaginados(): ClienteObtenerDTO[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;

    return this.clientesFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(
      this.clientesFiltrados.length / this.registrosPorPagina
    );
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) {
      return;
    }

    this.paginaActual = pagina;
  }

  buscarPorDocumento(): void {
    const documento = this.numeroDocumentoBusqueda.trim();

    this.mensajeError = '';
    this.mensajeExito = '';

    if (!documento) {
      this.clientesFiltrados = this.clientes;
      this.paginaActual = 1;
      return;
    }

    this.buscando = true;

    this.clienteService.obtenerPorDocumento(documento).subscribe({
      next: (cliente) => {
        this.clientesFiltrados = [cliente];
        this.paginaActual = 1;
        this.buscando = false;
      },
      error: (error) => {
        this.clientesFiltrados = [];
        this.paginaActual = 1;
        this.buscando = false;
        this.mensajeError = 'Cliente no encontrado';

        console.error(error);
      }
    });
  }

  limpiarBusqueda(): void {
    this.numeroDocumentoBusqueda = '';
    this.mensajeError = '';
    this.mensajeExito = '';
    this.clientesFiltrados = this.clientes;
    this.paginaActual = 1;
  }

  editarCliente(cliente: ClienteObtenerDTO): void {
    if (cliente.puedeModificar === false) {
      Swal.fire({
        icon: 'warning',
        title: 'Cliente bloqueado',
        text: cliente.motivoBloqueo || 'No se puede editar este cliente porque tiene ventas vinculadas.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0d6efd'
      });

      return;
    }

    this.router.navigate(
      this.rutaEditarCliente(cliente.id)
    );
  }

  eliminarCliente(cliente: ClienteObtenerDTO): void {
    if (cliente.puedeModificar === false) {
      Swal.fire({
        icon: 'warning',
        title: 'Cliente bloqueado',
        text: cliente.motivoBloqueo || 'No se puede eliminar este cliente porque tiene ventas vinculadas.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0d6efd'
      });

      return;
    }

    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar cliente?',
      text: `Se eliminará el cliente ${cliente.nombre}`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mensajeError = '';
        this.mensajeExito = '';

        this.clienteService.eliminar(cliente.id).subscribe({
          next: () => {
            this.clientes = this.clientes.filter(
              item => item.id !== cliente.id
            );

            this.clientesFiltrados = this.clientesFiltrados.filter(
              item => item.id !== cliente.id
            );

            if (
              this.paginaActual > this.totalPaginas &&
              this.totalPaginas > 0
            ) {
              this.paginaActual = this.totalPaginas;
            }

            if (this.clientesFiltrados.length === 0) {
              this.paginaActual = 1;
            }

            Swal.fire({
              icon: 'success',
              title: 'Cliente eliminado',
              text: 'El cliente fue eliminado correctamente.',
              confirmButtonText: 'Continuar',
              confirmButtonColor: '#0d6efd'
            });
          },
          error: (error) => {
            this.mensajeError =
              error?.error?.message ||
              error?.error ||
              'No se pudo eliminar el cliente';

            console.error(error);
          }
        });
      }
    });
  }
}
