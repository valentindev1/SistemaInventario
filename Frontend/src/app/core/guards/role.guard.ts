import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  UrlTree
} from '@angular/router';

import { AuthService } from '../services/auth/auth.service';

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
): boolean | UrlTree => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.obtenerToken();
  const rol = authService.obtenerRol();

  const rolesPermitidos = route.data?.['roles'] as string[] | undefined;

  if (!token || !rol) {
    authService.cerrarSesion();
    return router.createUrlTree(['/login']);
  }

  if (tokenExpirado(token)) {
    authService.cerrarSesion();
    return router.createUrlTree(['/login']);
  }

  if (!rolesPermitidos || rolesPermitidos.length === 0) {
    return true;
  }

  const rolNormalizado = rol.replace('ROLE_', '').trim().toUpperCase();

  const rolesPermitidosNormalizados = rolesPermitidos.map(role =>
    role.replace('ROLE_', '').trim().toUpperCase()
  );

  if (!rolesPermitidosNormalizados.includes(rolNormalizado)) {
    return router.createUrlTree(['/acceso-denegado']);
  }

  return true;
};

function tokenExpirado(token: string): boolean {
  try {
    const partes = token.split('.');

    if (partes.length !== 3) {
      return true;
    }

    const payloadBase64 = partes[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const payloadJson = decodeURIComponent(
      atob(payloadBase64)
        .split('')
        .map(char => {
          return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    const payload = JSON.parse(payloadJson);

    if (!payload.exp) {
      return true;
    }

    return Date.now() >= payload.exp * 1000;

  } catch {
    return true;
  }
}
