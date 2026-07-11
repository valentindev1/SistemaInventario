import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ClienteService } from '../../../../core/services/cliente/cliente.service';
import { AuthTemporalService } from '../../../../core/services/auth/auth-temporal.service';

import {
  ClienteCrearDTO,
  ClienteEditarDTO,
  ClienteObtenerDTO
} from '../../../../core/models/cliente/cliente.model';

type ModoFormularioCliente = 'CREAR' | 'EDITAR' | null;

interface ClienteFormulario {
  nombre: string;
  numeroDocumento: string;
  correo: string;
  telefono: string;
}

@Component({
  selector: 'app-panel-clientes-empleado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './panel-clientes-empleado.component.html',
  styleUrl: './panel-clientes-empleado.component.css'
})
export class PanelClientesEmpleadoComponent implements OnInit {

  sucursalId!: number;
  empresaId!: number;

  clientes: ClienteObtenerDTO[] = [];
  clientesFiltrados: ClienteObtenerDTO[] = [];

  filtro = '';

  cargando = false;
  guardando = false;
  eliminandoId: number | null = null;

  mensajeError = '';
  mensajeExito = '';

  modoFormulario: ModoFormularioCliente = null;
  clienteEditandoId: number | null = null;

  formulario: ClienteFormulario = this.crearFormularioVacio();

