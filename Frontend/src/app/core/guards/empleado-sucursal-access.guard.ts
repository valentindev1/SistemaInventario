import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  UrlTree
} from '@angular/router';

import { AuthService } from '../services/auth/auth.service';

export const empleadoSucursalAccessGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
): boolean | UrlTree => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const rol = authService.obtenerRol();
  const empresaIdUsuario = authService.obtenerEmpresaId();
  const sucursalIdUsuario = authService.obtenerSucursalId();

  if (!authService.estaAutenticado() || !rol) {
    return router.createUrlTree(['/login']);
  }

  if (rol !== 'EMPLEADO') {
    return router.createUrlTree(['/acceso-denegado']);
  }

  if (!empresaIdUsuario || !sucursalIdUsuario) {
    return router.createUrlTree(['/login']);
  }

  const sucursalIdRutaParam =
    route.paramMap.get('sucursalId') ??
    route.parent?.paramMap.get('sucursalId') ??
    route.parent?.parent?.paramMap.get('sucursalId') ??
    null;

  if (!sucursalIdRutaParam) {
    return router.createUrlTree([
      '/empleado',
      'sucursal',
      sucursalIdUsuario,
      'dashboard'
    ]);
  }

  const sucursalIdRuta = Number(sucursalIdRutaParam);

  if (
    Number.isNaN(sucursalIdRuta) ||
    sucursalIdRuta <= 0
  ) {
    return router.createUrlTree([
      '/empleado',
      'sucursal',
      sucursalIdUsuario,
      'dashboard'
    ]);
  }

  if (sucursalIdRuta !== sucursalIdUsuario) {
    return router.createUrlTree([
      '/empleado',
      'sucursal',
      sucursalIdUsuario,
      'dashboard'
    ]);
  }

  return true;
};
