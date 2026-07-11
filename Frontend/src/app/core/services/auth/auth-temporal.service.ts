import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { UsuarioAuthTemporal } from '../../models/auth/usuario-auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthTemporalService {

  private usuarioSuperAdminMock: UsuarioAuthTemporal = {
    id: 1,
    nombre: 'Super Administrador',
    username: 'superadmin',
    rol: 'SUPER_ADMIN',
    empresaId: null,
    sucursalId: null
  };

  private usuarioEmpleadoMock: UsuarioAuthTemporal = {
    id: 3,
    nombre: 'Empleado Principal',
    username: 'empleado_sucursal',
    rol: 'EMPLEADO',
    empresaId: 1,
    sucursalId: 1
  };

  // Desde aquí seleccionamos el usuario que necesitamos de forma temporal
  private usuarioActualSubject = new BehaviorSubject<UsuarioAuthTemporal>(
    this.usuarioEmpleadoMock
  );

  usuarioActual$: Observable<UsuarioAuthTemporal> =
    this.usuarioActualSubject.asObservable();

  obtenerUsuarioActual(): UsuarioAuthTemporal {
    return this.usuarioActualSubject.value;
  }

  obtenerUsuarioId(): number {
    return this.usuarioActualSubject.value.id;
  }

  obtenerRol(): string {
    return this.usuarioActualSubject.value.rol;
  }

  obtenerEmpresaId(): number | null {
    return this.usuarioActualSubject.value.empresaId ?? null;
  }

  obtenerSucursalId(): number | null {
    return this.usuarioActualSubject.value.sucursalId ?? null;
  }

  esSuperAdmin(): boolean {
    return this.usuarioActualSubject.value.rol === 'SUPER_ADMIN';
  }

  esAdmin(): boolean {
    return this.usuarioActualSubject.value.rol === 'ADMIN';
  }

  esEmpleado(): boolean {
    return this.usuarioActualSubject.value.rol === 'EMPLEADO';
  }

  usarSuperAdmin(): void {
    this.usuarioActualSubject.next(this.usuarioSuperAdminMock);
  }

  usarEmpleado(): void {
    this.usuarioActualSubject.next(this.usuarioEmpleadoMock);
  }
}
