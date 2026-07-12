import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthService } from '../services/auth/auth.service';

export const empresaAccessGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const rol = authService.obtenerRol();
  const empresaIdUsuario = authService.obtenerEmpresaId();

  const empresaIdRutaParam =
    route.paramMap.get('empresaId') ??
    route.parent?.paramMap.get('empresaId') ??
    null;

  if (!rol) {
    router.navigate(['/login']);
    return false;
  }

  if (!empresaIdRutaParam) {
    router.navigate(['/acceso-denegado']);
    return false;
  }

  const empresaIdRuta = Number(empresaIdRutaParam);

  if (Number.isNaN(empresaIdRuta)) {
    router.navigate(['/acceso-denegado']);
    return false;
  }

  if (rol === 'SUPER_ADMIN') {
    return true;
  }

  if (rol === 'ADMIN') {
    if (!empresaIdUsuario) {
      router.navigate(['/acceso-denegado']);
      return false;
    }

    if (empresaIdUsuario !== empresaIdRuta) {
      router.navigate(['/acceso-denegado']);
      return false;
    }

    return true;
  }

  router.navigate(['/acceso-denegado']);
  return false;
};
