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

  private usuarioActualSubject = new BehaviorSubject<UsuarioAuthTemporal>(
    this.usuarioSuperAdminMock
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

  esSuperAdmin(): boolean {
    return this.usuarioActualSubject.value.rol === 'SUPER_ADMIN';
  }

  esAdmin(): boolean {
    return this.usuarioActualSubject.value.rol === 'ADMIN';
  }

  esEmpleado(): boolean {
    return this.usuarioActualSubject.value.rol === 'EMPLEADO';
  }
}
