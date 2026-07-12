import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const platformId = inject(PLATFORM_ID);

  // En SSR no existe localStorage
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  // No enviar token en login
  if (req.url.includes('/api/auth/login')) {
    return next(req);
  }

  const token = localStorage.getItem('token');
  const tipo = localStorage.getItem('tipo') ?? 'Bearer';

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `${tipo} ${token}`
    }
  });

  return next(authReq);
};
