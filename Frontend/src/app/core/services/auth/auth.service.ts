import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import {
  AuthResponse,
  LoginRequest
} from '../../models/auth/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      request
    );
  }

  guardarSesion(response: AuthResponse): void {
    if (!this.esNavegador()) {
      return;
    }

    localStorage.setItem('token', response.token);
    localStorage.setItem('tipo', response.tipo);

    localStorage.setItem('usuarioId', response.usuarioId.toString());
    localStorage.setItem('username', response.username);
    localStorage.setItem('nombre', response.nombre);
    localStorage.setItem('rol', response.rol);

    if (response.empresaId !== null && response.empresaId !== undefined) {
      localStorage.setItem('empresaId', response.empresaId.toString());
    } else {
      localStorage.removeItem('empresaId');
    }

    if (response.sucursalId !== null && response.sucursalId !== undefined) {
      localStorage.setItem('sucursalId', response.sucursalId.toString());
    } else {
      localStorage.removeItem('sucursalId');
    }
  }

  obtenerToken(): string | null {
    if (!this.esNavegador()) {
      return null;
    }

    return localStorage.getItem('token');
  }

  obtenerTipoToken(): string {
    if (!this.esNavegador()) {
      return 'Bearer';
    }

    return localStorage.getItem('tipo') ?? 'Bearer';
  }

  obtenerUsuarioId(): number | null {
    if (!this.esNavegador()) {
      return null;
    }

    const usuarioId = localStorage.getItem('usuarioId');

    return usuarioId ? Number(usuarioId) : null;
  }

  obtenerUsername(): string | null {
    if (!this.esNavegador()) {
      return null;
    }

    return localStorage.getItem('username');
  }

  obtenerNombre(): string | null {
    if (!this.esNavegador()) {
      return null;
    }

    return localStorage.getItem('nombre');
  }

  obtenerRol(): string | null {
    if (!this.esNavegador()) {
      return null;
    }

    return localStorage.getItem('rol');
  }

  obtenerEmpresaId(): number | null {
    if (!this.esNavegador()) {
      return null;
    }

    const empresaId = localStorage.getItem('empresaId');

    return empresaId ? Number(empresaId) : null;
  }

  obtenerSucursalId(): number | null {
    if (!this.esNavegador()) {
      return null;
    }

    const sucursalId = localStorage.getItem('sucursalId');

    return sucursalId ? Number(sucursalId) : null;
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  cerrarSesion(): void {
    if (!this.esNavegador()) {
      return;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('tipo');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('username');
    localStorage.removeItem('nombre');
    localStorage.removeItem('rol');
    localStorage.removeItem('empresaId');
    localStorage.removeItem('sucursalId');
  }

  private esNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