  paginaActual = 1;
  registrosPorPagina = 20;
  totalPaginas = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clienteService: ClienteService,
    private authTemporalService: AuthTemporalService
  ) {}

  ngOnInit(): void {

    const sucursalIdParam = this.route.snapshot.paramMap.get('sucursalId');

    if (!sucursalIdParam) {
      this.mensajeError = 'No se pudo identificar la sucursal.';
      return;
    }

    this.sucursalId = Number(sucursalIdParam);

    if (!this.sucursalId) {
      this.mensajeError = 'El identificador de la sucursal no es válido.';
      return;
    }

    const empresaIdActual = this.authTemporalService.obtenerEmpresaId();

    if (!empresaIdActual) {
      this.mensajeError = 'No se pudo identificar la empresa del usuario actual.';
      return;
    }

    this.empresaId = empresaIdActual;

    this.cargarClientes();
    this.verificarAccionDesdeRuta();
  }

  private verificarAccionDesdeRuta(): void {

    const accion = this.route.snapshot.queryParamMap.get('accion');
    const documento = this.route.snapshot.queryParamMap.get('documento');

    if (accion === 'crear') {
      this.abrirCrearCliente();

      if (documento) {
        this.formulario.numeroDocumento = documento;
      }
    }
  }

  cargarClientes(): void {

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.clienteService.listar()
      .subscribe({
        next: (clientes) => {
          this.clientes = clientes || [];
          this.clientesFiltrados = [...this.clientes];

          this.paginaActual = 1;
          this.actualizarTotalPaginas();

          this.cargando = false;
        },
        error: (error) => {
          this.cargando = false;

          this.mensajeError =
            error?.error?.message ||
            error?.error ||
            'No se pudieron cargar los clientes.';
        }
      });
  }

  filtrarClientes(): void {

    const texto = this.filtro.trim().toLowerCase();

    if (!texto) {
      this.clientesFiltrados = [...this.clientes];
      this.paginaActual = 1;
      this.actualizarTotalPaginas();
      return;
    }

    this.clientesFiltrados = this.clientes.filter(cliente => {
      const nombre = cliente.nombre?.toLowerCase() || '';
      const documento = cliente.numeroDocumento?.toLowerCase() || '';
      const correo = cliente.correo?.toLowerCase() || '';
      const telefono = cliente.telefono?.toLowerCase() || '';
      const empresa = cliente.empresaNombre?.toLowerCase() || '';

      return nombre.includes(texto) ||
        documento.includes(texto) ||
        correo.includes(texto) ||
        telefono.includes(texto) ||
        empresa.includes(texto);
    });

    this.paginaActual = 1;
    this.actualizarTotalPaginas();
  }

  limpiarBusqueda(): void {
    this.filtro = '';
    this.filtrarClientes();
  }

  abrirCrearCliente(): void {

    this.modoFormulario = 'CREAR';
    this.clienteEditandoId = null;
    this.formulario = this.crearFormularioVacio();

    this.mensajeError = '';
    this.mensajeExito = '';

    this.subirArriba();
  }

  abrirEditarCliente(cliente: ClienteObtenerDTO): void {

    if (!this.puedeModificarCliente(cliente)) {
      this.mensajeError =
        cliente.motivoBloqueo ||
        'Este cliente no puede modificarse.';
      return;
    }

    this.modoFormulario = 'EDITAR';
    this.clienteEditandoId = cliente.id;

    this.formulario = {
      nombre: cliente.nombre || '',
      numeroDocumento: cliente.numeroDocumento || '',
      correo: cliente.correo || '',
      telefono: cliente.telefono || ''
    };

    this.mensajeError = '';
    this.mensajeExito = '';

    this.subirArriba();
  }

  cancelarFormulario(): void {

    this.modoFormulario = null;
    this.clienteEditandoId = null;
    this.formulario = this.crearFormularioVacio();

    this.mensajeError = '';
  }

  guardarCliente(): void {

    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.formulario.nombre.trim()) {
      this.mensajeError = 'El nombre del cliente es obligatorio.';
      return;
    }

    if (this.modoFormulario === 'CREAR' && !this.formulario.numeroDocumento.trim()) {
      this.mensajeError = 'El número de documento es obligatorio.';
      return;
    }

    if (this.modoFormulario === 'CREAR') {
      this.crearCliente();
      return;
    }

    if (this.modoFormulario === 'EDITAR') {
      this.editarCliente();
      return;
    }
  }

  private crearCliente(): void {

    const documentoCreado = this.formulario.numeroDocumento.trim();

    const dto: ClienteCrearDTO = {
      empresaId: this.empresaId,
      numeroDocumento: documentoCreado,
      nombre: this.formulario.nombre.trim(),
      correo: this.formulario.correo?.trim() || null,
      telefono: this.formulario.telefono?.trim() || null
    };

    this.guardando = true;

    this.clienteService.crear(dto)
      .subscribe({
        next: () => {
          this.guardando = false;
          this.mensajeExito = 'Cliente creado correctamente.';

          const retorno = this.route.snapshot.queryParamMap.get('retorno');

          if (retorno === 'venta') {
            this.router.navigate([
              '/empleado',
              'sucursal',
              this.sucursalId,
              'ventas',
              'generar'
            ], {
              queryParams: {
                documento: documentoCreado
              }
            });

            return;
          }

          this.cancelarFormulario();
          this.cargarClientes();
        },
        error: (error) => {
          this.guardando = false;

          this.mensajeError =
            error?.error?.message ||
            error?.error ||
            'No se pudo crear el cliente.';
        }
      });
  }

  private editarCliente(): void {

    if (!this.clienteEditandoId) {
      this.mensajeError = 'No se pudo identificar el cliente a editar.';
      return;
    }

    const dto: ClienteEditarDTO = {
      nombre: this.formulario.nombre.trim(),
      correo: this.formulario.correo?.trim() || null,
      telefono: this.formulario.telefono?.trim() || null
    };

    this.guardando = true;

    this.clienteService.editar(this.clienteEditandoId, dto)
      .subscribe({
        next: () => {
          this.guardando = false;
          this.mensajeExito = 'Cliente actualizado correctamente.';

          this.cancelarFormulario();
          this.cargarClientes();
        },
        error: (error) => {
          this.guardando = false;

          this.mensajeError =
            error?.error?.message ||
            error?.error ||
            'No se pudo actualizar el cliente.';
        }
      });
  }

  eliminarCliente(cliente: ClienteObtenerDTO): void {

    if (!this.puedeModificarCliente(cliente)) {
      this.mensajeError =
        cliente.motivoBloqueo ||
        'Este cliente no puede eliminarse.';
      return;
    }

    const confirmar = confirm(
      `¿Seguro que deseas eliminar el cliente "${cliente.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    this.mensajeError = '';
    this.mensajeExito = '';
    this.eliminandoId = cliente.id;

    this.clienteService.eliminar(cliente.id)
      .subscribe({
        next: () => {
          this.eliminandoId = null;
          this.mensajeExito = 'Cliente eliminado correctamente.';

          if (this.clienteEditandoId === cliente.id) {
            this.cancelarFormulario();
          }

          this.cargarClientes();
        },
        error: (error) => {
          this.eliminandoId = null;

          this.mensajeError =
            error?.error?.message ||
            error?.error ||
            'No se pudo eliminar el cliente. Puede tener ventas asociadas.';
        }
      });
  }

  puedeModificarCliente(cliente: ClienteObtenerDTO): boolean {
    return cliente.puedeModificar !== false;
  }

  get clientesPaginados(): ClienteObtenerDTO[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;

    return this.clientesFiltrados.slice(inicio, fin);
  }

  actualizarTotalPaginas(): void {
    this.totalPaginas = Math.max(
      1,
      Math.ceil(this.clientesFiltrados.length / this.registrosPorPagina)
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

  calcularTotalClientes(): number {
    return this.clientesFiltrados.length;
  }

  calcularClientesConCorreo(): number {
    return this.clientesFiltrados.filter(
      cliente => !!cliente.correo
    ).length;
  }

  calcularClientesConTelefono(): number {
    return this.clientesFiltrados.filter(
      cliente => !!cliente.telefono
    ).length;
  }

  volverDashboard(): void {

    this.router.navigate([
      '/empleado',
      'sucursal',
      this.sucursalId,
      'dashboard'
    ]);
  }

  private crearFormularioVacio(): ClienteFormulario {
    return {
      nombre: '',
      numeroDocumento: '',
      correo: '',
      telefono: ''
    };
  }

  private subirArriba(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
