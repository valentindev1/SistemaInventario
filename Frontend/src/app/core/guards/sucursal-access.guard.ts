import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router
} from '@angular/router';

import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { AuthService } from '../services/auth/auth.service';
import { EmpresaService } from '../services/empresa/empresa.service';
import { SucursalService } from '../services/sucursal/sucursal.service';

export const sucursalAccessGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
): boolean | Observable<boolean> => {

  const authService = inject(AuthService);
  const empresaService = inject(EmpresaService);
  const sucursalService = inject(SucursalService);
  const router = inject(Router);

  const rol = authService.obtenerRol();
  const empresaIdUsuario = authService.obtenerEmpresaId();

  const empresaIdRutaParam =
    route.paramMap.get('empresaId') ??
    route.parent?.paramMap.get('empresaId') ??
    route.parent?.parent?.paramMap.get('empresaId') ??
    null;

  const sucursalIdRutaParam =
    route.paramMap.get('sucursalId') ??
    route.parent?.paramMap.get('sucursalId') ??
    route.parent?.parent?.paramMap.get('sucursalId') ??
    null;

  if (!rol) {
    router.navigate(['/login']);
    return false;
  }

  if (!empresaIdRutaParam || !sucursalIdRutaParam) {
    router.navigate(['/acceso-denegado']);
    return false;
  }

  const empresaIdRuta = Number(empresaIdRutaParam);
  const sucursalIdRuta = Number(sucursalIdRutaParam);

  if (
    Number.isNaN(empresaIdRuta) ||
    Number.isNaN(sucursalIdRuta) ||
    empresaIdRuta <= 0 ||
    sucursalIdRuta <= 0
  ) {
    router.navigate(['/acceso-denegado']);
    return false;
  }

  /**
   * SUPER_ADMIN puede entrar a cualquier sucursal.
   */
  if (rol === 'SUPER_ADMIN') {
    return true;
  }

  /**
   * Solo ADMIN debe entrar a rutas /admin/empresa/:empresaId/sucursales/...
   */
  if (rol !== 'ADMIN') {
    router.navigate(['/acceso-denegado']);
    return false;
  }

  /**
   * El ADMIN solo puede entrar a su propia empresa.
   */
  if (!empresaIdUsuario || empresaIdUsuario !== empresaIdRuta) {
    router.navigate(['/acceso-denegado']);
    return false;
  }

  /**
   * Validación fuerte de frontend:
   * 1. Carga la empresa de la URL.
   * 2. Lista las sucursales de esa empresa por NIT.
   * 3. Verifica que la sucursal de la URL pertenezca a esa empresa.
   */
  return empresaService.obtenerPorId(empresaIdRuta).pipe(
    switchMap((empresa) => {
      if (!empresa || !empresa.nit) {
        router.navigate(['/acceso-denegado']);
        return of(false);
      }

      return sucursalService.listarPorEmpresaNit(empresa.nit).pipe(
        map((sucursales) => {
          const pertenece = sucursales.some(
            sucursal => Number(sucursal.id) === sucursalIdRuta
          );

          if (!pertenece) {
            router.navigate(['/acceso-denegado']);
            return false;
          }

          return true;
        })
      );
    }),
    catchError((error) => {
      console.error('Error validando acceso a sucursal:', error);
      router.navigate(['/acceso-denegado']);
      return of(false);
    })
  );
};
