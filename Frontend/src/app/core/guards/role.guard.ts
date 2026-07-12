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

  console.log('ROLE GUARD');
  console.log('token:', token);
  console.log('rol localStorage:', rol);
  console.log('roles permitidos:', rolesPermitidos);

  if (!token || !rol) {
    console.warn('ROLE GUARD: sin token o sin rol');
    return router.createUrlTree(['/login']);
  }

  if (!rolesPermitidos || rolesPermitidos.length === 0) {
    return true;
  }

  const rolNormalizado = rol.replace('ROLE_', '').trim().toUpperCase();

  const rolesPermitidosNormalizados = rolesPermitidos.map(
    role => role.replace('ROLE_', '').trim().toUpperCase()
  );

  console.log('rol normalizado:', rolNormalizado);
  console.log('roles permitidos normalizados:', rolesPermitidosNormalizados);

  if (!rolesPermitidosNormalizados.includes(rolNormalizado)) {
    console.warn('ROLE GUARD: rol no permitido');
    return router.createUrlTree(['/acceso-denegado']);
  }

  return true;
};
