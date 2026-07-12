import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth.service';

import {
  AuthResponse,
  LoginRequest
} from '../../../core/models/auth/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  username = '';
  password = '';

  cargando = false;
  mostrarPassword = false;
  mensajeError = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {
    this.mensajeError = '';

    const request: LoginRequest = {
      username: this.username.trim(),
      password: this.password.trim()
    };

    if (!request.username || !request.password) {
      this.mensajeError = 'Ingrese usuario y contraseña';
      return;
    }

    this.cargando = true;

    this.authService.login(request).subscribe({
      next: (response: AuthResponse) => {
        this.cargando = false;

        this.authService.guardarSesion(response);

        this.redireccionarPorRol(response);
      },
      error: (error) => {
        this.cargando = false;

        console.error('Error login:', error);

        if (error.status === 403 || error.status === 401) {
          this.mensajeError = 'Usuario o contraseña incorrectos';
          return;
        }

        this.mensajeError = 'No se pudo conectar con el servidor';
      }
    });
  }

  alternarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  private redireccionarPorRol(response: AuthResponse): void {

    if (response.rol === 'SUPER_ADMIN') {
      this.router.navigate(['/super-admin/empresas']);
      return;
    }

    if (response.rol === 'ADMIN') {
      if (!response.empresaId) {
        this.mensajeError = 'El usuario ADMIN no tiene empresa asignada';
        return;
      }

      this.router.navigate([
        '/admin/empresa',
        response.empresaId,
        'dashboard'
      ]);

      return;
    }

    if (response.rol === 'EMPLEADO') {
      if (!response.sucursalId) {
        this.mensajeError = 'El usuario EMPLEADO no tiene sucursal asignada';
        return;
      }

      this.router.navigate([
        '/empleado/sucursal',
        response.sucursalId,
        'dashboard'
      ]);

      return;
    }

    this.mensajeError = 'Rol de usuario no válido';
  }
}
