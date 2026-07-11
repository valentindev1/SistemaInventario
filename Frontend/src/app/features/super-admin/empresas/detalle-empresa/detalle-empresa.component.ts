import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';

import { EmpresaService } from '../../../../core/services/empresa/empresa.service';
import { UsuarioService } from '../../../../core/services/usuario/usuario.service';
import { SucursalService } from '../../../../core/services/sucursal/sucursal.service';

import { EmpresaObtenerDTO } from '../../../../core/models/empresa/empresa.model';
import { UsuarioObtenerDTO } from '../../../../core/models/usuario/usuario.model';
import { SucursalObtenerDTO } from '../../../../core/models/sucursal/sucursal.model';
import {AuthTemporalService} from '../../../../core/services/auth/auth-temporal.service';

@Component({
  selector: 'app-detalle-empresa',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './detalle-empresa.component.html',
  styleUrl: './detalle-empresa.component.css'
})
export class DetalleEmpresaComponent implements OnInit {

  empresaId!: number;

  empresa: EmpresaObtenerDTO | null = null;
  usuarios: UsuarioObtenerDTO[] = [];
  sucursales: SucursalObtenerDTO[] = [];

  cargandoEmpresa = false;
  cargandoUsuarios = false;
  cargandoSucursales = false;

  mensajeError = '';

  constructor(
    private route: ActivatedRoute,
    private empresaService: EmpresaService,
    private usuarioService: UsuarioService,
    private sucursalService: SucursalService
    ,  private router: Router,

    public authTemporalService: AuthTemporalService

  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.mensajeError = 'ID de empresa no válido';
      return;
    }

    this.empresaId = Number(idParam);

    this.cargarEmpresa();
    this.cargarUsuarios();
  }

  cargarEmpresa(): void {
    this.cargandoEmpresa = true;
    this.mensajeError = '';

    this.empresaService.obtenerPorId(this.empresaId).subscribe({
      next: (empresa) => {
        this.empresa = empresa;
        this.cargandoEmpresa = false;

        // Cuando ya tenemos el NIT, cargamos las sucursales
        this.cargarSucursales(empresa.nit);
      },
      error: (error) => {
        this.cargandoEmpresa = false;
        this.mensajeError = 'No se pudo cargar la empresa';
        console.error(error);
      }
    });
  }

  esSuperAdmin(): boolean {
    return this.authTemporalService.esSuperAdmin();
  }

  cargarUsuarios(): void {
    this.cargandoUsuarios = true;
    this.mensajeError = '';

    this.usuarioService.listarPorEmpresaSeleccionada(this.empresaId).subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.cargandoUsuarios = false;
      },
      error: (error) => {
        this.cargandoUsuarios = false;
        this.mensajeError = 'No se pudieron cargar los usuarios de la empresa';
        console.error(error);
      }
    });
  }

  cargarSucursales(empresaNit: string): void {
    this.cargandoSucursales = true;
    this.mensajeError = '';

    this.sucursalService.listarPorEmpresaNit(empresaNit).subscribe({
      next: (sucursales) => {
        this.sucursales = sucursales;
        this.cargandoSucursales = false;
      },
      error: (error) => {
        this.cargandoSucursales = false;
        this.mensajeError = 'No se pudieron cargar las sucursales de la empresa';
        console.error(error);
      }
    });
  }


  irEditarPasswordAdmin(usuarioId: number): void {
    this.router.navigate([
      '/super-admin/empresas',
      this.empresaId,
      'usuarios',
      usuarioId,
      'editar-password'
    ]);
  }

  eliminarUsuario(usuarioId: number): void {
    const confirmar = confirm('¿Estás seguro de eliminar este usuario?');

    if (!confirmar) {
      return;
    }

    this.usuarioService.eliminar(usuarioId).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(usuario => usuario.id !== usuarioId);
      },
      error: (error) => {
        this.mensajeError = 'No se pudo eliminar el usuario';
        console.error(error);
      }
    });
  }
}
