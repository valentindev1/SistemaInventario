import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { EmpresaService } from '../../../../../core/services/empresa/empresa.service';
import { SucursalService } from '../../../../../core/services/sucursal/sucursal.service';
import { UsuarioService } from '../../../../../core/services/usuario/usuario.service';

import { EmpresaObtenerDTO } from '../../../../../core/models/empresa/empresa.model';
import { SucursalObtenerDTO } from '../../../../../core/models/sucursal/sucursal.model';
import { UsuarioObtenerDTO } from '../../../../../core/models/usuario/usuario.model';

@Component({
  selector: 'app-detalle-sucursal-empresa',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './detalle-sucursal-empresa.component.html',
  styleUrl: './detalle-sucursal-empresa.component.css'
})
export class DetalleSucursalEmpresaComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  empresa: EmpresaObtenerDTO | null = null;
  sucursal: SucursalObtenerDTO | null = null;
  empleados: UsuarioObtenerDTO[] = [];

  cargandoEmpresa = false;
  cargandoSucursal = false;
  cargandoEmpleados = false;

  mensajeError = '';
  mensajeExito = '';

  constructor(
    private route: ActivatedRoute,
    private empresaService: EmpresaService,
    private sucursalService: SucursalService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.route.snapshot.paramMap.get('empresaId');
    const sucursalIdParam = this.route.snapshot.paramMap.get('sucursalId');

    if (!empresaIdParam || !sucursalIdParam) {
      this.mensajeError = 'Parámetros no válidos';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);

    this.cargarEmpresa();
    this.cargarSucursal();
    this.cargarEmpleados();
  }

  cargarEmpresa(): void {
    this.cargandoEmpresa = true;
    this.mensajeError = '';

    this.empresaService.obtenerPorId(this.empresaId).subscribe({
      next: (empresa) => {
        this.empresa = empresa;
        this.cargandoEmpresa = false;
      },
      error: (error) => {
        this.cargandoEmpresa = false;
        this.mensajeError = 'No se pudo cargar la empresa';
        console.error(error);
      }
    });
  }

  cargarSucursal(): void {
    this.cargandoSucursal = true;
    this.mensajeError = '';

    this.sucursalService.obtenerPorId(this.sucursalId).subscribe({
      next: (sucursal) => {
        this.sucursal = sucursal;
        this.cargandoSucursal = false;
      },
      error: (error) => {
        this.cargandoSucursal = false;
        this.mensajeError = 'No se pudo cargar la sucursal';
        console.error(error);
      }
    });
  }

  cargarEmpleados(): void {
    this.cargandoEmpleados = true;
    this.mensajeError = '';

    this.usuarioService.listarPorSucursal(this.sucursalId).subscribe({
      next: (usuarios) => {
        this.empleados = usuarios;
        this.cargandoEmpleados = false;
      },
      error: (error) => {
        this.cargandoEmpleados = false;
        this.mensajeError = 'No se pudieron cargar los empleados de la sucursal';
        console.error(error);
      }
    });
  }

  eliminarEmpleado(usuarioId: number): void {
    const confirmar = confirm('¿Estás seguro de eliminar este empleado?');

    if (!confirmar) {
      return;
    }

    this.mensajeError = '';
    this.mensajeExito = '';

    this.usuarioService.eliminar(usuarioId).subscribe({
      next: () => {
        this.empleados = this.empleados.filter(empleado => empleado.id !== usuarioId);
        this.mensajeExito = 'Empleado eliminado correctamente';
      },
      error: (error) => {
        this.mensajeError = 'No se pudo eliminar el empleado';
        console.error(error);
      }
    });
  }
}
