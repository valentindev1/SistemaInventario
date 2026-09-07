import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import {
  ClasificacionContableCrearDTO,
  ClasificacionContableDTO,
  ClasificacionContableEditarDTO,
  TipoRegistroContable
} from '../../../../../core/models/contabilidad/contabilidad.model';
import { AuthService } from '../../../../../core/services/auth/auth.service';
import { ContabilidadService } from '../../../../../core/services/contabilidad/contabilidad.service';
import { EmpresaService } from '../../../../../core/services/empresa/empresa.service';
import { SucursalService } from '../../../../../core/services/sucursal/sucursal.service';

@Component({
  selector: 'app-clasificaciones-contables',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './clasificaciones-contables.component.html',
  styleUrl: './clasificaciones-contables.component.css'
})
export class ClasificacionesContablesComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;
  empresaNombre = 'Empresa';
  sucursalNombre = 'Sucursal';

  clasificaciones: ClasificacionContableDTO[] = [];
  cargando = false;
  guardando = false;
  mensajeError = '';
  nombre = '';
  tipo: TipoRegistroContable = 'GASTO';
  selectorTipoAbierto = false;
  editandoId: number | null = null;
  filtroNombre = '';
  filtroTipo: 'TODOS' | TipoRegistroContable = 'TODOS';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private empresaService: EmpresaService,
    private sucursalService: SucursalService,
    private contabilidadService: ContabilidadService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.obtenerParametroRuta('empresaId');
    const sucursalIdParam = this.obtenerParametroRuta('sucursalId');

    if (!empresaIdParam || !sucursalIdParam) {
      this.mensajeError = 'No se pudo identificar la empresa o la sucursal.';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);

    if (!Number.isInteger(this.empresaId) || !Number.isInteger(this.sucursalId)
      || this.empresaId <= 0 || this.sucursalId <= 0) {
      this.mensajeError = 'La ruta contiene parámetros inválidos.';
      return;
    }

    this.empresaService.obtenerPorId(this.empresaId).subscribe({
      next: empresa => this.empresaNombre = empresa.nombre,
      error: () => undefined
    });
    this.sucursalService.obtenerPorId(this.sucursalId).subscribe({
      next: sucursal => this.sucursalNombre = sucursal.nombre,
      error: () => undefined
    });
    this.cargarClasificaciones();
  }

  cargarClasificaciones(): void {
    this.cargando = true;
    this.contabilidadService.listarClasificaciones(this.empresaId).subscribe({
      next: clasificaciones => {
        this.clasificaciones = clasificaciones || [];
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        this.mensajeError = error?.error?.message
          ?? 'No se pudieron cargar las clasificaciones contables.';
      }
    });
  }

  get clasificacionesFiltradas(): ClasificacionContableDTO[] {
    const filtro = this.normalizarTexto(this.filtroNombre);
    return this.clasificaciones
      .filter(clasificacion =>
        (!filtro || this.normalizarTexto(clasificacion.nombre).includes(filtro))
        && (this.filtroTipo === 'TODOS' || clasificacion.tipo === this.filtroTipo)
      )
      .sort((a, b) => {
        const tipo = a.tipo.localeCompare(b.tipo);
        return tipo || a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
      });
  }

  guardar(): void {
    this.mensajeError = '';
    const nombre = this.nombre.trim();
    if (!nombre) {
      this.mensajeError = 'Escribe el nombre de la clasificación.';
      return;
    }

    const editando = this.editandoId !== null;
    const reactivando = !editando && this.clasificaciones.some(clasificacion =>
      !clasificacion.activo
      && clasificacion.tipo === this.tipo
      && clasificacion.nombre.localeCompare(nombre, 'es', { sensitivity: 'base' }) === 0
    );
    const operacion = editando
      ? this.contabilidadService.editarClasificacion(
          this.editandoId!,
          { nombre } satisfies ClasificacionContableEditarDTO
        )
      : this.contabilidadService.crearClasificacion({
          nombre,
          tipo: this.tipo,
          empresaId: this.empresaId
        } satisfies ClasificacionContableCrearDTO);

    this.guardando = true;
    operacion.subscribe({
      next: () => {
        this.guardando = false;
        this.limpiarFormulario();
        this.cargarClasificaciones();
        Swal.fire({
          icon: 'success',
          title: editando ? 'Clasificación actualizada' : reactivando ? 'Clasificación reactivada' : 'Clasificación creada',
          text: reactivando
            ? 'Se recuperó la clasificación original sin afectar conceptos ni movimientos existentes.'
            : 'La clasificación quedó disponible para organizar tus conceptos.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#2563eb'
        });
      },
      error: error => {
        this.guardando = false;
        this.mensajeError = error?.error?.message
          ?? 'No se pudo guardar la clasificación contable.';
      }
    });
  }

  editar(clasificacion: ClasificacionContableDTO): void {
    this.editandoId = clasificacion.id;
    this.nombre = clasificacion.nombre;
    this.tipo = clasificacion.tipo;
    this.selectorTipoAbierto = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  alternarSelectorTipo(): void {
    if (this.editandoId !== null) {
      return;
    }
    this.selectorTipoAbierto = !this.selectorTipoAbierto;
  }

  seleccionarTipo(tipo: TipoRegistroContable): void {
    this.tipo = tipo;
    this.selectorTipoAbierto = false;
  }

  eliminar(clasificacion: ClasificacionContableDTO): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar clasificación?',
      text: `"${clasificacion.nombre}" dejará de aparecer para nuevos conceptos, pero se conservará en los conceptos y movimientos existentes.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b'
    }).then(resultado => {
      if (!resultado.isConfirmed) {
        return;
      }
      this.contabilidadService.eliminarClasificacion(clasificacion.id).subscribe({
        next: () => {
          this.cargarClasificaciones();
          Swal.fire({
            icon: 'success',
            title: 'Clasificación eliminada',
            text: 'Se conservó la información relacionada para mantener la trazabilidad.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#2563eb'
          });
        },
        error: error => {
          this.mensajeError = error?.error?.message
            ?? 'No se pudo eliminar la clasificación contable.';
        }
      });
    });
  }

  limpiarFormulario(): void {
    this.editandoId = null;
    this.nombre = '';
    this.tipo = 'GASTO';
    this.selectorTipoAbierto = false;
  }

  volverReportesContables(): any[] {
    return this.esSuperAdmin()
      ? ['/super-admin/empresas', this.empresaId, 'sucursales', this.sucursalId, 'reportes-contables']
      : ['/admin/empresa', this.empresaId, 'sucursales', this.sucursalId, 'reportes-contables'];
  }

  etiquetaTipo(tipo: TipoRegistroContable): string {
    return tipo === 'COSTO' ? 'Costo indirecto de producción' : 'Gasto';
  }

  private esSuperAdmin(): boolean {
    return this.authService.obtenerRol() === 'SUPER_ADMIN';
  }

  private normalizarTexto(valor: string): string {
    return valor.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  private obtenerParametroRuta(nombre: string): string | null {
    return this.route.snapshot.paramMap.get(nombre)
      ?? this.route.parent?.snapshot.paramMap.get(nombre)
      ?? this.route.parent?.parent?.snapshot.paramMap.get(nombre)
      ?? null;
  }
}
